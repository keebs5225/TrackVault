// frontend/src/pages/Splash.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/global.css';
import '../styles/splash.css';

export default function Splash() {
  return (
    <section className="splash-page">
      {/* ── Main headline ─────────────────────────────── */}
      <h1>Welcome to TrackVault</h1>
      <h2>The modern way to manage your money</h2>

      {/* ── Subheading ────────────────────────────────── */}
      <p>Organize your finances in one clear view and achieve your goals quicker.</p>

      {/* ── Primary call-to-action ───────────────────── */}
      <div>
        <Link to="/signup">Get Started</Link>
      </div>

      {/* ── Top-right navigation links ───────────────── */}
      <nav className="navbar-links">
        <Link to="/login">Sign In</Link>
        <Link to="/signup">Sign Up</Link>
      </nav>
    </section>
  );
}
