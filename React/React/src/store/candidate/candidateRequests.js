import { createAsyncThunk } from '@reduxjs/toolkit';
import api, { errorMessage } from '../../services/api.js';
import { selectSession, selectWorkspaceVersion } from '../sessionSlice.js';
import { buildStore } from './candidateSnapshot.js';

const currentWorkspace = {
    condition: ({ workspaceVersion }, { getState }) => selectWorkspaceVersion(getState()) === workspaceVersion,
};

export const loadCandidateSnapshot = createAsyncThunk(
    'candidate/loadSnapshot',
    async (_, { getState, rejectWithValue }) => {
        const id = selectSession(getState())?.id;
        if (!id) return null;

        try {
            const [user, jobs, applications, notifications, savedIds, schedule, referrals, announcements] = await Promise.all([
                api.get(`/users/${id}`).then((r) => r.data),
                api.get('/opportunities').then((r) => r.data),
                api.get('/applications/my').then((r) => r.data),
                api.get('/notifications').then((r) => r.data),
                api.get('/features/candidate/saved-drive-ids').then((r) => r.data),
                api.get('/assessments/my').then((r) => r.data),
                api.get('/referrals/my').then((r) => r.data),
                api.get('/announcements').then((r) => r.data),
            ]);
            return buildStore({
                user, jobs, applications, notifications, schedule, referrals, announcements,
                savedIds: savedIds.map(Number).filter((value) => !Number.isNaN(value)),
            });
        } catch (error) {
            return rejectWithValue(errorMessage(error, 'Could not load your data.'));
        }
    },
    currentWorkspace,
);

export const saveCandidateProfile = createAsyncThunk(
    'candidate/saveProfile',
    async ({ id, payload }) => {
        await api.put(`/users/${id}`, payload);
        return JSON.stringify(payload);
    },
    currentWorkspace,
);
