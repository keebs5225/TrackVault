// frontend/src/services/budgets.ts
import API from './api'
import type { BudgetRead, BudgetCreate, BudgetUpdate } from '../types.ts'

/* ── Fetch all budgets ───────────────────────────────── */
export const fetchBudgets = (): Promise<BudgetRead[]> =>
  API.get<BudgetRead[]>('/budgets').then(r => r.data)

/* ── Create budget ─────────────────────────────── */
export const createBudget = (b: BudgetCreate): Promise<BudgetRead> =>
  API.post<BudgetRead>('/budgets', b).then(r => r.data)

/* ── Update budget ───────────────────────── */
export const updateBudget = (id: number, b: BudgetUpdate): Promise<BudgetRead> =>
  API.patch<BudgetRead>(`/budgets/${id}`, b).then(r => r.data)

/* ── Delete budget ─────────────────────────────────── */
export const deleteBudget = (id: number): Promise<void> =>
  API.delete<void>(`/budgets/${id}`).then(() => {})
