import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Signup from './pages/Signup'
import Login from './pages/Login'
import Profile from './pages/Profile'

function App() {
  const token = localStorage.getItem('access_token')

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/profile"
        element={token ? <Profile /> : <Navigate to="/login" replace />}
      />
    </Routes>
  )
}

export default App