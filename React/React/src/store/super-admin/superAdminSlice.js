import { createSlice } from '@reduxjs/toolkit';
import { addViewReducers } from '../viewState.js';
import { readSavedPage } from '../../shared/utils/navigationState.js';
import { emptyPlatform } from '../adminPlatformState.js';

export const SUPER_ADMIN_TABS = ['dashboard', 'colleges', 'college-admins', 'activity', 'messages', 'profile'];
export const SUPER_ADMIN_TAB_KEY = 'cn_active_super_admin_tab';

const superAdminSlice = createSlice({
  name: 'superAdmin',
  initialState: () => ({ views: {}, activeTab: readSavedPage(SUPER_ADMIN_TAB_KEY, 'dashboard', SUPER_ADMIN_TABS), adminCollegeId: null, platform: emptyPlatform }),
  reducers: {
    tabChanged(state, { payload }) {
      state.activeTab = payload;
      if (payload !== 'college-admins') state.adminCollegeId = null;
    },
    adminCollegeChanged(state, { payload }) {
      state.adminCollegeId = payload;
    },
    platformLoaded(state, { payload }) {
      state.platform.data = payload.data;
      state.platform.stats = payload.stats;
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
    addViewReducers(builder, 'superAdmin');
  },
});

export const superAdminActions = superAdminSlice.actions;
export const selectSuperAdmin = (state) => {
  const { views, ...workspace } = state.superAdmin;
  return workspace;
};
export const selectSuperAdminPlatform = (state) => state.superAdmin.platform;
export default superAdminSlice.reducer;
