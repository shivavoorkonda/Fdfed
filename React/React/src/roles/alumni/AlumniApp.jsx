import { useViewState } from '../../store/useViewState.js';
import { infoDialog } from '../../shared/components/AppDialog.jsx';
import { useEffect } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import api, { errorMessage } from '../../services/api.js';
import Sidebar from './components/Sidebar';
import AlumniNotifications from './components/AlumniNotifications';
import SignOutModal from './components/SignOutModal';
import AlumniDashboard from './pages/AlumniDashboard';
import AlumniDirectory from './pages/AlumniDirectory';
import AlumniProfile from './pages/AlumniProfile';
import ReferralRequests from './pages/ReferralRequests';
import { savePage } from '../../shared/utils/navigationState.js';
import { useLogout, useUpdateSession } from '../../shared/context/AuthContext.jsx';
import { ALUMNI_PAGE_KEY, alumniActions, initialsOf, selectAlumni } from '../../store/alumni/alumniSlice.js';
import { selectSession } from '../../store/sessionSlice.js';
import useWorkspaceDispatch from '../../store/useWorkspaceDispatch.js';
import './styles/Alumni.css';

const PAGES = {
  dashboard: AlumniDashboard,
  directory: AlumniDirectory,
  profile: AlumniProfile,
  referrals: ReferralRequests,
};

const toReferral = (r) => {
  const raw = String(r.status || 'pending').toLowerCase();
  const status = raw === 'rejected' ? 'declined' : raw;
  return {
    id: r.id,
    initials: r.candidateInitials || r.initials || initialsOf(r.candidateName || r.name),
    name: r.candidateName || r.name,
    status,
    department: r.department || '',
    cgpa: r.cgpa ?? '',
    batch: r.batch || '',
    role: r.appliedRole || r.role,
    company: r.appliedCompany || r.company,
    salary: r.salary || '',
    location: r.location || '',
    skills: r.skills || [],
    message: r.userMessage || r.message,
    alumniNote: r.alumniResponse || r.alumniNote,
    updatedAt: r.requestedDate ? new Date(r.requestedDate).getTime() : Date.now(),
  };
};

