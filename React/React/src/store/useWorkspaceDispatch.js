import { useCallback, useLayoutEffect, useRef } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { selectWorkspaceVersion } from './sessionSlice.js';

export default function useWorkspaceDispatch() {
  const dispatch = useDispatch();
  const store = useStore();
  const version = useSelector(selectWorkspaceVersion);
  const mounted = useRef(false);

  useLayoutEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  return useCallback((action) => {
    // Requests started by a previous account or an unmounted view can still finish.
    if (mounted.current && selectWorkspaceVersion(store.getState()) === version) {
      dispatch(action);
      return true;
    }
    return false;
  }, [dispatch, store, version]);
}
