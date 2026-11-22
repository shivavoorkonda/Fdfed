import { createSelector, createSlice } from '@reduxjs/toolkit';
import { addViewReducers } from '../viewState.js';
import { readSavedPage } from '../../shared/utils/navigationState.js';
import { workspaceChanged } from '../sessionSlice.js';
import { loadRecruiterWorkspace } from './recruiterRequests.js';

export const initialsOf = (name = '') => name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'RC';

function recruiterFromSession(session = {}) {
  return {
    name: session.name || '',
    role: session.headline || 'Recruiter',
    email: session.email || '',
    avatar: session.avatar || initialsOf(session.name),
    company: session.company || '',
    department: session.department || '',
    phone: session.phone || '',
    location: session.location || '',
    joinedDate: session.joinedDate || '',
  };
}

export const RECRUITER_TABS = ['dashboard', 'post', 'opportunities', 'applications', 'assessments', 'candidates', 'reports', 'profile'];
export const RECRUITER_TAB_KEY = 'cn_active_recruiter_tab';

const recruiterSlice = createSlice({
  name: 'recruiter',
  initialState: () => ({
    views: {},
    activeTab: readSavedPage(RECRUITER_TAB_KEY, 'dashboard', RECRUITER_TABS),
    selectedRoleFilter: 'All Roles',
    scheduleFor: null,
    recruiter: recruiterFromSession(),
    opportunities: [],
    applications: [],
    assessments: [],
    notifications: [],
    workspaceRequest: { id: null, status: 'idle', error: null },
  }),
  reducers: {
    tabChanged(state, { payload }) {
      state.activeTab = payload;
    },
    roleFilterChanged(state, { payload }) {
      state.selectedRoleFilter = payload;
    },
    scheduleSelectionChanged(state, { payload }) {
      state.scheduleFor = payload;
    },
    profileLoaded(state, { payload: user }) {
      state.recruiter = {
        ...state.recruiter,
        name: user.name,
        email: user.email,
        role: user.headline || 'Recruiter',
        avatar: user.avatar || initialsOf(user.name),
        company: user.company || '',
        department: user.department || '',
        phone: user.phone || '',
        location: user.location || '',
        joinedDate: user.joinedDate || state.recruiter.joinedDate,
      };
    },
    profileUpdated(state, { payload }) {
      state.recruiter = { ...state.recruiter, ...payload };
    },
    notificationsRead(state) {
      state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
    },
  },
  extraReducers: (builder) => {
    addViewReducers(builder, 'recruiter');
    builder
      .addCase(workspaceChanged, (state, { payload: session }) => {
        if (session?.role === 'recruiter') state.recruiter = recruiterFromSession(session);
      })
      .addCase(loadRecruiterWorkspace.pending, (state, { meta }) => {
        state.workspaceRequest = { id: meta.requestId, status: 'pending', error: null };
      })
      .addCase(loadRecruiterWorkspace.fulfilled, (state, { payload, meta }) => {
        if (state.workspaceRequest.id !== meta.requestId) return;
        state.opportunities = payload.opportunities;
        state.applications = payload.applications;
        state.assessments = payload.assessments;
        state.notifications = payload.notifications;
        state.workspaceRequest.status = 'fulfilled';
      })
      .addCase(loadRecruiterWorkspace.rejected, (state, { error, meta }) => {
        if (state.workspaceRequest.id !== meta.requestId) return;
        state.workspaceRequest.status = 'rejected';
        state.workspaceRequest.error = error;
      });
  },
});

export const recruiterActions = recruiterSlice.actions;
export const selectRecruiter = (state) => {
  const { views, workspaceRequest, ...workspace } = state.recruiter;
  return workspace;
};
export const selectOpportunitiesWithCount = createSelector(
  [(state) => state.recruiter.opportunities, (state) => state.recruiter.applications],
  (opportunities, applications) => opportunities.map((opportunity) => ({
    ...opportunity,
    applications: applications.filter((application) => application.opportunityId === opportunity.id).length,
  })),
);
export default recruiterSlice.reducer;
