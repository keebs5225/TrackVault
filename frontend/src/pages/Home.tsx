import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  const token = localStorage.getItem('access_token')

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome to TrackVault</h1>

      {token ? (
        <>
          <p className="mb-2">You’re already logged in!</p>
          <Link
            to="/profile"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Go to Profile
          </Link>
        </>
      ) : (
        <>
          <p className="mb-2">Please log in or sign up to continue.</p>
          <div className="space-x-4">
            <Link
              to="/login"
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Sign Up
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
