// frontend/src/components/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/dashboard', label: 'Home', icon: '🏠' },
  { to: '/profile', label: 'Profile', icon: '👤' },
  { to: '/accounts',      label: 'Accounts',    icon: '🏦' },
  { to: '/transactions', label: 'Transactions', icon: '💳' },
  { to: '/budgets', label: 'Budgets', icon: '📊' },
  // { to: '/calculators', label: 'Calculators', icon: '📈' },
  // { to: '/recurring', label: 'Recurring', icon: '🔁' },
  // { to: '/goals', label: 'Goals', icon: '🎯' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
  { to: '/support', label: 'Help', icon: '❓' }
];

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map(item => (
          <li key={item.to} style={{ margin: '1rem 0' }}>
            <NavLink
              to={item.to}
              style={({ isActive }) => ({ color: isActive ? '#333' : '#555', fontWeight: isActive ? 'bold' : 'normal' })}
            >
              <span style={{ marginRight: '0.5rem' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}