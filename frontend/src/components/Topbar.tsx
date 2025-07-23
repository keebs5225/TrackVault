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
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  // -- useQuery in object form, with generics --
  const { data: user } = useQuery<User, AxiosError>({
    queryKey: ['user'],
    queryFn: () =>
      API.get<User>('/users/me').then(res => res.data),
    retry: false,
  })

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?query=${encodeURIComponent(query)}`)
    }
  }

  return (
    <header className="topbar">
      {/* ─── Logo / Home Link ─────────────────────────── */}
      <Link to="/dashboard" className="topbar-logo">
        TrackVault
      </Link>

      {/* ─── Global Search ────────────────────────────── */}
      <form className="topbar-search-form" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          className="topbar-search-input"
          placeholder="Search..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Global search"
        />
      </form>

      <LightDarkToggle />

    </header>
  )
}
