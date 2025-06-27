// frontend/src/App.tsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Signup from './pages/Signup'
import Login from './pages/Login'
import Profile from './pages/Profile'
import './styles/global.css'

function App() {
  const token = localStorage.getItem('access_token')

  return (
    <Routes>
      {/* 1. Home page */}
      <Route path="/" element={<Home />} />

      {/* 2. Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* 3. Protected */}
      <Route
        path="/profile"
        element={
          token
            ? <Profile />
            : <Navigate to="/login" replace />
        }
      />

      {/* 4. Catch all back to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
