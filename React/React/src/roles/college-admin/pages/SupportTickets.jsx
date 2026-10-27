import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CircleHelp, Clock3, LoaderCircle, MessageSquare, Plus, Send } from 'lucide-react';
import api, { errorMessage } from '../../../services/api.js';

const CATEGORY_OPTIONS = [
  ['technical', 'Technical issue'],
  ['billing', 'Account & billing'],
  ['account', 'Account access'],
  ['feature_request', 'Feature request'],
  ['general', 'General question'],
];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const label = (value = '') => String(value).replace('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
const formatTime = (value) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'technical', priority: 'medium' });
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async (selectedId) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/support-tickets/my');
      const list = response.data || [];
      setTickets(list);
      const nextId = selectedId || selected?.id;
      setSelected(nextId ? list.find((ticket) => ticket.id === nextId) || list[0] || null : list[0] || null);
    } catch (requestError) {
      setError(errorMessage(requestError, 'Could not load your support tickets.'));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const shownTickets = useMemo(
    () => tickets.filter((ticket) => filter === 'all' || ticket.status === filter),
    [tickets, filter],
  );
  const counts = {
    open: tickets.filter((ticket) => ticket.status === 'open').length,
    inProgress: tickets.filter((ticket) => ticket.status === 'in_progress').length,
    resolved: tickets.filter((ticket) => ['resolved', 'closed'].includes(ticket.status)).length,
  };

  const createTicket = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setSaving(true);
    try {
      const response = await api.post('/support-tickets', {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
      });
      setForm({ title: '', description: '', category: 'technical', priority: 'medium' });
      setComposerOpen(false);
      await load(response.data?.id);
    } catch (requestError) {
      setError(errorMessage(requestError, 'Could not create this ticket.'));
    } finally {
      setSaving(false);
    }
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSaving(true);
    try {
      await api.post('/support-tickets/' + selected.id + '/respond', { message: reply.trim() });
      setReply('');
      await load(selected.id);
    } catch (requestError) {
      setError(errorMessage(requestError, 'Could not send your reply.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ca-support">
      <section className="ca-feature-hero">
        <div>
          <span className="ca-feature-eyebrow"><CircleHelp size={14} /> Platform support</span>
          <h2>Support Tickets</h2>
          <p>Raise an issue with the CareerNest operations team and track every response in one place.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setComposerOpen(true)}><Plus size={16} /> Raise a ticket</button>
      </section>

      <div className="ca-feature-stats ca-feature-stats--tickets">
        <article><Clock3 size={18} /><div><span>Open</span><strong>{counts.open}</strong></div></article>
        <article><LoaderCircle size={18} /><div><span>In progress</span><strong>{counts.inProgress}</strong></div></article>
        <article><CheckCircle2 size={18} /><div><span>Resolved</span><strong>{counts.resolved}</strong></div></article>
      </div>
      {error && <div className="ca-feature-error">{error}</div>}

      <section className="ca-support-layout">
        <div className="ca-feature-card ca-ticket-list">
          <div className="ca-ticket-filters">
            {['all', 'open', 'in_progress', 'resolved', 'closed'].map((item) => (
              <button key={item} onClick={() => setFilter(item)} className={filter === item ? 'active' : ''}>{label(item)}</button>
            ))}
          </div>
          {loading ? <div className="empty-state"><LoaderCircle className="ca-spin" /><p>Loading tickets…</p></div> : shownTickets.length ? (
            shownTickets.map((ticket) => (
              <button key={ticket.id} onClick={() => setSelected(ticket)} className={'ca-ticket-row' + (selected?.id === ticket.id ? ' selected' : '')}>
                <span className={'ca-ticket-priority ' + ticket.priority} />
                <span>
                  <strong>{ticket.title}</strong>
                  <small>#{ticket.id} · {label(ticket.category)} · {formatTime(ticket.updatedAt)}</small>
                </span>
                <em className={'ca-ticket-status ' + ticket.status}>{label(ticket.status)}</em>
              </button>
            ))
          ) : <div className="empty-state"><CircleHelp /><p>No tickets match this filter.</p></div>}
        </div>

        <aside className="ca-feature-card ca-ticket-detail">
          {selected ? (
            <>
              <div className="ca-ticket-detail__head">
                <div><span className={'ca-ticket-status ' + selected.status}>{label(selected.status)}</span><h3>{selected.title}</h3></div>
                <span className={'ca-ticket-priority-label ' + selected.priority}>{selected.priority} priority</span>
              </div>
              <p className="ca-ticket-detail__meta">Opened {formatTime(selected.createdAt)} · {label(selected.category)}</p>
              <p className="ca-ticket-description">{selected.description}</p>
              {selected.assignedToName && <p className="ca-ticket-assignee">Assigned to <strong>{selected.assignedToName}</strong></p>}
              {selected.resolution && <div className="ca-ticket-resolution"><CheckCircle2 size={16} /><span><strong>Resolution</strong>{selected.resolution}</span></div>}

              <div className="ca-ticket-thread">
                <h4><MessageSquare size={15} /> Conversation</h4>
                {(selected.responses || []).length ? selected.responses.map((message) => (
                  <article key={message.id} className={'ca-ticket-message ' + (message.userRole === 'college_admin' ? 'mine' : '')}>
                    <header><strong>{message.userName}</strong><small>{formatTime(message.createdAt)}</small></header>
                    <p>{message.message}</p>
                  </article>
                )) : <p className="ca-ticket-empty-thread">No replies yet. The operations team will respond here.</p>}
              </div>
              {!['closed'].includes(selected.status) && <div className="ca-ticket-reply">
                <textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={3} placeholder="Add more context or reply to the operations team" />
                <button className="btn btn-primary btn-sm" disabled={saving || !reply.trim()} onClick={sendReply}><Send size={14} /> Send reply</button>
              </div>}
            </>
          ) : <div className="empty-state"><CircleHelp /><p>Select a ticket to see its status and conversation.</p></div>}
        </aside>
      </section>

      {composerOpen && <div className="modal-backdrop open" onClick={() => !saving && setComposerOpen(false)}>
        <form className="modal ca-ticket-composer" onClick={(event) => event.stopPropagation()} onSubmit={createTicket}>
          <h3><CircleHelp size={19} color="#0ea5e9" /> Raise a support ticket</h3>
          <p className="ca-ticket-composer__intro">Share enough detail for the platform operations team to help quickly.</p>
          <div className="form-group"><label>Subject *</label><input autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Briefly describe the issue" maxLength={120} /></div>
          <div className="ca-form-two-col">
            <div className="form-group"><label>Category</label><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{CATEGORY_OPTIONS.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></div>
            <div className="form-group"><label>Priority</label><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>{PRIORITIES.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}</select></div>
          </div>
          <div className="form-group"><label>Description *</label><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={6} placeholder="What happened, who is affected, and what have you already tried?" /></div>
          <div className="modal-actions"><button type="button" className="btn btn-outline" disabled={saving} onClick={() => setComposerOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={saving || !form.title.trim() || !form.description.trim()}>{saving ? 'Creating…' : 'Create ticket'}</button></div>
        </form>
      </div>}
    </div>
  );
}
