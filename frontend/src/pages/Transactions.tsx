// frontend/src/pages/Transactions.tsx
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTransactions, createTransaction, updateTransaction, deleteTransaction} from '../services/transactions';
import type { TransactionRead, TransactionCreate, TransactionUpdate, Paged} from '../types.ts';
import Spinner from '../components/Spinner';

// (need to fetch accounts/categories for the dropdowns similarly)
export default function TransactionsPage() {
  const qc = useQueryClient()

  // filter & paging state
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [account, setAccount] = useState<number | ''>('')
  const [category, setCategory] = useState<number | ''>('')

  // fetch paged & filtered
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery<Paged<TransactionRead>, Error>({
    queryKey: ['transactions', { page, pageSize, start, end, account, category }],
    queryFn: () =>
      fetchTransactions({
        page,
        page_size: pageSize,
        start: start || undefined,
        end: end || undefined,
        account: account || undefined,
        category: category || undefined,
      }),
  })

  // ─── mutations ───────────────────────────────────────

  // create
  const createMut = useMutation<TransactionRead, Error, TransactionCreate>({
    mutationFn: createTransaction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })

  // update
  const updateMut = useMutation<TransactionRead, Error, { id: number; data: TransactionUpdate }>({
    mutationFn: ({ id, data }) => updateTransaction(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })

  // delete
const deleteMut = useMutation<void, Error, number>({
  mutationFn: (id: number) =>
    deleteTransaction(id).then(() => {
      // TypeScript sees this as Promise<void>
    }),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
})

  if (isLoading) return <Spinner />
  if (isError) return <p style={{ color: 'crimson' }}>{error.message}</p>

  return (
    <section>
      <h2>Transactions</h2>

      {/* ─── Filter panel ─────────────────────────────── */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <label>
          Start:
          <input type="date" value={start} onChange={e => setStart(e.target.value)} />
        </label>
        <label>
          End:
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} />
        </label>
        <label>
          Account ID:
          <input
            type="number"
            value={account}
            onChange={e => setAccount(e.target.value ? +e.target.value : '')}
          />
        </label>
        <label>
          Category ID:
          <input
            type="number"
            value={category}
            onChange={e => setCategory(e.target.value ? +e.target.value : '')}
          />
        </label>
        <button onClick={() => setPage(1)}>Apply</button>
      </div>

      {/* ─── Table ─────────────────────────────────────── */}
      <table>
        <thead>
          <tr>
            <th>Date</th><th>Description</th><th>Acct</th><th>Cat</th>
            <th>Type</th><th>Amount</th><th>Notes</th><th>🗑</th>
          </tr>
        </thead>
        <tbody>
          {data!.items.map(tx => (
            <tr key={tx.transaction_id}>
              <td>{new Date(tx.date).toLocaleDateString()}</td>
              <td>{tx.description}</td>
              <td>{tx.account_id}</td>
              <td>{tx.category_id}</td>
              <td>{tx.type}</td>
              <td>{tx.amount.toFixed(2)}</td>
              <td>{tx.notes || '—'}</td>
              <td>
                <button
                  onClick={() => deleteMut.mutate(tx.transaction_id)}
                  disabled={deleteMut.status === 'pending'}
                >
                  {deleteMut.status === 'pending' ? '…' : '❌'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ─── Pagination ────────────────────────────────── */}
      <div style={{ marginTop: '1rem' }}>
        <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>
          Previous
        </button>
        <span style={{ margin: '0 1rem' }}>
          Page {page} / {Math.ceil(data!.total / pageSize)}
        </span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={page * pageSize >= data!.total}
        >
          Next
        </button>
      </div>
    </section>
  )
}
// Note: This is a basic implementation. You would typically want to add more features like
// form validation, better error handling, and possibly a modal for creating/editing transactions.
// You might also want to fetch accounts and categories for the dropdowns, which can be done