// frontend/src/services/recurring.ts
import API from './api'
import type { RecurringRead, RecurringCreate, RecurringUpdate } from '../types'

/* ── Fetch all recurring transactions ─────────────────── */
export function fetchRecurring(): Promise<RecurringRead[]> {
  return API.get<RecurringRead[]>('/recurring').then(r => r.data)
}

/* ── Add recurring transaction ─────────────────── */
export function createRecurring(r: RecurringCreate): Promise<RecurringRead> {
  return API.post<RecurringRead>('/recurring', r).then(rsp => rsp.data)
}

/* ── Update recurring ────────────────────── */
export function updateRecurring(
  id: number,
  r: RecurringUpdate
): Promise<RecurringRead> {
  return API.patch<RecurringRead>(`/recurring/${id}`, r).then(rsp => rsp.data)
}

/* ── Remove recurring transaction ──────────────────── */
export function deleteRecurring(id: number): Promise<void> {
  return API.delete<void>(`/recurring/${id}`).then(() => {})
}
