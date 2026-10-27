import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CircleHelp,
  Edit3,
  Mail,
  Megaphone,
  Plus,
  RefreshCw,
  Send,
  Trash2,
} from 'lucide-react';
import api, { errorMessage } from '../../../services/api.js';
import ChangePasswordModal from '../../../shared/components/ChangePasswordModal.jsx';
import StatCard from '../components/StatCard.jsx';

const EMPTY_TEXT = '—';

const labelize = (value) => String(value || '').replaceAll('_', ' ');
const formatTime = (value) => value
  ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  : EMPTY_TEXT;

function useRemote(loader, dependencies = []) {
  const [state, setState] = useState({ loading: true, error: '', value: [] });

  const load = async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const response = await loader();
      setState({ loading: false, error: '', value: response.data ?? response });
    } catch (error) {
      setState({
        loading: false,
        error: errorMessage(error, 'Could not load this information.'),
        value: [],
      });
    }
  };

  useEffect(() => {
    void load();
  }, dependencies);

  return { ...state, reload: load };
}

function PageError({ message }) {
  return <p className="admin-error">{message}</p>;
}

function EmptyState({ children }) {
  return <p className="admin-empty">{children}</p>;
}

export function AdminDashboard({ data, loading, setActive }) {
  const ticketStats = useRemote(() => api.get('/support-tickets/stats'));
  const stats = data.stats || {};
  const support = ticketStats.value || {};

  return (
    <>
      <div className="admin-welcome">
        <div>
          <h2>Keep the platform moving.</h2>
          <p>Monitor colleges, support work, and operational requests from one place.</p>
        </div>
        <button onClick={() => setActive('support')}>Review support queue</button>
      </div>

      <div className="admin-stats-grid">
        <StatCard
          label="Active colleges"
          value={loading ? '…' : stats.activeColleges || 0}
          detail={(stats.totalColleges || 0) + ' total colleges'}
        />
        <StatCard
          label="Open tickets"
          value={ticketStats.loading ? '…' : support.open || 0}
          detail={(support.inProgress || 0) + ' in progress'}
          tone="orange"
        />
        <StatCard
          label="College admins"
          value={loading ? '…' : stats.totalCollegeAdmins || 0}
          detail="Active college operations"
          tone="green"
        />
        <StatCard
          label="Placement officers"
          value={loading ? '…' : stats.totalPlacementOfficers || 0}
          detail="Across all colleges"
          tone="purple"
        />
      </div>

      <div className="admin-two-column">
        <section className="admin-card">
          <div className="admin-card__head"><h3>Quick actions</h3></div>
          <div className="admin-quick-actions">
            <button onClick={() => setActive('colleges')}><Building2 /> Add or manage college</button>
            <button onClick={() => setActive('messages')}><Mail /> Send a message</button>
            <button onClick={() => setActive('announcements')}><Megaphone /> Post announcement</button>
            <button onClick={() => setActive('support')}><CircleHelp /> View tickets</button>
          </div>
        </section>
      </div>
    </>
  );
}

