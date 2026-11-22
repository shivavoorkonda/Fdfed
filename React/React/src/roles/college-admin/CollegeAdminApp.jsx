import { useViewState } from '../../store/useViewState.js';
import { infoDialog } from '../../shared/components/AppDialog.jsx';
import { useCallback, useEffect } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import CollegeAdminSidebar from './components/Sidebar';
import CATopbar from './components/Topbar';
import CADashboard from './pages/Dashboard';
import Officers from './pages/Officers';
import Recruiters from './pages/Recruiters.jsx';
import AccountDirectory from '../../shared/components/AccountDirectory.jsx';
import ActivityLog from './pages/ActivityLog.jsx';
import Announcements from './pages/Announcements';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import SignOutModal from './components/SignOutModal';
import Messages from './pages/Messages';
import api from '../../services/api.js';
import { useLogout, useUpdateSession } from '../../shared/context/AuthContext.jsx';
import { COLLEGE_ADMIN_TAB_KEY, COLLEGE_ADMIN_TABS, collegeAdminActions, selectCollegeAdmin } from '../../store/college-admin/collegeAdminSlice.js';
import { selectSession } from '../../store/sessionSlice.js';
import useWorkspaceDispatch from '../../store/useWorkspaceDispatch.js';
import { usePlatformData } from '../../shared/context/PlatformDataContext.jsx';
import { savePage } from '../../shared/utils/navigationState.js';
import './styles/CollegeAdmin.css';

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'CA';
}

function getTitle(tab) {
  switch (tab) {
    case 'dashboard':     return 'College Dashboard';
    case 'officers':      return 'Placement Officers';
    case 'students':      return 'Students';
    case 'recruiters':    return 'Recruiters';
    case 'alumni': return 'Alumni';
    case 'activity': return 'Placement Officer Activity';
    case 'announcements': return 'Announcements';
    case 'messages':      return 'Messages';
    case 'reports':       return 'Placement Reports';
    case 'profile':       return 'My Profile';
    default:              return 'College Admin';
  }
}

export default function CollegeAdminApp() {
  const platform = usePlatformData();
  const { data }  = platform;
  const user = useSelector(selectSession);
  const dispatch = useWorkspaceDispatch();
  const confirmSignOut = useLogout();
  const updateSession = useUpdateSession();
  const workspace = useSelector(selectCollegeAdmin, shallowEqual);
  const userName = user.name || localStorage.getItem('userName') || 'College Admin';

  const activeTab = workspace.activeTab;
  const { unread } = workspace;
  const [{ isSignOutOpen }, { setIsSignOutOpen }] = useViewState('collegeAdmin', 'CollegeAdminApp', () => ({
    isSignOutOpen: false,
  }));

  // Messages from the super admin: badge = how many arrived since the admin last opened the inbox.
  const seenKey = `ca_messages_seen_${Number(user.collegeId) || 1}`;
  useEffect(() => {
    const check = () => api.get('/super-admin/inbox').then(({ data }) => {
      const seen = Number(localStorage.getItem(seenKey) || 0);
      const unreadCount = data.filter((m) => new Date(m.sentAt).getTime() > seen).length;
      dispatch(collegeAdminActions.unreadChanged(unreadCount));
    }).catch(() => {});
    check();
    const timer = setInterval(check, 20000);
    return () => clearInterval(timer);
  }, [dispatch, seenKey]);
  const markMessagesSeen = () => {
    localStorage.setItem(seenKey, String(Date.now()));
    dispatch(collegeAdminActions.unreadChanged(0));
  };

  const collegeId   = Number(user.collegeId) || 1;
  const collegeInfo = data.colleges.find(c => c.id === collegeId) || data.colleges[0] || { name: '' };
  const officers    = data.officersByCollege[collegeId]   || [];
  const students    = data.studentsByCollege[collegeId]   || [];
  const alumniCount = (data.alumniByCollege[collegeId]    || []).length;
  const applications = data.applicationsByCollege?.[collegeId] || [];
  const placedStudentIds = new Set(
    applications
      .filter((application) => ['offered', 'offer'].includes(String(application.status).toLowerCase()) && /full/i.test(application.type))
      .map((application) => application.candidateId)
  );
  // Preserve legacy user-level placement records while the application status
  // remains the source of truth for all current placement activity.
  const placedCount = students.filter(
    (student) => placedStudentIds.has(student.id) || student.status === 'placed'
  ).length;

  const showToast = useCallback((msg) => { infoDialog(msg); }, []);

  const setActiveTab = useCallback((tab) => {
    const nextTab = COLLEGE_ADMIN_TABS.includes(tab) ? tab : 'dashboard';
    savePage(COLLEGE_ADMIN_TAB_KEY, nextTab);
    dispatch(collegeAdminActions.tabChanged(nextTab));
  }, [dispatch]);

  const handleSignOut = () => setIsSignOutOpen(true);

  const sharedProps = {
    officers, students, platform, alumniCount, applications,
    placedCount, placedStudentIds,
    collegeName: collegeInfo.name,
    collegeInfo,
    showToast,
    setActiveTab,
    userName,
  };

  return (
    <div className="cn-college-admin" style={{ display: 'contents' }}>
      <div className="app-container">
        {/* Sidebar */}
        <CollegeAdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          collegeName={collegeInfo.name}
          onSignOut={handleSignOut}
          unreadMessages={unread}
        />

        {/* Main */}
        <div className="main-content">
          <CATopbar
            title={getTitle(activeTab)}
            userName={userName}
            avatarInitials={getInitials(userName)}
            onProfileClick={() => setActiveTab('profile')}
            onSignOutClick={handleSignOut}
          />

          <div className="page-content">
            {activeTab === 'dashboard'     && <CADashboard     {...sharedProps} />}
            {activeTab === 'officers'      && <Officers        {...sharedProps} />}
            {activeTab === 'students' && <AccountDirectory key="students" canCreate initialTab="candidates" showTabs={false} onChanged={platform.refresh} />}
            {activeTab === 'alumni' && <AccountDirectory key="alumni" canCreate initialTab="alumni" showTabs={false} onChanged={platform.refresh} />}
            {activeTab === 'recruiters' && <Recruiters />}
            {activeTab === 'activity' && <ActivityLog />}
            {activeTab === 'announcements' && <Announcements   collegeName={collegeInfo.name} />}
            {activeTab === 'messages'      && <Messages        onSeen={markMessagesSeen} />}
            {activeTab === 'reports'       && <Reports         students={students} collegeName={collegeInfo.name} placedStudentIds={placedStudentIds} />}
            {activeTab === 'profile'       && <Profile collegeName={collegeInfo.name} showToast={showToast} onProfileUpdated={updateSession} />}
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
