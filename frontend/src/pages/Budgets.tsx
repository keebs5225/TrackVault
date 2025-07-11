// frontend/src/pages/Budgets.tsx
import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Spinner from '../components/Spinner'

import { fetchBudgets, createBudget, deleteBudget } from '../services/budgets'
import type { BudgetRead, BudgetCreate } from '../types'
import { fetchCategoryTree } from '../services/categories'
import type { CategoryRead } from '../types'
import { fetchGoals, createGoal, updateGoal, deleteGoal } from '../services/goals'
import type { GoalRead, GoalCreate, GoalUpdate } from '../types'

type Tab = 'budgets' | 'analytics' | 'goals'

export default function BudgetsPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('budgets')

  // ─── Shared lookups ───────────────────────────────
  const {
    data: categories = [],
    isLoading: catLoading,
    isError: catError,
    error: catErrorObj,
  } = useQuery<CategoryRead[], Error>({
    queryKey: ['categories', 'tree'],
    queryFn: fetchCategoryTree,
  })

   // ─── Budgets CRUD ─────────────────────────────────
  const {
    data: budgets = [],
    isLoading: bLoad,
    isError: bErr,
    error: bErrObj,
  } = useQuery<BudgetRead[], Error>({
    queryKey: ['budgets'],
    queryFn: fetchBudgets,
  })
  const createBudgetMut = useMutation<BudgetRead, Error, BudgetCreate>({
    mutationFn: createBudget,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })
  const deleteBudgetMut = useMutation<void, Error, number>({
    mutationFn: deleteBudget,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })

  const [bCategory, setBCategory] = useState<number | ''>('')
  const [bLimit, setBLimit] = useState('')
  const [bPeriod, setBPeriod] =
    useState<'weekly' | 'monthly' | 'yearly'>('monthly')
  const [bStart, setBStart] = useState('')
  const [bEnd, setBEnd]     = useState('')

  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bCategory || !bStart) return
    createBudgetMut.mutate({
      category_id:  +bCategory,
      amount_limit: parseFloat(bLimit) || 0,
      period:       bPeriod,
      start_date:   bStart,
      end_date:     bEnd || undefined,
    })
    setBCategory('')
    setBLimit('')
    setBStart('')
    setBEnd('')
  }

  // ─── Analytics calculators ────────────────────────
  // Loan
  const [loanAmt, setLoanAmt]   = useState('')
  const [loanRate, setLoanRate] = useState('')
  const [loanTerm, setLoanTerm] = useState('')
  const loanPayment = useMemo(() => {
    const P = parseFloat(loanAmt),
          r = parseFloat(loanRate)/100/12,
          n = parseFloat(loanTerm)*12
    if (!P || !r || !n) return ''
    return (P*r/(1 - Math.pow(1+r, -n))).toFixed(2)
  }, [loanAmt, loanRate, loanTerm])

  // Savings
  const [saveInit, setSaveInit]       = useState('')
  const [saveRate, setSaveRate]       = useState('')
  const [saveTerm, setSaveTerm]       = useState('')
  const [saveMonthly, setSaveMonthly] = useState('')
  const saveFuture = useMemo(() => {
    const P = parseFloat(saveInit),
          r = parseFloat(saveRate)/100/12,
          n = parseFloat(saveTerm)*12,
          C = parseFloat(saveMonthly)
    if (isNaN(P)||isNaN(r)||isNaN(n)||isNaN(C)) return ''
    return (P*Math.pow(1+r, n) + C*((Math.pow(1+r,n)-1)/r)).toFixed(2)
  }, [saveInit, saveRate, saveTerm, saveMonthly])

  // Investment
  const [invInit, setInvInit] = useState('')
  const [invRate, setInvRate] = useState('')
  const [invTerm, setInvTerm] = useState('')
  const [invCont, setInvCont] = useState('')
  const invFuture = useMemo(() => {
    const P = parseFloat(invInit),
          r = parseFloat(invRate)/100,
          n = parseFloat(invTerm),
          C = parseFloat(invCont)
    if (isNaN(P)||isNaN(r)||isNaN(n)||isNaN(C)) return ''
    return (P*Math.pow(1+r, n) + C*((Math.pow(1+r,n)-1)/r)).toFixed(2)
  }, [invInit, invRate, invTerm, invCont])

  // ─── Goals CRUD & Progress ────────────────────────
  const {
    data: goals = [],
    isLoading: gLoad,
    isError: gErr,
    error: gErrObj,
  } = useQuery<GoalRead[], Error>({
    queryKey: ['goals'],
    queryFn: fetchGoals,
  })
  const createGoalMut = useMutation<GoalRead, Error, GoalCreate>({
    mutationFn: createGoal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
  const updateGoalMut = useMutation<GoalRead, Error, { id: number; data: GoalUpdate }>({
    mutationFn: ({ id, data }) => updateGoal(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })
  const deleteGoalMut = useMutation<void, Error, number>({
    mutationFn: deleteGoal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  })

  const [gTitle, setGTitle]       = useState('')
  const [gDesc, setGDesc]         = useState('')
  const [gTarget, setGTarget]     = useState('')
  const [gDate, setGDate]         = useState('')
  const [deposits, setDeposits]   = useState<Record<number,string>>({})

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!gTitle || !gTarget || !gDate) return
    createGoalMut.mutate({
      title:         gTitle,
      description:   gDesc || undefined,
      target_amount: parseFloat(gTarget),
      target_date:   gDate,
    })
    setGTitle(''); setGDesc(''); setGTarget(''); setGDate('')
  }

  return (
    <section style={{ padding: 16 }}>
      <h1>Budgets · Analytics · Goals</h1>

      {/* ─── Tabs ───────────────────────────────────────── */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {(['budgets','analytics','goals'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            disabled={tab===t}
          >
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {/* ────────────────────────────────────────────────── */}
      {tab === 'budgets' && (
        bLoad ? <Spinner/> :
        bErr  ? <p style={{color:'crimson'}}>{bErrObj!.message}</p> :
        <>
          <h2>Budgets</h2>
          <form onSubmit={handleAddBudget} style={{ display:'flex', gap:8, marginBottom:16 }}>
            <select
              value={bCategory}
              onChange={e => setBCategory(e.target.value ? +e.target.value : '')}
            >
              <option value="">Category</option>
              {categories.map(c => (
                <option key={c.category_id} value={c.category_id}>{c.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Limit"
              value={bLimit}
              onChange={e => setBLimit(e.target.value)}
              step="0.01"
            />
            <select
              value={bPeriod}
              onChange={e => setBPeriod(e.target.value as any)}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <input
              type="date"
              value={bStart}
              onChange={e => setBStart(e.target.value)}
              required
            />
            <input
              type="date"
              value={bEnd}
              onChange={e => setBEnd(e.target.value)}
            />
            <button type="submit" disabled={createBudgetMut.status === 'pending'}>
              {createBudgetMut.status === 'pending' ? '…' : 'Add'}
            </button>
          </form>

          <table>
            <thead>
              <tr>
                <th>Category</th><th>Limit</th><th>Period</th>
                <th>Start</th><th>End</th><th>🗑</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map(b => (
                <tr key={b.budget_id}>
                  <td>
                    {categories.find(c => c.category_id === b.category_id)?.name}
                  </td>
                  <td>${b.amount_limit.toFixed(2)}</td>
                  <td>{b.period}</td>
                  <td>{new Date(b.start_date).toLocaleDateString()}</td>
                  <td>
                    {b.end_date
                      ? new Date(b.end_date).toLocaleDateString()
                      : '—'}
                  </td>
                  <td>
                    <button
                      onClick={() => deleteBudgetMut.mutate(b.budget_id)}
                      disabled={deleteBudgetMut.status === 'pending'}
                    >
                      {deleteBudgetMut.status === 'pending' ? '…' : '❌'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {tab === 'analytics' && (
        <>
          <h2>Analytics</h2>

          <fieldset style={{ marginBottom:16 }}>
            <legend>Loan</legend>
            <label>Amount: <input type="number" value={loanAmt} onChange={e=>setLoanAmt(e.target.value)} step="0.01"/></label>
            <label>Rate %: <input type="number" value={loanRate} onChange={e=>setLoanRate(e.target.value)} step="0.01"/></label>
            <label>Years:  <input type="number" value={loanTerm} onChange={e=>setLoanTerm(e.target.value)} step="0.1"/></label>
            <p>Monthly: {loanPayment ? `$${loanPayment}` : '—'}</p>
          </fieldset>

          <fieldset style={{ marginBottom:16 }}>
            <legend>Savings</legend>
            <label>Initial: <input type="number" value={saveInit} onChange={e=>setSaveInit(e.target.value)} step="0.01"/></label>
            <label>Rate %:  <input type="number" value={saveRate} onChange={e=>setSaveRate(e.target.value)} step="0.01"/></label>
            <label>Years:   <input type="number" value={saveTerm} onChange={e=>setSaveTerm(e.target.value)} step="0.1"/></label>
            <label>Monthly:<input type="number" value={saveMonthly} onChange={e=>setSaveMonthly(e.target.value)} step="0.01"/></label>
            <p>Future: {saveFuture ? `$${saveFuture}` : '—'}</p>
          </fieldset>

          <fieldset>
            <legend>Investment</legend>
            <label>Initial: <input type="number" value={invInit} onChange={e=>setInvInit(e.target.value)} step="0.01"/></label>
            <label>Rate %:  <input type="number" value={invRate} onChange={e=>setInvRate(e.target.value)} step="0.01"/></label>
            <label>Years:   <input type="number" value={invTerm} onChange={e=>setInvTerm(e.target.value)} step="0.1"/></label>
            <label>Annual:  <input type="number" value={invCont} onChange={e=>setInvCont(e.target.value)} step="0.01"/></label>
            <p>Proj: {invFuture ? `$${invFuture}` : '—'}</p>
          </fieldset>
        </>
      )}

      {tab === 'goals' && (
        gLoad ? <Spinner/> :
        gErr  ? <p style={{color:'crimson'}}>{gErrObj!.message}</p> :
        <>
          <h2>Goals</h2>
          <form onSubmit={handleAddGoal} style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            <input
              placeholder="Title"
              value={gTitle}
              onChange={e=>setGTitle(e.target.value)}
              required
            />
            <input
              placeholder="Description"
              value={gDesc}
              onChange={e=>setGDesc(e.target.value)}
            />
            <input
              type="number"
              placeholder="Target Amount"
              value={gTarget}
              onChange={e=>setGTarget(e.target.value)}
              step="0.01"
              required
            />
            <input
              type="date"
              placeholder="By Date"
              value={gDate}
              onChange={e=>setGDate(e.target.value)}
              required
            />
            <button type="submit" disabled={createGoalMut.status === 'pending'}>
              {createGoalMut.status === 'pending' ? '…' : 'Add Goal'}
            </button>
          </form>

          <div style={{ display:'grid', gap:16 }}>
            {goals.map(goal => {
              const pct = Math.floor((goal.current_amount / goal.target_amount)*100)
              return (
                <div key={goal.goal_id} style={{ border:'1px solid #ccc', padding:16, borderRadius:4 }}>
                  <h3>{goal.title}</h3>
                  {goal.description && <p>{goal.description}</p>}
                  <progress value={pct} max={100} style={{ width:'100%' }} />
                  <p>${goal.current_amount.toFixed(2)} / ${goal.target_amount.toFixed(2)} ({pct}%)</p>
                  <p>By: {new Date(goal.target_date).toLocaleDateString()}</p>

                  <div style={{ display:'flex', gap:8, marginTop:8 }}>
                    <input
                      type="number"
                      placeholder="Deposit"
                      value={deposits[goal.goal_id]||''}
                      onChange={e => setDeposits(prev => ({ ...prev, [goal.goal_id]: e.target.value }))}
                      step="0.01"
                    />
                    <button
                      onClick={() => {
                        const d = parseFloat(deposits[goal.goal_id]||'')
                        if (!d) return
                        updateGoalMut.mutate({ id: goal.goal_id, data: { current_amount: goal.current_amount + d } })
                        setDeposits(prev => ({ ...prev, [goal.goal_id]: '' }))
                      }}
                      disabled={updateGoalMut.status === 'pending'}
                    >
                      {updateGoalMut.status === 'pending' ? '…' : 'Deposit'}
                    </button>
                    <button
                      onClick={() => deleteGoalMut.mutate(goal.goal_id)}
                      disabled={deleteGoalMut.status === 'pending'}
                    >
                      {deleteGoalMut.status === 'pending' ? '…' : '❌'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
