// frontend/src/pages/Signup.tsx
import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { AxiosResponse } from 'axios'
import API from '../services/api'
import { useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import '../styles/global.css'
import '../styles/signup.css'

interface SignupForm {
  name: string
  email: string
  password: string
}

export default function Signup() {
  const navigate = useNavigate()

  /* ── Form state ───────────────────────────────────── */
  const [form, setForm] = useState<SignupForm>({
    name: '',
    email: '',
    password: '',
  })

  /* ── Signup mutation ───────────────────────────────── */
  const signupMutation = useMutation<AxiosResponse<any>, any, SignupForm>({
    mutationFn: newUser => API.post('/auth/signup', newUser),
    onSuccess: () => navigate('/login'),
    onError: err => {
      if (err.response?.status === 400) {
        // Email already registered
        navigate('/login', {
          state: { flash: 'Already have an account under this email.' },
        })
      } else {
        alert(err.response?.data || 'Signup failed')
      }
    },
  })
  const { mutate, status } = signupMutation

  /* ── Handle input changes ──────────────────────────── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  /* ── Handle form submit ────────────────────────────── */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate(form)
  }

  /* ── Signup form UI ────────────────────────────────── */
  return (
    <form onSubmit={handleSubmit} className="signup-form">
      <h2>Sign Up</h2>

      <input
        name="name"
        placeholder="Name"
        value={form.name}
        onChange={handleChange}
        required
      />

      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
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
        {status === 'pending' ? <Spinner /> : 'Sign Up'}
      </button>
    </form>
  )
}
