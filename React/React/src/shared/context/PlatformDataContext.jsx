import { useEffect, useMemo } from 'react';
import { bindActionCreators } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { emptyPlatform } from '../../store/adminPlatformState.js';
import { collegeAdminActions, selectCollegeAdminPlatform } from '../../store/college-admin/collegeAdminSlice.js';
import { selectSession } from '../../store/sessionSlice.js';
import { superAdminActions, selectSuperAdminPlatform } from '../../store/super-admin/superAdminSlice.js';
import { platformCommands, refreshPlatform } from '../../store/platformCommands.js';
import useWorkspaceDispatch from '../../store/useWorkspaceDispatch.js';

export function PlatformDataProvider({ children }) {
  const user = useSelector(selectSession);
  const dispatch = useWorkspaceDispatch();
  const dispatchRequest = useDispatch();
  const role = user?.role;
  const collegeId = user?.collegeId;
  const platformActions = role === 'super_admin' ? superAdminActions : collegeAdminActions;

  useEffect(() => {
    if (role !== 'super_admin' && role !== 'college_admin') return undefined;
    let cancelled = false;
    dispatch(platformActions.platformLoadStarted());
    dispatchRequest(refreshPlatform())
      .catch(() => { if (!cancelled) dispatch(platformActions.platformLoadFailed('Could not load data from the server.')); })
      .finally(() => { if (!cancelled) dispatch(platformActions.platformLoadFinished()); });
    return () => { cancelled = true; };
  }, [role, collegeId, dispatch, dispatchRequest, platformActions]);

  return children;
}

function selectPlatform(state) {
  const role = selectSession(state)?.role;
  if (role === 'super_admin') return selectSuperAdminPlatform(state);
  if (role === 'college_admin') return selectCollegeAdminPlatform(state);
  return emptyPlatform;
}

export function usePlatformData() {
  const platform = useSelector(selectPlatform);
  const dispatch = useDispatch();
  const commands = useMemo(() => bindActionCreators(platformCommands, dispatch), [dispatch]);
  return useMemo(() => ({ ...platform, ...commands }), [platform, commands]);
}
