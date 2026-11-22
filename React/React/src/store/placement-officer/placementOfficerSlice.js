import { createSlice } from '@reduxjs/toolkit';
import { addViewReducers } from '../viewState.js';
import { readSavedPage } from '../../shared/utils/navigationState.js';

const emptyData = {
  stats: {
    totalCandidates: 0, placementRate: 0, highestPkg: 0, companiesVisited: 0, totalApps: 0,
    avgPkg: 0, studentsPlaced: 0, offersMade: 0, internships: 0, pending: 0, published: 0, totalOpps: 0, totalApplicants: 0,
  },
  stakeholders: { candidates: 0, recruiters: 0, activeDrives: 0, alumni: 0 },
  branches: [],
  topCompanies: [],
  monthlyTrend: [],
  trend: { labels: [], fullTime: [], internships: [] },
  submissions: [],
  drives: [],
  interviews: [],
  recruiters: [],
  announcements: [],
  users: [],
  applications: [],
  notifications: [],
};

export const PLACEMENT_PAGES = ['p1', 'dashboard', 'p2', 'review', 'p3', 'statistics', 'placement-dashboard', 'dept-report', 'p4', 'recruiters', 'p5', 'oversight', 'p6', 'tracking', 'bulk-notify', 'profile'];
export const PLACEMENT_PAGE_KEY = 'cn_active_placement_page';

const placementOfficerSlice = createSlice({
  name: 'placementOfficer',
  initialState: () => ({ views: {}, currentPage: readSavedPage(PLACEMENT_PAGE_KEY, 'p1', PLACEMENT_PAGES), snapshot: { data: emptyData, revision: 0 } }),
  reducers: {
    pageChanged(state, { payload }) {
      state.currentPage = payload;
    },
    snapshotLoaded(state, { payload }) {
      state.snapshot.data = payload;
      state.snapshot.revision += 1;
    },
  },
  extraReducers: (builder) => {
    addViewReducers(builder, 'placementOfficer');
  },
});

export const placementOfficerActions = placementOfficerSlice.actions;
export const selectPlacementPage = (state) => state.placementOfficer.currentPage;
export const selectOfficerSnapshot = (state) => state.placementOfficer.snapshot;
export default placementOfficerSlice.reducer;
