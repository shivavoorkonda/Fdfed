import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { candidateActions, selectCandidateUI, selectCandidateStore, selectUnreadCandidateNotifications } from '../../../store/candidate/candidateSlice.js';
import { useNavigate } from 'react-router-dom';
import { useCandidateCommands } from './StoreContext.jsx';

export function useUI() {
    const ui = useSelector(selectCandidateUI);
    const notifications = useSelector((state) => selectCandidateStore(state).notificationsData);
    const unreadCount = useSelector(selectUnreadCandidateNotifications);
    const { markAllNotificationsRead, markNotificationRead } = useCandidateCommands();
    const navigate = useNavigate();

    const dispatch = useDispatch();

    const toggleNotif = useCallback(() => dispatch(candidateActions.notificationsToggled()), [dispatch]);
    const closeNotif = useCallback(() => dispatch(candidateActions.notificationsClosed()), [dispatch]);

    const markAllRead = useCallback(() => {
        markAllNotificationsRead();
    }, [markAllNotificationsRead]);

    const readAndNavigate = useCallback(
        (idx, route) => {
            const notification = notifications[idx];
            if (notification) markNotificationRead(notification.id);
            closeNotif();
            if (route && route !== '#') navigate(`/candidate/${route.replace('.html', '')}`);
        },
        [closeNotif, notifications, markNotificationRead, navigate]
    );

    const openAskQuery = useCallback((e) => {
        if (e) e.preventDefault();
        dispatch(candidateActions.queryOpened());
    }, [dispatch]);

    const closeAskQuery = useCallback(() => dispatch(candidateActions.queryClosed()), [dispatch]);
    const setQueryMessage = useCallback((message) => dispatch(candidateActions.queryMessageChanged(message)), [dispatch]);
    const submitQuery = useCallback(() => dispatch(candidateActions.querySubmitted()), [dispatch]);

    const showSuccess = useCallback((title, message) => {
        dispatch(candidateActions.successOpened({ title, message }));
    }, [dispatch]);

    const closeSuccess = useCallback(() => dispatch(candidateActions.successClosed()), [dispatch]);

    return {
        ...ui, toggleNotif, closeNotif, markAllRead, readAndNavigate, unreadCount,
        openAskQuery, closeAskQuery, setQueryMessage, submitQuery, showSuccess, closeSuccess,
    };
}
