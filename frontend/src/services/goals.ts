//frontend/src/services/goals.ts
import API from './api'
import type { GoalRead, GoalCreate, GoalUpdate, GoalDepositRead } from '../types.ts'

/* ── Fetch goals ─────────────────────────────────────── */
export function fetchGoals(): Promise<GoalRead[]> {
  return API.get<GoalRead[]>('/goals').then(r => r.data)
}

/* ── Create goal ────────────────────────────────── */
export function createGoal(data: GoalCreate): Promise<GoalRead> {
  return API.post<GoalRead>('/goals', data).then(r => r.data)
}

/* ── Update goal ───────────────────────────── */
export function updateGoal(
  id: number,
  data: GoalUpdate
): Promise<GoalRead> {
  return API.patch<GoalRead>(`/goals/${id}`, data).then(r => r.data)
}

/* ── Delete goal ────────────────────────────────────── */
export function deleteGoal(id: number): Promise<void> {
  return API.delete<void>(`/goals/${id}`).then(r => r.data)
}

/* ── Add or remove deposit ──────────────────────────── */
export function addDeposit(
  id: number,
  amount: number
): Promise<GoalDepositRead> {
  return API
    .post<GoalDepositRead>(`/goals/${id}/deposits`, { amount })
    .then(r => r.data);
}