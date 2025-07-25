// frontend/src/pages/Dashboard.tsx
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import Spinner from '../components/Spinner'
import { fetchBudgets } from '../services/budgets'
import { fetchTransactions } from '../services/transactions'
import { fetchGoals } from '../services/goals'
import { fetchRecurring } from '../services/recurring'
import type {BudgetRead, Paged, TransactionRead, GoalRead, RecurringRead } from '../types'
import '../styles/global.css'
import '../styles/dashboard.css'


function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export default function Dashboard() {
  // ── Load budgets ───────────────────────────────────
  const {
    data: budgets = [],
    isLoading: bLoad,
    isError: bErr,
    error: bErrMsg,
  } = useQuery<BudgetRead[], Error>({
    queryKey: ['budgets'],
    queryFn: fetchBudgets,
  })

  // ── Load recent transactions ────────────────────────
  const {
    data: txPage = { items: [], total: 0, page: 1, page_size: 5 },
    isLoading: tLoad,
    isError: tErr,
    error: tErrMsg,
  } = useQuery<Paged<TransactionRead>, Error>({
    queryKey: ['transactions', { page: 1, page_size: 5 }],
    queryFn: () => fetchTransactions({ page: 1, page_size: 5 }),
  })

  // ── Load goals ──────────────────────────────────────
  const {
    data: goals = [],
    isLoading: gLoad,
    isError: gErr,
    error: gErrMsg,
  } = useQuery<GoalRead[], Error>({
    queryKey: ['goals'],
    queryFn: fetchGoals,
  })

  // ── Load recurring ──────────────────────────────────
  const {
    data: recs = [],
    isLoading: rLoad,
    isError: rErr,
    error: rErrMsg,
  } = useQuery<RecurringRead[], Error>({
    queryKey: ['recurring'],
    queryFn: fetchRecurring,
  })

  // ── Show spinner or error ──────────────────────────
  if (bLoad || tLoad || gLoad || rLoad) return <Spinner />
  if (bErr || tErr || gErr || rErr)
    return (
      <p className="error-message">
        {bErrMsg?.message || tErrMsg?.message || gErrMsg?.message || rErrMsg?.message}
      </p>
    )

  // ── Compute totals ──────────────────────────────────
  const totalIncome = budgets
    .filter(b => b.section === 'income')
    .reduce((sum, b) => sum + b.amount, 0)
  const totalExpenses = budgets
    .filter(b => b.section !== 'income')
    .reduce((sum, b) => sum + b.amount, 0)
  const leftover = totalIncome - totalExpenses

  // ── Group budgets ───────────────────────────────────
  const incomeB = budgets.filter(b => b.section === 'income')
  const fixedB = budgets.filter(b => b.section === 'fixed')
  const variableB = budgets.filter(b => b.section === 'variable')

  // ── Render budget bars ──────────────────────────────
  const renderBars = (items: BudgetRead[], base: number) =>
    items.map(b => {
      const pct = Math.floor((b.amount / (base || 1)) * 100)
      return (
        <div key={b.budget_id} className="progress-item">
          <strong>{capitalize(b.label)}</strong> — {pct}%
          <progress className="progress" value={pct} max={100} />
        </div>
      )
    })

  // ── Upcoming recurring ──────────────────────────────
  const upcoming = recs
    .slice()
    .sort((a, b) => new Date(a.next_run_date).getTime() - new Date(b.next_run_date).getTime())
    .slice(0, 5)

  return (
    <section className="dashboard-page">
      <h1>Dashboard</h1>

      {/* ── Summary cards ─────────────────────────────── */}
      <div className="summary-cards">
        <div className="card">
          <strong>Total Income</strong>
          <p>${totalIncome.toFixed(2)}</p>
        </div>
        <div className="card">
          <strong>Total Expenses</strong>
          <p>${totalExpenses.toFixed(2)}</p>
        </div>
        <div className="card">
          <strong>Leftover Buffer</strong>
          <p>${leftover.toFixed(2)}</p>
        </div>
      </div>

      {/* ── Budget overview ────────────────────────────── */}
      <div className="card">
        <h2>Budget Overview</h2>
        <div className="overview-section">
          <h3>Income</h3>
          {renderBars(incomeB, totalIncome)}
        </div>
        <div className="overview-section">
          <h3>Fixed Expenses</h3>
          {renderBars(fixedB, totalExpenses)}
        </div>
        <div className="overview-section">
          <h3>Variable Expenses</h3>
          {renderBars(variableB, totalExpenses)}
        </div>
      </div>

      {/* ── Recent transactions ───────────────────────── */}
      <div className="card">
        <h2>Recent Transactions</h2>
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Amt</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {txPage.items.map(tx => (
              <tr key={tx.transaction_id}>
                <td>{capitalize(tx.title)}</td>
                <td>{new Date(tx.date).toLocaleDateString()}</td>
                <td>${tx.amount.toFixed(2)}</td>
                <td>{tx.direction.toUpperCase()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Upcoming recurring ─────────────────────────── */}
      <div className="card">
        <h2>Upcoming Recurring</h2>
        <table className="transactions-table recurring-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Amt</th>
              <th>Freq</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.map(r => (
              <tr key={r.recurring_id}>
                <td>{capitalize(r.title || '')}</td>
                <td>{new Date(r.next_run_date).toLocaleDateString()}</td>
                <td>${r.amount.toFixed(2)}</td>
                <td>{r.frequency.toUpperCase()}</td>
                <td>{r.direction.toUpperCase()}</td>
              </tr>
            ))}
            {upcoming.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '12px 0' }}>
                  No upcoming recurring transactions
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Goals progress ─────────────────────────────── */}
      <div className="card">
        <h2>Goals</h2>
        {goals.map(g => {
          const pct = Math.floor((g.current_amount / g.target_amount) * 100)
          return (
            <div key={g.goal_id} className="progress-item">
              <strong>{g.title}</strong> — {pct}%
              <progress className="progress" value={pct} max={100} />
            </div>
          )
        })}
      </div>
    </section>
  )
}