import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchRecruiterData } from '../../roles/recruiter/data/api.js';
import { selectWorkspaceVersion } from '../sessionSlice.js';

export const loadRecruiterWorkspace = createAsyncThunk(
  'recruiter/loadWorkspace',
  () => fetchRecruiterData(),
  {
    condition: ({ workspaceVersion }, { getState }) => selectWorkspaceVersion(getState()) === workspaceVersion,
    serializeError: (error) => ({
      message: error.message,
      response: error.response ? { data: error.response.data } : undefined,
    }),
  },
);
