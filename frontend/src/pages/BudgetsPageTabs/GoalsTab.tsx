// frontend/src/pages/BudgetsPageTabs/GoalsTab.tsx
import React, { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Spinner from '../../components/Spinner';
import { fetchGoals, createGoal, updateGoal, deleteGoal, addDeposit } from '../../services/goals';
import type { GoalRead, GoalCreate, GoalUpdate, GoalDepositRead } from '../../types';

export default function GoalsTab(): JSX.Element {
  const qc = useQueryClient();

  // ── Fetch goals ────────────────────────────────────────
  const {
    data: goals = [],
    isLoading,
    isError,
    error,
  } = useQuery<GoalRead[], Error>({
    queryKey: ['goals'],
    queryFn: fetchGoals,
  });

  // ── Mutations ──────────────────────────────────────────
  const createMut = useMutation<GoalRead, Error, GoalCreate>({
    mutationFn: createGoal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });

  const updateMut = useMutation<GoalRead, Error, { id: number; data: GoalUpdate }>({
    mutationFn: ({ id, data }) => updateGoal(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });

  const deleteMut = useMutation<void, Error, number>({
    mutationFn: deleteGoal,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });

  const depositMut = useMutation<GoalDepositRead, Error, { id: number; amount: number }>({
    mutationFn: ({ id, amount }) => addDeposit(id, amount),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });

  // ── Form state ─────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [target, setTarget] = useState('');
  const [byDate, setByDate] = useState('');
  const [deposits, setDeposits] = useState<Record<number, string>>({});

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!title || !target || !byDate) return;
    createMut.mutate({
      title,
      description: desc || undefined,
      target_amount: parseFloat(target),
      target_date: byDate,
    });
    setTitle(''); setDesc(''); setTarget(''); setByDate('');
  }

  if (isLoading) return <Spinner />;
  if (isError) return <p style={{ color: 'crimson' }}>{error?.message}</p>;

  return (
    <>
      <h2>Goals</h2>
      <form
        onSubmit={handleAdd}
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}
      >
        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
        <input placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
        <input
          type="number"
          placeholder="Target Amount"
          value={target}
          onChange={e => setTarget(e.target.value)}
          step="0.01"
          required
        />
        <input type="date" value={byDate} onChange={e => setByDate(e.target.value)} required />
        <button type="submit" disabled={createMut.status === 'pending'}>
          {createMut.status === 'pending' ? '…' : 'Add Goal'}
        </button>
      </form>

      <div style={{ display: 'grid', gap: 16 }}>
        {goals.map(g => {
          const pct = Math.floor((g.current_amount / g.target_amount) * 100);
          return (
            <div key={g.goal_id} style={{ border: '1px solid #ccc', padding: 16, borderRadius: 4 }}>
              <h3>{g.title}</h3>
              {g.description && <p>{g.description}</p>}
              <progress value={pct} max={100} style={{ width: '100%' }} />
              <p>${g.current_amount.toFixed(2)} / ${g.target_amount.toFixed(2)} ({pct}%)</p>
              <p>By: {new Date(g.target_date).toLocaleDateString()}</p>

              {/* Deposit/Subtract Section */}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  type="number"
                  placeholder="Amount"
                  step="0.01"
                  value={deposits[g.goal_id] || ''}
                  onChange={e => setDeposits(prev => ({ ...prev, [g.goal_id]: e.target.value }))}
                />
                <button
                  onClick={() => {
                    const amt = parseFloat(deposits[g.goal_id] || '');
                    if (isNaN(amt) || amt <= 0) return;
                    depositMut.mutate({ id: g.goal_id, amount: amt });
                    setDeposits(prev => ({ ...prev, [g.goal_id]: '' }));
                  }}
                  disabled={depositMut.status === 'pending'}
                >
                  {depositMut.status === 'pending' ? '…' : 'Deposit'}
                </button>
                <button
                  onClick={() => {
                    const amt = parseFloat(deposits[g.goal_id] || '');
                    if (isNaN(amt) || amt <= 0) return;
                    depositMut.mutate({ id: g.goal_id, amount: -amt });
                    setDeposits(prev => ({ ...prev, [g.goal_id]: '' }));
                  }}
                  disabled={depositMut.status === 'pending'}
                >
                  {depositMut.status === 'pending' ? '…' : 'Withdraw'}
                </button>
                <button
                  onClick={() => deleteMut.mutate(g.goal_id)}
                  disabled={deleteMut.status === 'pending'}
                >
                  {deleteMut.status === 'pending' ? '…' : '❌'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
