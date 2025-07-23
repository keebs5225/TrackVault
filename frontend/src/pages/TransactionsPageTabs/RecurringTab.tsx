// frontend/src/pages/TransactionsPageTabs/RecurringTab.tsx

import React, { useState, FormEvent, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Spinner from '../../components/Spinner'
import { fetchAccounts } from '../../services/accounts'
import { fetchRecurring, createRecurring, updateRecurring, deleteRecurring } from '../../services/recurring'
import type { AccountRead, RecurringRead, RecurringCreate, RecurringUpdate } from '../../types'
import '../../styles/global.css'
import '../../styles/recurring.css'

type Dir = 'deposit' | 'withdrawal'
type Freq = 'daily' | 'weekly' | 'monthly' | 'yearly'

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/* -------- helpers -------- */
const acctName = (acs: AccountRead[], id: number) =>
  acs.find(a => a.account_id === id)?.name ?? '—'

const actionWord = (dir: Dir) => (dir === 'deposit' ? 'Deposit' : 'Withdrawal')

const addFreq = (isoDate: string, freq: Freq): string => {
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return isoDate

  switch (freq) {
    case 'daily':
      d.setDate(d.getDate() + 1)
      break
    case 'weekly':
      d.setDate(d.getDate() + 7)
      break
    case 'monthly': {
      const m = d.getMonth()
      d.setMonth(m + 1)
      break
    }
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1)
      break
  }
  return d.toISOString().split('T')[0]
}

