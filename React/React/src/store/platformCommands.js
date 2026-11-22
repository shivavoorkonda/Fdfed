import api from '../services/api.js';
import { emptyPlatform } from './adminPlatformState.js';
import { collegeAdminActions } from './college-admin/collegeAdminSlice.js';
import { selectSession, selectWorkspaceVersion } from './sessionSlice.js';
import { superAdminActions } from './super-admin/superAdminSlice.js';

export const refreshPlatform = () => async (dispatch, getState) => {
  const { role, collegeId } = selectSession(getState()) ?? {};
  const version = selectWorkspaceVersion(getState());
  const publish = (action) => {
    if (selectWorkspaceVersion(getState()) === version) dispatch(action);
  };
  if (role === 'super_admin') {
    const [colleges, platformStats] = await Promise.all([
      api.get('/super-admin/colleges'),
      api.get('/super-admin/stats'),
    ]);

    const collegeList = colleges.data || [];

    // Fetch all placement officers so the SA can see per-college officer counts
    // and drill into officer lists. Falls back gracefully if the endpoint is
    // scoped only to college_admin (some backends restrict it).
    let officersByCollege = {};
    try {
      const res = await api.get('/users', { params: { role: 'placement_officer' } });
      (res.data || []).forEach(o => {
        const cid = o.collegeId;
        if (cid != null) {
          if (!officersByCollege[cid]) officersByCollege[cid] = [];
          officersByCollege[cid].push(o);
        }
      });
    } catch {
      // Backend scopes this endpoint — officer counts fall back to college.stats
    }

    publish(superAdminActions.platformLoaded({
      data: { ...emptyPlatform.data, colleges: collegeList, officersByCollege },
      stats: platformStats.data,
    }));

  } else if (role === 'college_admin' && collegeId != null) {
    const [college, officers, students, alumni, applications] = await Promise.all([
      api.get(`/colleges/${collegeId}`),
      api.get('/users', { params: { role: 'placement_officer' } }),
      api.get('/users', { params: { role: 'candidate' } }),
      api.get('/users', { params: { role: 'alumni' } }),
      api.get('/applications'),
    ]);
    publish(collegeAdminActions.platformLoaded({
      colleges: [college.data],
      officersByCollege:   { [collegeId]: officers.data },
      studentsByCollege:   { [collegeId]: students.data },
      alumniByCollege:     { [collegeId]: alumni.data },
      recruitersByCollege: {},
      applicationsByCollege: { [collegeId]: applications.data },
    }));
  }
};

// Keep the existing write-then-refresh order and return the API response.
const mutate = (request) => async (dispatch, getState) => {
  const version = selectWorkspaceVersion(getState());
  const result = await request(selectSession(getState())?.collegeId);
  if (selectWorkspaceVersion(getState()) === version) await dispatch(refreshPlatform());
  return result;
};

export const platformCommands = {
  refresh: refreshPlatform,
  // Super admin
  addCollege:       (payload)         => mutate(() => api.post('/super-admin/colleges', payload)),
  setCollegeStatus: (id, status)      => mutate(() => api.patch(`/super-admin/colleges/${id}/status`, { status })),
  assignAdmin:      (id, payload)     => mutate(() => api.post(`/super-admin/colleges/${id}/admin`, payload)),
  setAdminStatus:   (id, status)      => mutate(() => api.patch(`/super-admin/colleges/${id}/admin/status`, { status })),

  // Messaging — returns the API promise directly (no data refresh needed)
  sendMessage:      (payload)         => () => api.post('/super-admin/messages', payload),
  getSentMessages:  ()                => () => api.get('/super-admin/messages'),

  // Activity log
  getActivityLog:   ()                => () => api.get('/super-admin/activity'),

  // College admin
  addOfficer:       (payload)         => mutate((collegeId) => api.post('/users', { ...payload, role: 'placement_officer', collegeId: Number(collegeId) })),
  removeUser:       (id)              => mutate(() => api.delete(`/users/${id}`)),
  setStudentsStatus:(ids, status)     => mutate(() => Promise.all(ids.map(id => api.put(`/users/${id}`, { status })))),
  setUserStatus:    (id, status)      => mutate(() => api.put(`/users/${id}`, { status })),

  // Announcements
  getAnnouncements: ()                => () => api.get('/announcements'),
  postAnnouncement: (payload)         => () => api.post('/announcements', payload),
  deleteAnnouncement:(id)             => () => api.delete(`/announcements/${id}`),
};

