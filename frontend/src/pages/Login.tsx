// frontend/src/pages/Login.tsx
import React, { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import API from '../services/api'
import { useNavigate, useLocation } from 'react-router-dom'
import Spinner from '../components/Spinner'
import '../styles/global.css'
import '../styles/login.css'

export default function Login() {
  /* ── Router hooks ─────────────────────────────────── */
  const navigate = useNavigate()
  const location = useLocation()

  /* ── Flash & form state ───────────────────────────── */
  const [flash, setFlash] = useState<string | null>(null)
  const [form, setForm] = useState<{ username: string; password: string }>({
    username: '',
    password: '',
  })

  /* ── Load flash from nav state ─────────────────────── */
  useEffect(() => {
    const state = location.state as { flash?: string }
    if (state?.flash) {
      setFlash(state.flash)
      window.history.replaceState({}, '')
    }
  }, [location.state])

  /* ── Login mutation ────────────────────────────────── */
  const loginMutation = useMutation<any, AxiosError<{ detail?: string }>, void>({
    mutationFn: () =>
      API.post(
        '/auth/token',
        new URLSearchParams({
          username: form.username,
          password: form.password,
        })
      ),
    onSuccess: res => {
      localStorage.setItem('access_token', res.data.access_token)
      navigate('/dashboard')
    },
    onError: err => {
      const msg =
        err.response?.data.detail ??
        JSON.stringify(err.response?.data) ??
        err.message
      setFlash(msg)
    },
  })
  const { mutate, status } = loginMutation

  /* ── Form input handler ───────────────────────────── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  /* ── Form submit handler ──────────────────────────── */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFlash(null)
    mutate()
  }

  /* ── Render login form ────────────────────────────── */
  return (
    <form onSubmit={handleSubmit} className="profile-form">
      <h2>Log In</h2>
      {flash && <div className="flash-message">{flash}</div>}

      <label>
        Email
        <input
          name="username"
          type="email"
          autoComplete="username"
          placeholder="you@example.com"
          value={form.username}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange}
          required
        />
      </label>

      <button type="submit" disabled={status === 'pending'}>
        {status === 'pending' ? <Spinner /> : 'Log In'}
      </button>
    </form>
  )
}
