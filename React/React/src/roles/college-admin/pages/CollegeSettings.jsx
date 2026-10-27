import React, { useEffect, useState } from 'react';
import { Building2, Globe2, Mail, MapPin, Phone, RefreshCw, Save } from 'lucide-react';
import api, { errorMessage } from '../../../services/api.js';

const EMPTY = { name: '', email: '', phone: '', address: '', website: '' };

export default function CollegeSettings({ collegeId, platform, showToast }) {
  const [college, setCollege] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!collegeId) return;
    setLoading(true);
    setError('');
    try {
      const collegeResponse = await api.get('/colleges/' + collegeId);
      const nextCollege = collegeResponse.data;
      setCollege(nextCollege);
      setForm({
        name: nextCollege.name || '',
        email: nextCollege.email || '',
        phone: nextCollege.phone || '',
        address: nextCollege.address || '',
        website: nextCollege.website || '',
      });
    } catch (requestError) {
      setError(errorMessage(requestError, 'Could not load college settings.'));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [collegeId]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      // This purpose-built endpoint only permits a college admin to update
      // their own college's contact profile.
      const response = await api.put('/colleges/' + collegeId + '/settings', form);
      setCollege(response.data);
      setForm({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        address: response.data.address || '',
        website: response.data.website || '',
      });
      setEditing(false);
      await platform?.refresh?.();
      showToast?.('College settings updated successfully.');
    } catch (requestError) {
      const message = errorMessage(requestError, 'Could not update college settings.');
      setError(message);
      showToast?.(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="empty-state"><RefreshCw className="ca-spin" /><p>Loading college settings…</p></div>;
  if (!college) return <div className="empty-state"><Building2 /><p>{error || 'College information is not available.'}</p></div>;

  return (
    <div className="ca-college-settings">
      <section className="ca-feature-hero">
        <div>
          <span className="ca-feature-eyebrow"><Building2 size={14} /> College profile</span>
          <h2>College Settings</h2>
          <p>Keep your college contact details accurate for students, alumni, and recruiters.</p>
        </div>
        {!editing && <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit profile</button>}
      </section>
      {error && <div className="ca-feature-error">{error}</div>}

      <div className="ca-settings-grid">
        <section className="ca-feature-card">
          <div className="ca-settings-title"><Building2 size={17} /><h3>College contact details</h3></div>
          {editing ? (
            <form onSubmit={save} className="ca-settings-form">
              <label>College name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
              <label>Official email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
              <label>Phone number<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
              <label>Address<textarea rows={3} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
              <label>Website<input type="url" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} placeholder="https://example.edu" /></label>
              <div className="ca-settings-form__actions"><button type="button" className="btn btn-outline" disabled={saving} onClick={() => { setForm({ name: college.name || '', email: college.email || '', phone: college.phone || '', address: college.address || '', website: college.website || '' }); setEditing(false); setError(''); }}>Cancel</button><button className="btn btn-primary" disabled={saving}><Save size={15} /> {saving ? 'Saving…' : 'Save changes'}</button></div>
            </form>
          ) : (
            <dl className="ca-settings-details">
              <div><dt><Building2 size={15} /> College name</dt><dd>{college.name}</dd></div>
              <div><dt>Code</dt><dd>{college.code}</dd></div>
              <div><dt><Mail size={15} /> Email</dt><dd>{college.email || '—'}</dd></div>
              <div><dt><Phone size={15} /> Phone</dt><dd>{college.phone || '—'}</dd></div>
              <div><dt><MapPin size={15} /> Address</dt><dd>{college.address || '—'}</dd></div>
              <div><dt><Globe2 size={15} /> Website</dt><dd>{college.website ? <a href={college.website} target="_blank" rel="noreferrer">{college.website}</a> : '—'}</dd></div>
            </dl>
          )}
        </section>

      </div>
    </div>
  );
}
