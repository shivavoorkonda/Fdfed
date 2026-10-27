import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, BarChart3, Building2, Crown, Eye, GraduationCap,
  ShieldCheck, Ticket, UserCog, Users, Wifi, XCircle,
} from 'lucide-react';
import api, { errorMessage } from '../../../services/api.js';

const number = (value) => Number(value || 0).toLocaleString('en-IN');
const initials = (name = '') => name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '—';
const roleLabel = (role = '') => role.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Unassigned';

function statusClass(status) {
  if (['active', 'resolved', 'closed'].includes(String(status).toLowerCase())) return 'badge-green';
  if (['suspended', 'urgent', 'high'].includes(String(status).toLowerCase())) return 'badge-red';
  if (['inactive', 'open', 'medium', 'in_progress'].includes(String(status).toLowerCase())) return 'badge-yellow';
  return 'badge-gray';
}

function Empty({ icon: Icon = Eye, children }) {
  return <div className="empty-state"><Icon /><p>{children}</p></div>;
}

function Metric({ icon: Icon, label, value, note, color = '#7c3aed' }) {
  return (
    <article className="stat-card sa-observer-metric" style={{ borderTop: `3px solid ${color}` }}>
      <div className="sa-observer-metric-head"><span className="stat-label">{label}</span><Icon size={17} color={color} /></div>
      <strong className="stat-value" style={{ color }}>{value}</strong>
      <span className="stat-sub">{note}</span>
    </article>
  );
}

