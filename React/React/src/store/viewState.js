import { createAction } from '@reduxjs/toolkit';

export const viewMounted = createAction('views/mounted');
export const viewFieldChanged = createAction('views/fieldChanged');
export const viewUnmounted = createAction('views/unmounted');

export function addViewReducers(builder, owner) {
  builder
    .addCase(viewMounted, (state, { payload }) => {
      if (payload.owner === owner) state.views[payload.id] = payload.values;
    })
    .addCase(viewFieldChanged, (state, { payload }) => {
      if (payload.owner === owner && state.views[payload.id]) {
        state.views[payload.id][payload.field] = payload.value;
      }
    })
    .addCase(viewUnmounted, (state, { payload }) => {
      if (payload.owner === owner) delete state.views[payload.id];
    });
}

export function selectView(state, owner, id) {
  return state[owner].views[id];
}

export const workspaceOwners = {
  candidate: 'candidate',
  alumni: 'alumni',
  recruiter: 'recruiter',
  placement_officer: 'placementOfficer',
  college_admin: 'collegeAdmin',
  super_admin: 'superAdmin',
};
