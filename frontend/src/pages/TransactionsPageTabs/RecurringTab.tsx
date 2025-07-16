// frontend/src/pages/TransactionsPageTabs/RecurringTab.tsx
import React, { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Spinner from '../../components/Spinner';
import { fetchAccounts }    from '../../services/accounts';
import {
  fetchRecurring,
  createRecurring,
  deleteRecurring,
} from '../../services/recurring';
import type {
  RecurringRead,
  RecurringCreate,
  AccountRead,
} from '../../types';

export default function RecurringTab(): JSX.Element {
  const qc = useQueryClient();

  // ─── Lookups ────────────────────────────────────────
  const { data: accounts = [] } = useQuery<AccountRead[], Error>({
    queryKey: ['accounts'],
    queryFn:  fetchAccounts,
  });

  // ─── Recurring items ────────────────────────────────
  const {
    data: recs = [],
    isLoading,
    isError,
    error,
  } = useQuery<RecurringRead[], Error>({
    queryKey: ['recurring'],
    queryFn:  fetchRecurring,
  });

  const createRec = useMutation<RecurringRead, Error, RecurringCreate>({
    mutationFn: createRecurring,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  });
  const deleteRec = useMutation<void, Error, number>({
    mutationFn: deleteRecurring,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  });

  // ─── Form state ─────────────────────────────────────
  const [recAccount,  setRecAccount]  = useState<number | ''>('');
  const [recAmount,   setRecAmount]   = useState('');
  const [recFreq,     setRecFreq]     = useState<'daily'|'weekly'|'monthly'|'yearly'>('monthly');
  const [recStart,    setRecStart]    = useState('');
  const [recNextRun,  setRecNextRun]  = useState('');
  const [recEnd,      setRecEnd]      = useState('');

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!recAccount || !recStart || !recNextRun) return;
    createRec.mutate({
      account_id:   +recAccount,
      amount:        parseFloat(recAmount),
      frequency:     recFreq,
      start_date:    recStart,
      next_run_date: recNextRun,
      end_date:      recEnd || undefined,
    });
  };

  if (isLoading) return <Spinner />;
  if (isError)   return <p style={{ color: 'crimson' }}>{error?.message}</p>;

  return (
    <>
      <h3>Recurring Transactions</h3>

      <form
        onSubmit={handleAdd}
        style={{ display:'flex', gap:'.5rem', marginBottom:'1rem' }}
      >
        <select
          value={recAccount}
          onChange={e => setRecAccount(e.target.value ? +e.target.value : '')}
        >
          <option value="">Account</option>
          {accounts.map(a => (
            <option key={a.account_id} value={a.account_id}>
              {a.name}
            </option>
          ))}
        </select>


        <input
          type="number"
          placeholder="Amount"
          step="0.01"
          value={recAmount}
          onChange={e => setRecAmount(e.target.value)}
        />

        <select
          value={recFreq}
          onChange={e => setRecFreq(e.target.value as any)}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>

        <input
          type="date"
          value={recStart}
          onChange={e => setRecStart(e.target.value)}
        />
        <input
          type="date"
          value={recNextRun}
          onChange={e => setRecNextRun(e.target.value)}
        />
        <input
          type="date"
          value={recEnd}
          onChange={e => setRecEnd(e.target.value)}
        />

        <button
          type="submit"
          disabled={createRec.status == 'pending'}
        >
          {createRec.status == 'pending' ? '…' : 'Add'}
        </button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Account</th>
            <th>Amount</th>
            <th>Freq</th>
            <th>Next Run</th>
            <th>🗑</th>
          </tr>
        </thead>
        <tbody>
          {recs.map(r => (
            <tr key={r.recurring_id}>
              <td>{accounts.find(a => a.account_id === r.account_id)?.name}</td>
              <td>${r.amount.toFixed(2)}</td>
              <td>{r.frequency}</td>
              <td>{new Date(r.next_run_date).toLocaleDateString()}</td>
              <td>
                <button
                  onClick={() => deleteRec.mutate(r.recurring_id)}
                  disabled={deleteRec.status == 'pending'}
                >
                  {deleteRec.status == 'pending' ? '…' : '❌'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
