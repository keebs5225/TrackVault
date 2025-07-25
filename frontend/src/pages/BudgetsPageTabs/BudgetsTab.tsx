// frontend/src/pages/BudgetsPageTabs/BudgetsTab.tsx
import React, { useState, FormEvent, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Spinner from '../../components/Spinner'
import { fetchBudgets, createBudget, updateBudget, deleteBudget } from '../../services/budgets'
import type { BudgetRead, BudgetCreate, BudgetUpdate } from '../../types'
import '../../styles/global.css'
import '../../styles/budgets.css'

type SectionKey = 'income' | 'fixed' | 'variable'


// ── Helpers & types ───────────────────────────────────────
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
type SortKey =
  | 'amount_desc'
  | 'amount_asc'
  | 'label_az'
  | 'label_za'
  | 'income_first'
  | 'fixed_first'
  | 'variable_first'


export default function BudgetsTab(): JSX.Element {
  const qc = useQueryClient()

  /* ── Fetch ─────────────────────────────────────────── */
  const { data: budgets = [], isLoading, isError, error } = useQuery<BudgetRead[], Error>({
    queryKey: ['budgets'],
    queryFn: fetchBudgets,
  })

  /* ── Mutations ─────────────────────────────────────── */
  const createMut = useMutation<BudgetRead, Error, BudgetCreate>({
    mutationFn: createBudget,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })
  const updateMut = useMutation<BudgetRead, Error, { id: number; data: BudgetUpdate }>({
    mutationFn: ({ id, data }) => updateBudget(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })
  const deleteMut = useMutation<void, Error, number>({
    mutationFn: deleteBudget,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })

  /* ── UI state ───────────────────────────────────────── */
  const [showForm, setShowForm] = useState(false)
  const [newSection, setNewSection] = useState<SectionKey>('income')
  const [newLabel, setNewLabel] = useState('')
  const [newAmount, setNewAmount] = useState('')

  const [editing, setEditing] = useState<Record<number, boolean>>({})
  const [editForm, setEditForm] = useState<Record<number, { section: SectionKey; label: string; amount: number }>>({})

  const [sortBy, setSortBy] = useState<SortKey>('amount_desc')

  /* ── Sort & group data ──────────────────────────────── */
  const sectionOrder: SectionKey[] = useMemo(() => {
    switch (sortBy) {
      case 'income_first':   return ['income', 'fixed', 'variable']
      case 'fixed_first':    return ['fixed', 'income', 'variable']
      case 'variable_first': return ['variable', 'income', 'fixed']
      default:               return ['income', 'fixed', 'variable']
    }
  }, [sortBy])

  const itemSorter = useMemo(() => {
    switch (sortBy) {
      case 'amount_desc': return (a: BudgetRead, b: BudgetRead) => b.amount - a.amount
      case 'amount_asc':  return (a: BudgetRead, b: BudgetRead) => a.amount - b.amount
      case 'label_az':    return (a: BudgetRead, b: BudgetRead) => a.label.localeCompare(b.label)
      case 'label_za':    return (a: BudgetRead, b: BudgetRead) => b.label.localeCompare(a.label)
      default:            return () => 0
    }
  }, [sortBy])

  const groupedSorted = useMemo(() => {
    const map: Record<SectionKey, BudgetRead[]> = { income: [], fixed: [], variable: [] }
    budgets.forEach(b => map[b.section as SectionKey].push(b))
    ;(Object.keys(map) as SectionKey[]).forEach(sec => map[sec].sort(itemSorter))
    return map
  }, [budgets, itemSorter])

  const totals = useMemo(() => {
    const totalBy = (sec: SectionKey) =>
      budgets.filter(b => b.section === sec).reduce((sum, b) => sum + b.amount, 0)
    const income = totalBy('income')
    const expenses = totalBy('fixed') + totalBy('variable')
    return { income, expenses, leftover: income - expenses }
  }, [budgets])

  /* ── Early returns ───────────────────────────────────── */
  if (isLoading) return <Spinner />
  if (isError)   return <p className="error-message">{error.message}</p>

  /* ── Handlers ───────────────────────────────────────── */
  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!newLabel || !newAmount) return
    createMut.mutate({ section: newSection, label: newLabel, amount: +newAmount })
    setNewLabel('')
    setNewAmount('')
    setShowForm(false)
  }

  function renderCard(item: BudgetRead) {
    const isEdit = !!editing[item.budget_id]
    const base = { section: item.section as SectionKey, label: item.label, amount: item.amount }
    const form = editForm[item.budget_id] ?? base

    return (
      <div key={item.budget_id} className={`budget-card ${isEdit ? 'is-editing' : ''}`}>
        {isEdit ? (
          <>
            {/* ── Edit form fields ───────────────────────── */}
            <label className="tv-field">
              <span className="tv-label">Section</span>
              <select
                className="tv-select"
                value={form.section}
                onChange={e =>
                  setEditForm(f => ({
                    ...f,
                    [item.budget_id]: { ...form, section: e.target.value as SectionKey },
                  }))
                }
              >
                <option value="income">Income</option>
                <option value="fixed">Fixed</option>
                <option value="variable">Variable</option>
              </select>
            </label>

            <label className="tv-field">
              <span className="tv-label">Title</span>
              <input
                className="tv-input"
                value={form.label}
                onChange={e =>
                  setEditForm(f => ({
                    ...f,
                    [item.budget_id]: { ...form, label: e.target.value },
                  }))
                }
              />
            </label>

            <label className="tv-field">
              <span className="tv-label">Amount ($)</span>
              <input
                className="tv-input"
                type="number"
                step="0.01"
                value={form.amount}
                onChange={e =>
                  setEditForm(f => ({
                    ...f,
                    [item.budget_id]: { ...form, amount: +e.target.value },
                  }))
                }
              />
            </label>

            <div className="tv-actions--split">
              <div className="left">
                <button
                  className="btn btn-danger"
                  onClick={() => deleteMut.mutate(item.budget_id)}
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
                      id: item.budget_id,
                      data: { section: form.section, label: form.label, amount: form.amount },
                    })
                    setEditing(e => ({ ...e, [item.budget_id]: false }))
                  }}
                  disabled={updateMut.status === 'pending'}
                >
                  {updateMut.status === 'pending' ? '…' : 'Save'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setEditing(e => ({ ...e, [item.budget_id]: false }))}
                >
                  Discard
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ── Display  ───────────────────────────── */}
            <h2>{capitalize(item.label)}</h2>
            <p>${item.amount.toFixed(2)}</p>
            <div className="tv-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditForm(f => ({ ...f, [item.budget_id]: base }))
                  setEditing(e => ({ ...e, [item.budget_id]: true }))
                }}
              >
                Edit
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  /* ── Render page ──────────────────────────────────────── */
  return (
    <section className="budgets-page">
      <h1>Budgets</h1>

      <div className="header-row">
        <button
          className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => setShowForm(f => !f)}
        >
          {showForm ? 'Close Form' : '+ Add Budget'}
        </button>

        {/* ── Sort dropdown ─────────────────────────────── */}
        <select
          className="tv-select sort-select"
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortKey)}
        >
          <optgroup label="Section">
            <option value="income_first">Income</option>
            <option value="fixed_first">Fixed</option>
            <option value="variable_first">Variable</option>
          </optgroup>
          <optgroup label="Title">
            <option value="label_az">Title (A→Z)</option>
            <option value="label_za">Title (Z→A)</option>
          </optgroup>
          <optgroup label="Amount">
            <option value="amount_desc">Amount (Highest)</option>
            <option value="amount_asc">Amount (Lowest)</option>
          </optgroup>
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card tv-form-card tv-form">
          {/* ── Add budget form ─────────────────────────── */}
          <label className="tv-field">
            <span className="tv-label">Section</span>
            <select
              className="tv-select"
              value={newSection}
              onChange={e => setNewSection(e.target.value as SectionKey)}
            >
              <option value="income">Income</option>
              <option value="fixed">Fixed</option>
              <option value="variable">Variable</option>
            </select>
          </label>

          <label className="tv-field">
            <span className="tv-label">Title</span>
            <input
              className="tv-input"
              placeholder="Name"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              required
            />
          </label>

          <label className="tv-field">
            <span className="tv-label">Amount</span>
            <input
              className="tv-input"
              type="number"
              placeholder="$0.00"
              step="1"
              value={newAmount}
              onChange={e => setNewAmount(e.target.value)}
              required
            />
          </label>

          <div className="tv-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMut.status === 'pending'}
            >
              {createMut.status === 'pending' ? <Spinner /> : 'Add'}
            </button>
          </div>
        </form>
      )}

      {/* ── Budget sections ────────────────────────────────── */}
      <div className="budgets-grid">
        {sectionOrder.map(sec => (
          <div key={sec}>
            <h2>
              {sec === 'income'
                ? <>Income <small>(NET)</small></>
                : sec === 'fixed'
                ? 'Fixed Expenses'
                : 'Variable Expenses'}
            </h2>
            {groupedSorted[sec].map(renderCard)}
          </div>
        ))}
      </div>

      {/* ── Summary block ─────────────────────────────────── */}
      <div className="summary-block">
        <h2>Summary</h2>
        <p><strong>Total Income:</strong> ${totals.income.toFixed(2)}</p>
        <p><strong>Total Expenses:</strong> ${totals.expenses.toFixed(2)}</p>
        <p>-------------------------------------------</p>
        <p><strong>Leftover:</strong> ${totals.leftover.toFixed(2)}</p>
      </div>
    </section>
  )
}
