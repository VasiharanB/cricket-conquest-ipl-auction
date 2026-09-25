import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Radio,
  History,
  Trophy,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  UserCog,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

type Role = 'Admin' | 'Auctioneer' | 'Volunteer';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  end?: boolean;
  /** Roles that can see this item. Empty = all authenticated. */
  allowedRoles?: Role[];
  /** Badge to indicate restricted access */
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/organizer',         icon: LayoutDashboard, label: 'Dashboard',        end: true },
  { to: '/organizer/teams',   icon: Users,           label: 'Teams',             end: false },
  { to: '/organizer/players', icon: UserCircle,      label: 'Players',           end: false },
  { to: '/organizer/auction', icon: Radio,           label: 'Live Auction',      end: false },
  { to: '/organizer/history', icon: History,         label: 'Auction History',   end: false },
  { to: '/organizer/results', icon: Trophy,          label: 'Results',           end: false },
  {
    to: '/organizer/monitor',
    icon: ShieldAlert,
    label: 'Watchdog Monitor',
    end: false,
    allowedRoles: ['Admin', 'Auctioneer', 'Volunteer'],
    badge: 'Monitor',
  },
  {
    to: '/organizer/users',
    icon: UserCog,
    label: 'User Management',
    end: false,
    allowedRoles: ['Admin'],
    badge: 'Admin',
  },
];

const ROLE_STYLE: Record<Role, React.CSSProperties> = {
  Admin:      { background: 'rgba(239,68,68,0.2)',   color: '#F87171', border: '1px solid rgba(239,68,68,0.3)' },
  Auctioneer: { background: 'rgba(14,165,233,0.2)',  color: '#38BDF8', border: '1px solid rgba(14,165,233,0.3)' },
  Volunteer:  { background: 'rgba(34,197,94,0.2)',   color: '#4ADE80', border: '1px solid rgba(34,197,94,0.3)' },
};

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const roleNorm = (user?.role || '').toLowerCase();

  const visibleItems = NAV_ITEMS.filter((item) =>
    !item.allowedRoles || item.allowedRoles.some((r) => r.toLowerCase() === roleNorm)
  );

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__brand-icon">
          <Trophy size={20} />
        </div>
        <div className="sidebar__brand-text">
          <span className="sidebar__brand-sub">ZenTriX'26</span>
          <span className="sidebar__brand-name">Cricket Conquest</span>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div style={{
          padding: '12px 16px',
          margin: '8px 12px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            <ShieldCheck size={16} color="#38BDF8" style={{ flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user.username}
              </span>
              <span style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 4, width: 'fit-content', marginTop: 2,
                ...(roleNorm === 'admin'
                  ? ROLE_STYLE.Admin
                  : roleNorm === 'auctioneer'
                  ? ROLE_STYLE.Auctioneer
                  : ROLE_STYLE.Volunteer),
              }}>
                {user.role}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4, display: 'flex' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      )}

      {/* Volunteer read-only notice */}
      {roleNorm === 'volunteer' && (
        <div style={{
          margin: '4px 12px 8px',
          padding: '8px 12px',
          background: 'rgba(234,179,8,0.1)',
          border: '1px solid rgba(234,179,8,0.25)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          color: '#FDE047',
        }}>
          <Lock size={12} />
          Read-only access
        </div>
      )}

      <div className="sidebar__label">Organizer Control</div>

      <nav className="sidebar__nav">
        {visibleItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            <item.icon size={18} />
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && (
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 4,
                background: item.badge === 'Admin' ? 'rgba(239,68,68,0.2)' : 'rgba(14,165,233,0.2)',
                color: item.badge === 'Admin' ? '#F87171' : '#38BDF8',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <NavLink to="/" className="sidebar__link sidebar__link--back">
          ← Back to Event
        </NavLink>
      </div>
    </aside>
  );
};
