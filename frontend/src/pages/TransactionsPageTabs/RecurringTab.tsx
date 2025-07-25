// frontend/src/pages/TransactionsPageTabs/RecurringTab.tsx
import React, { useState, FormEvent, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Spinner from '../../components/Spinner'
import { fetchAccounts } from '../../services/accounts'
import { fetchRecurring, createRecurring, updateRecurring, deleteRecurring } from '../../services/recurring'
import type { AccountRead, RecurringRead, RecurringCreate, RecurringUpdate } from '../../types'
import '../../styles/global.css'
import '../../styles/recurring.css'

// ── Types ─────────────────────────────────────────────
type Dir = 'deposit' | 'withdrawal'
type Freq = 'daily' | 'weekly' | 'monthly' | 'yearly'

// ── Helpers ───────────────────────────────────────────
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const acctName = (acs: AccountRead[], id: number) =>
  acs.find(a => a.account_id === id)?.name ?? '—'
const actionWord = (dir: Dir) => (dir === 'deposit' ? 'Deposit' : 'Withdrawal')

const addFreq = (isoDate: string, freq: Freq): string => {
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return isoDate
  switch (freq) {
    case 'daily':   d.setDate(d.getDate() + 1); break
    case 'weekly':  d.setDate(d.getDate() + 7); break
    case 'monthly': d.setMonth(d.getMonth() + 1); break
    case 'yearly':  d.setFullYear(d.getFullYear() + 1); break
  }
  return d.toISOString().split('T')[0]
}

// ── Sorting Keys ──────────────────────────────────────
type BaseSortKey =
  | 'start_desc'
  | 'start_asc'
  | 'next_desc'
  | 'next_asc'
  | 'amount_desc'
  | 'amount_asc'
  | 'title_az'
  | 'title_za'
  | 'account_az'
  | 'deposit_first'
  | 'withdraw_first'

type SortKey = BaseSortKey | `acc_${number}` | `freq_${Freq}`

export default function RecurringTab(): JSX.Element {
  const qc = useQueryClient()

  // ── Lookups ──────────────────────────────────────────
  const { data: accounts = [] } = useQuery<AccountRead[], Error>({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  })

  // ── Fetch recurring items ────────────────────────────
  const {
    data: recs = [],
    isLoading,
    isError,
    error,
  } = useQuery<RecurringRead[], Error>({
    queryKey: ['recurring'],
    queryFn: fetchRecurring,
  })

  // ── Mutations ────────────────────────────────────────
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

  // ── UI State ─────────────────────────────────────────
  const [showForm, setShowForm] = useState(false)
  // ── “Today” constant ─────────────────────────────────
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], [])

  // ── Create Form State ────────────────────────────────
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [acct, setAcct] = useState<number | ''>('')
  const [amount, setAmount] = useState('')
  const [direction, setDirection] = useState<Dir>('deposit')
  const [frequency, setFrequency] = useState<Freq>('monthly')
  const [startDate, setStartDate] = useState(todayISO)
  const [endDate, setEndDate] = useState('')

  const nextRun = useMemo(() => (startDate ? addFreq(startDate, frequency) : ''), [startDate, frequency])

  // ── Edit Form State ──────────────────────────────────
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

  // ── Sort State ───────────────────────────────────────
  const [sortBy, setSortBy] = useState<SortKey>('start_desc')

  const time = (d: string | Date) => new Date(d).getTime()
  const defaultTie = (a: RecurringRead, b: RecurringRead) =>
    time(b.start_date) - time(a.start_date)
  // ── Sort Functions ──────────────────────────────────
  const SORTS: Record<SortKey, (a: RecurringRead, b: RecurringRead) => number> = useMemo(() => {
    const base: Record<BaseSortKey, (a: RecurringRead, b: RecurringRead) => number> = {
      start_desc:   (a, b) => time(b.start_date) - time(a.start_date),
      start_asc:    (a, b) => time(a.start_date) - time(b.start_date),
      next_desc:    (a, b) => time(b.next_run_date) - time(a.next_run_date),
      next_asc:     (a, b) => time(a.next_run_date) - time(b.next_run_date),
      amount_desc:  (a, b) => b.amount - a.amount,
      amount_asc:   (a, b) => a.amount - b.amount,
      title_az:     (a, b) => ((a as any).title ?? '').localeCompare((b as any).title ?? ''),
      title_za:     (a, b) => ((b as any).title ?? '').localeCompare((a as any).title ?? ''),
      account_az:   (a, b) => acctName(accounts, a.account_id).localeCompare(acctName(accounts, b.account_id)),
      deposit_first:  (a, b) => (a.direction === 'withdrawal' ? 1 : 0) - (b.direction === 'withdrawal' ? 1 : 0),
      withdraw_first: (a, b) => (a.direction === 'deposit' ? 1 : 0) - (b.direction === 'deposit' ? 1 : 0),
    }
    // per-account “first” sorts
    const accSorts = Object.fromEntries(
      accounts.map(acc => {
        const key: SortKey = `acc_${acc.account_id}`
        return [
          key,
          (a: RecurringRead, b: RecurringRead) => {
            const aIs = a.account_id === acc.account_id
            const bIs = b.account_id === acc.account_id
            if (aIs && !bIs) return -1
            if (!aIs && bIs) return 1
            return defaultTie(a, b)
          },
        ]
      })
    )
    // frequency‐group sorts
    const freqSorts: Record<`freq_${Freq}`, (a: RecurringRead, b: RecurringRead) => number> = {
      freq_daily:   (a, b) => (a.frequency === 'daily'   ? -1 : b.frequency === 'daily'   ? 1 : defaultTie(a, b)),
      freq_weekly:  (a, b) => (a.frequency === 'weekly'  ? -1 : b.frequency === 'weekly'  ? 1 : defaultTie(a, b)),
      freq_monthly: (a, b) => (a.frequency === 'monthly' ? -1 : b.frequency === 'monthly' ? 1 : defaultTie(a, b)),
      freq_yearly:  (a, b) => (a.frequency === 'yearly'  ? -1 : b.frequency === 'yearly'  ? 1 : defaultTie(a, b)),
    }

    return { ...base, ...accSorts, ...freqSorts }
  }, [accounts])

  const sortedRecs = useMemo(() => [...recs].sort(SORTS[sortBy]), [recs, SORTS, sortBy])
  // ── Handlers ────────────────────────────────────────
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
      next_run_date: nextRun,
      end_date: endDate || undefined,
    })
    // reset form
    setTitle('')
    setDescription('')
    setAcct('')
    setAmount('')
    setDirection('deposit')
    setFrequency('monthly')
    setStartDate(todayISO)
    setEndDate('')
    setShowForm(false)
  }

  if (isLoading) return <Spinner />
  if (isError) return <p className="error-message">{error?.message}</p>

  // ── Summary ──────────────────────────────────────────
  const showing = recs.length
  const total = recs.length
  // ── Render ──────────────────────────────────────────
  return (
    <section className="recurring-page">
      <h1>Recurring Transactions</h1>
      {/* Header row: Add button + Sort dropdown */}
      <div className="header-row">
        <button
          className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => setShowForm(f => !f)}
        >
          {showForm ? 'Close Form' : '+ New Recurring'}
        </button>

        <select
          className="tv-select sort-select"
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortKey)}
        >
          <optgroup label="Title">
            <option value="title_az">Title (A→Z)</option>
            <option value="title_za">Title (Z→A)</option>
          </optgroup>

          <optgroup label="Start Date">
            <option value="start_desc">Date (Newest)</option>
            <option value="start_asc">Date (Oldest)</option>
          </optgroup>

          <optgroup label="Next Transaction">
            <option value="next_asc">Next (Earliest)</option>
            <option value="next_desc">Next (Latest)</option>
          </optgroup>

          <optgroup label="Accounts">
            {accounts.map(a => (
              <option key={a.account_id} value={`acc_${a.account_id}`}>
                {a.name}
              </option>
            ))}
          </optgroup>

          <optgroup label="Amount">
            <option value="amount_desc">Amount (Highest)</option>
            <option value="amount_asc">Amount (Lowest)</option>
          </optgroup>

          <optgroup label="Action">
            <option value="deposit_first">Deposits</option>
            <option value="withdraw_first">Withdrawals</option>
          </optgroup>

          <optgroup label="Frequency">
            <option value="freq_daily">Daily</option>
            <option value="freq_weekly">Weekly</option>
            <option value="freq_monthly">Monthly</option>
            <option value="freq_yearly">Yearly</option>
          </optgroup>
        </select>
      </div>

      <p className="summary">Showing {showing} of {total}</p>
      {/* Add Recurring Form */}
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
            <span className="tv-label">Description (Optional)</span>
            <input
              className="tv-input"
              placeholder="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
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
            <span className="tv-label">Amount</span>
            <input
              className="tv-input"
              type="number"
              step="1"
              placeholder="$0.00"
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
              onChange={e => setDirection(e.target.value as Dir)}
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
            <span className="tv-label">Next Transaction (Auto)</span>
            <input className="tv-input" type="date" value={nextRun} readOnly />
          </label>
          {/* Submit */}
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

      {/* Recurring List */}
      <div className="transactions-grid">
        {sortedRecs.map(r => {
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
            start_date: r.start_date.split('T')[0],
            next_run_date: r.next_run_date.split('T')[0],
            end_date: r.end_date || undefined,
          }

          const form = editForm[r.recurring_id] ?? base
          const displayNext =
            r.next_run_date ||
            addFreq(r.start_date.split('T')[0], r.frequency)

          return (
            <div key={r.recurring_id} className="transaction-card">
              {isEdit ? (
                <>
                  {/* EDIT MODE: Fields + Save/Delete */}
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
                    <span className="tv-label">Description</span>
                    <input
                      className="tv-input"
                      value={form.description || ''}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [r.recurring_id]: { ...form, description: e.target.value },
                        }))
                      }
                    />
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
                    <span className="tv-label">Account</span>
                    <select
                      className="tv-select"
                      value={form.account_id}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [r.recurring_id]: { ...form, account_id: +e.target.value },
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
                      step="1"
                      value={form.amount ?? 0}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [r.recurring_id]: { ...form, amount: parseFloat(e.target.value) },
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
                          [r.recurring_id]: { ...form, direction: e.target.value as Dir },
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
                      onChange={e => {
                        const freq = e.target.value as Freq
                        setEditForm(f => ({
                          ...f,
                          [r.recurring_id]: {
                            ...form,
                            frequency: freq,
                            next_run_date: form.start_date
                              ? addFreq(form.start_date, freq)
                              : form.next_run_date,
                          },
                        }))
                      }}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
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
                  {/* EDIT MODE: Fields + Save/Delete */}
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