export default function RecurringTab(): JSX.Element {
  const qc = useQueryClient()

  /* Lookups */
  const { data: accounts = [] } = useQuery<AccountRead[], Error>({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  })

  /* Fetch recurring */
  const {
    data: recs = [],
    isLoading,
    isError,
    error,
  } = useQuery<RecurringRead[], Error>({
    queryKey: ['recurring'],
    queryFn: fetchRecurring,
  })

  /* Mutations */
  const createMut = useMutation<RecurringRead, Error, RecurringCreate>({
    mutationFn: createRecurring,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring'] })
      qc.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
  const updateMut = useMutation<
    RecurringRead,
    Error,
    { id: number; data: RecurringUpdate }
  >({
    mutationFn: ({ id, data }) => updateRecurring(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring'] })
      qc.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
  const deleteMut = useMutation<void, Error, number>({
    mutationFn: deleteRecurring,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring'] })
      qc.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  /* UI state */
  const [showForm, setShowForm] = useState(false)

  // today's date once
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], [])

  // create form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [acct, setAcct] = useState<number | ''>('')
  const [amount, setAmount] = useState('')
  const [direction, setDirection] = useState<Dir>('deposit')
  const [frequency, setFrequency] = useState<Freq>('monthly')
  const [startDate, setStartDate] = useState(todayISO)   // <-- default to today
  const [endDate, setEndDate] = useState('')

  // computed nextRun (no manual field now)
  const nextRun = useMemo(() => {
    if (!startDate) return ''
    return addFreq(startDate, frequency)
  }, [startDate, frequency])

  // edit state
  const [editing, setEditing] = useState<Record<number, boolean>>({})
  const [editForm, setEditForm] = useState<
    Record<
      number,
      RecurringUpdate & {
        title?: string
        description?: string
        account_id?: number
        direction?: Dir
        start_date?: string
        next_run_date?: string
      }
    >
  >({})

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!title || !acct || !amount || !startDate) return

    createMut.mutate({
      title,
      description: description || undefined,
      account_id: +acct,
      amount: parseFloat(amount),
      direction,
      frequency,
      start_date: startDate,
      next_run_date: nextRun, // auto
      end_date: endDate || undefined,
    })

    // reset
    setTitle('')
    setDescription('')
    setAcct('')
    setAmount('')
    setDirection('deposit')
    setFrequency('monthly')
    setStartDate(todayISO)  // <-- reset to today again
    setEndDate('')
    setShowForm(false)
  }

  if (isLoading) return <Spinner />
  if (isError) return <p className="error-message">{error?.message}</p>

  /* Summary */
  const showing = recs.length
  const total = recs.length

  return (
    <section className="recurring-page">
      <h1>Recurring Transactions</h1>

      <button
        className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`}
        onClick={() => setShowForm(f => !f)}
      >
        {showForm ? 'Close Form' : '+ New Recurring'}
      </button>

      <p className="summary">Showing {showing} of {total}</p>

      {showForm && (
        <form onSubmit={handleAdd} className="card tv-form-card tv-form">
          <label className="tv-field">
            <span className="tv-label">Title</span>
            <input
              className="tv-input"
              placeholder="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </label>

          <label className="tv-field">
            <span className="tv-label">Description (optional)</span>
            <input
              className="tv-input"
              placeholder="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </label>

          <label className="tv-field">
            <span className="tv-label">Account</span>
            <select
              className="tv-select"
              value={acct}
              onChange={e => setAcct(e.target.value ? +e.target.value : '')}
              required
            >
              <option value="">Select account</option>
              {accounts.map(a => (
                <option key={a.account_id} value={a.account_id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          <label className="tv-field">
            <span className="tv-label">Amount ($)</span>
            <input
              className="tv-input"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </label>

          <label className="tv-field">
            <span className="tv-label">Action</span>
            <select
              className="tv-select"
              value={direction}
              onChange={e =>
                setDirection(e.target.value as 'deposit' | 'withdrawal')
              }
            >
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
            </select>
          </label>

          <label className="tv-field">
            <span className="tv-label">Frequency</span>
            <select
              className="tv-select"
              value={frequency}
              onChange={e => setFrequency(e.target.value as Freq)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>

          <label className="tv-field">
            <span className="tv-label">Start Date</span>
            <input
              className="tv-input"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required
            />
          </label>

          {/* Read-only computed next date */}
          <label className="tv-field">
            <span className="tv-label">Next Transaction (Auto)</span>
            <input className="tv-input" type="date" value={nextRun} readOnly />
          </label>

          <div className="tv-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMut.status === 'pending'}
            >
              {createMut.status === 'pending' ? <Spinner /> : 'Add Recurring Transaction'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="transactions-grid">
        {recs.map(r => {
          const isEdit = !!editing[r.recurring_id]

          const base: RecurringUpdate & {
            title?: string
            description?: string
            account_id?: number
            direction?: Dir
            start_date?: string
            next_run_date?: string
          } = {
            title: (r as any).title,
            description: (r as any).description,
            account_id: r.account_id,
            amount: r.amount,
            direction: r.direction,
            frequency: r.frequency,
            start_date: r.start_date,
            next_run_date: r.next_run_date,
            end_date: r.end_date || undefined,
          }

          const form = editForm[r.recurring_id] ?? base

          // compute next txn for display (trust DB value, fallback to calc)
          const displayNext =
            r.next_run_date ||
            addFreq(r.start_date.split('T')[0], r.frequency)

          return (
            <div key={r.recurring_id} className="transaction-card">
              {isEdit ? (
                <>
                  <label className="tv-field">
                    <span className="tv-label">Title</span>
                    <input
                      className="tv-input"
                      value={form.title || ''}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [r.recurring_id]: { ...form, title: e.target.value },
                        }))
                      }
                    />
                  </label>

                  <label className="tv-field">
                    <span className="tv-label">Description (optional)</span>
                    <input
                      className="tv-input"
                      value={form.description || ''}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [r.recurring_id]: {
                            ...form,
                            description: e.target.value,
                          },
                        }))
                      }
                    />
                  </label>

                  <label className="tv-field">
                    <span className="tv-label">Account</span>
                    <select
                      className="tv-select"
                      value={form.account_id}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [r.recurring_id]: {
                            ...form,
                            account_id: +e.target.value,
                          },
                        }))
                      }
                    >
                      {accounts.map(a => (
                        <option key={a.account_id} value={a.account_id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="tv-field">
                    <span className="tv-label">Amount ($)</span>
                    <input
                      className="tv-input"
                      type="number"
                      step="0.01"
                      value={form.amount ?? 0}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [r.recurring_id]: {
                            ...form,
                            amount: parseFloat(e.target.value),
                          },
                        }))
                      }
                    />
                  </label>

                  <label className="tv-field">
                    <span className="tv-label">Action</span>
                    <select
                      className="tv-select"
                      value={form.direction}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [r.recurring_id]: {
                            ...form,
                            direction: e.target.value as Dir,
                          },
                        }))
                      }
                    >
                      <option value="deposit">Deposit</option>
                      <option value="withdrawal">Withdrawal</option>
                    </select>
                  </label>

                  <label className="tv-field">
                    <span className="tv-label">Frequency</span>
                    <select
                      className="tv-select"
                      value={form.frequency}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [r.recurring_id]: {
                            ...form,
                            frequency: e.target.value as Freq,
                            next_run_date: form.start_date
                              ? addFreq(form.start_date, e.target.value as Freq)
                              : form.next_run_date,
                          },
                        }))
                      }
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </label>

                  <label className="tv-field">
                    <span className="tv-label">Start Date</span>
                    <input
                      className="tv-input"
                      type="date"
                      value={form.start_date || ''}
                      onChange={e => {
                        const sd = e.target.value
                        setEditForm(f => ({
                          ...f,
                          [r.recurring_id]: {
                            ...form,
                            start_date: sd,
                            next_run_date: addFreq(sd, form.frequency as Freq),
                          },
                        }))
                      }}
                    />
                  </label>

                  <label className="tv-field">
                    <span className="tv-label">Next Transaction (Auto)</span>
                    <input
                      className="tv-input"
                      type="date"
                      value={form.next_run_date || ''}
                      readOnly
                    />
                  </label>

                  <div className="tv-actions--split">
                    <div className="left">
                      <button
                        className="btn btn-danger"
                        onClick={() => deleteMut.mutate(r.recurring_id)}
                        disabled={deleteMut.status === 'pending'}
                      >
                        {deleteMut.status === 'pending' ? '…' : 'Delete'}
                      </button>
                    </div>
                    <div className="right">
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          updateMut.mutate({ id: r.recurring_id, data: form })
                          setEditing(e => ({ ...e, [r.recurring_id]: false }))
                        }}
                        disabled={updateMut.status === 'pending'}
                      >
                        {updateMut.status === 'pending' ? '…' : 'Save'}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() =>
                          setEditing(e => ({ ...e, [r.recurring_id]: false }))
                        }
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    <strong>{capitalize((r as any).title || 'Untitled')}</strong> —{' '}
                    {new Date(r.start_date).toLocaleDateString()} —{' '}
                    <em>{actionWord(r.direction)}</em>
                  </p>
                  {(r as any).description && (
                    <p><strong>Description:</strong> {(r as any).description}</p>
                  )}
                  <p><strong>Account:</strong> {acctName(accounts, r.account_id)}</p>
                  <p><strong>Amount:</strong> ${r.amount.toFixed(2)}</p>
                  <p><strong>Frequency:</strong> {capitalize(r.frequency)}</p>
                  <p><strong>Next Transaction:</strong> {new Date(displayNext).toLocaleDateString()}</p>

                  <div className="tv-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setEditForm(f => ({ ...f, [r.recurring_id]: base }))
                        setEditing(e => ({ ...e, [r.recurring_id]: true }))
                      }}
                    >
                      Edit
                    </button>
                    {/* Delete removed from view mode */}
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