function AdminEditor({ admin, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    name: admin?.name || '', email: admin?.email || '', department: admin?.department || 'Platform Operations',
    phone: admin?.phone || '', password: '', status: admin?.status || 'active',
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return; }
    setSaving(true); setError('');
    const saved = await onSave({
      name: form.name.trim(), email: form.email.trim(), department: form.department.trim() || 'Platform Operations',
      phone: form.phone.trim() || undefined, status: form.status,
      ...(form.password ? { password: form.password } : {}),
    });
    setSaving(false);
    if (!saved) setError('Could not save this Admin. Check the details and try again.');
  };
  return (
    <div className="modal-backdrop open" onClick={() => !saving && onClose()}>
      <form className="modal" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
        <h3>{admin?.id ? 'Edit Platform Admin' : 'Add Platform Admin'}</h3>
        <div className="form-group"><label>Name *</label><input value={form.name} onChange={(event) => set('name', event.target.value)} required /></div>
        <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={(event) => set('email', event.target.value)} required /></div>
        <div className="form-group"><label>Department</label><input value={form.department} onChange={(event) => set('department', event.target.value)} /></div>
        <div className="form-group"><label>Phone</label><input value={form.phone} onChange={(event) => set('phone', event.target.value)} /></div>
        <div className="form-group"><label>{admin?.id ? 'New password (optional)' : 'Password (optional)'}</label><input type="password" minLength={3} value={form.password} onChange={(event) => set('password', event.target.value)} placeholder="Defaults to 123 when blank" /></div>
        {admin?.id && <div className="form-group"><label>Status</label><select value={form.status} onChange={(event) => set('status', event.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>}
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions"><button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Admin'}</button></div>
      </form>
    </div>
  );
}

function PlacementBar({ college }) {
  const students = Number(college.stats?.students || 0);
  const placed = Number(college.stats?.placed || 0);
  const rate = students ? Math.round((placed / students) * 100) : 0;
  const color = rate >= 75 ? '#16a34a' : rate >= 50 ? '#d97706' : '#dc2626';
  return (
    <div className="placement-bar-row">
      <div className="placement-bar-label"><strong className="placement-bar-name">{college.name}</strong><span className="placement-bar-rate">{rate}%</span></div>
      <div className="placement-bar-track"><div className="placement-bar-fill" style={{ width: `${rate}%`, background: color }} /></div>
      <span className="placement-bar-meta">{number(placed)} of {number(students)} students placed</span>
    </div>
  );
}

export function PlatformOverview({ colleges = [], stats, userName }) {
  const totalStudents = stats?.totalStudents ?? colleges.reduce((sum, college) => sum + Number(college.stats?.students || 0), 0);
  const totalPlaced = stats?.totalPlaced ?? colleges.reduce((sum, college) => sum + Number(college.stats?.placed || 0), 0);
  const active = stats?.activeColleges ?? colleges.filter((college) => college.status === 'active').length;
  const rate = totalStudents ? Math.round((totalPlaced / totalStudents) * 100) : 0;
  const health = Math.max(0, Math.min(100, 100 - Number(stats?.suspendedColleges || 0) * 12 - Number(stats?.inactiveColleges || 0) * 5));
  const rankings = [...colleges].sort((a, b) => {
    const aRate = a.stats?.students ? a.stats.placed / a.stats.students : 0;
    const bRate = b.stats?.students ? b.stats.placed / b.stats.students : 0;
    return bRate - aRate;
  }).slice(0, 5);

  return (
    <>
      <section className="sa-observer-banner">
        <div>
          <span className="sa-observer-kicker"><Eye size={14} /> Platform control</span>
          <h2>Platform administration, {userName?.split(' ')[0] || 'Super Admin'}</h2>
          <p>Manage organizations and platform Admin accounts while monitoring live platform signals.</p>
        </div>
        <div className="sa-health"><Wifi size={17} /><span>Platform health</span><strong>{health}%</strong></div>
      </section>

      <div className="stats-grid">
        <Metric icon={Building2} label="Active colleges" value={number(active)} note={`${number(colleges.length)} registered`} />
        <Metric icon={Users} label="Platform users" value={number(totalStudents + Number(stats?.totalAlumni || 0) + Number(stats?.totalPlacementOfficers || 0) + Number(stats?.totalCollegeAdmins || 0))} note="Students, alumni & staff" color="#0284c7" />
        <Metric icon={GraduationCap} label="Placement rate" value={`${rate}%`} note={`${number(totalPlaced)} placements tracked`} color="#16a34a" />
        <Metric icon={ShieldCheck} label="College admins" value={number(stats?.totalCollegeAdmins)} note="College-side operators" color="#d97706" />
      </div>

      <div className="dashboard-two-col">
        <section className="dashboard-card">
          <div className="dashboard-card-header"><div className="dashboard-card-title"><BarChart3 size={17} color="#7c3aed" /> Placement performance</div></div>
          {rankings.length ? <div className="placement-bars">{rankings.map((college) => <PlacementBar key={college.id} college={college} />)}</div> : <Empty>No college performance data is available yet.</Empty>}
        </section>
        <section className="dashboard-card">
          <div className="dashboard-card-header"><div className="dashboard-card-title"><Activity size={17} color="#0ea5e9" /> Oversight summary</div></div>
          <div className="sa-observer-summary">
            <div><span>Operational owner</span><strong>Super Admin</strong></div>
            <div><span>College coverage</span><strong>{number(active)} active colleges</strong></div>
            <div><span>Access scope</span><strong>Platform-wide management</strong></div>
            <div><span>Operational support</span><strong>Admin Support Center</strong></div>
          </div>
        </section>
      </div>
    </>
  );
}

export function CollegesView({ colleges = [] }) {
  const [query, setQuery] = useState('');
  const shown = useMemo(() => colleges.filter((college) => `${college.name} ${college.code} ${college.admin?.name || ''}`.toLowerCase().includes(query.toLowerCase())), [colleges, query]);
  return (
    <>
      <section className="sa-observer-intro"><Building2 size={20} /><div><h2>College management</h2><p>Create, edit, remove, and manage organizations and their college administrators.</p></div></section>
      <div className="search-bar"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search colleges, codes or college admins" aria-label="Search colleges" /></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>College</th><th>College admin</th><th>Students</th><th>Placement rate</th><th>Status</th></tr></thead>
          <tbody>{shown.length ? shown.map((college) => {
            const students = Number(college.stats?.students || 0);
            const placed = Number(college.stats?.placed || 0);
            const rate = students ? Math.round((placed / students) * 100) : 0;
            return <tr key={college.id}>
              <td><div className="chip"><span className="chip-avatar">{initials(college.name)}</span><span className="chip-info"><strong className="chip-name">{college.name}</strong><small className="chip-sub">{college.code} · {college.email}</small></span></div></td>
              <td>{college.admin ? <div><strong>{college.admin.name}</strong><br /><small className="chip-sub">{college.admin.email}</small></div> : <span className="sa-muted">Not assigned</span>}</td>
              <td>{number(students)}</td>
              <td><span className={`badge ${rate >= 75 ? 'badge-green' : rate >= 50 ? 'badge-yellow' : 'badge-red'}`}>{rate}%</span></td>
              <td><span className={`badge ${statusClass(college.status)}`}>{college.status}</span></td>
            </tr>;
          }) : <tr><td colSpan="5"><Empty>No colleges match this search.</Empty></td></tr>}</tbody>
        </table>
      </div>
    </>
  );
}

export function AdminsOverview({ platform }) {
  const [admins, setAdmins] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [state, setState] = useState({ loading: true, error: '' });
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    let alive = true;
    Promise.all([
      api.get('/super-admin/admins').catch(() => api.get('/users', { params: { role: 'admin' } })),
      api.get('/super-admin/admin-stats').catch(() => ({ data: [] })),
    ]).then(([adminResponse, statsResponse]) => {
      if (!alive) return;
      setAdmins(adminResponse.data || []);
      const workloadData = statsResponse.data || {};
      setWorkload(Array.isArray(workloadData) ? workloadData : workloadData.admins || []);
      setState({ loading: false, error: '' });
    }).catch((error) => alive && setState({ loading: false, error: errorMessage(error, 'Could not load Admin oversight data.') }));
    return () => { alive = false; };
  }, []);
  useEffect(() => load(), [load]);

  const saveAdmin = async (payload) => {
    try {
      if (editing?.id) await platform.updatePlatformAdmin(editing.id, payload);
      else await platform.addPlatformAdmin(payload);
      setEditing(null);
      load();
      return true;
    } catch (error) {
      window.alert(errorMessage(error, 'Could not save the admin.'));
      return false;
    }
  };

  const editAdmin = (admin) => setEditing(admin);

  const deleteAdmin = async (admin) => {
    if (!window.confirm('Delete ' + admin.name + '? This cannot be undone.')) return;
    try {
      await platform.removePlatformAdmin(admin.id);
      load();
    } catch (error) { window.alert(errorMessage(error, 'Could not delete the admin.')); }
  };

  const workloadById = useMemo(() => new Map(workload.map((entry) => [Number(entry.adminId ?? entry.id), entry])), [workload]);
  return (
    <>
      <section className="sa-observer-intro"><UserCog size={20} /><div><h2>Admin management</h2><p>Create, update, and remove platform Admin accounts.</p></div><button className="btn btn-primary" onClick={() => setEditing({})}>Add Admin</button></section>
      {state.loading && <Empty>Loading Admin workload…</Empty>}
      {!state.loading && state.error && <div className="sa-observer-error"><XCircle size={17} /> {state.error}</div>}
      {!state.loading && !state.error && <>
        <div className="stats-grid">
          <Metric icon={UserCog} label="Platform admins" value={number(admins.length)} note="Operational accounts" />
          <Metric icon={Ticket} label="Open assignments" value={number(workload.reduce((sum, entry) => sum + Number(entry.openTickets || 0), 0))} note="Across the Admin team" color="#d97706" />
          <Metric icon={Activity} label="Actions logged" value={number(workload.reduce((sum, entry) => sum + Number(entry.actionsToday || 0), 0))} note="Actions today" color="#0284c7" />
        </div>
        <div className="table-wrap"><table><thead><tr><th>Admin</th><th>Department</th><th>Open tickets</th><th>Recent activity</th><th>Account status</th><th>Actions</th></tr></thead><tbody>
          {admins.length ? admins.map((admin) => {
            const metrics = workloadById.get(Number(admin.id)) || {};
            return <tr key={admin.id}><td><div className="chip"><span className="chip-avatar">{admin.avatar || initials(admin.name)}</span><span className="chip-info"><strong className="chip-name">{admin.name}</strong><small className="chip-sub">{admin.email}</small></span></div></td><td>{admin.department || 'Platform operations'}</td><td>{number(metrics.openTickets)}</td><td>{number(metrics.actionsToday)} logged today</td><td><span className={`badge ${statusClass(admin.status)}`}>{admin.status || 'active'}</span></td><td><button className="btn btn-outline btn-sm" onClick={() => editAdmin(admin)}>Edit</button> <button className="btn btn-outline btn-sm" onClick={() => deleteAdmin(admin)}>Delete</button></td></tr>;
          }) : <tr><td colSpan="6"><Empty>No platform Admin accounts are available.</Empty></td></tr>}
        </tbody></table></div>
      </>}
      {editing && <AdminEditor admin={editing} onClose={() => setEditing(null)} onSave={saveAdmin} />}
    </>
  );
}

