import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/live', label: 'Live Tracking', icon: '📍' },
  { path: '/employees', label: 'Employees', icon: '👥' },
  { path: '/locations', label: 'Locations', icon: '🏢' },
  { path: '/assignments', label: 'Assignments', icon: '📅' },
  { path: '/reports', label: 'Shift Reports', icon: '📋' },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">📍</div>
        <div className="brand-info">
          <span className="brand-name">Distributor Tracker</span>
          <span className="brand-subtitle">V2 Workforce GPS</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="v2-badge">V2 Client Demo</div>
      </div>
    </aside>
  );
};
