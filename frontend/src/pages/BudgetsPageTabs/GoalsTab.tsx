// frontend/src/pages/BudgetsPageTabs/GoalsTab.tsx
import React, { useState, FormEvent, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Spinner from '../../components/Spinner'
import { fetchGoals, createGoal, updateGoal, deleteGoal, addDeposit } from '../../services/goals'
import type { GoalRead, GoalCreate, GoalUpdate, GoalDepositRead, Priority } from '../../types'
import '../../styles/global.css'
import '../../styles/goals.css'

/* ── Priority helpers ───────────────────────────────── */
const PRIORITIES: Priority[] = ['low', 'med', 'high']
const incPriority = (p: Priority): Priority =>
  PRIORITIES[Math.min(PRIORITIES.indexOf(p) + 1, PRIORITIES.length - 1)]
const decPriority = (p: Priority): Priority =>
  PRIORITIES[Math.max(PRIORITIES.indexOf(p) - 1, 0)]

/* ── Sort keys ──────────────────────────────────────── */
type SortKey =
  | 'prio_high_first'
  | 'prio_med_first'
  | 'prio_low_first'
  | 'target_date_asc'
  | 'target_date_desc'
  | 'amount_asc'
  | 'amount_desc'
  | 'progress_asc'
  | 'progress_desc'
  | 'title_az'
  | 'title_za'

export default function GoalsTab(): JSX.Element {
  const qc = useQueryClient()

  // ── Fetch goals ────────────────────────────────────────
  const { data: goals = [], isLoading, isError, error } = useQuery<GoalRead[], Error>({
    queryKey: ['goals'],
    queryFn: fetchGoals,
  })

  // ── Mutations ──────────────────────────────────────────
  const createMut = useMutation<GoalRead, Error, GoalCreate>({
    mutationFn: createGoal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
  const updateMut = useMutation<GoalRead, Error, { id: number; data: GoalUpdate }>({
    mutationFn: ({ id, data }) => updateGoal(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
  const deleteMut = useMutation<void, Error, number>({
    mutationFn: deleteGoal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
  const depositMut = useMutation<GoalDepositRead, Error, { id: number; amount: number }>({
    mutationFn: ({ id, amount }) => addDeposit(id, amount),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })

  // ── UI state ───────────────────────────────────────────
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle]       = useState('')
  const [desc, setDesc]         = useState('')
  const [target, setTarget]     = useState('')
  const [byDate, setByDate]     = useState('')
  const [priority, setPriority] = useState<Priority>('med')
  const [deposits, setDeposits] = useState<Record<number, string>>({})

  // inline edit state
  const [editing, setEditing]   = useState<Record<number, boolean>>({})
  const [editForm, setEditForm] = useState<Record<number, GoalUpdate & { title?: string; description?: string }>>({})

  // sort state
  const [sortBy, setSortBy] = useState<SortKey>('prio_high_first')

  /* ── Sorters ────────────────────────────────────────── */
  const makePrioritySorter = (first: Priority) => {
    const order: Priority[] =
      first === 'high' ? ['high', 'med', 'low']
      : first === 'med' ? ['med', 'high', 'low']
      : ['low', 'med', 'high']
    const rank: Record<Priority, number> = {
      high: order.indexOf('high'),
      med:  order.indexOf('med'),
      low:  order.indexOf('low'),
    }
    return (a: GoalRead, b: GoalRead) => rank[a.priority] - rank[b.priority]
  }

  const SORTS: Record<SortKey, (a: GoalRead, b: GoalRead) => number> = {
    prio_high_first: makePrioritySorter('high'),
    prio_med_first:  makePrioritySorter('med'),
    prio_low_first:  makePrioritySorter('low'),

    target_date_asc:  (a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime(),
    target_date_desc: (a, b) => new Date(b.target_date).getTime() - new Date(a.target_date).getTime(),

    amount_asc:  (a, b) => a.target_amount - b.target_amount,
    amount_desc: (a, b) => b.target_amount - a.target_amount,

    progress_asc:  (a, b) => (a.current_amount / a.target_amount) - (b.current_amount / b.target_amount),
    progress_desc: (a, b) => (b.current_amount / b.target_amount) - (a.current_amount / a.target_amount),

    title_az: (a, b) => a.title.localeCompare(b.title),
    title_za: (a, b) => b.title.localeCompare(a.title),
  }

  const sortedGoals = useMemo(
    () => [...goals].sort(SORTS[sortBy]),
    [goals, sortBy]
  )

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!title || !target || !byDate) return
    createMut.mutate({
      title,
      description: desc || undefined,
      target_amount: parseFloat(target),
      target_date: byDate,
      priority,
    })
    setTitle(''); setDesc(''); setTarget(''); setByDate(''); setPriority('med')
    setShowForm(false)
  }

  const handlePriorityBump = (id: number, current: Priority, dir: 'up' | 'down') => {
    const next = dir === 'up' ? incPriority(current) : decPriority(current)
    if (next === current) return
    updateMut.mutate({ id, data: { priority: next } })
  }

  if (isLoading) return <Spinner />
  if (isError)   return <p className="error-message">{error.message}</p>

  /* ── Render card ────────────────────────────────────── */
  const renderGoal = (g: GoalRead) => {
    const pct = Math.floor((g.current_amount / g.target_amount) * 100)
    const isEdit = !!editing[g.goal_id]

    const base: GoalUpdate & { title?: string; description?: string } = {
      title: g.title,
      description: g.description,
      target_amount: g.target_amount,
      target_date: g.target_date.split('T')[0],
      priority: g.priority,
    }
    const form = editForm[g.goal_id] ?? base

    const canUp   = g.priority !== 'high'
    const canDown = g.priority !== 'low'

    return (
      <div key={g.goal_id} className="goal-card">
        {isEdit ? (
          <>
            <label className="tv-field">
              <span className="tv-label">Title</span>
              <input
                className="tv-input"
                value={form.title || ''}
                onChange={e =>
                  setEditForm(f => ({ ...f, [g.goal_id]: { ...form, title: e.target.value } }))
                }
              />
            </label>

            <label className="tv-field">
              <span className="tv-label">Description</span>
              <input
                className="tv-input"
                value={form.description || ''}
                onChange={e =>
                  setEditForm(f => ({ ...f, [g.goal_id]: { ...form, description: e.target.value } }))
                }
              />
            </label>

            <label className="tv-field">
              <span className="tv-label">Target Amount ($)</span>
              <input
                className="tv-input"
                type="number"
                step="1"
                value={form.target_amount ?? 0}
                onChange={e =>
                  setEditForm(f => ({
                    ...f,
                    [g.goal_id]: { ...form, target_amount: parseFloat(e.target.value) },
                  }))
                }
              />
            </label>

            <label className="tv-field">
              <span className="tv-label">Target Date</span>
              <input
                className="tv-input"
                type="date"
                value={form.target_date || ''}
                onChange={e =>
                  setEditForm(f => ({ ...f, [g.goal_id]: { ...form, target_date: e.target.value } }))
                }
              />
            </label>

            <div className="tv-actions--split goal-edit-actions">
              <div className="left">
                <button
                  className="btn btn-danger"
                  onClick={() => deleteMut.mutate(g.goal_id)}
                  disabled={deleteMut.status === 'pending'}
                >
                  {deleteMut.status === 'pending' ? '…' : 'Delete'}
                </button>
              </div>
              <div className="right">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    updateMut.mutate({
                      id: g.goal_id,
                      data: {
                        title: form.title,
                        description: form.description,
                        target_amount: form.target_amount,
                        target_date: form.target_date,
                        priority: form.priority,
                      },
                    })
                    setEditing(e => ({ ...e, [g.goal_id]: false }))
                  }}
                  disabled={updateMut.status === 'pending'}
                >
                  {updateMut.status === 'pending' ? '…' : 'Save'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setEditing(e => ({ ...e, [g.goal_id]: false })) }
                >
                  Discard
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2>
              {g.title}{' '}
              <span className={`priority-badge ${g.priority}`}>
                {g.priority.toUpperCase()}
              </span>
            </h2>

            {/* Priority arrows */}
            <div className="priority-arrows">
              <button
                type="button"
                className="priority-arrow up"
                title="Increase priority"
                disabled={!canUp || updateMut.status === 'pending'}
                onClick={(e) => { e.stopPropagation(); handlePriorityBump(g.goal_id, g.priority, 'up') }}
              >▲</button>
              <button
                type="button"
                className="priority-arrow down"
                title="Decrease priority"
                disabled={!canDown || updateMut.status === 'pending'}
                onClick={(e) => { e.stopPropagation(); handlePriorityBump(g.goal_id, g.priority, 'down') }}
              >▼</button>
            </div>

            {g.description && <p>{g.description}</p>}

            <progress
              value={pct}
              max={100}
              className={`progress-bar ${pct === 100 ? 'complete' : ''}`}
            />

            <p>
              ${g.current_amount.toLocaleString()} / ${g.target_amount.toLocaleString()} ({pct}%)
            </p>
            <p>By: {new Date(g.target_date).toLocaleDateString()}</p>

            <div className="tv-actions--split goal-footer">
              <div className="left deposit-actions">
                <input
                  className="tv-input goal-amt-input"
                  type="number"
                  placeholder="Amount"
                  step="0.01"
                  value={deposits[g.goal_id] || ''}
                  onChange={e =>
                    setDeposits(prev => ({ ...prev, [g.goal_id]: e.target.value }))
                  }
                />
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const amt = parseFloat(deposits[g.goal_id] || '')
                    if (isNaN(amt) || amt <= 0) return
                    if (g.current_amount + amt > g.target_amount) {
                      alert('Cannot deposit more than the target amount')
                      return
                    }
                    depositMut.mutate({ id: g.goal_id, amount: amt })
                    setDeposits(prev => ({ ...prev, [g.goal_id]: '' }))
                  }}
                  disabled={depositMut.status === 'pending'}
                >
                  {depositMut.status === 'pending' ? '…' : 'Deposit'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    const amt = parseFloat(deposits[g.goal_id] || '')
                    if (isNaN(amt) || amt <= 0) return
                    depositMut.mutate({ id: g.goal_id, amount: -amt })
                    setDeposits(prev => ({ ...prev, [g.goal_id]: '' }))
                  }}
                  disabled={depositMut.status === 'pending'}
                >
                  {depositMut.status === 'pending' ? '…' : 'Withdraw'}
                </button>
              </div>

              <div className="right">
                <button
                  className="btn btn-primary edit-btn"
                  onClick={() => {
                    setEditForm(f => ({ ...f, [g.goal_id]: base }))
                    setEditing(e => ({ ...e, [g.goal_id]: true }))
                  }}
                >
                  Edit
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <section className="goals-page">
      <h1>Goals</h1>

      <div className="header-row">
        <button
          className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => setShowForm(f => !f)}
        >
          {showForm ? 'Close Form' : '+ Add Goal'}
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

          <optgroup label="Target Amount">
            <option value="amount_desc">Amount (Highest)</option>
            <option value="amount_asc">Amount (Lowest)</option>
          </optgroup>

          <optgroup label="Target Date">
            <option value="target_date_asc">Date (Earliest)</option>
            <option value="target_date_desc">Date (Latest)</option>
          </optgroup>

          <optgroup label="Priority">
            <option value="prio_high_first">High</option>
            <option value="prio_med_first">Medium</option>
            <option value="prio_low_first">Low</option>
          </optgroup>

          <optgroup label="Progress %">
            <option value="progress_desc">Progress (Highest)</option>
            <option value="progress_asc">Progress (Lowest)</option>
          </optgroup>
        </select>
      </div>

      {/* Add Goal Form */}
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
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </label>

          <label className="tv-field">
            <span className="tv-label">Target Amount</span>
            <input
              className="tv-input"
              type="number"
              step="1"
              placeholder="$0.00"
              value={target}
              onChange={e => setTarget(e.target.value)}
              required
            />
          </label>

          <label className="tv-field">
            <span className="tv-label">Target Date</span>
            <input
              className="tv-input"
              type="date"
              value={byDate}
              onChange={e => setByDate(e.target.value)}
              required
            />
          </label>

          <label className="tv-field">
            <span className="tv-label">Priority</span>
            <select
              className="tv-select"
              value={priority}
              onChange={e => setPriority(e.target.value as Priority)}
            >
              <option value="low">Low</option>
              <option value="med">Med</option>
              <option value="high">High</option>
            </select>
          </label>

          <div className="tv-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMut.status === 'pending'}
            >
              {createMut.status === 'pending' ? <Spinner /> : 'Add Goal'}
            </button>
          </div>
        </form>
      )}

      {/* Goals List (sorted) */}
      <div className="goals-grid">
        {sortedGoals.map(renderGoal)}
      </div>
    </section>
  )
}