export function UsersOverview() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [state, setState] = useState({ loading: true, error: '' });
  useEffect(() => {
    let alive = true;
    api.get('/users').then((response) => alive && (setUsers(response.data || []), setState({ loading: false, error: '' }))).catch((error) => alive && setState({ loading: false, error: errorMessage(error, 'Could not load users.') }));
    return () => { alive = false; };
  }, []);
  const roles = useMemo(() => [...new Set(users.map((user) => user.role).filter(Boolean))], [users]);
  const shown = users.filter((user) => (role === 'all' || user.role === role) && `${user.name} ${user.email} ${user.department || ''}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <section className="sa-observer-intro"><Users size={20} /><div><h2>Platform user directory</h2><p>Search and review accounts across every role.</p></div></section>
      {!state.loading && !state.error && <div className="stats-grid sa-observer-compact-grid">{roles.map((currentRole) => <Metric key={currentRole} icon={Users} label={roleLabel(currentRole)} value={number(users.filter((user) => user.role === currentRole).length)} note="Accounts" color="#0284c7" />)}</div>}
      <div className="sa-observer-filters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email or department" aria-label="Search platform users" /><select value={role} onChange={(event) => setRole(event.target.value)} aria-label="Filter users by role"><option value="all">All roles</option>{roles.map((currentRole) => <option key={currentRole} value={currentRole}>{roleLabel(currentRole)}</option>)}</select></div>
      {state.loading && <Empty>Loading the platform directory…</Empty>}
      {!state.loading && state.error && <div className="sa-observer-error"><XCircle size={17} /> {state.error}</div>}
      {!state.loading && !state.error && <div className="table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>College</th><th>Department</th><th>Status</th></tr></thead><tbody>{shown.length ? shown.map((user) => <tr key={user.id}><td><div className="chip"><span className="chip-avatar">{user.avatar || initials(user.name)}</span><span className="chip-info"><strong className="chip-name">{user.name}</strong><small className="chip-sub">{user.email}</small></span></div></td><td><span className="badge badge-blue">{roleLabel(user.role)}</span></td><td>{user.collegeName || (user.collegeId ? `College #${user.collegeId}` : 'Platform')}</td><td>{user.department || '—'}</td><td><span className={`badge ${statusClass(user.status)}`}>{user.status || 'active'}</span></td></tr>) : <tr><td colSpan="5"><Empty>No accounts match these filters.</Empty></td></tr>}</tbody></table></div>}
    </>
  );
}

