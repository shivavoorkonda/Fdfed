import { useViewState } from '../../store/useViewState.js';
import { infoDialog } from '../../shared/components/AppDialog.jsx';
import { useCallback } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import SuperAdminSidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import SADashboard from './pages/Dashboard';
import Colleges from './pages/Colleges';
import CollegeAdmins from './pages/CollegeAdmins';
import ActivityLog from './pages/ActivityLog';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import SignOutModal from './components/SignOutModal';
import { useLogout, useUpdateSession } from '../../shared/context/AuthContext.jsx';
import { SUPER_ADMIN_TAB_KEY, SUPER_ADMIN_TABS, superAdminActions, selectSuperAdmin } from '../../store/super-admin/superAdminSlice.js';
import { selectSession } from '../../store/sessionSlice.js';
import useWorkspaceDispatch from '../../store/useWorkspaceDispatch.js';
import { usePlatformData } from '../../shared/context/PlatformDataContext.jsx';
import { savePage } from '../../shared/utils/navigationState.js';
import './styles/SuperAdmin.css';

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'SA';
}

function getTitle(tab) {
  switch (tab) {
    case 'dashboard':      return 'Platform Dashboard';
    case 'colleges':       return 'Colleges';
    case 'college-admins': return 'College Admin Management';
    case 'activity':       return 'Activity Log';
    case 'messages':       return 'Messages';
    case 'profile':        return 'My Profile';
    default:               return 'Super Admin';
  }
}

export default function SuperAdminApp() {
  const platform = usePlatformData();
  const { data, stats } = platform;
  const user = useSelector(selectSession);
  const dispatch = useWorkspaceDispatch();
  const confirmSignOut = useLogout();
  const updateSession = useUpdateSession();
  const workspace = useSelector(selectSuperAdmin, shallowEqual);
  const userName = user.name || localStorage.getItem('userName') || 'Super Admin';

  const activeTab = workspace.activeTab;
  const { adminCollegeId } = workspace;
  const [{ isSignOutOpen }, { setIsSignOutOpen }] = useViewState('superAdmin', 'SuperAdminApp', () => ({
    isSignOutOpen: false,
  }));

  const showToast = useCallback((msg) => { infoDialog(msg); }, []);

  const handleSignOut = () => setIsSignOutOpen(true);

  const handleTabChange = (tab) => {
    const nextTab = SUPER_ADMIN_TABS.includes(tab) ? tab : 'dashboard';
    savePage(SUPER_ADMIN_TAB_KEY, nextTab);
    dispatch(superAdminActions.tabChanged(nextTab));
  };

  const pageProps = {
    colleges: data.colleges,
    stats,
    platform,
    showToast, setActiveTab: handleTabChange,
    adminCollegeId, setAdminCollegeId: (id) => dispatch(superAdminActions.adminCollegeChanged(id)),
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
            {activeTab === 'dashboard'      && <SADashboard {...pageProps} data={data} userName={userName} avatarInitials={getInitials(userName)} />}
            {activeTab === 'colleges'       && <Colleges     {...pageProps} />}
            {activeTab === 'college-admins' && <CollegeAdmins {...pageProps} />}
            {activeTab === 'activity'       && <ActivityLog />}
            {activeTab === 'messages'       && <Messages colleges={data.colleges} />}
            {activeTab === 'profile'        && <Profile showToast={showToast} onProfileUpdated={updateSession} />}
          </div>
        </div>

        {/* Toast */}

        <SignOutModal
          isOpen={isSignOutOpen}
          onClose={() => setIsSignOutOpen(false)}
          onConfirm={confirmSignOut}
        />
      </div>
    </div>
  );
}
