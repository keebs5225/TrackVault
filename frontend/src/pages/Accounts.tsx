// frontend/src/pages/Accounts.tsx
import React, { useState, FormEvent, useMemo } from 'react'
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

/* ---------- sorting ------------ */
type SortKey =
  | 'balance_desc'
  | 'balance_asc'
  | 'name_az'
  | 'name_za'
  | 'type_az'
  | 'type_checking'
  | 'type_savings'
  | 'type_credit'
  | 'type_cash'

const SORTS: Record<SortKey, (a: AccountRead, b: AccountRead) => number> = {
  balance_desc: (a, b) => b.balance - a.balance,
  balance_asc:  (a, b) => a.balance - b.balance,
  name_az:      (a, b) => a.name.localeCompare(b.name),
  name_za:      (a, b) => b.name.localeCompare(a.name),
  type_az:      (a, b) => a.account_type.localeCompare(b.account_type),
  type_checking: (a, b) =>
    (a.account_type === 'checking' ? -1 : 0) -
    (b.account_type === 'checking' ? -1 : 0),
  type_savings: (a, b) =>
    (a.account_type === 'savings' ? -1 : 0) -
    (b.account_type === 'savings' ? -1 : 0),
  type_credit: (a, b) =>
    (a.account_type === 'credit' ? -1 : 0) -
    (b.account_type === 'credit' ? -1 : 0),
  type_cash: (a, b) =>
    (a.account_type === 'cash' ? -1 : 0) -
    (b.account_type === 'cash' ? -1 : 0),
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

  // ── Mutations ─────────────────────────────────────────
  const createMut = useMutation<AccountRead, Error, AccountCreate>({
    mutationFn: createAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] })
      setShowForm(false)
      setNewName('')
      setNewType('checking')
      setNewBalance('')
    },
  })

  const updateMut = useMutation<AccountRead, Error, { id: number; data: AccountUpdate }>({
    mutationFn: ({ id, data }) => updateAccount(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
    onError: err => console.error('Update failed:', err),
  })

  const deleteMut = useMutation<void, Error, number>({
    mutationFn: deleteAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  })

  // ── UI state ─────────────────────────────────────────
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<AccountCreate['account_type']>('checking')
  const [newBalance, setNewBalance] = useState('')   // string now!

  const [editing, setEditing] = useState<Record<number, boolean>>({})
  const [editForm, setEditForm] = useState<Record<number, AccountUpdate>>({})

  const [sortBy, setSortBy] = useState<SortKey>('balance_desc')

  // ── Hooks before any early returns ───────────────────
  const sortedAccounts = useMemo(
    () => [...accounts].sort(SORTS[sortBy]),
    [accounts, sortBy]
  )
  const totalBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + a.balance, 0).toFixed(2),
    [accounts]
  )

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

  return (
    <section className="accounts-page">
      <h1>Your Accounts</h1>

      <div className="header-row">
        <button
          className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => setShowForm(f => !f)}
        >
          {showForm ? 'Close Form' : '+ New Account'}
        </button>

        <select
          className="tv-select sort-select"
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortKey)}
        >
          <optgroup label="Title">
            <option value="name_az">Title (A→Z)</option>
            <option value="name_za">Title (Z→A)</option>
          </optgroup>
          <optgroup label="Type">
            <option value="type_checking">Checking</option>
            <option value="type_savings">Savings</option>
            <option value="type_credit">Credit</option>
            <option value="type_cash">Cash</option>
          </optgroup>
          <optgroup label="Balance">
            <option value="balance_desc">Balance (Highest)</option>
            <option value="balance_asc">Balance (Lowest)</option>
          </optgroup>
        </select>
      </div>

      <p className="summary">
        Total Accounts: {accounts.length} | Total Balance: ${totalBalance}
      </p>

      {showForm && (
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            // parse balance or default to 0
            const bal = parseFloat(newBalance)
            createMut.mutate({
              name: newName,
              account_type: newType,
              balance: isNaN(bal) ? 0 : bal,
              currency: 'USD',
              is_active: true,
            })
          }}
          className="card tv-form-card tv-form"
        >
          <label className="tv-field">
            <span className="tv-label">Title</span>
            <input
              className="tv-input"
              placeholder="Account name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
            />
          </label>

          <label className="tv-field">
            <span className="tv-label">Type of Account</span>
            <select
              className="tv-select"
              value={newType}
              onChange={e => setNewType(e.target.value as AccountCreate['account_type'])}
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
              step="1"
              placeholder="$0.00"
              value={newBalance}
              onChange={e => setNewBalance(e.target.value)}
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
        {sortedAccounts.map(a => {
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
            <div key={a.account_id} className={`account-card ${isEdit ? 'is-editing' : ''}`}>
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
                          [a.account_id]: { ...form, account_type: e.target.value as AccountUpdate['account_type'] },
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
                      step="1"
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
                        onClick={() => setEditing(e => ({ ...e, [a.account_id]: false }))}
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2>{a.name}</h2>
                  <p>
                    <strong>Type:</strong> {capitalize(a.account_type)}
                  </p>
                  <p>
                    <strong>Balance:</strong> ${a.balance.toFixed(2)} {a.currency}
                  </p>

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