function CollegeForm({ value, onChange, onSave, onClose, saving }) {
  const setValue = (key, nextValue) => onChange({
    ...value,
    [key]: key === 'code' ? nextValue.toUpperCase() : nextValue,
  });

  const fields = [
    ['name', 'College name'],
    ['code', 'College code'],
    ['email', 'Official email'],
    ['phone', 'Phone'],
    ['address', 'Address'],
    ['website', 'Website'],
    ['studentLimit', 'Student limit'],
  ];

  return (
    <div className="admin-modal__backdrop" onClick={onClose}>
      <form
        className="admin-modal"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <h3>{value.id ? 'Edit college' : 'Add college'}</h3>
        <div className="admin-form-grid">
          {fields.map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                required={['name', 'code', 'email'].includes(key)}
                type={key === 'email' ? 'email' : key === 'website' ? 'url' : key === 'studentLimit' ? 'number' : 'text'}
                value={value[key] || ''}
                onChange={(event) => setValue(key, event.target.value)}
              />
            </label>
          ))}
        </div>
        <div className="admin-modal__actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button className="primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save college'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function CollegesPage({ data, refresh, notify }) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const colleges = (data.colleges || []).filter((college) => (
    (college.name + ' ' + college.code + ' ' + college.email)
      .toLowerCase()
      .includes(search.toLowerCase())
  ));

  const save = async () => {
    const skipped = new Set([
      'id',
      'stats',
      'admin',
      'createdAt',
      'updatedAt',
      'status',
    ]);
    const payload = Object.fromEntries(
      Object.entries(editing).filter(([key, value]) => !skipped.has(key) && value !== ''),
    );

    setSaving(true);
    try {
      if (editing.id) {
        await api.put('/super-admin/colleges/' + editing.id, payload);
      } else {
        await api.post('/super-admin/colleges', payload);
      }
      notify(editing.id ? 'College updated.' : 'College created.');
      setEditing(null);
      await refresh();
    } catch (error) {
      notify(errorMessage(error, 'Could not save college.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (college) => {
    const nextStatus = college.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch('/super-admin/colleges/' + college.id + '/status', { status: nextStatus });
      notify(college.name + ' is now ' + nextStatus + '.');
      await refresh();
    } catch (error) {
      notify(errorMessage(error), 'error');
    }
  };

  const remove = async (college) => {
    if (!window.confirm('Remove ' + college.name + '? This cannot be undone.')) return;
    try {
      await api.delete('/super-admin/colleges/' + college.id);
      notify('College removed.');
      await refresh();
    } catch (error) {
      notify(errorMessage(error), 'error');
    }
  };

  return (
    <>
      <div className="admin-toolbar">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search colleges…"
        />
        <button
          className="primary"
          onClick={() => setEditing({
            name: '',
            code: '',
            email: '',
            phone: '',
            address: '',
            website: '',
            studentLimit: 200,
          })}
        >
          <Plus size={16} /> Add college
        </button>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr><th>College</th><th>Code</th><th>Admin</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {colleges.map((college) => (
              <tr key={college.id}>
                <td><strong>{college.name}</strong><small>{college.email}</small></td>
                <td>{college.code}</td>
                <td>{college.admin?.name || 'Unassigned'}</td>
                <td>
                  <button
                    className={'admin-status ' + (college.status || '')}
                    onClick={() => setStatus(college)}
                    title="Toggle active status"
                  >
                    {college.status}
                  </button>
                </td>
                <td className="admin-actions">
                  <button title="Edit" onClick={() => setEditing(college)}><Edit3 size={15} /></button>
                  <button title="Delete" onClick={() => remove(college)}><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
            {!colleges.length && (
              <tr><td colSpan="5" className="admin-empty">No matching colleges.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <CollegeForm
          value={editing}
          onChange={setEditing}
          onSave={save}
          onClose={() => setEditing(null)}
          saving={saving}
        />
      )}
    </>
  );
}

export function CollegeAdminsPage({ data, refresh, notify }) {
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);

  const openForm = (college) => {
    setTarget(college);
    setForm({ name: '', email: '', password: '' });
  };

  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      notify('Name and email are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), email: form.email.trim() };
      if (form.password) payload.password = form.password;
      await api.post('/super-admin/colleges/' + target.id + '/admin', payload);
      notify('College admin assigned.');
      setTarget(null);
      await refresh();
    } catch (error) {
      notify(errorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (college) => {
    if (!college.admin) return;
    const status = college.admin.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch('/super-admin/colleges/' + college.id + '/admin/status', { status });
      notify('Admin status updated.');
      await refresh();
    } catch (error) {
      notify(errorMessage(error), 'error');
    }
  };

  return (
    <>
      <p className="admin-subtitle">
        Assign a primary College Admin for each college. A new assignment replaces the current active administrator.
      </p>
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr><th>College</th><th>Current admin</th><th>Email</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {(data.colleges || []).map((college) => (
              <tr key={college.id}>
                <td><strong>{college.name}</strong></td>
                <td>{college.admin?.name || 'Not assigned'}</td>
                <td>{college.admin?.email || EMPTY_TEXT}</td>
                <td>
                  {college.admin ? (
                    <button
                      className={'admin-status ' + (college.admin.status || 'active')}
                      onClick={() => toggle(college)}
                    >
                      {college.admin.status || 'active'}
                    </button>
                  ) : EMPTY_TEXT}
                </td>
                <td>
                  <button className="admin-link" onClick={() => openForm(college)}>
                    {college.admin ? 'Reassign' : 'Assign'} admin
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {target && (
        <div className="admin-modal__backdrop" onClick={() => setTarget(null)}>
          <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Assign admin — {target.name}</h3>
            <label className="admin-field">
              Full name
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </label>
            <label className="admin-field">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </label>
            <label className="admin-field">
              Password (optional)
              <input
                type="password"
                value={form.password}
                placeholder="Defaults to 123"
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
            </label>
            <div className="admin-modal__actions">
              <button onClick={() => setTarget(null)}>Cancel</button>
              <button className="primary" disabled={saving} onClick={save}>
                {saving ? 'Assigning…' : 'Assign admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function SupportPage({ notify }) {
  const tickets = useRemote(() => api.get('/support-tickets'));
  const [filter, setFilter] = useState('all');
  const [active, setActive] = useState(null);
  const [response, setResponse] = useState('');
  const [pendingStatus, setPendingStatus] = useState('');
  const [resolution, setResolution] = useState('');

  const items = (tickets.value || []).filter((ticket) => (
    filter === 'all' || ticket.status === filter
  ));

  const setActiveTicket = async (ticket) => {
    try {
      const result = await api.get('/support-tickets/' + ticket.id);
      const nextTicket = result.data;
      setActive(nextTicket);
      setPendingStatus(nextTicket.status);
      setResolution(nextTicket.resolution || '');
      setResponse('');
    } catch (error) {
      notify(errorMessage(error), 'error');
    }
  };

  const reloadActive = async () => {
    if (!active) return;
    const result = await api.get('/support-tickets/' + active.id);
    const nextTicket = result.data;
    setActive(nextTicket);
    setPendingStatus(nextTicket.status);
    setResolution(nextTicket.resolution || '');
  };

  const act = async (request, successMessage) => {
    try {
      await request();
      notify(successMessage);
      await tickets.reload();
      await reloadActive();
    } catch (error) {
      notify(errorMessage(error), 'error');
    }
  };

  const updateStatus = async () => {
    if (pendingStatus === 'resolved' && resolution.trim().length < 2) {
      notify('Add a resolution before marking a ticket resolved.', 'error');
      return;
    }
    const payload = { status: pendingStatus };
    if (pendingStatus === 'resolved') payload.resolution = resolution.trim();
    await act(
      () => api.patch('/support-tickets/' + active.id + '/status', payload),
      'Ticket status updated.',
    );
  };

  const sendResponse = async () => {
    const message = response.trim();
    if (!message) return;
    await act(async () => {
      await api.post('/support-tickets/' + active.id + '/respond', { message });
      setResponse('');
    }, 'Response added.');
  };

  return (
    <div className="admin-split">
      <section>
        <div className="admin-filters">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
            <button
              key={status}
              className={filter === status ? 'active' : ''}
              onClick={() => setFilter(status)}
            >
              {labelize(status)}
            </button>
          ))}
        </div>

        {tickets.loading && <EmptyState>Loading tickets…</EmptyState>}
        {tickets.error && <PageError message={tickets.error} />}
        {!tickets.loading && !tickets.error && (
          <div className="admin-ticket-list">
            {items.map((ticket) => (
              <button
                key={ticket.id}
                className={'admin-ticket ' + (active?.id === ticket.id ? 'selected' : '')}
                onClick={() => setActiveTicket(ticket)}
              >
                <span className={'admin-priority ' + ticket.priority} />
                <div>
                  <strong>{ticket.title}</strong>
                  <p>{ticket.collegeName} · {ticket.category}</p>
                </div>
                <em>{labelize(ticket.status)}</em>
              </button>
            ))}
            {!items.length && <EmptyState>No tickets match this filter.</EmptyState>}
          </div>
        )}
      </section>

      <section className="admin-card admin-ticket-detail">
        {!active && <EmptyState>Select a ticket to review, assign, respond, or resolve.</EmptyState>}
        {active && (
          <>
            <h3>{active.title}</h3>
            <p className="admin-ticket-detail__meta">
              {active.collegeName} · {active.raisedByName} · {formatTime(active.createdAt)}
            </p>
            <p>{active.description}</p>

            <div className="admin-ticket-detail__actions">
              {!active.assignedTo && (
                <button
                  className="primary"
                  onClick={() => act(
                    () => api.patch('/support-tickets/' + active.id + '/assign'),
                    'Ticket assigned to you.',
                  )}
                >
                  Assign to me
                </button>
              )}
              <select
                value={pendingStatus}
                onChange={(event) => setPendingStatus(event.target.value)}
                aria-label="Ticket status"
              >
                {['open', 'in_progress', 'resolved', 'closed'].map((status) => (
                  <option key={status} value={status}>{labelize(status)}</option>
                ))}
              </select>
              <button className="primary" onClick={updateStatus}>Update status</button>
            </div>

            {pendingStatus === 'resolved' && (
              <label className="admin-field">
                Resolution
                <textarea
                  rows={3}
                  value={resolution}
                  placeholder="Describe how this request was resolved."
                  onChange={(event) => setResolution(event.target.value)}
                />
              </label>
            )}

            {active.resolution && (
              <div className="admin-resolution"><strong>Resolution</strong><p>{active.resolution}</p></div>
            )}

            <div className="admin-response-list">
              {(active.responses || []).map((item) => (
                <div key={item.id}>
                  <strong>{item.userName}</strong>
                  <small>{formatTime(item.createdAt)}</small>
                  <p>{item.message}</p>
                </div>
              ))}
            </div>

            <textarea
              value={response}
              onChange={(event) => setResponse(event.target.value)}
              placeholder="Write a response…"
              rows={4}
            />
            <button className="primary" disabled={!response.trim()} onClick={sendResponse}>
              Send response
            </button>
          </>
        )}
      </section>
    </div>
  );
}

const CONTENT_TABS = [
  ['features', 'Features'],
  ['testimonials', 'Testimonials'],
  ['faqs', 'FAQs'],
  ['contacts', 'Contact inbox'],
];

const blankTestimonial = () => ({
  name: '',
  role: '',
  college: '',
  text: '',
  avatar: '',
  rating: 5,
  isActive: true,
});

const blankFaq = () => ({
  question: '',
  answer: '',
  category: 'general',
  order: 1,
  isActive: true,
});

function ContentEntryDialog({ kind, entry, onChange, onClose, onSave, saving }) {
  const isTestimonial = kind === 'testimonials';

  return (
    <div className="admin-modal__backdrop" onClick={onClose}>
      <div className="admin-modal admin-modal--content" onClick={(event) => event.stopPropagation()}>
        <h3>{entry.id ? 'Edit ' : 'Add '}{isTestimonial ? 'testimonial' : 'FAQ'}</h3>
        {isTestimonial ? (
          <>
            <div className="admin-form-grid">
              <label>Name<input value={entry.name} onChange={(event) => onChange({ ...entry, name: event.target.value })} /></label>
              <label>Role<input value={entry.role} onChange={(event) => onChange({ ...entry, role: event.target.value })} /></label>
              <label>College<input value={entry.college} onChange={(event) => onChange({ ...entry, college: event.target.value })} /></label>
              <label>Rating
                <select value={entry.rating} onChange={(event) => onChange({ ...entry, rating: Number(event.target.value) })}>
                  {[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
                </select>
              </label>
            </div>
            <label className="admin-field">Avatar initials (optional)
              <input value={entry.avatar || ''} onChange={(event) => onChange({ ...entry, avatar: event.target.value })} />
            </label>
            <label className="admin-field">Testimonial
              <textarea rows={5} value={entry.text} onChange={(event) => onChange({ ...entry, text: event.target.value })} />
            </label>
          </>
        ) : (
          <>
            <div className="admin-form-grid">
              <label>Category<input value={entry.category} onChange={(event) => onChange({ ...entry, category: event.target.value })} /></label>
              <label>Display order
                <input
                  type="number"
                  min="1"
                  value={entry.order}
                  onChange={(event) => onChange({ ...entry, order: Number(event.target.value) })}
                />
              </label>
            </div>
            <label className="admin-field">Question
              <input value={entry.question} onChange={(event) => onChange({ ...entry, question: event.target.value })} />
            </label>
            <label className="admin-field">Answer
              <textarea rows={6} value={entry.answer} onChange={(event) => onChange({ ...entry, answer: event.target.value })} />
            </label>
          </>
        )}
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={Boolean(entry.isActive)}
            onChange={(event) => onChange({ ...entry, isActive: event.target.checked })}
          />
          Visible on the landing page
        </label>
        <div className="admin-modal__actions">
          <button onClick={onClose}>Cancel</button>
          <button className="primary" disabled={saving} onClick={onSave}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function WebsitePage({ notify }) {
  const [kind, setKind] = useState('features');
  const content = useRemote(() => api.get('/website-content/' + kind), [kind]);
  const [featureDraft, setFeatureDraft] = useState('');
  const [entry, setEntry] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeContact, setActiveContact] = useState(null);
  const [contactReply, setContactReply] = useState('');

  const items = Array.isArray(content.value) ? content.value : [];
  const isCollection = kind === 'testimonials' || kind === 'faqs';

  useEffect(() => {
    if (kind === 'features') {
      setFeatureDraft(JSON.stringify(items, null, 2));
    }
  }, [kind, content.value]);

  useEffect(() => {
    setEntry(null);
    setActiveContact(null);
    setContactReply('');
  }, [kind]);

  const saveFeatures = async () => {
    let features;
    try {
      features = JSON.parse(featureDraft);
    } catch {
      notify('Enter valid JSON before publishing.', 'error');
      return;
    }
    if (!Array.isArray(features)) {
      notify('Features must be a JSON array.', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.put('/website-content/features', { features });
      notify('Landing page features published.');
      await content.reload();
    } catch (error) {
      notify(errorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveEntry = async () => {
    if (!entry) return;
    const payload = kind === 'testimonials'
      ? {
        name: entry.name.trim(),
        role: entry.role.trim(),
        college: entry.college.trim(),
        text: entry.text.trim(),
        avatar: entry.avatar?.trim() || undefined,
        rating: Number(entry.rating),
        isActive: Boolean(entry.isActive),
      }
      : {
        question: entry.question.trim(),
        answer: entry.answer.trim(),
        category: entry.category.trim(),
        order: Number(entry.order),
        isActive: Boolean(entry.isActive),
      };

    setSaving(true);
    try {
      if (entry.id) {
        await api.put('/website-content/' + kind + '/' + entry.id, payload);
      } else {
        await api.post('/website-content/' + kind, payload);
      }
      notify((kind === 'testimonials' ? 'Testimonial' : 'FAQ') + ' saved.');
      setEntry(null);
      await content.reload();
    } catch (error) {
      notify(errorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeEntry = async (item) => {
    const name = kind === 'testimonials' ? item.name : item.question;
    if (!window.confirm('Delete "' + name + '"?')) return;
    try {
      await api.delete('/website-content/' + kind + '/' + item.id);
      notify('Content item deleted.');
      await content.reload();
    } catch (error) {
      notify(errorMessage(error), 'error');
    }
  };

  const updateContact = async (payload, message) => {
    if (!activeContact) return;
    try {
      await api.patch('/website-content/contacts/' + activeContact.id, payload);
      notify(message);
      await content.reload();
      setActiveContact({ ...activeContact, ...payload });
      if (payload.adminReply) setContactReply('');
    } catch (error) {
      notify(errorMessage(error), 'error');
    }
  };

  return (
    <>
      <div className="admin-toolbar">
        <div className="admin-filters">
          {CONTENT_TABS.map(([id, label]) => (
            <button
              key={id}
              className={kind === id ? 'active' : ''}
              onClick={() => setKind(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <button onClick={() => content.reload()}><RefreshCw size={15} /> Refresh</button>
      </div>

      {content.loading && <EmptyState>Loading {labelize(kind)}…</EmptyState>}
      {content.error && <PageError message={content.error} />}

      {!content.loading && !content.error && kind === 'features' && (
        <section className="admin-card">
          <h3>Landing page features</h3>
          <p className="admin-subtitle">
            Edit the complete feature list as JSON. Each item needs icon, title, description, order, and isActive.
          </p>
          <textarea
            className="admin-code-editor"
            rows={20}
            value={featureDraft}
            onChange={(event) => setFeatureDraft(event.target.value)}
            spellCheck="false"
          />
          <button className="primary" disabled={saving} onClick={saveFeatures}>
            {saving ? 'Publishing…' : 'Publish features'}
          </button>
        </section>
      )}

      {!content.loading && !content.error && isCollection && (
        <>
          <div className="admin-toolbar">
            <p className="admin-subtitle">
              Manage the {kind === 'testimonials' ? 'stories shown as social proof' : 'answers shown in the help section'}.
            </p>
            <button
              className="primary"
              onClick={() => setEntry(kind === 'testimonials' ? blankTestimonial() : blankFaq())}
            >
              <Plus size={16} /> Add {kind === 'testimonials' ? 'testimonial' : 'FAQ'}
            </button>
          </div>
          <div className="admin-content-list">
            {items.map((item) => (
              <article className="admin-content-item" key={item.id}>
                <div>
                  <strong>{kind === 'testimonials' ? item.name : item.question}</strong>
                  {kind === 'testimonials' ? (
                    <p>{item.role} · {item.college} · {item.rating}/5</p>
                  ) : (
                    <p>{item.category} · order {item.order}</p>
                  )}
                  <span>{kind === 'testimonials' ? item.text : item.answer}</span>
                </div>
                <aside>
                  <span className={'admin-status ' + (item.isActive ? 'active' : 'inactive')}>
                    {item.isActive ? 'Live' : 'Hidden'}
                  </span>
                  <button className="admin-link" onClick={() => setEntry({ ...item })}>Edit</button>
                  <button className="admin-link danger" onClick={() => removeEntry(item)}>Delete</button>
                </aside>
              </article>
            ))}
            {!items.length && <EmptyState>No {labelize(kind)} have been added.</EmptyState>}
          </div>
        </>
      )}

      {!content.loading && !content.error && kind === 'contacts' && (
        <div className="admin-split">
          <section className="admin-content-list">
            {items.map((item) => (
              <button
                className={'admin-contact-row ' + (activeContact?.id === item.id ? 'selected' : '')}
                key={item.id}
                onClick={() => {
                  setActiveContact(item);
                  setContactReply(item.adminReply || '');
                }}
              >
                <div>
                  <strong>{item.subject}</strong>
                  <p>{item.name} · {item.email}</p>
                </div>
                <span className={'admin-status ' + item.status}>{item.status}</span>
              </button>
            ))}
            {!items.length && <EmptyState>No contact submissions yet.</EmptyState>}
          </section>

          <section className="admin-card admin-contact-detail">
            {!activeContact && <EmptyState>Select a contact submission to review it.</EmptyState>}
            {activeContact && (
              <>
                <h3>{activeContact.subject}</h3>
                <p className="admin-ticket-detail__meta">
                  {activeContact.name} · {activeContact.email} · {formatTime(activeContact.createdAt)}
                </p>
                <p>{activeContact.message}</p>
                <label className="admin-field">
                  Status
                  <select
                    value={activeContact.status}
                    onChange={(event) => updateContact({ status: event.target.value }, 'Contact status updated.')}
                  >
                    {['new', 'read', 'replied', 'archived'].map((status) => (
                      <option key={status} value={status}>{labelize(status)}</option>
                    ))}
                  </select>
                </label>
                <label className="admin-field">
                  Admin reply
                  <textarea
                    rows={5}
                    value={contactReply}
                    placeholder="Record your response to this enquiry."
                    onChange={(event) => setContactReply(event.target.value)}
                  />
                </label>
                <button
                  className="primary"
                  disabled={!contactReply.trim()}
                  onClick={() => updateContact({ adminReply: contactReply.trim() }, 'Reply recorded.')}
                >
                  Save reply
                </button>
              </>
            )}
          </section>
        </div>
      )}

      {entry && (
        <ContentEntryDialog
          kind={kind}
          entry={entry}
          onChange={setEntry}
          onClose={() => setEntry(null)}
          onSave={saveEntry}
          saving={saving}
        />
      )}
    </>
  );
}

export function MessagesPage({ data, notify }) {
  const [form, setForm] = useState({
    toType: 'all',
    toCollegeId: '',
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const messages = useRemote(() => api.get('/super-admin/messages'));

  const send = async () => {
    if (
      !form.subject.trim()
      || !form.message.trim()
      || (form.toType === 'one' && !form.toCollegeId)
    ) {
      notify('Complete the recipient, subject, and message.', 'error');
      return;
    }
    const college = data.colleges.find((item) => item.id === Number(form.toCollegeId));
    setSending(true);
    try {
      await api.post('/super-admin/messages', {
        ...form,
        toCollegeId: form.toType === 'one' ? Number(form.toCollegeId) : undefined,
        toCollegeName: college?.name,
      });
      notify('Message sent.');
      setForm({ toType: 'all', toCollegeId: '', subject: '', message: '' });
      await messages.reload();
    } catch (error) {
      notify(errorMessage(error), 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-two-column">
      <section className="admin-card">
        <h3>Compose message</h3>
        <label className="admin-field">
          Recipients
          <select
            value={form.toType}
            onChange={(event) => setForm({ ...form, toType: event.target.value })}
          >
            <option value="all">All college admins</option>
            <option value="one">One college admin</option>
          </select>
        </label>
        {form.toType === 'one' && (
          <label className="admin-field">
            College
            <select
              value={form.toCollegeId}
              onChange={(event) => setForm({ ...form, toCollegeId: event.target.value })}
            >
              <option value="">Select college</option>
              {data.colleges.filter((college) => college.admin).map((college) => (
                <option key={college.id} value={college.id}>{college.name}</option>
              ))}
            </select>
          </label>
        )}
        <label className="admin-field">
          Subject
          <input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} />
        </label>
        <label className="admin-field">
          Message
          <textarea rows={6} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
        </label>
        <button className="primary" disabled={sending} onClick={send}>
          <Send size={15} /> {sending ? 'Sending…' : 'Send message'}
        </button>
      </section>

      <section className="admin-card">
        <div className="admin-card__head">
          <h3>Message history</h3>
          <button onClick={() => messages.reload()}>Refresh</button>
        </div>
        {messages.error && <PageError message={messages.error} />}
        {(messages.value || []).map((message) => (
          <div className="admin-message" key={message.id}>
            <strong>{message.subject}</strong>
            <p>{message.message}</p>
            <small>
              {message.toType === 'all' ? 'All college admins' : message.toCollegeName}
              {' · '}{formatTime(message.createdAt || message.sentAt)}
            </small>
          </div>
        ))}
        {!messages.loading && !messages.value?.length && <EmptyState>No messages sent yet.</EmptyState>}
      </section>
    </div>
  );
}

export function ActivityPage({ data, refresh }) {
  const [query, setQuery] = useState('');
  const entries = useMemo(() => (data.activity || []).filter((entry) => (
    (entry.action + ' ' + entry.detail + ' ' + entry.actor)
      .toLowerCase()
      .includes(query.toLowerCase())
  )), [data.activity, query]);

  return (
    <>
      <div className="admin-toolbar">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search activity…"
        />
        <button onClick={refresh}><RefreshCw size={15} /> Refresh</button>
      </div>
      <div className="admin-card admin-activity">
        {entries.map((entry) => (
          <div key={entry.id}>
            <span />
            <section>
              <strong>{entry.action}</strong>
              <p>{entry.detail}</p>
              <small>{entry.actor} · {formatTime(entry.timestamp)}</small>
            </section>
          </div>
        ))}
        {!entries.length && <EmptyState>No activity found.</EmptyState>}
      </div>
    </>
  );
}

const ANNOUNCEMENT_ROLES = [
  ['admin', 'Platform admins'],
  ['super_admin', 'Super Admin'],
  ['college_admin', 'College admins'],
  ['placement_officer', 'Placement officers'],
  ['candidate', 'Candidates'],
  ['alumni', 'Alumni'],
  ['recruiter', 'Recruiters'],
];

const emptyAnnouncement = () => ({
  title: '',
  message: '',
  type: 'info',
  targetRoles: [],
  targetColleges: [],
  isActive: true,
  expiresAt: '',
});

export function AnnouncementsPage({ data, notify }) {
  const list = useRemote(() => api.get('/platform-announcements/all'));
  const [form, setForm] = useState(emptyAnnouncement);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const toggleRole = (role) => {
    setForm((current) => ({
      ...current,
      targetRoles: current.targetRoles.includes(role)
        ? current.targetRoles.filter((item) => item !== role)
        : [...current.targetRoles, role],
    }));
  };

  const saveAnnouncement = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      notify('Title and message are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        message: form.message.trim(),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      };
      if (editingId) {
        await api.put('/platform-announcements/' + editingId, payload);
      } else {
        await api.post('/platform-announcements', payload);
      }
      notify(editingId ? 'Announcement updated.' : 'Announcement published.');
      setForm(emptyAnnouncement());
      setEditingId(null);
      await list.reload();
    } catch (error) {
      notify(errorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete('/platform-announcements/' + id);
      notify('Announcement removed.');
      await list.reload();
    } catch (error) {
      notify(errorMessage(error), 'error');
    }
  };

  const toggleActive = async (item) => {
    try {
      await api.put('/platform-announcements/' + item.id, { isActive: !item.isActive });
      notify(item.isActive ? 'Announcement paused.' : 'Announcement activated.');
      await list.reload();
    } catch (error) {
      notify(errorMessage(error), 'error');
    }
  };

  const beginEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title || '',
      message: item.message || '',
      type: item.type || 'info',
      targetRoles: item.targetRoles || [],
      targetColleges: item.targetColleges || [],
      isActive: item.isActive !== false,
      expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString().slice(0, 16) : '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="admin-two-column">
      <section className="admin-card">
        <h3>{editingId ? 'Edit announcement' : 'Publish announcement'}</h3>
        <label className="admin-field">
          Title
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </label>
        <label className="admin-field">
          Type
          <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
            {['info', 'warning', 'maintenance', 'update'].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          Message
          <textarea rows={5} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
        </label>
        <fieldset className="admin-audience">
          <legend>Audience (leave blank for everyone)</legend>
          {ANNOUNCEMENT_ROLES.map(([role, label]) => (
            <label className="admin-checkbox" key={role}>
              <input
                type="checkbox"
                checked={form.targetRoles.includes(role)}
                onChange={() => toggleRole(role)}
              />
              {label}
            </label>
          ))}
        </fieldset>
        <label className="admin-field">
          Specific colleges (optional)
          <select
            multiple
            value={form.targetColleges.map(String)}
            onChange={(event) => setForm({
              ...form,
              targetColleges: Array.from(event.target.selectedOptions, (option) => Number(option.value)),
            })}
          >
            {(data.colleges || []).map((college) => (
              <option key={college.id} value={college.id}>{college.name}</option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          Expiry (optional)
          <input
            type="datetime-local"
            value={form.expiresAt}
            onChange={(event) => setForm({ ...form, expiresAt: event.target.value })}
          />
        </label>
        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
          />
          Publish as active
        </label>
        <button className="primary" disabled={saving} onClick={saveAnnouncement}>
          <Megaphone size={15} /> {saving ? 'Publishing…' : 'Publish announcement'}
        </button>
      </section>

      <section className="admin-card">
        <div className="admin-card__head">
          <h3>Published announcements</h3>
          <button onClick={() => list.reload()}>Refresh</button>
        </div>
        {list.error && <PageError message={list.error} />}
        {(list.value || []).map((item) => (
          <div className="admin-message" key={item.id}>
            <strong>
              {item.title} <span className="admin-pill">{item.type}</span>
              {!item.isActive && <span className="admin-pill admin-pill--muted">Paused</span>}
            </strong>
            <p>{item.message}</p>
            <small>
              {item.targetRoles?.length ? item.targetRoles.map(labelize).join(', ') : 'All roles'}
              {' · '}{item.targetColleges?.length ? item.targetColleges.length + ' selected colleges' : 'All colleges'}
              {' · '}{formatTime(item.createdAt)}
            </small>
            <button className="admin-link" onClick={() => toggleActive(item)}>
              {item.isActive ? 'Pause' : 'Activate'}
            </button>
            <button className="admin-link" onClick={() => beginEdit(item)}>Edit</button>
            <button className="admin-link danger" onClick={() => remove(item.id)}>Delete</button>
          </div>
        ))}
        {!list.loading && !list.value?.length && <EmptyState>No platform announcements yet.</EmptyState>}
      </section>
    </div>
  );
}

export function OnboardingPage({ notify, refresh }) {
  const requests = useRemote(() => api.get('/super-admin/onboarding-requests'));
  const [filter, setFilter] = useState('pending');
  const [review, setReview] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const items = Array.isArray(requests.value) ? requests.value : [];
  const visible = items.filter((item) => filter === 'all' || item.status === filter);

  const openReview = (request, action) => {
    setReview({ request, action });
    setNote('');
  };

  const processRequest = async () => {
    if (!review || (review.action === 'reject' && !note.trim())) {
      if (review?.action === 'reject') notify('Add a reason before rejecting this request.', 'error');
      return;
    }
    setSaving(true);
    try {
      const path = '/super-admin/onboarding-requests/' + review.request.id + '/' + review.action;
      const payload = note.trim() ? { note: note.trim() } : {};
      await api.patch(path, payload);
      notify(review.action === 'approve' ? 'College and College Admin created.' : 'Onboarding request rejected.');
      setReview(null);
      await requests.reload();
      await refresh();
    } catch (error) {
      notify(errorMessage(error, 'Could not process this onboarding request.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="admin-toolbar">
        <div className="admin-filters">
          {['pending', 'approved', 'rejected', 'all'].map((status) => (
            <button
              key={status}
              className={filter === status ? 'active' : ''}
              onClick={() => setFilter(status)}
            >
              {labelize(status)} ({status === 'all' ? items.length : items.filter((item) => item.status === status).length})
            </button>
          ))}
        </div>
        <button onClick={() => requests.reload()}><RefreshCw size={15} /> Refresh</button>
      </div>

      <section className="admin-card">
        <h3>College onboarding requests</h3>
        <p className="admin-subtitle">Review organization enquiries and provision their CareerNest workspace.</p>
        {requests.error && <PageError message={requests.error} />}
        {requests.loading && <EmptyState>Loading onboarding requestsâ€¦</EmptyState>}
        {!requests.loading && !requests.error && (
          <div className="admin-table-wrap">
            <table>
              <thead><tr><th>Organization</th><th>Primary contact</th><th>Submitted</th><th>Status</th><th /></tr></thead>
              <tbody>
                {visible.map((request) => (
                  <tr key={request.id}>
                    <td><strong>{request.collegeName}</strong><small>{request.collegeCode} Â· {request.collegeEmail}</small></td>
                    <td><strong>{request.contactName}</strong><small>{request.contactDesignation} Â· {request.contactEmail}</small></td>
                    <td>{formatTime(request.submittedAt)}</td>
                    <td><span className={'admin-status ' + request.status}>{request.status}</span></td>
                    <td className="admin-actions">
                      {request.status === 'pending' ? (
                        <>
                          <button className="admin-link" onClick={() => openReview(request, 'approve')}>Approve</button>
                          <button className="admin-link danger" onClick={() => openReview(request, 'reject')}>Reject</button>
                        </>
                      ) : <span className="admin-subtitle">{request.reviewNote || 'Reviewed'}</span>}
                    </td>
                  </tr>
                ))}
                {!visible.length && <tr><td colSpan="5" className="admin-empty">No {filter === 'all' ? '' : filter + ' '}onboarding requests.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {review && (
        <div className="admin-modal__backdrop" onClick={() => !saving && setReview(null)}>
          <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <h3>{review.action === 'approve' ? 'Approve' : 'Reject'} {review.request.collegeName}</h3>
            <p className="admin-subtitle">
              {review.action === 'approve'
                ? 'This creates the college and assigns the submitted contact as its College Admin.'
                : 'Provide a clear reason for rejecting this organization request.'}
            </p>
            <label className="admin-field">
              Review note{review.action === 'reject' ? ' *' : ' (optional)'}
              <textarea rows={4} value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
            <div className="admin-modal__actions">
              <button disabled={saving} onClick={() => setReview(null)}>Cancel</button>
              <button className={review.action === 'reject' ? 'danger' : 'primary'} disabled={saving} onClick={processRequest}>
                {saving ? 'Savingâ€¦' : review.action === 'approve' ? 'Approve and create' : 'Reject request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ProfilePage({ user, onUserUpdated, notify }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [password, setPassword] = useState(false);

  const save = async () => {
    try {
      const response = await api.put('/users/' + user.id, form);
      const updated = { ...user, ...response.data };
      localStorage.setItem('loggedInUser', JSON.stringify(updated));
      onUserUpdated(updated);
      notify('Profile updated.');
      setEditing(false);
    } catch (error) {
      notify(errorMessage(error), 'error');
    }
  };

  return (
    <div className="admin-profile">
      <div className="admin-profile__hero">
        <div>{(user?.name || 'Admin').slice(0, 2).toUpperCase()}</div>
        <section>
          <h2>{user?.name || 'Admin'}</h2>
          <p>{user?.email}</p>
          <span>Platform Operations Admin</span>
        </section>
      </div>
      {editing ? (
        <section className="admin-card">
          <label className="admin-field">
            Name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="admin-field">
            Email
            <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <label className="admin-field">
            Phone
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </label>
          <button className="primary" onClick={save}>Save profile</button>
          <button onClick={() => setEditing(false)}>Cancel</button>
        </section>
      ) : (
        <section className="admin-card">
          <div className="admin-profile__row"><span>Name</span><strong>{user?.name}</strong></div>
          <div className="admin-profile__row"><span>Email</span><strong>{user?.email}</strong></div>
          <div className="admin-profile__row"><span>Phone</span><strong>{user?.phone || EMPTY_TEXT}</strong></div>
          <button className="primary" onClick={() => setEditing(true)}>Edit profile</button>
          <button onClick={() => setPassword(true)}>Change password</button>
        </section>
      )}
      {password && (
        <ChangePasswordModal
          isOpen={password}
          onClose={() => setPassword(false)}
          userId={user?.id}
          accentColor="#2563eb"
        />
      )}
    </div>
  );
}
