import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { clearSession, errorMessage } from '../../services/api.js';
import AdminSidebar from './components/AdminSidebar.jsx';
import AdminHeader from './components/AdminHeader.jsx';
import { AdminDashboard, AnnouncementsPage, CollegeAdminsPage, CollegesPage, MessagesPage, OnboardingPage, ProfilePage, SupportPage } from './pages/OperationsPages.jsx';
import './styles/Admin.css';
import './styles/AdminContent.css';

const TITLES = { dashboard: 'Operations Dashboard', colleges: 'College Management', onboarding: 'College Onboarding', 'college-admins': 'College Admin Management', support: 'Support Center', messages: 'Message Center', announcements: 'Platform Announcements', profile: 'My Profile' };

export default function AdminApp() {
  const [active, setActive] = useState('dashboard');
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('loggedInUser') || '{}'); } catch { return {}; } });
  const [data, setData] = useState({ colleges: [], stats: null });
  const [loading, setLoading] = useState(true); const [toast, setToast] = useState(null);
  const notify = useCallback((message, type = 'success') => { setToast({ message, type }); window.setTimeout(() => setToast(null), 3400); }, []);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [colleges, stats] = await Promise.all([
        api.get('/super-admin/colleges'), api.get('/super-admin/stats'),
      ]);
      setData({ colleges: colleges.data || [], stats: stats.data || {} });
    } catch (error) { notify(errorMessage(error, 'Could not load operational data.'), 'error'); }
    finally { setLoading(false); }
  }, [notify]);
  useEffect(() => { refresh(); }, [refresh]);
  const common = useMemo(() => ({ data, loading, refresh, notify, user, setActive }), [data, loading, refresh, notify, user]);
  const pages = { dashboard: <AdminDashboard {...common} />, colleges: <CollegesPage {...common} />, onboarding: <OnboardingPage {...common} />, 'college-admins': <CollegeAdminsPage {...common} />, support: <SupportPage {...common} />, messages: <MessagesPage {...common} />, announcements: <AnnouncementsPage {...common} />, profile: <ProfilePage {...common} onUserUpdated={setUser} /> };
  const signOut = () => { clearSession(); window.location.replace('/login'); };
  return <div className="cn-admin"><div className="admin-layout"><AdminSidebar active={active} onChange={setActive} onSignOut={signOut} /><main className="admin-main"><AdminHeader title={TITLES[active]} user={user} onProfile={() => setActive('profile')} /><div className="admin-page">{pages[active]}</div></main>{toast && <div className={`admin-toast ${toast.type}`}>{toast.message}</div>}</div></div>;
}
