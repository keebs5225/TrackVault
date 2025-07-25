// frontend/src/components/Layout.tsx
import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar  from './Topbar'
import '../styles/global.css'


export default function Layout() {
  // ── Layout wrapper ──────────────────────────────────────
  return (
    <div className="app-container">
      {/* ── Sidebar nav ────────────────────────────────────── */}
      <Sidebar />

      <div className="main-content">
        {/* ── Top navigation bar ────────────────────────────── */}
        <Topbar />

        <div className="main-body">
          {/* ── Render page content ─────────────────────────── */}
          <Outlet />
        </div>
      </div>
    </div>
  )
}