export function AnalyticsView({ colleges = [], stats }) {
  const totalStudents = stats?.totalStudents ?? colleges.reduce((sum, college) => sum + Number(college.stats?.students || 0), 0);
  const totalPlaced = stats?.totalPlaced ?? colleges.reduce((sum, college) => sum + Number(college.stats?.placed || 0), 0);
  const placementRate = totalStudents ? Math.round((totalPlaced / totalStudents) * 100) : 0;
  return <>
    <section className="sa-observer-intro"><BarChart3 size={20} /><div><h2>Platform analytics</h2><p>Cross-college placement signals for platform decision-making.</p></div></section>
    <div className="stats-grid"><Metric icon={GraduationCap} label="Candidates" value={number(totalStudents)} note="Across all colleges" color="#0284c7" /><Metric icon={ShieldCheck} label="Placements" value={number(totalPlaced)} note={`${placementRate}% platform placement rate`} color="#16a34a" /><Metric icon={Building2} label="Active institutions" value={number(colleges.filter((college) => college.status === 'active').length)} note="Current college coverage" color="#7c3aed" /></div>
    <section className="dashboard-card"><div className="dashboard-card-title"><BarChart3 size={17} color="#7c3aed" /> College placement comparison</div><div className="placement-bars">{[...colleges].sort((a, b) => (b.stats?.students ? b.stats.placed / b.stats.students : 0) - (a.stats?.students ? a.stats.placed / a.stats.students : 0)).map((college) => <PlacementBar key={college.id} college={college} />)}</div></section>
  </>;
}

