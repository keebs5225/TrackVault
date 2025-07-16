// frontend/src/pages/BudgetsPageTabs/BudgetsTab.tsx
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Spinner from '../../components/Spinner'
import { fetchBudgets, createBudget, updateBudget, deleteBudget} from '../../services/budgets'
import type { BudgetRead, BudgetCreate, BudgetUpdate } from '../../types'

type SectionKey = 'income' | 'fixed' | 'variable' | 'savings_and_debt'

export default function BudgetsTab(): JSX.Element {
  const qc = useQueryClient()
  const [showHint, setShowHint] = useState(false)

  // ── Fetch all budget entries ───────────────────────────────
  const {
    data: entries = [],
    isLoading,
    isError,
    error,
  } = useQuery<BudgetRead[], Error>({
    queryKey: ['budgets'],
    queryFn: fetchBudgets,
  })

  // ── Mutations ──────────────────────────────────────────────
  const addEntry = useMutation<BudgetRead, Error, BudgetCreate>({
  mutationFn: createBudget,
  onSuccess:  () => qc.invalidateQueries({ queryKey: ['budgets'] }),
})

const updEntry = useMutation<BudgetRead, Error, { id: number; data: BudgetUpdate }>({
  mutationFn: ({ id, data }) => updateBudget(id, data),
  onSuccess:  () => qc.invalidateQueries({ queryKey: ['budgets'] }),
})

const delEntry = useMutation<void, Error, number>({
  mutationFn: deleteBudget,
  onSuccess:  () => qc.invalidateQueries({ queryKey: ['budgets'] }),
})

  if (isLoading) return <Spinner />
  if (isError) return <p style={{ color: 'crimson' }}>{error?.message}</p>

  // ── Helpers ────────────────────────────────────────────────
  const bySection = (sec: SectionKey): BudgetRead[] =>
    entries.filter((e) => e.section === sec)

  const totalOf = (sec: SectionKey): number =>
    bySection(sec).reduce((sum, e) => sum + e.amount, 0)

  // ── Totals for the summary ─────────────────────────────────
  const incomeTotal   = totalOf('income')
  const fixedTotal    = totalOf('fixed')
  const variableTotal = totalOf('variable')
  const savingsTotal  = totalOf('savings_and_debt')
  const totalExpenses = fixedTotal + variableTotal + savingsTotal
  const leftover       = incomeTotal - totalExpenses

  // ── Render ─────────────────────────────────────────────────
  return (
    <>
      {(['income', 'fixed', 'variable'] as SectionKey[]).map(
        (sec, idx) => (
          <div key={sec} style={{ marginBottom: 24 }}>
            <h3 style={{ textTransform: 'capitalize' }}>
              {idx + 1}. {sec.replace(/_/g, ' & ')}{' '}
              <button
                onClick={() => {
                  const label = prompt('Label')
                  const amt   = prompt('Amount')
                  if (label && amt) {
                    addEntry.mutate({ section: sec, label, amount: +amt })
                  }
                }}
              >
                + Add
              </button>
            </h3>

            <table>
              <thead>
                <tr>
                  <th>Label</th>
                  <th>Amount</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bySection(sec).map((e) => (
                  <tr key={e.budget_id}>
                    <td>{e.label}</td>
                    <td>${e.amount.toFixed(2)}</td>
                    <td>
                      <button
                        onClick={() => {
                          const newLabel =
                            prompt('New label', e.label) ?? e.label
                          const newAmt =
                            prompt('New amount', String(e.amount)) ??
                            String(e.amount)
                          updEntry.mutate({
                            id:   e.budget_id,
                            data: { label: newLabel, amount: +newAmt },
                          })
                        }}
                      >
                        ✎
                      </button>
                    </td>
                    <td>
                      <button onClick={() => delEntry.mutate(e.budget_id)}>
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold' }}>
                  <td>Total</td>
                  <td>${totalOf(sec).toFixed(2)}</td>
                  <td colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Step 4: Summary */}
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
          <strong>Total Income:</strong> ${incomeTotal.toFixed(2)}
        </p>
        <p>
          <strong>Total Expenses:</strong> ${totalExpenses.toFixed(2)}
        </p>
        <p>
          <strong>Total:</strong> ${leftover.toFixed(2)}
        </p>
      </div>

      {/* Step 5: Hint */}
      <button
        onClick={() => setShowHint((h) => !h)}
        style={{ marginTop: '1rem' }}
      >
        {showHint ? 'Hide Hint' : 'Show Hint'}
      </button>
      {showHint && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Track Spending Monthly</h3>
          <p>Review weekly. Try the 50/30/20 rule:</p>
          <ul>
            <li>50% Needs</li>
            <li>30% Wants</li>
            <li>20% Savings/Debt</li>
          </ul>
        </div>
      )}
    </>
  )
}
