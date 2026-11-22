import { createSlice } from '@reduxjs/toolkit';
import { addViewReducers } from './viewState.js';

export function readTheme() {
  const saved = localStorage.getItem('careernest-theme');
  return saved === 'light' || saved === 'dark' ? saved : 'dark';
}

const publicSlice = createSlice({
  name: 'publicPages',
  initialState: { views: {}, theme: 'dark' },
  reducers: {
    themeLoaded(state, { payload }) {
      state.theme = payload;
    },
    themeToggled(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
  },
  extraReducers: (builder) => {
    addViewReducers(builder, 'publicPages');
  },
});

export const { themeLoaded, themeToggled } = publicSlice.actions;
export const selectTheme = (state) => state.publicPages.theme;
export default publicSlice.reducer;