export function SupportAudit() {
  const [tickets, setTickets] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [state, setState] = useState({ loading: true, error: '' });
  useEffect(() => { let alive = true; api.get('/support-tickets').then((response) => alive && (setTickets(response.data || []), setState({ loading: false, error: '' }))).catch((error) => alive && setState({ loading: false, error: errorMessage(error, 'Could not load support tickets.') })); return () => { alive = false; }; }, []);
  const statuses = useMemo(() => [...new Set(tickets.map((ticket) => ticket.status).filter(Boolean))], [tickets]);
  const shown = tickets.filter((ticket) => (status === 'all' || ticket.status === status) && `${ticket.title} ${ticket.collegeName || ''} ${ticket.raisedByName || ''}`.toLowerCase().includes(query.toLowerCase()));
  return <>
    <section className="sa-observer-intro"><Ticket size={20} /><div><h2>Support audit</h2><p>Review the support queue and resolution health.</p></div></section>
    <div className="stats-grid sa-observer-compact-grid"><Metric icon={Ticket} label="Open tickets" value={number(tickets.filter((ticket) => ['open', 'in_progress'].includes(ticket.status)).length)} note="Requires Admin attention" color="#d97706" /><Metric icon={ShieldCheck} label="Resolved" value={number(tickets.filter((ticket) => ticket.status === 'resolved').length)} note="Completed by support" color="#16a34a" /></div>
    <div className="sa-observer-filters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ticket, college or requester" aria-label="Search tickets" /><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter tickets by status"><option value="all">All statuses</option>{statuses.map((currentStatus) => <option key={currentStatus} value={currentStatus}>{roleLabel(currentStatus)}</option>)}</select></div>
    {state.loading && <Empty>Loading the support audit…</Empty>}{!state.loading && state.error && <div className="sa-observer-error"><XCircle size={17} /> {state.error}</div>}{!state.loading && !state.error && <div className="table-wrap"><table><thead><tr><th>Ticket</th><th>College</th><th>Priority</th><th>Owner</th><th>Status</th><th>Opened</th></tr></thead><tbody>{shown.length ? shown.map((ticket) => <tr key={ticket.id}><td><strong>{ticket.title}</strong><br /><small className="chip-sub">{ticket.category?.replaceAll('_', ' ')}</small></td><td>{ticket.collegeName || '—'}</td><td><span className={`badge ${statusClass(ticket.priority)}`}>{ticket.priority}</span></td><td>{ticket.assignedToName || 'Unassigned'}</td><td><span className={`badge ${statusClass(ticket.status)}`}>{ticket.status?.replaceAll('_', ' ')}</span></td><td>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-IN') : '—'}</td></tr>) : <tr><td colSpan="6"><Empty>No support tickets match these filters.</Empty></td></tr>}</tbody></table></div>}</>;
}

export function ObserverProfile({ user }) {
  const name = user?.name || 'Super Admin';
  return <>
    <section className="sa-observer-intro"><Crown size={20} /><div><h2>Super Admin profile</h2><p>Your role has platform-wide management authority.</p></div><span className="badge badge-purple">Platform authority</span></section>
    <section className="sa-profile-observer-card"><div className="sa-profile-observer-avatar">{user?.avatar || initials(name)}</div><div><h3>{name}</h3><p>{user?.email || 'Platform Super Administrator'}</p><span className="badge badge-purple">Super Admin</span></div></section>
    <div className="dashboard-two-col"><section className="dashboard-card"><div className="dashboard-card-title"><Eye size={17} color="#7c3aed" /> Access scope</div><div className="sa-observer-summary"><div><span>Role</span><strong>Super Administrator</strong></div><div><span>Workspace</span><strong>Platform administration</strong></div><div><span>Visibility</span><strong>Platform-wide</strong></div><div><span>Authority</span><strong>Manage Admins and organizations</strong></div></div></section><section className="dashboard-card"><div className="dashboard-card-title"><ShieldCheck size={17} color="#16a34a" /> Account information</div><div className="sa-observer-summary"><div><span>Department</span><strong>{user?.department || 'Platform leadership'}</strong></div><div><span>Phone</span><strong>{user?.phone || '—'}</strong></div><div><span>Account status</span><strong>{user?.status || 'active'}</strong></div></div></section></div>
  </>;
}
