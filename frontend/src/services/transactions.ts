// frontend/src/services/transactions.ts
import API from './api';
import type { TransactionRead, TransactionCreate, TransactionUpdate, Paged } from '../types';

export function fetchTransactions(params: {
  page: number
  page_size: number
  start?: string
  end?: string
  account?: number
}): Promise<Paged<TransactionRead>> {
  return API.get<Paged<TransactionRead>>('/transactions/', { params })
    .then(res => res.data)
}

export function createTransaction(data: TransactionCreate): Promise<TransactionRead> {
  return API.post<TransactionRead>('/transactions/', data).then(res => res.data)
}

export function updateTransaction(
  id: number,
  data: TransactionUpdate
): Promise<TransactionRead> {
  return API.patch<TransactionRead>(`/transactions/${id}/`, data).then(res => res.data)
}

export function deleteTransaction(id: number): Promise<void> {
  return API.delete<void>(`/transactions/${id}/`).then(() => {})
}