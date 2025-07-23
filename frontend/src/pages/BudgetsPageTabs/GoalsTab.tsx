// frontend/src/pages/BudgetsPageTabs/GoalsTab.tsx
import React, { useState, FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Spinner from '../../components/Spinner'
import { fetchGoals, createGoal, updateGoal, deleteGoal, addDeposit } from '../../services/goals'
import type { GoalRead, GoalCreate, GoalUpdate, GoalDepositRead } from '../../types'
import '../../styles/global.css'
import '../../styles/goals.css'


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
  const [showForm, setShowForm]     = useState(false)
  const [title, setTitle]           = useState('')
  const [desc, setDesc]             = useState('')
  const [target, setTarget]         = useState('')
  const [byDate, setByDate]         = useState('')
  const [deposits, setDeposits]     = useState<Record<number, string>>({})

  // inline edit state
  const [editing, setEditing]       = useState<Record<number, boolean>>({})
  const [editForm, setEditForm]     = useState<Record<number, GoalUpdate & { title?: string; description?: string }>>({})

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!title || !target || !byDate) return
    createMut.mutate({
      title,
      description: desc || undefined,
      target_amount: parseFloat(target),
      target_date: byDate,
    })
    setTitle(''); setDesc(''); setTarget(''); setByDate('')
    setShowForm(false)
  }

  if (isLoading) return <Spinner />
  if (isError)   return <p className="error-message">{error.message}</p>

  return (
    <section className="goals-page">
      <h1>Goals</h1>

      {/* Toggle Add Form */}
      <button
        className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`}
        onClick={() => setShowForm(f => !f)}
      >
        {showForm ? 'Close Form' : '+ Add Goal'}
      </button>

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
            <span className="tv-label">Description</span>
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
              step="0.01"
              placeholder="Target Amount"
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

      {/* Goals List */}
      <div className="goals-grid">
        {goals.map(g => {
          const pct = Math.floor((g.current_amount / g.target_amount) * 100)

          const isEdit = !!editing[g.goal_id]
          const base: GoalUpdate & { title?: string; description?: string } = {
            title: g.title,
            description: g.description,
            target_amount: g.target_amount,
            target_date: g.target_date.split('T')[0],
          }
          const form = editForm[g.goal_id] ?? base

          return (
            <div key={g.goal_id} className="goal-card">
              {isEdit ? (
                <>
                  {/* EDIT MODE */}
                  <label className="tv-field">
                    <span className="tv-label">Title</span>
                    <input
                      className="tv-input"
                      value={form.title || ''}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [g.goal_id]: { ...form, title: e.target.value },
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
                          [g.goal_id]: { ...form, description: e.target.value },
                        }))
                      }
                    />
                  </label>

                  <label className="tv-field">
                    <span className="tv-label">Target Amount</span>
                    <input
                      className="tv-input"
                      type="number"
                      step="0.01"
                      value={form.target_amount ?? 0}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [g.goal_id]: {
                            ...form,
                            target_amount: parseFloat(e.target.value),
                          },
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
                        setEditForm(f => ({
                          ...f,
                          [g.goal_id]: { ...form, target_date: e.target.value },
                        }))
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
                        onClick={() =>
                          setEditing(e => ({ ...e, [g.goal_id]: false }))
                        }
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* VIEW MODE */}
                  <h2>{g.title}</h2>
                  {g.description && <p>{g.description}</p>}
                  <progress value={pct} max={100} className="progress-bar" />
                  <p>
                    ${g.current_amount.toFixed(2)} / $
                    {g.target_amount.toFixed(2)} ({pct}%)
                  </p>
                  <p>By: {new Date(g.target_date).toLocaleDateString()}</p>

                  {/* ONE-LINE FOOTER */}
                  <div className="tv-actions--split goal-footer">
                    <div className="left deposit-actions">
                      <input
                        className="tv-input goal-amt-input"
                        type="number"
                        placeholder="Amount"
                        step="0.01"
                        value={deposits[g.goal_id] || ''}
                        onChange={e =>
                          setDeposits(prev => ({
                            ...prev,
                            [g.goal_id]: e.target.value,
                          }))
                        }
                      />
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          const amt = parseFloat(deposits[g.goal_id] || '')
                          if (isNaN(amt) || amt <= 0) return
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
        })}
      </div>
    </section>
  )
}