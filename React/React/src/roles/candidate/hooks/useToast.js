import { useViewState } from '../../../store/useViewState.js';
import { useCallback, useEffect, useRef } from 'react';

// Simple transient toast (auto-hides after 3s), matching the vanilla-JS pages' behavior.
export function useToast() {
    const [{ toast }, { setToast }] = useViewState('candidate', 'useToast', () => ({
      toast: { show: false, message: '' },
    }));
    const timerRef = useRef(null);

    useEffect(() => () => clearTimeout(timerRef.current), []);

    const showToast = useCallback((message) => {
        setToast({ show: true, message });
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
    }, [setToast]);

    return { toast, showToast };
}

