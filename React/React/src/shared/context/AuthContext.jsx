import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { clearSession, readSession } from '../../services/api.js';
import { selectWorkspaceVersion, sessionChanged } from '../../store/sessionSlice.js';

const PROTECTED_PATH_PREFIXES = ['/candidate', '/alumni', '/recruiter', '/placement', '/college-admin', '/super-admin'];

function isProtectedPath(pathname) {
  return PROTECTED_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function AuthProvider({ children }) {
  const dispatch = useDispatch();

  // A browser profile can have only one active CareerNest account. Without
  // this listener, an officer screen left open in one tab could keep rendering
  // after another tab signs in as a candidate, while API calls use the newer
  // candidate session. Keep every tab's UI aligned with its request headers.
  useEffect(() => {
    const syncSession = (event) => {
      if (event.key === 'loggedInUser' || event.key === null) dispatch(sessionChanged(readSession()));
    };
    window.addEventListener('storage', syncSession);
    return () => window.removeEventListener('storage', syncSession);
  }, [dispatch]);

  // Browsers may restore a page from their back/forward cache without remounting
  // the route. Re-check storage on history navigation so a signed-out user can
  // never view a previously rendered portal screen.
  useEffect(() => {
    const enforceAuthentication = () => {
      if (!readSession()?.accessToken && isProtectedPath(window.location.pathname)) {
        window.location.replace('/login');
      }
    };
    window.addEventListener('pageshow', enforceAuthentication);
    window.addEventListener('popstate', enforceAuthentication);
    return () => {
      window.removeEventListener('pageshow', enforceAuthentication);
      window.removeEventListener('popstate', enforceAuthentication);
    };
  }, []);

  return children;
}

export function useUpdateSession() {
  const dispatch = useDispatch();
  const store = useStore();
  const version = useSelector(selectWorkspaceVersion);

  return useCallback((user) => {
    if (selectWorkspaceVersion(store.getState()) !== version) return false;
    localStorage.setItem('loggedInUser', JSON.stringify(user));
    dispatch(sessionChanged(user));
    return true;
  }, [dispatch, store, version]);
}

export function useLogout() {
  const dispatch = useDispatch();

  return useCallback(() => {
    clearSession();
    dispatch(sessionChanged(null));
    window.location.replace('/login');
  }, [dispatch]);
}
