// frontend/src/components/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/global.css'


const items = [
  { to: '/dashboard', label: 'DashBoard', icon: '🏠' },
  { to: '/profile',   label: 'Profile',   icon: '👤' },
  { to: '/accounts',  label: 'Accounts',  icon: '🏦' },
  { to: '/transactions', label: 'Transactions', icon: '💳' },
  { to: '/budgets',   label: 'Budgets',   icon: '📊' },
];

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <ul className="sidebar-list">
        {items.map(item => (
          <li key={item.to} className="sidebar-list-item">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `nav-link${isActive ? ' active' : ''}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
