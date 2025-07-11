// frontend/src/pages/Profile.tsx
import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import type { AxiosError, AxiosResponse } from 'axios'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import API from '../services/api'
import Spinner from '../components/Spinner'
import '../styles/global.css'

interface User {
  user_id: number
  name: string
  email: string
}

type UpdatePayload = { 
  name: string
  email: string
  current_password?: string 
  new_password?: string
}

export default function Profile() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<UpdatePayload>({ name: '', email: '' })
  const [error, setError] = useState<string | null>(null)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

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

  const handleLogout = useCallback(() => {
    localStorage.removeItem('access_token')
    navigate('/login', { replace: true })
  }, [navigate])

  const updateMutation: UseMutationResult<User, AxiosError, UpdatePayload> =
    useMutation<User, AxiosError, UpdatePayload>({
      mutationFn: data =>
        API.patch<User>('/users/me', data).then(res => res.data),
      onSuccess: updated => {
        setUser(updated)
        setEditing(false)
        setForm({ name: updated.name, email: updated.email })
        setError(null)
        qc.invalidateQueries({ queryKey: ['user'] })
      },
      onError: err => {
        setError(
          typeof err.response?.data === 'string'
            ? err.response.data
            : 'Update failed'
        )
      },
    })

  const deleteMutation: UseMutationResult<void, AxiosError, void> =
    useMutation<void, AxiosError, void>({
      mutationFn: () => API.delete<void>('/users/me').then(() => {}),
      onSuccess: () => {
        localStorage.removeItem('access_token')
        navigate('/', { replace: true })
      },
      onError: err => {
        alert(
          typeof err.response?.data === 'string'
            ? err.response.data
            : 'Could not delete account'
        )
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
          onSubmit={e => {
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
              onChange={e =>
                setForm(f => ({ ...f, name: e.target.value }))
              }
              required
            />
          </label>

          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={e =>
                setForm(f => ({ ...f, email: e.target.value }))
              }
              required
            />
          </label>

          <label>
            Current Password
            <div className="password-wrapper">
              <input
                name="current_password"
                type={showCurrent ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.current_password || ''}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    current_password: e.target.value,
                  }))
                }
                placeholder="••••••••"
              />
              <button
                type="button"
                className="toggle-eye"
                onClick={() => setShowCurrent(s => !s)}
                aria-label="Show or hide current password"
              >
                {showCurrent ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </label>

          <label>
            New Password
            <div className="password-wrapper">
              <input
                name="new_password"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.new_password || ''}
                onChange={e =>
                  setForm(f => ({ ...f, new_password: e.target.value }))
                }
                placeholder="••••••••"
              />
              <button
                type="button"
                className="toggle-eye"
                onClick={() => setShowNew(s => !s)}
                aria-label="Show or hide new password"
              >
                {showNew ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </label>

          <div className="profile-actions">
            <button
              type="submit"
              disabled={updateMutation.status === 'pending'}
            >
              {updateMutation.status === 'pending' ? <Spinner /> : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                if (user)
                  setForm({ name: user.name, email: user.email })
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
            <button onClick={() => setEditing(true)}>
              Edit Info
            </button>
            <button onClick={handleLogout}>Log Out</button>
            <button
              className="btn-danger"
              onClick={() => {
                if (
                  window.confirm(
                    'Delete account? This is irreversible.'
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
