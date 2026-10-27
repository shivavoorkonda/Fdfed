import { Bell, Building2, CircleHelp, ClipboardList, LayoutDashboard, LogOut, Mail, ShieldCheck, UserCog, Users } from 'lucide-react';

const NAV = [
  ['dashboard', 'Dashboard', LayoutDashboard], ['colleges', 'Colleges', Building2], ['onboarding', 'Onboarding', ClipboardList], ['college-admins', 'College Admins', UserCog],
  ['support', 'Support Center', CircleHelp], ['messages', 'Messages', Mail],
  ['announcements', 'Announcements', Bell], ['profile', 'Profile', Users],
];

export default function AdminSidebar({ active, onChange, onSignOut }) {
  return <aside className="admin-sidebar"><div className="admin-sidebar__brand"><ShieldCheck size={22} /><div><strong>CareerNest</strong><span>Operations Admin</span></div></div><nav>{NAV.map(([id, label, Icon]) => <button key={id} className={active === id ? 'active' : ''} onClick={() => onChange(id)}><Icon size={18} />{label}</button>)}</nav><div className="admin-sidebar__bottom"><p>Platform operations and college success.</p><button onClick={onSignOut}><LogOut size={17} /> Sign Out</button></div></aside>;
}
