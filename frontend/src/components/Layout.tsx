// frontend/src/components/Layout.tsx
import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar  from './Topbar'
import '../styles/global.css'


export default function Layout() {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="main-body">
          {/* this is where your child routes will render */}
          <Outlet />
        </div>
      </div>
    </div>
  )
}
