import api from '../../services/api.js';
import { selectWorkspaceVersion } from '../sessionSlice.js';
import { candidateActions } from './candidateSlice.js';
import { loadCandidateSnapshot } from './candidateRequests.js';

// Company suffixes are not useful for referral eligibility. This permits an
// alumnus at "TechCorp Solutions" to be discovered for a "TechCorp" drive,
// while still requiring the same underlying company name.
const COMPANY_SUFFIXES = new Set([
    'and', 'co', 'company', 'corp', 'corporation', 'inc', 'incorporated',
    'limited', 'llc', 'llp', 'private', 'pvt', 'service', 'services',
    'solution', 'solutions', 'technologies', 'technology', 'ltd',
]);

function referralCompanyKey(company) {
    return String(company || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter((word) => word && !COMPANY_SUFFIXES.has(word))
        .join(' ');
}

export const candidateCommands = {
    reload: () => (dispatch, getState) =>
        dispatch(loadCandidateSnapshot({ workspaceVersion: selectWorkspaceVersion(getState()) })),

    applyToJob: (job, resumeFile, resumeUrl) => async (dispatch, getState) => {
        if (!resumeUrl) throw new Error('Select an uploaded resume before applying.');
        const workspaceVersion = selectWorkspaceVersion(getState());
        await api.post('/applications', { opportunityId: job.id, resumeFile: resumeFile || undefined, resumeUrl });
        if (selectWorkspaceVersion(getState()) === workspaceVersion) await dispatch(candidateCommands.reload());
    },

    withdrawApplication: (applicationId) => async (dispatch, getState) => {
        const workspaceVersion = selectWorkspaceVersion(getState());
        await api.patch(`/applications/${applicationId}/withdraw`);
        if (selectWorkspaceVersion(getState()) === workspaceVersion) await dispatch(candidateCommands.reload());
    },

    toggleSaved: (jobId, isSaved) => async (dispatch, getState) => {
        const workspaceVersion = selectWorkspaceVersion(getState());
        if (isSaved) await api.delete(`/features/candidate/drives/${jobId}/save`);
        else await api.post(`/features/candidate/drives/${jobId}/save`);
        if (selectWorkspaceVersion(getState()) === workspaceVersion) {
            dispatch(candidateActions.savedDriveToggled({ jobId, isSaved }));
        }
    },

    markAllNotificationsRead: () => async (dispatch) => {
        dispatch(candidateActions.notificationsRead());
        await api.patch('/notifications/read-all').catch(() => {});
    },

    markNotificationRead: (notificationId) => async (dispatch) => {
        dispatch(candidateActions.notificationRead(notificationId));
        await api.patch(`/notifications/${notificationId}/read`).catch(() => {});
    },

    fetchAlumniForCompany: (company) => async () => {
        const { data } = await api.get('/users/alumni-directory');
        const wanted = referralCompanyKey(company);
        return data.filter((alumnus) => referralCompanyKey(alumnus.company) === wanted);
    },

    requestReferral: ({ applicationId, opportunityId, alumniId, message }) => async (dispatch, getState) => {
        const workspaceVersion = selectWorkspaceVersion(getState());
        await api.post('/referrals', { opportunityId, applicationId, alumniId, userMessage: message });
        if (selectWorkspaceVersion(getState()) === workspaceVersion) await dispatch(candidateCommands.reload());
    },
};
