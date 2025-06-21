// src/pages/Signup.tsx

import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { AxiosResponse } from 'axios'
import API from '../services/api'
import { useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'

interface SignupForm {
  name: string
  email: string
  password: string
}

function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState<SignupForm>({ name: '', email: '', password: '' })

  // Mutation returns status instead of isLoading in v5
  const signupMutation = useMutation<
    AxiosResponse<any>,
    any,
    SignupForm
  >({
    mutationFn: newUser => API.post('/auth/signup', newUser),
    onSuccess: () => navigate('/login'),
    onError: (err: any) => alert(err.response?.data || 'Signup failed'),
  })

  const { mutate, status } = signupMutation

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto p-4">
      <h2 className="text-xl font-bold">Sign Up</h2>

      <input
        name="name"
        placeholder="Name"
        value={form.name}
        onChange={handleChange}
        className="border p-2 w-full"
        required
      />

      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
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

    <button type="submit" disabled={status === "pending"}>
      {status === "pending" ? <Spinner /> : "Sign Up"}
    </button>
    </form>
  )
}

export default Signup