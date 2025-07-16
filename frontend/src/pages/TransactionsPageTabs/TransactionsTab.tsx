// frontend/src/pages/TransactionsPageTabs/TransactionsTab.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Spinner from '../../components/Spinner';
import { fetchAccounts }    from '../../services/accounts';
import {
  fetchTransactions,
  deleteTransaction,
} from '../../services/transactions';
import type {
  TransactionRead,
  Paged,
  AccountRead,
} from '../../types';

const pageSize = 10;

export default function TransactionsTab(): JSX.Element {
  const qc = useQueryClient();

  // ─── Filters state ─────────────────────────────────
  const [page, setPage]             = useState(1);
  const [start, setStart]           = useState('');
  const [end, setEnd]               = useState('');
  const [filterAcct, setFilterAcct] = useState<number | ''>('');
  const [filterCat, setFilterCat]   = useState<number | ''>('');

  // ─── Lookups ────────────────────────────────────────
  const { data: accounts = [] } = useQuery<AccountRead[], Error>({
    queryKey: ['accounts'],
    queryFn:  fetchAccounts,
  });

  // ─── Transactions page ──────────────────────────────
  const {
    data: txData,
    isLoading,
    isError,
    error,
  } = useQuery<Paged<TransactionRead>, Error>({
    queryKey: ['transactions', { page, start, end, filterAcct, filterCat }],
    queryFn: () =>
      fetchTransactions({
        page,
        page_size: pageSize,
        start: start || undefined,
        end:   end   || undefined,
        account:  filterAcct || undefined,
      }),
  });

  // ─── Delete mutation ────────────────────────────────
  const deleteTx = useMutation<void, Error, number>({
    // ensure we return Promise<void> instead of AxiosResponse
    mutationFn: (id: number) =>
      deleteTransaction(id).then(() => {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });

  if (isLoading) return <Spinner />;
  if (isError)   return <p style={{ color: 'crimson' }}>{error?.message}</p>;

  return (
    <>
      {/* Filters */}
      <div style={{ display:'flex', gap:'1rem', marginBottom:'1rem' }}>
        <label>
          Start:
          <input
            type="date"
            value={start}
            onChange={e => setStart(e.target.value)}
          />
        </label>
        <label>
          End:
          <input
            type="date"
            value={end}
            onChange={e => setEnd(e.target.value)}
          />
        </label>
        <label>
          Account:
          <select
            value={filterAcct}
            onChange={e => setFilterAcct(e.target.value ? +e.target.value : '')}
          >
            <option value="">All</option>
            {accounts.map(a => (
              <option key={a.account_id} value={a.account_id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Transaction Table */}
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Account</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Notes</th>
            <th>🗑</th>
          </tr>
        </thead>
        <tbody>
          {txData!.items.map(tx => (
            <tr key={tx.transaction_id}>
              <td>{new Date(tx.date).toLocaleDateString()}</td>
              <td>{tx.description}</td>
              <td>
                {accounts.find(a => a.account_id === tx.account_id)?.name}
              </td>
              <td>{tx.type}</td>
              <td>${tx.amount.toFixed(2)}</td>
              <td>{tx.notes || '—'}</td>
              <td>
                <button
                  onClick={() => deleteTx.mutate(tx.transaction_id)}
                  disabled={deleteTx.status == 'pending'}
                >
                  {deleteTx.status == 'pending' ? '…' : '❌'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div style={{ marginTop:'1rem' }}>
        <button
          onClick={() => setPage(p => Math.max(p - 1, 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span style={{ margin: '0 1rem' }}>
          Page {page} / {Math.ceil(txData!.total / pageSize)}
        </span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={page * pageSize >= txData!.total}
        >
          Next
        </button>
      </div>
    </>
  );
}
