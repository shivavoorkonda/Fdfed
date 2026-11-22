import { bindActionCreators } from '@reduxjs/toolkit';
import { useCallback, useEffect, useMemo } from 'react';
import { shallowEqual, useDispatch, useSelector, useStore as useReduxStore } from 'react-redux';
import { candidateCommands } from '../../../store/candidate/candidateCommands.js';
import { loadCandidateSnapshot, saveCandidateProfile } from '../../../store/candidate/candidateRequests.js';
import { candidateActions, selectCandidateProfileSync, selectCandidateStore, selectCandidateWorkspace } from '../../../store/candidate/candidateSlice.js';
import { profilePayload } from '../../../store/candidate/candidateSnapshot.js';
import { selectSession, selectWorkspaceVersion } from '../../../store/sessionSlice.js';

export function StoreProvider({ children }) {
    const dispatch = useDispatch();
    const redux = useReduxStore();
    const workspaceVersion = useSelector(selectWorkspaceVersion);
    const sessionId = useSelector(selectSession)?.id;
    const { currentUser, profileResumeData } = useSelector(selectCandidateStore);

    useEffect(() => {
        let cancelled = false;
        dispatch(loadCandidateSnapshot({ workspaceVersion })).then(() => {
            if (!cancelled && selectWorkspaceVersion(redux.getState()) === workspaceVersion) {
                dispatch(candidateActions.loadFinished());
            }
        });
        const timer = setInterval(() => {
            if (!document.hidden) dispatch(loadCandidateSnapshot({ workspaceVersion, silent: true }));
        }, 20000);
        return () => { cancelled = true; clearInterval(timer); };
    }, [dispatch, redux, workspaceVersion]);

    // Check the last saved value when the profile changes. Save completions
    // alone do not restart the debounce or retry a failed request.
    useEffect(() => {
        const { hydrated, lastSaved } = selectCandidateProfileSync(redux.getState());
        if (!hydrated) return undefined;
        const payload = profilePayload({ currentUser, profileResumeData });
        if (JSON.stringify(payload) === lastSaved) return undefined;
        const timer = setTimeout(() => {
            dispatch(saveCandidateProfile({ workspaceVersion, id: sessionId, payload }));
        }, 700);
        return () => clearTimeout(timer);
    }, [currentUser, dispatch, profileResumeData, redux, sessionId, workspaceVersion]);

    return children;
}

export function useCandidateCommands() {
    const dispatch = useDispatch();
    return useMemo(() => bindActionCreators(candidateCommands, dispatch), [dispatch]);
}

export function useStore() {
    const workspace = useSelector(selectCandidateWorkspace, shallowEqual);
    const actions = useCandidateCommands();
    const redux = useReduxStore();
    const workspaceVersion = useSelector(selectWorkspaceVersion);
    const dispatchCandidate = useCallback((action) => {
        if (selectWorkspaceVersion(redux.getState()) === workspaceVersion) redux.dispatch(action);
    }, [redux, workspaceVersion]);
    return { ...workspace, ...actions, dispatchCandidate };
}
