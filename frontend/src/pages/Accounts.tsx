// frontend/src/pages/Accounts.tsx
import React, { useState, FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Spinner from '../components/Spinner'
import {
  fetchAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from '../services/accounts'
import type { AccountRead, AccountCreate, AccountUpdate } from '../types'
import '../styles/global.css'
import '../styles/accounts.css'

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export default function AccountsPage(): JSX.Element {
  const qc = useQueryClient()

  // ── Fetch accounts ───────────────────────────────────
  const {
    data: accounts = [],
    isLoading,
    isError,
    error,
  } = useQuery<AccountRead[], Error>({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  })

  // ── Mutations (modeled after Transactions) ───────────
  const createMut = useMutation<AccountRead, Error, AccountCreate>({
    mutationFn: createAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] })
      setShowForm(false)
      setNewForm({
        name: '',
        account_type: 'checking',
        balance: 0,
        currency: 'USD',
        is_active: true,
      })
    },
  })

  const updateMut = useMutation<AccountRead, Error, { id: number; data: AccountUpdate }>({
    mutationFn: ({ id, data }) => updateAccount(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] })
    },
    onError: err => {
      console.error('Update failed:', err)
    },
  })

  const deleteMut = useMutation<void, Error, number>({
    mutationFn: deleteAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  // ── UI state ─────────────────────────────────────────
  const [showForm, setShowForm] = useState(false)
  const [newForm, setNewForm] = useState<AccountCreate>({
    name: '',
    account_type: 'checking',
    balance: 0,
    currency: 'USD',
    is_active: true,
  })

  const [editing, setEditing] = useState<Record<number, boolean>>({})
  const [editForm, setEditForm] = useState<Record<number, AccountUpdate>>({})

  if (isLoading) {
    return (
      <section className="accounts-page">
        <Spinner />
      </section>
    )
  }

  if (isError) {
    return (
      <section className="accounts-page">
        <h1>Your Accounts</h1>
        <p className="error-message">{error.message}</p>
      </section>
    )
  }

  // ── Summary ─────────────────────────────────────────
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0).toFixed(2)

  return (
    <section className="accounts-page">
      <h1>Your Accounts</h1>

      <button
        className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`}
        onClick={() => setShowForm(f => !f)}
      >
        {showForm ? 'Close Form' : '+ New Account'}
      </button>

      <p className="summary">
        Total Accounts: {accounts.length} | Total Balance: ${totalBalance}
      </p>

      {showForm && (
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            createMut.mutate(newForm)
          }}
          className="card tv-form-card tv-form"
        >
          <label className="tv-field">
            <span className="tv-label">Title</span>
            <input
              className="tv-input"
              placeholder="Account name"
              value={newForm.name}
              onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </label>

          <label className="tv-field">
            <span className="tv-label">Type of Account</span>
            <select
              className="tv-select"
              value={newForm.account_type}
              onChange={e =>
                setNewForm(f => ({
                  ...f,
                  account_type: e.target.value as AccountCreate['account_type'],
                }))
              }
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="credit">Credit</option>
              <option value="cash">Cash</option>
            </select>
          </label>

          <label className="tv-field">
            <span className="tv-label">Balance</span>
            <input
              className="tv-input"
              type="number"
              step="0.01"
              value={newForm.balance}
              onChange={e => setNewForm(f => ({ ...f, balance: +e.target.value }))}
            />
          </label>

          <div className="tv-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMut.status === 'pending'}
            >
              {createMut.status === 'pending' ? <Spinner /> : 'Create Account'}
            </button>
          </div>
        </form>
      )}

      <div className="accounts-grid">
        {accounts.map(a => {
          const isEdit = !!editing[a.account_id]
          const base: AccountUpdate = {
            name: a.name,
            account_type: a.account_type,
            balance: a.balance,
            currency: a.currency,
            is_active: a.is_active,
          }
          const form = editForm[a.account_id] ?? base

          return (
            <div
              key={a.account_id}
              className={`account-card ${isEdit ? 'is-editing' : ''}`}
            >
              {isEdit ? (
                <>
                  <label className="tv-field">
                    <span className="tv-label">Title</span>
                    <input
                      className="tv-input"
                      value={form.name}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [a.account_id]: { ...form, name: e.target.value },
                        }))
                      }
                    />
                  </label>

                  <label className="tv-field">
                    <span className="tv-label">Type of Account</span>
                    <select
                      className="tv-select"
                      value={form.account_type}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [a.account_id]: {
                            ...form,
                            account_type: e.target.value as AccountUpdate['account_type'],
                          },
                        }))
                      }
                    >
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                      <option value="credit">Credit</option>
                      <option value="cash">Cash</option>
                    </select>
                  </label>

                  <label className="tv-field">
                    <span className="tv-label">Balance</span>
                    <input
                      className="tv-input"
                      type="number"
                      step="0.01"
                      value={form.balance}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [a.account_id]: { ...form, balance: +e.target.value },
                        }))
                      }
                    />
                  </label>

                  <div className="tv-actions--split">
                    <div className="left">
                      <button
                        className="btn btn-danger"
                        onClick={() => deleteMut.mutate(a.account_id)}
                        disabled={deleteMut.status === 'pending'}
                      >
                        {deleteMut.status === 'pending' ? '…' : 'Delete'}
                      </button>
                    </div>
                    <div className="right">
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          updateMut.mutate({ id: a.account_id, data: form })
                          setEditing(e => ({ ...e, [a.account_id]: false }))
                        }}
                        disabled={updateMut.status === 'pending'}
                      >
                        {updateMut.status === 'pending' ? '…' : 'Save'}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() =>
                          setEditing(e => ({ ...e, [a.account_id]: false }))
                        }
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2>{a.name}</h2>
                  <p><strong>Type:</strong> {capitalize(a.account_type)}</p>
                  <p><strong>Balance:</strong> ${a.balance.toFixed(2)} {a.currency}</p>

                  <div className="tv-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setEditForm(f => ({ ...f, [a.account_id]: base }))
                        setEditing(e => ({ ...e, [a.account_id]: true }))
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}