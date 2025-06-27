// frontend/src/pages/Home.tsx
import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  const token = localStorage.getItem('access_token')

  return (
    <section className="home-page">
      <h1>Welcome to TrackVault</h1>

      {token ? (
        <>
          <p>You’re already logged in!</p>
          <Link to="/profile">Go to Profile</Link>
        </>
      ) : (
        <>
          <p>Please log in or sign up to continue.</p>
          <div className="navbar-links">
            <Link to="/login">Log In</Link>
            <Link to="/signup">Sign Up</Link>
          </div>
        </>
      )}
    </section>
  )
}
