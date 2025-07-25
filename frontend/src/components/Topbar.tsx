// frontend/src/components/Topbar.tsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import API from '../services/api'
import LightDarkToggle from './LightDarkToggle'
import '../styles/global.css'


interface User {
  user_id: number
  name: string
  email: string
}

export default function Topbar() {
  // ── Navigation & state hooks ───────────────────────────
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  // ── Fetch current user ──────────────────────────────────
  const { data: user } = useQuery<User, AxiosError>({
    queryKey: ['user'],
    queryFn: () =>
      API.get<User>('/users/me').then(res => res.data),
    retry: false,
  })

  // ── Search submit handler ───────────────────────────────
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?query=${encodeURIComponent(query)}`)
    }
  }

  // ── Render topbar ───────────────────────────────────────
  return (
    <header className="topbar">
      {/* ── Logo link ─────────────────────────────────────── */}
      <Link to="/dashboard" className="topbar-logo">
        TrackVault
      </Link>
      
      {/* ── Theme toggle ──────────────────────────────────── */}
      <LightDarkToggle />
    </header>
  )
}