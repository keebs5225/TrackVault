// frontend/src/pages/Profile.tsx
import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import type { AxiosError, AxiosResponse } from 'axios'
import API from '../services/api'
import Spinner from '../components/Spinner'
import '../styles/global.css'

interface User {
  user_id: number
  name: string
  email: string
  password: string
}

type UpdatePayload = { name: string; email: string }

export default function Profile() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<UpdatePayload>({ name: '', email: '' })
  const [error, setError] = useState<string | null>(null)

  // 0) fetch current user
  useEffect(() => {
    API.get<User>('/users/me')
      .then((res: AxiosResponse<User>) => {
        setUser(res.data)
        setForm({ name: res.data.name, email: res.data.email })
        setLoading(false)
      })
      .catch(() => {
        localStorage.removeItem('access_token')
        navigate('/login', { replace: true })
      })
  }, [navigate])

  // 1) logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem('access_token')
    navigate('/login', { replace: true })
  }, [navigate])

  // 2) update mutation
  const updateMutation: UseMutationResult<User, AxiosError, UpdatePayload> =
    useMutation<User, AxiosError, UpdatePayload>({
      mutationFn: (data) =>
        API.put<User>('/users/me', data).then((res) => res.data),
      onSuccess: (updated) => {
        setUser(updated)
        setEditing(false)
        qc.invalidateQueries({ queryKey: ['user'] })
      },
      onError: (err) => {
        setError(typeof err.response?.data === 'string' ? err.response.data : 'Update failed')
      },
    })

  // 3) delete mutation
  const deleteMutation: UseMutationResult<void, AxiosError, void> =
    useMutation<void, AxiosError, void>({
      mutationFn: () => API.delete<void>('/users/me').then(() => {}),
      onSuccess: () => {
        localStorage.removeItem('access_token')
        navigate('/', { replace: true })
      },
      onError: (err) => {
        const msg = typeof err.response?.data === 'string' ? err.response.data : 'Could not delete account'
        alert(msg)
      },
    })

  if (loading) {
    return (
      <div className="center">
        <Spinner />
      </div>
    )
  }

  return (
    <section className="profile-page">
      <h2>Your Profile</h2>

      {editing ? (
        <form
          className="profile-form"
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            updateMutation.mutate(form)
          }}
        >
          {error && <p className="profile-error">{error}</p>}

          <label>
            Name
            <input
              name="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </label>

          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </label>

          <div className="profile-actions">
            <button type="submit" disabled={updateMutation.status === 'pending'}>
              {updateMutation.status === 'pending' ? <Spinner /> : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                if (user) setForm({ name: user.name, email: user.email })
                setError(null)
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-form">
          <p>
            <strong>Name:</strong> {user?.name}
          </p>
          <p>
            <strong>Email:</strong> {user?.email}
          </p>

          <div className="profile-actions">
            <button onClick={() => setEditing(true)}>Edit Info</button>
            <button onClick={handleLogout}>Log Out</button>
            <button
              className="btn-danger"
              onClick={() => {
                if (
                  window.confirm(
                    'Are you sure you want to delete your account? This is irreversible.'
                  )
                ) {
                  deleteMutation.mutate()
                }
              }}
            >
              Delete Account
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
