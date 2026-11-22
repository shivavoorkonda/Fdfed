import { createSlice } from '@reduxjs/toolkit';

const dialogSlice = createSlice({
  name: 'dialogs',
  initialState: [],
  reducers: {
    dialogQueued(state, { payload }) {
      state.push(payload);
    },
    dialogDismissed(state, { payload: id }) {
      if (state[0]?.id === id) state.shift();
    },
  },
});

export const { dialogQueued, dialogDismissed } = dialogSlice.actions;
export const selectActiveDialog = (state) => state.dialogs[0];
export default dialogSlice.reducer;
