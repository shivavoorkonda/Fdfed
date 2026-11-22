import { createSelector, createSlice } from '@reduxjs/toolkit';
import { addViewReducers } from '../viewState.js';
import { workspaceChanged } from '../sessionSlice.js';
import { emptyStore, profilePayload } from './candidateSnapshot.js';
import { loadCandidateSnapshot, saveCandidateProfile } from './candidateRequests.js';

const emptyUI = {
    notifOpen: false,
    askQueryOpen: false,
    queryMessage: '',
    successModal: { open: false, title: 'Success!', message: 'Operation completed.' },
};

function addResumeRecord(state, section, record) {
    const resume = state.store.profileResumeData;
    (resume[section] ||= []).push(record);
}

const candidateSlice = createSlice({
    name: 'candidate',
    initialState: {
        views: {}, store: emptyStore(), loading: true, loadError: '', ui: emptyUI,
        profileSync: { hydrated: false, lastSaved: '' },
    },
    reducers: {
        loadFinished(state) {
            state.loading = false;
        },
        savedDriveToggled(state, { payload: { jobId, isSaved } }) {
            state.store.savedDriveIds = isSaved
                ? state.store.savedDriveIds.filter((id) => id !== jobId)
                : [...state.store.savedDriveIds, jobId];
        },
        notificationsRead(state) {
            state.store.notificationsData.forEach((notification) => { notification.isRead = true; });
        },
        notificationRead(state, { payload: notificationId }) {
            const notification = state.store.notificationsData.find((item) => item.id === notificationId);
            if (notification) notification.isRead = true;
        },
        eligibilityChecked(state, { payload: jobId }) {
            const job = state.store.recruiterJobs.find((item) => item.id === jobId);
            if (job) job.eligibilityChecked = true;
        },
        resumeUploaded(state, { payload: entry }) {
            const resume = state.store.profileResumeData;
            resume.uploadedResume = entry;
            resume.resumeHistory = [entry, ...(resume.resumeHistory || [])];
        },
        introSaved(state, { payload: { github, linkedin, portfolio, ...intro } }) {
            const user = state.store.currentUser;
            Object.assign(user, intro, { socialLinks: { github, linkedin, portfolio } });
            const parts = user.name.split(' ');
            user.avatar = parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0];
        },
        aboutSaved(state, { payload }) {
            state.store.currentUser.about = payload;
        },
        resumeRecordAdded(state, { payload: { section, record } }) {
            addResumeRecord(state, section, record);
        },
        resumeRecordRemoved(state, { payload: { type, index } }) {
            const records = state.store.profileResumeData[type];
            if (records) records.splice(index, 1);
            state.store.notificationsData.unshift({ title: 'Record Deleted', message: 'Item removed successfully from your profile.', isRead: false });
        },
        profileImageRemoved(state, { payload: target }) {
            state.store.currentUser[target] = '';
            state.store.notificationsData.unshift({ title: 'Image Deleted', message: 'Media successfully removed from your profile.', isRead: false });
        },
        profileImageUploaded(state, { payload: { target, image } }) {
            if (target === 'banner') state.store.currentUser.bannerImage = image;
            if (target === 'avatar') state.store.currentUser.avatarImage = image;
        },
        documentUploaded(state, { payload: document }) {
            addResumeRecord(state, 'additionalDocs', document);
            state.store.notificationsData.unshift({
                title: 'Document Uploaded', message: `Successfully uploaded ${document.name}.`, isRead: false,
            });
        },
        notificationsToggled(state) {
            state.ui.notifOpen = !state.ui.notifOpen;
        },
        notificationsClosed(state) {
            state.ui.notifOpen = false;
        },
        queryOpened(state) {
            state.ui.queryMessage = '';
            state.ui.askQueryOpen = true;
        },
        queryClosed(state) {
            state.ui.askQueryOpen = false;
        },
        queryMessageChanged(state, { payload }) {
            state.ui.queryMessage = payload;
        },
        querySubmitted(state) {
            state.ui.askQueryOpen = false;
            state.ui.queryMessage = '';
            state.ui.successModal = {
                open: true,
                title: 'Query Sent',
                message: 'Your query was sent successfully. We will get back to you shortly.',
            };
        },
        successOpened(state, { payload: { title, message } }) {
            state.ui.successModal = { open: true, title, message };
        },
        successClosed(state) {
            state.ui.successModal.open = false;
        },
    },
    extraReducers: (builder) => {
        addViewReducers(builder, 'candidate');
        builder
            .addCase(workspaceChanged, (state, { payload: session }) => {
                if (session?.role === 'candidate') state.store = emptyStore(session);
            })
            .addCase(loadCandidateSnapshot.fulfilled, (state, { payload: snapshot, meta }) => {
                if (!snapshot) {
                    state.loading = false;
                    return;
                }
                // A background refresh must preserve profile edits in progress.
                if (meta.arg.silent) {
                    state.store = { ...snapshot, currentUser: state.store.currentUser, profileResumeData: state.store.profileResumeData };
                } else {
                    state.store = snapshot;
                    state.profileSync.lastSaved = JSON.stringify(profilePayload(snapshot));
                }
                state.profileSync.hydrated = true;
                state.loadError = '';
            })
            .addCase(loadCandidateSnapshot.rejected, (state, { payload, meta }) => {
                if (!meta.arg.silent) state.loadError = payload;
            })
            .addCase(saveCandidateProfile.fulfilled, (state, { payload }) => {
                state.profileSync.lastSaved = payload;
            });
    },
});

export const candidateActions = candidateSlice.actions;
export const selectCandidateWorkspace = ({ candidate: { store, loading, loadError } }) => ({ store, loading, loadError });
export const selectCandidateStore = (state) => state.candidate.store;
export const selectCandidateUI = (state) => state.candidate.ui;
export const selectCandidateProfileSync = (state) => state.candidate.profileSync;
export const selectUnreadCandidateNotifications = createSelector(
    [(state) => selectCandidateStore(state).notificationsData],
    (notifications) => notifications.filter((notification) => !notification.isRead).length,
);
export default candidateSlice.reducer;
