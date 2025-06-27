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
    return <div className="center"><Spinner /></div>
  }

  return (
    <section>
      <h2>Your Profile</h2>
      <p><strong>Name:</strong> {user?.name}</p>
      <p><strong>Email:</strong> {user?.email}</p>
    </section>
  )
}
