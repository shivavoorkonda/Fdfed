import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, RefreshCw, Users } from 'lucide-react';
import api, { errorMessage } from '../../../services/api.js';

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(String(value).length === 10 ? String(value) + 'T12:00:00' : value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const monthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const dayKey = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
const formatDate = (value) => {
  const date = toDate(value);
  return date ? date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : 'Date not set';
};
const statusClass = (status = '') => {
  const normal = String(status).toLowerCase();
  if (normal === 'published' || normal === 'approved') return 'active';
  if (normal === 'pending') return 'pending';
  return 'closed';
};

function nearestDriveMonth(drives) {
  if (!drives.length) return monthStart(new Date());
  const now = Date.now();
  const dated = drives.map((drive) => ({ drive, date: toDate(drive.deadline) })).filter((item) => item.date);
  const future = dated.filter((item) => item.date.getTime() >= now).sort((a, b) => a.date - b.date);
  return monthStart((future[0] || dated.sort((a, b) => a.date - b.date)[0]).date);
}

export default function DriveCalendar({ collegeName }) {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [month, setMonth] = useState(() => monthStart(new Date()));
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/opportunities');
      const list = (response.data || []).filter(
        (drive) => String(drive.status).toLowerCase() === 'published',
      );
      setDrives(list);
      setMonth(nearestDriveMonth(list));
    } catch (requestError) {
      setError(errorMessage(requestError, 'Could not load placement drives.'));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const days = useMemo(() => {
    const start = monthStart(month);
    const offset = start.getDay();
    const first = new Date(start);
    first.setDate(first.getDate() - offset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(first);
      date.setDate(first.getDate() + index);
      return date;
    });
  }, [month]);
  const drivesByDay = useMemo(() => drives.reduce((map, drive) => {
    const date = toDate(drive.deadline);
    if (!date) return map;
    const key = dayKey(date);
    map[key] = [...(map[key] || []), drive];
    return map;
  }, {}), [drives]);
  const activeDrives = drives.filter((drive) => String(drive.status).toLowerCase() === 'published');
  const currentMonthLabel = month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="ca-drive-calendar">
      <section className="ca-feature-hero">
        <div>
          <span className="ca-feature-eyebrow"><CalendarDays size={14} /> Placement planning</span>
          <h2>Drive Calendar</h2>
          <p>Review upcoming and completed placement deadlines for {collegeName || 'your college'}.</p>
        </div>
        <div className="ca-feature-hero__icon"><CalendarDays size={30} /></div>
      </section>

      <div className="ca-drive-summary">
        <span><strong>{drives.length}</strong> total drives</span>
        <span><strong>{activeDrives.length}</strong> published drives</span>
        <button className="btn btn-outline btn-sm" onClick={load} disabled={loading}><RefreshCw size={14} className={loading ? 'ca-spin' : ''} /> Refresh</button>
      </div>

      {error && <div className="ca-feature-error">{error}</div>}
      <section className="ca-calendar-layout">
        <div className="ca-feature-card ca-calendar-card">
          <div className="ca-calendar-head">
            <button aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={18} /></button>
            <h3>{currentMonthLabel}</h3>
            <button aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={18} /></button>
          </div>
          <div className="ca-calendar-grid ca-calendar-grid--weekdays">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="ca-calendar-grid">
            {days.map((date) => {
              const dayDrives = drivesByDay[dayKey(date)] || [];
              const otherMonth = date.getMonth() !== month.getMonth();
              const today = dayKey(date) === dayKey(new Date());
              return (
                <div key={date.toISOString()} className={'ca-calendar-day' + (otherMonth ? ' muted' : '') + (today ? ' today' : '')}>
                  <span>{date.getDate()}</span>
                  <div>{dayDrives.slice(0, 2).map((drive) => <button key={drive.id} onClick={() => setSelected(drive)} className={'ca-calendar-event ' + statusClass(drive.status)} title={drive.title}>{drive.company}</button>)}</div>
                  {dayDrives.length > 2 && <small>+{dayDrives.length - 2} more</small>}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="ca-feature-card ca-drive-detail">
          {selected ? (
            <>
              <span className={'ca-status-dot ' + statusClass(selected.status)}>{selected.status || 'scheduled'}</span>
              <h3>{selected.title}</h3>
              <p className="ca-drive-company">{selected.company}</p>
              <dl>
                <div><dt><CalendarDays size={14} /> Deadline</dt><dd>{formatDate(selected.deadline)}</dd></div>
                <div><dt><MapPin size={14} /> Location</dt><dd>{selected.location || '—'}</dd></div>
                <div><dt><Users size={14} /> Eligible branches</dt><dd>{(selected.branches || []).join(', ') || 'All branches'}</dd></div>
              </dl>
              <p className="ca-drive-detail__meta">{selected.openings || 0} openings · {selected.applications || 0} applications · {selected.salary || 'Salary not listed'}</p>
            </>
          ) : (
            <div className="empty-state"><CalendarDays /><p>Select a drive from the calendar to view its details.</p></div>
          )}
        </aside>
      </section>
    </div>
  );
}
