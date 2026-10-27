import React, { useState } from 'react';
import SuperAdminSidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ActivityLog from './pages/ActivityLog';
import Colleges from './pages/Colleges';
import CollegeAdmins from './pages/CollegeAdmins';
import {
  AdminsOverview,
  AnalyticsView,
  ObserverProfile,
  PlatformOverview,
  SupportAudit,
  UsersOverview,
} from './pages/ObserverViews';
import SignOutModal from './components/SignOutModal';
import { clearSession } from '../../services/api.js';
import { usePlatformData } from '../../shared/context/PlatformDataContext.jsx';
import { readSavedPage, savePage } from '../../shared/utils/navigationState.js';
import './styles/SuperAdmin.css';

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'SA';
}

function getTitle(tab) {
  switch (tab) {
    case 'overview':  return 'Platform Overview';
    case 'colleges':  return 'College Management';
    case 'admins':    return 'Admin Management';
    case 'college-admins': return 'College Admin Management';
    case 'users':     return 'All Users';
    case 'analytics': return 'Platform Analytics';
    case 'support':   return 'Support Audit';
    case 'activity':  return 'Audit Trail';
    case 'profile':   return 'My Profile';
    default:          return 'Super Admin';
  }
}

const SUPER_ADMIN_TABS = ['overview', 'colleges', 'college-admins', 'admins', 'users', 'analytics', 'support', 'activity', 'profile'];
const SUPER_ADMIN_TAB_KEY = 'cn_active_super_admin_tab';

export default function SuperAdminApp() {
  const platform = usePlatformData();
  const { data, stats } = platform;
  const [user] = useState(() => {
    const raw = localStorage.getItem('loggedInUser');
    try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
  });
  const userName = user.name || localStorage.getItem('userName') || 'Super Admin';

  const [activeTab, setActiveTab] = useState(() => readSavedPage(SUPER_ADMIN_TAB_KEY, 'overview', SUPER_ADMIN_TABS));
  const [adminCollegeId, setAdminCollegeId] = useState(null);
  const [toast, setToast] = useState(null);
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  };

  const handleSignOut = () => setIsSignOutOpen(true);
  const confirmSignOut = () => {
    clearSession();
    window.location.replace('/login');
  };

  const handleTabChange = (tab) => {
    const nextTab = SUPER_ADMIN_TABS.includes(tab) ? tab : 'overview';
    savePage(SUPER_ADMIN_TAB_KEY, nextTab);
    setActiveTab(nextTab);
  };

  return (
    <div className="cn-super-admin" style={{ display: 'contents' }}>
      <div className="app-container">
        {/* Sidebar */}
        <SuperAdminSidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          onSignOut={handleSignOut}
        />

        {/* Main */}
        <div className="main-content">
          <Topbar
            title={getTitle(activeTab)}
            userName={userName}
            avatarInitials={getInitials(userName)}
            onProfileClick={() => handleTabChange('profile')}
            onSignOutClick={handleSignOut}
          />

          <div className="page-content">
            {activeTab === 'overview'  && <PlatformOverview colleges={data.colleges} stats={stats} userName={userName} />}
            {activeTab === 'colleges'  && <Colleges colleges={data.colleges} platform={platform} showToast={showToast} setActiveTab={handleTabChange} setAdminCollegeId={setAdminCollegeId} />}
            {activeTab === 'admins'    && <AdminsOverview platform={platform} />}
            {activeTab === 'college-admins' && <CollegeAdmins colleges={data.colleges} platform={platform} showToast={showToast} adminCollegeId={adminCollegeId} setAdminCollegeId={setAdminCollegeId} />}
            {activeTab === 'users'     && <UsersOverview />}
            {activeTab === 'analytics' && <AnalyticsView colleges={data.colleges} stats={stats} />}
            {activeTab === 'support'   && <SupportAudit />}
            {activeTab === 'activity'  && <ActivityLog />}
            {activeTab === 'profile'   && <ObserverProfile user={user} />}
          </div>
        </div>

        {toast && <div className={'toast ' + toast.type}>{toast.message}</div>}

        <SignOutModal
          isOpen={isSignOutOpen}
          onClose={() => setIsSignOutOpen(false)}
          onConfirm={confirmSignOut}
        />
      </div>
    </div>
  );
}
