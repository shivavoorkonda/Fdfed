import { Bell, UserRound } from 'lucide-react';

export default function AdminHeader({ title, user, onProfile }) {
  const initials = (user?.name || 'Admin').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return <header className="admin-header"><div><h1>{title}</h1><span>CareerNest platform operations</span></div><div className="admin-header__actions"><button type="button" title="Platform notifications" aria-label="Platform notifications"><Bell size={19} /></button><button type="button" className="admin-header__profile" onClick={onProfile}><UserRound size={17} /> <span>{user?.name || 'Admin'}</span><b>{initials}</b></button></div></header>;
}
