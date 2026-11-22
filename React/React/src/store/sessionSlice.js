import { createAction, createSlice } from '@reduxjs/toolkit';

export const workspaceChanged = createAction('auth/workspaceChanged');

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, workspaceVersion: 0 },
  reducers: {
    sessionChanged(state, { payload: user }) {
      const previous = state.user;
      if (previous?.id !== user?.id || previous?.role !== user?.role ||
          previous?.collegeId !== user?.collegeId || Boolean(previous?.accessToken) !== Boolean(user?.accessToken)) {
        state.workspaceVersion += 1;
      }
      state.user = user;
    },
  },
});

export const { sessionChanged } = authSlice.actions;
export const selectSession = (state) => state.auth.user;
export const selectWorkspaceVersion = (state) => state.auth.workspaceVersion;
export default authSlice.reducer;
