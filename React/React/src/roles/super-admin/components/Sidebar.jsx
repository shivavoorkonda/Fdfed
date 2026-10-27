import React from 'react';
import {
  LayoutDashboard, Building2, UserCog, Activity, Crown, LogOut, Ticket,
  Users, BarChart3
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview',  label: 'Overview',           icon: LayoutDashboard },
  { id: 'colleges',  label: 'Colleges',           icon: Building2 },
  { id: 'admins',    label: 'Admins',             icon: UserCog },
  { id: 'users',     label: 'All Users',          icon: Users },
  { id: 'analytics', label: 'Analytics',          icon: BarChart3 },
  { id: 'support',   label: 'Support Audit',      icon: Ticket },
  { id: 'activity',  label: 'Audit Trail',        icon: Activity },
];

export default function SuperAdminSidebar({ activeTab, setActiveTab, onSignOut }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2><Crown size={18} color="#a78bfa" /> CareerNest</h2>
        <p>Platform Administration</p>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-item ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-help-text">
          Full platform administration and organization management.
        </div>
        <button className="btn-signout" onClick={onSignOut}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
