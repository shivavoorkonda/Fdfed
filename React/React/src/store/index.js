import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { readSession } from '../services/api.js';
import alumni from './alumni/alumniSlice.js';
import candidate from './candidate/candidateSlice.js';
import collegeAdmin from './college-admin/collegeAdminSlice.js';
import dialogs from './dialogSlice.js';
import placementOfficer from './placement-officer/placementOfficerSlice.js';
import publicPages from './publicSlice.js';
import recruiter from './recruiter/recruiterSlice.js';
import auth, { sessionChanged, workspaceChanged } from './sessionSlice.js';
import superAdmin from './super-admin/superAdminSlice.js';

const appReducer = combineReducers({
  auth, publicPages, candidate, alumni, recruiter, placementOfficer, collegeAdmin, superAdmin, dialogs,
});

function rootReducer(state, action) {
  const requestVersion = action.meta?.arg?.workspaceVersion;
  if (state && requestVersion != null && requestVersion !== state.auth.workspaceVersion) return state;

  const next = appReducer(state, action);
  if (state && next.auth.workspaceVersion !== state.auth.workspaceVersion) {
    // Drop the previous account's data even when the switch happens in another tab.
    return appReducer({ auth: next.auth, publicPages: next.publicPages }, workspaceChanged(next.auth.user));
  }
  return next;
}

const store = configureStore({
  reducer: rootReducer,
  // The session contains the same access token used by the route guard.
  devTools: false,
});
store.dispatch(sessionChanged(readSession()));

export default store;
