import React, { useMemo, useState } from 'react';
import { Building2, Gift, GraduationCap, MapPin, Search, Users } from 'lucide-react';

const initials = (name = '') => name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'AL';

export default function AlumniNetwork({ alumni = [], collegeName }) {
  const [query, setQuery] = useState('');
  const [batch, setBatch] = useState('all');

  const batches = useMemo(
    () => [...new Set(alumni.map((person) => person.batch).filter(Boolean))].sort((a, b) => String(b).localeCompare(String(a))),
    [alumni],
  );
  const visibleAlumni = alumni.filter((person) => {
    const haystack = [person.name, person.company, person.headline, person.location, person.department, person.batch]
      .filter(Boolean).join(' ').toLowerCase();
    return (batch === 'all' || String(person.batch) === batch) && haystack.includes(query.trim().toLowerCase());
  });
  const activeCount = alumni.filter((person) => person.status !== 'inactive').length;
  const referrals = alumni.reduce((total, person) => total + Number(person.referrals || 0), 0);
  const companies = new Set(alumni.map((person) => person.company).filter(Boolean)).size;

  return (
    <div className="ca-alumni-network">
      <section className="ca-feature-hero">
        <div>
          <span className="ca-feature-eyebrow"><Users size={14} /> Alumni engagement</span>
          <h2>Alumni Network</h2>
          <p>Stay connected with {collegeName || 'your college'} graduates and their referral activity.</p>
        </div>
        <div className="ca-feature-hero__icon"><GraduationCap size={30} /></div>
      </section>

      <div className="ca-feature-stats">
        <article><Users size={18} /><div><span>Total alumni</span><strong>{alumni.length}</strong></div></article>
        <article><Gift size={18} /><div><span>Referrals shared</span><strong>{referrals}</strong></div></article>
        <article><Building2 size={18} /><div><span>Companies represented</span><strong>{companies}</strong></div></article>
        <article><GraduationCap size={18} /><div><span>Active profiles</span><strong>{activeCount}</strong></div></article>
      </div>

      <section className="ca-feature-card">
        <div className="ca-feature-toolbar">
          <label className="ca-search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search alumni, company, role or location" /></label>
          <label className="ca-select-field">Batch
            <select value={batch} onChange={(event) => setBatch(event.target.value)}>
              <option value="all">All batches</option>
              {batches.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>

        {visibleAlumni.length ? (
          <div className="ca-alumni-grid">
            {visibleAlumni.map((person) => (
              <article key={person.id} className="ca-alumni-card">
                <div className="ca-alumni-card__top">
                  <div className="ca-alumni-avatar">{person.avatar || initials(person.name)}</div>
                  <div>
                    <h3>{person.name}</h3>
                    <p>{person.headline || 'Alumni community member'}</p>
                  </div>
                  <span className={'badge ' + (person.status === 'inactive' ? 'badge-gray' : 'badge-green')}>{person.status || 'active'}</span>
                </div>
                <dl>
                  <div><dt><Building2 size={14} /> Company</dt><dd>{person.company || '—'}</dd></div>
                  <div><dt><GraduationCap size={14} /> Batch</dt><dd>{person.batch || '—'} {person.department ? '· ' + person.department : ''}</dd></div>
                  <div><dt><MapPin size={14} /> Location</dt><dd>{person.location || '—'}</dd></div>
                </dl>
                <footer><Gift size={14} /> {Number(person.referrals || 0)} referral{Number(person.referrals || 0) === 1 ? '' : 's'} contributed</footer>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state"><Users /><p>No alumni match the selected filters.</p></div>
        )}
      </section>
    </div>
  );
}
