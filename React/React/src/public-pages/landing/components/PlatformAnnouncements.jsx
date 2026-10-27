import { useEffect, useState } from 'react';
import api, { readSession } from '../../../services/api.js';

const TYPE_LABEL = {
  info: 'Information',
  warning: 'Important notice',
  maintenance: 'Maintenance',
  update: 'Platform update',
};

/**
 * Platform announcements are audience-aware on the API. They are shown only
 * when a visitor has an active CareerNest session; public visitors still get
 * the normal, uncluttered marketing landing page.
 */
export default function PlatformAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const session = readSession();
    if (!session?.accessToken) return undefined;

    let mounted = true;
    api.get('/platform-announcements')
      .then(({ data }) => {
        if (mounted && Array.isArray(data)) setAnnouncements(data.slice(0, 2));
      })
      .catch(() => {});

    return () => { mounted = false; };
  }, []);

  if (!announcements.length) return null;

  return (
    <section className="platform-announcements" aria-label="Platform announcements">
      <div className="container platform-announcements__inner">
        {announcements.map((announcement) => (
          <article
            className={`platform-announcement platform-announcement--${announcement.type || 'info'}`}
            key={announcement.id}
            role="status"
          >
            <span className="platform-announcement__label">
              {TYPE_LABEL[announcement.type] || TYPE_LABEL.info}
            </span>
            <div>
              <strong>{announcement.title}</strong>
              <p>{announcement.message}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
