import { Fragment } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectSession, selectWorkspaceVersion } from '../store/sessionSlice.js';

export default function ProtectedRoute({ allowedRole, children }) {
  const user = useSelector(selectSession);
  const version = useSelector(selectWorkspaceVersion);
  const role = user?.role;
  if (!user?.accessToken || !role || (allowedRole && role !== allowedRole)) return <Navigate to="/login" replace />;
  return <Fragment key={version}>{children}</Fragment>;
}
