// frontend/src/services/accounts.ts
import API from './api'
import type { AccountCreate, AccountRead, AccountUpdate } from '../types'

/* ── Fetch all accounts ─────────────────────────────── */
export function fetchAccounts(): Promise<AccountRead[]> {
  return API.get<AccountRead[]>('/accounts/').then(r => r.data)
}

/* ── Create account ───────────────────────────── */
export function createAccount(data: AccountCreate): Promise<AccountRead> {
  return API.post<AccountRead>('/accounts/', data).then(r => r.data)
}

/* ── Update account ─────────────────────── */
export function updateAccount(
  id: number,
  data: AccountUpdate
): Promise<AccountRead> {
  return API.patch<AccountRead>(`/accounts/${id}/`, data).then(r => r.data)
}

/* ── Delete account ──────────────────────────────── */
export function deleteAccount(id: number): Promise<void> {
  return API.delete<void>(`/accounts/${id}/`).then(() => {})
}
