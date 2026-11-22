import { createSlice } from '@reduxjs/toolkit';
import { addViewReducers } from '../viewState.js';
import { readSavedPage } from '../../shared/utils/navigationState.js';
import { workspaceChanged } from '../sessionSlice.js';

export const initialsOf = (name = '') => name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

const emptyProfile = (session) => ({
  initials: initialsOf(session?.name),
  name: session?.name || '',
  email: session?.email || '',
  company: '',
  batch: '',
  role: 'Alumni',
  totalReferrals: 0,
  approved: 0,
});

const ALUMNI_PAGES = ['dashboard', 'directory', 'profile', 'referrals'];
export const ALUMNI_PAGE_KEY = 'cn_active_alumni_page';

const alumniSlice = createSlice({
  name: 'alumni',
  initialState: () => ({
    views: {},
    activePage: readSavedPage(ALUMNI_PAGE_KEY, 'dashboard', ALUMNI_PAGES),
    pageProps: {},
    alumniData: emptyProfile(),
    referrals: [],
    loadError: '',
    personalInfo: { name: '', email: '', company: '', batch: '', role: '', location: '', linkedin: '', github: '', portfolio: '' },
    skillsList: [],
  }),
  reducers: {
    pageChanged(state, { payload }) {
      state.activePage = payload.page;
      state.pageProps = payload.props;
    },
    referralsLoaded(state, { payload }) {
      state.referrals = payload;
    },
    loadErrorChanged(state, { payload }) {
      state.loadError = payload;
    },
    profileLoaded(state, { payload: { alumniData, personalInfo, skillsList } }) {
      state.alumniData = alumniData;
      state.personalInfo = personalInfo;
      state.skillsList = skillsList;
    },
    personalInfoSaved(state, { payload: info }) {
      state.personalInfo = info;
      state.alumniData.name = info.name || state.alumniData.name;
      state.alumniData.initials = initialsOf(state.alumniData.name);
      state.alumniData.company = info.company || state.alumniData.company;
    },
    skillsChanged(state, { payload }) {
      state.skillsList = payload;
    },
    referralTotalsChanged(state, { payload }) {
      state.alumniData.totalReferrals = payload.total;
      state.alumniData.approved = payload.approved;
    },
  },
  extraReducers: (builder) => {
    addViewReducers(builder, 'alumni');
    builder.addCase(workspaceChanged, (state, { payload: session }) => {
      if (session?.role === 'alumni') state.alumniData = emptyProfile(session);
    });
  },
});

export const alumniActions = alumniSlice.actions;
export const selectAlumni = (state) => {
  const { views, ...workspace } = state.alumni;
  return workspace;
};
export default alumniSlice.reducer;
