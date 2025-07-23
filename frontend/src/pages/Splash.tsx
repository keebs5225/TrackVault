// frontend/src/pages/Splash.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/global.css';
import '../styles/splash.css';


export default function Splash() {
  return (
    <section className="splash-page">
      <h1>Welcome to TrackVault</h1>
      <h2>The modern way to manage your money</h2>
      <p>Organize your finances in one clear view and achieve your goals quicker.</p>
      <div>
        <Link to="/signup">Get Started</Link>
      </div>
      <nav className="navbar-links">
        <Link to="/login">Sign In</Link>
        <Link to="/signup">Sign Up</Link>
      </nav>
    </section>
  );
}