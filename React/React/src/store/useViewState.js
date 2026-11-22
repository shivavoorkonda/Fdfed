import { useId, useLayoutEffect, useMemo } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { selectSession, selectWorkspaceVersion } from './sessionSlice.js';
import { selectView, viewFieldChanged, viewMounted, viewUnmounted, workspaceOwners } from './viewState.js';

// Each mounted view owns one Redux record. Two copies of the same form can be
// open at once, and leaving a screen drops its drafts and transient results.
export function useViewState(scope, name, initialize) {
  const instance = useId();
  const id = `${name}/${instance}`;
  const dispatch = useDispatch();
  const store = useStore();
  const owner = useSelector((state) => scope === 'workspace'
    ? workspaceOwners[selectSession(state)?.role] ?? 'publicPages'
    : scope);
  const version = useSelector((state) => owner === 'publicPages' ? null : selectWorkspaceVersion(state));
  // The initializer is used on the first render and when registering the view.
  // Once mounted, the selector supplies the live values.
  const initialValues = useMemo(initialize, []);
  const values = useSelector((state) => selectView(state, owner, id)) ?? initialValues;

  useLayoutEffect(() => {
    if (version !== null && selectWorkspaceVersion(store.getState()) !== version) return undefined;
    dispatch(viewMounted({ owner, id, values: initialValues }));
    return () => {
      if (version === null || selectWorkspaceVersion(store.getState()) === version) {
        dispatch(viewUnmounted({ owner, id }));
      }
    };
  }, [dispatch, id, initialValues, owner, store, version]);

  const setters = useMemo(() => Object.fromEntries(Object.keys(initialValues).map((field) => {
    const name = `set${field[0].toUpperCase()}${field.slice(1)}`;
    const setValue = (update) => {
      const state = store.getState();
      if (version !== null && selectWorkspaceVersion(state) !== version) return;
      const view = selectView(state, owner, id);
      if (!view) return;
      // Resolve functional updates against Redux's current value. The action
      // carries only the resulting value, so functions and events stay out.
      const value = typeof update === 'function' ? update(view[field]) : update;
      if (!Object.is(value, view[field])) dispatch(viewFieldChanged({ owner, id, field, value }));
    };
    return [name, setValue];
  })), [dispatch, id, initialValues, owner, store, version]);

  return [values, setters, { owner, id }];
}
