// frontend/src/pages/Login.tsx
import React, { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { AxiosResponse } from 'axios'
import API from '../services/api'
import { useNavigate, useLocation } from 'react-router-dom'
import Spinner from '../components/Spinner'
import '../styles/global.css';


interface LoginForm {
  username: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [flash, setFlash] = useState<string | null>(null)
  const [form, setForm] = useState<LoginForm>({ username: '', password: '' })

  // show & clear any flash message coming from Signup
  useEffect(() => {
    const state = location.state as { flash?: string }
    if (state?.flash) {
      setFlash(state.flash)
      // Clear so it doesn’t reappear
      window.history.replaceState({}, '')
    }
  }, [location.state])

  const loginMutation = useMutation<AxiosResponse<any>, any, LoginForm>({
    mutationFn: creds =>
      API.post('/auth/token', new URLSearchParams({
        username: creds.username,
        password: creds.password
      })),
    onSuccess: res => {
      localStorage.setItem('access_token', res.data.access_token)
      navigate('/dashboard')
    },
    onError: (err: any) => {
      alert(err.response?.data || 'Login failed')
    },
  })

  const { mutate, status } = loginMutation

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate(form)
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Log In</h2>
      {flash && <div style={{ color: 'crimson', marginBottom: '1rem' }}>{flash}</div>}

      <input
        name="username"
        placeholder="Email"
        value={form.username}
        onChange={handleChange}
        required
      />

      <input
        name="password"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        required
      />

      <button type="submit" disabled={status === 'pending'}>
        {status === 'pending' ? <Spinner /> : 'Log In'}
      </button>
    </form>
  )
}