export default function AlumniApp() {
  const session = useSelector(selectSession);
  const dispatch = useWorkspaceDispatch();
  const confirmSignOut = useLogout();
  const updateSession = useUpdateSession();
  const workspace = useSelector(selectAlumni, shallowEqual);
  const { pageProps, alumniData, referrals, loadError, personalInfo, skillsList } = workspace;
  const activePage = workspace.activePage;
  const [{ isSignOutOpen }, { setIsSignOutOpen }] = useViewState('alumni', 'AlumniApp', () => ({
    isSignOutOpen: false,
  }));

  // Referral requests come straight from the server (the candidate's request, our reply) — no local copies.
  const loadReferrals = async () => {
    const { data } = await api.get('/referrals');
    const final = data.map(toReferral);
    dispatch(alumniActions.referralsLoaded(final));
    return final;
  };

  useEffect(() => {
    Promise.all([api.get(`/users/${session.id}`), loadReferrals()])
      .then(([{ data: user }, refs]) => {
        const alumniData = {
          initials: user?.avatar || initialsOf(user?.name),
          name: user?.name || '',
          email: user?.email || '',
          company: user?.company || '',
          batch: user?.batch || '',
          role: 'Alumni',
          totalReferrals: refs.length,
          approved: refs.filter((r) => String(r.status).toLowerCase() === 'approved').length,
        };
        const personalInfo = {
          name: user?.name || '',
          email: user?.email || '',
          company: user?.company || '',
          batch: String(user?.batch || ''),
          role: user?.headline || '',
          location: user?.location || '',
          linkedin: user?.socialLinks?.linkedin || '',
          github: user?.socialLinks?.github || '',
          portfolio: user?.socialLinks?.portfolio || '',
        };
        dispatch(alumniActions.profileLoaded({ alumniData, personalInfo, skillsList: user?.skills || [] }));
      })
      .then(() => dispatch(alumniActions.loadErrorChanged('')))
      .catch((error) => dispatch(alumniActions.loadErrorChanged(errorMessage(error, 'Could not load your alumni workspace from the server.'))));
    // Pick up new requests while the alumnus has the portal open.
    const timer = setInterval(() => {
      if (!document.hidden) loadReferrals().then(() => dispatch(alumniActions.loadErrorChanged(''))).catch((error) => dispatch(alumniActions.loadErrorChanged(errorMessage(error, 'Could not refresh referral requests.'))));
    }, 20000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSavePersonalInfo = async (info) => {
    try {
      await api.put(`/users/${session.id}`, {
        name: info.name || undefined,
        company: info.company || undefined,
        batch: info.batch || undefined,
        headline: info.role || undefined,
        location: info.location || undefined,
        socialLinks: { linkedin: info.linkedin, github: info.github, portfolio: info.portfolio },
      });
      if (!dispatch(alumniActions.personalInfoSaved(info))) return;
      // Keep the session copy in sync so other open tabs immediately reflect
      // profile changes as well.
      const nextSession = {
        ...session,
        name: info.name || session?.name,
        company: info.company || session?.company,
      };
      updateSession(nextSession);
    } catch (error) {
      infoDialog(errorMessage(error, 'Could not save your profile.'));
    }
  };

  const handleSetSkills = async (nextSkills) => {
    const value = typeof nextSkills === 'function' ? nextSkills(skillsList) : nextSkills;
    dispatch(alumniActions.skillsChanged(value));
    try {
      await api.put(`/users/${session.id}`, { skills: value });
    } catch (error) {
      infoDialog(errorMessage(error, 'Could not save your skills.'));
    }
  };

  // Approve or decline a referral request. The candidate sees the decision and the note straight away.
  const handleUpdateReferralStatus = async (id, status, note) => {
    try {
      await api.patch(`/referrals/${id}`, {
        status: status === 'declined' ? 'Rejected' : 'Approved',
        alumniResponse: note || undefined,
      });
      const fresh = await loadReferrals();
      dispatch(alumniActions.referralTotalsChanged({
        total: fresh.length, approved: fresh.filter((r) => r.status === 'approved').length,
      }));
    } catch (error) {
      infoDialog(errorMessage(error, 'Could not save your response. Please try again.'));
    }
  };

  // Support both string navigation and object navigation
  const handleNavigate = (page, props = {}) => {
    if (typeof page === 'string') {
      const nextPage = Object.hasOwn(PAGES, page) ? page : 'dashboard';
      savePage(ALUMNI_PAGE_KEY, nextPage);
      dispatch(alumniActions.pageChanged({ page: nextPage, props: props || {} }));
    }
  };

  const ActivePageComponent = PAGES[activePage] || AlumniDashboard;

  return (
    <div className="cn-alumni" style={{ display: 'contents' }}>
    <div className="alumni-app">
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        onOpenSignOut={() => setIsSignOutOpen(true)}
        alumni={alumniData}
      />
      {loadError && <div role="alert" style={{ margin: '12px 20px', padding: 12, borderRadius: 8, background: '#fef2f2', color: '#b91c1c' }}>{loadError}</div>}
      <ActivePageComponent
        alumniData={alumniData}
        referrals={referrals}
        onUpdateReferralStatus={handleUpdateReferralStatus}
        onNavigate={handleNavigate}
        // Lifted profile state passed down to AlumniProfile
        personalInfo={personalInfo}
        onSavePersonalInfo={handleSavePersonalInfo}
        skillsList={skillsList}
        onSetSkillsList={handleSetSkills}
        {...pageProps}
      />
      <AlumniNotifications />
      <SignOutModal
        isOpen={isSignOutOpen}
        onClose={() => setIsSignOutOpen(false)}
        onConfirm={confirmSignOut}
      />
    </div>
    </div>
  );
}
