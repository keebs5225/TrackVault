// frontend/src/pages/Profile.tsx
import React, { useEffect, useState } from 'react'
import API from '../services/api'
import { useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'

interface User {
  user_id: number
  name: string
  email: string
}

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/users/me')
      .then(res => {
        setUser(res.data)
        setLoading(false)
      })
      .catch(() => {
        localStorage.removeItem('access_token')
        navigate('/login')
      })
  }, [navigate])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Your Profile</h2>
      <p><strong>Name:</strong> {user?.name}</p>
      <p><strong>Email:</strong> {user?.email}</p>
    </div>
  )
}
