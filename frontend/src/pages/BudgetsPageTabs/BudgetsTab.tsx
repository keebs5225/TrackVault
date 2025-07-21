import React, { useState, FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Spinner from '../../components/Spinner'
import {
  fetchBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from '../../services/budgets'
import type { BudgetRead, BudgetCreate, BudgetUpdate } from '../../types'

type SectionKey = 'income' | 'fixed' | 'variable'

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export default function BudgetsTab(): JSX.Element {
  const qc = useQueryClient()

  // fetch
  const { data: budgets = [], isLoading, isError, error } = useQuery<
    BudgetRead[],
    Error
  >({
    queryKey: ['budgets'],
    queryFn: fetchBudgets,
  })

  // mutations
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

  // form state
  const [showForm, setShowForm] = useState(false)
  const [newSection, setNewSection] = useState<SectionKey>('income')
  const [newLabel, setNewLabel] = useState('')
  const [newAmount, setNewAmount] = useState('')

  // inline‐edit state
  const [editing, setEditing] = useState<Record<number, boolean>>({})
  const [editForm, setEditForm] = useState<
    Record<number, { section: SectionKey; label: string; amount: number }>
  >({})

  if (isLoading) return <Spinner />
  if (isError) return <p style={{ color: 'crimson' }}>{error.message}</p>

  // summary helpers
  const totalBy = (sec: SectionKey) =>
    budgets.filter(b => b.section === sec).reduce((sum, b) => sum + b.amount, 0)
  const totalIncome = totalBy('income')
  const totalExpenses =
    totalBy('fixed') + totalBy('variable')
  const leftover = totalIncome - totalExpenses

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!newLabel || !newAmount) return
    createMut.mutate({
      section: newSection,
      label: newLabel,
      amount: +newAmount,
    })
    setNewLabel('')
    setNewAmount('')
  }

  return (
    <>
      <h2>Budgets</h2>

      {/* show/hide add form */}
      <button onClick={() => setShowForm(f => !f)}>
        {showForm ? 'Cancel' : '+ Add Budget'}
      </button>
      {showForm && (
        <form
          onSubmit={handleAdd}
          style={{
            margin: '1rem 0',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <select
            value={newSection}
            onChange={e => setNewSection(e.target.value as SectionKey)}
          >
            <option value="income">Income</option>
            <option value="fixed">Fixed</option>
            <option value="variable">Variable</option>
            <option value="savings_and_debt">Savings & Debt</option>
          </select>

          <input
            placeholder="Label"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Amount"
            step="0.01"
            value={newAmount}
            onChange={e => setNewAmount(e.target.value)}
            required
          />

          <button type="submit" disabled={createMut.status == 'pending'}>
            {createMut.status == 'pending' ? '…' : 'Add'}
          </button>
        </form>
      )}

      {/* cards grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))',
          gap: 16,
        }}
      >
        {budgets.map(b => {
          const isEdit = !!editing[b.budget_id]
          const base = {
            section: b.section as SectionKey,
            label: b.label,
            amount: b.amount,
          }
          const form = editForm[b.budget_id] ?? base

          return (
            <div
              key={b.budget_id}
              style={{
                border: '1px solid #ccc',
                padding: 16,
                borderRadius: 4,
              }}
            >
              {isEdit ? (
                <>
                  <label>
                    Section
                    <select
                      value={form.section}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [b.budget_id]: {
                            ...form,
                            section: e.target.value as SectionKey,
                          },
                        }))
                      }
                    >
                      <option value="income">Income</option>
                      <option value="fixed">Fixed</option>
                      <option value="variable">Variable</option>
                      <option value="savings_and_debt">
                        Savings & Debt
                      </option>
                    </select>
                  </label>

                  <label>
                    Label
                    <input
                      value={form.label}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [b.budget_id]: { ...form, label: e.target.value },
                        }))
                      }
                    />
                  </label>

                  <label>
                    Amount
                    <input
                      type="number"
                      step="0.01"
                      value={form.amount}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [b.budget_id]: {
                            ...form,
                            amount: +e.target.value,
                          },
                        }))
                      }
                    />
                  </label>

                  <div
                    style={{
                      marginTop: 8,
                      display: 'flex',
                      gap: 8,
                    }}
                  >
                    <button
                      onClick={() =>
                        updateMut.mutate({
                          id: b.budget_id,
                          data: { label: form.label, amount: form.amount },
                        })
                      }
                      disabled={updateMut.status == 'pending'}
                    >
                      {updateMut.status == 'pending' ? '…' : 'Save'}
                    </button>
                    <button
                      onClick={() =>
                        setEditing(e => ({ ...e, [b.budget_id]: false }))
                      }
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h4>
                    {capitalize(b.section.replace(/_/g, ' & '))}
                  </h4>
                  <p>
                    <strong>Label:</strong> {b.label}
                  </p>
                  <p>
                    <strong>Amount:</strong> $
                    {b.amount.toFixed(2)}
                  </p>

                  <div
                    style={{
                      marginTop: 8,
                      display: 'flex',
                      gap: 8,
                    }}
                  >
                    <button
                      onClick={() => {
                        setEditForm(f => ({
                          ...f,
                          [b.budget_id]: base,
                        }))
                        setEditing(e => ({
                          ...e,
                          [b.budget_id]: true,
                        }))
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        deleteMut.mutate(b.budget_id)
                      }
                      disabled={deleteMut.status == 'pending'}
                    >
                      {deleteMut.status == 'pending' ? '…' : 'Delete'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* summary */}
      <div
        style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#f5f5f5',
          borderRadius: 8,
        }}
      >
        <h3>Summary</h3>
        <p>
          <strong>Total Income:</strong> $
          {totalIncome.toFixed(2)}
        </p>
        <p>
          <strong>Total Expenses:</strong> $
          {totalExpenses.toFixed(2)}
        </p>
        <p>
          <strong>Leftover:</strong> $
          {leftover.toFixed(2)}
        </p>
      </div>
    </>
  )
}
