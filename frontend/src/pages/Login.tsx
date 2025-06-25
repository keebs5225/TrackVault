// frontend/src/pages/Login.tsx
import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { AxiosResponse } from 'axios'
import API from '../services/api'
import { useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'

interface LoginForm {
  username: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState<LoginForm>({ username: '', password: '' })

  const loginMutation = useMutation<AxiosResponse<any>, any, LoginForm>({
    mutationFn: creds =>
      API.post('/auth/token', new URLSearchParams({
        username: creds.username,
        password: creds.password
      })),
    onSuccess: res => {
      localStorage.setItem('access_token', res.data.access_token)
      navigate('/profile')
    },
    onError: (err: any) => alert(err.response?.data || 'Login failed'),
  })

  const { mutate, status } = loginMutation

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto p-4">
      <h2 className="text-xl font-bold">Log In</h2>

      <input
        name="username"
        placeholder="Email"
        value={form.username}
        onChange={handleChange}
        className="border p-2 w-full"
        required
      />

      <input
        name="password"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        className="border p-2 w-full"
        required
      />

      <button
        type="submit"
        disabled={status === 'pending'}
        className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50 flex items-center justify-center"
      >
        {status === 'pending' ? <Spinner /> : 'Log In'}
      </button>
    </form>
  )
}
