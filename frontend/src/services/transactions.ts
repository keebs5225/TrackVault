// frontend/src/services/transactions.ts
import API from './api';
import type { TransactionRead, TransactionCreate, TransactionUpdate, Paged } from '../types';

export const fetchTransactions = (params: {
  page: number;
  page_size: number;
  start?: string;
  end?: string;
  account?: number;
}) =>
  API.get<Paged<TransactionRead>>('/transactions', { params })
     .then(res => res.data);

export const createTransaction = (t: TransactionCreate) =>
  API.post<TransactionRead>('/transactions', t).then(res => res.data);

export const updateTransaction = (id: number, t: TransactionUpdate) =>
  API.patch<TransactionRead>(`/transactions/${id}`, t).then(res => res.data);

export const deleteTransaction = (id: number) =>
  API.delete<void>(`/transactions/${id}`);
