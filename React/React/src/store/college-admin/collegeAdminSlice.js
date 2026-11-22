import { createSlice } from '@reduxjs/toolkit';
import { addViewReducers } from '../viewState.js';
import { readSavedPage } from '../../shared/utils/navigationState.js';
import { emptyPlatform } from '../adminPlatformState.js';

export const COLLEGE_ADMIN_TABS = ['dashboard', 'officers', 'students', 'alumni', 'recruiters', 'activity', 'announcements', 'messages', 'reports', 'profile'];
export const COLLEGE_ADMIN_TAB_KEY = 'cn_active_college_admin_tab';

const collegeAdminSlice = createSlice({
  name: 'collegeAdmin',
  initialState: () => ({ views: {}, activeTab: readSavedPage(COLLEGE_ADMIN_TAB_KEY, 'dashboard', COLLEGE_ADMIN_TABS), unread: 0, platform: emptyPlatform }),
  reducers: {
    tabChanged(state, { payload }) {
      state.activeTab = payload;
    },
    unreadChanged(state, { payload }) {
      state.unread = payload;
    },
    platformLoaded(state, { payload }) {
      state.platform.data = payload;
    },
    platformLoadStarted(state) {
      state.platform.loading = true;
      state.platform.error = '';
    },
    platformLoadFailed(state, { payload }) {
      state.platform.error = payload;
    },
    platformLoadFinished(state) {
      state.platform.loading = false;
    },
  },
  extraReducers: (builder) => {
    addViewReducers(builder, 'collegeAdmin');
  },
});

export const collegeAdminActions = collegeAdminSlice.actions;
export const selectCollegeAdmin = (state) => {
  const { views, ...workspace } = state.collegeAdmin;
  return workspace;
};
export const selectCollegeAdminPlatform = (state) => state.collegeAdmin.platform;
export default collegeAdminSlice.reducer;
