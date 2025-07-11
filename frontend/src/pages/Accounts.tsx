// frontend/src/pages/Accounts.tsx
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAccounts, createAccount, deleteAccount } from '../services/accounts'
import type { AccountRead, AccountCreate } from '../types'
import Spinner from '../components/Spinner'

export default function AccountsPage() {
  const qc = useQueryClient()

  // Fetch list
  const {
    data: accounts = [],
    isLoading: loadingList,
  } = useQuery<AccountRead[], Error>({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  })

  // Create
  const createMut = useMutation<AccountRead, Error, AccountCreate>({
    mutationFn: createAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  })

  // Delete
  const deleteMut = useMutation<void, Error, number>({
    mutationFn: deleteAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  })

  // Local form
  const [form, setForm] = useState<AccountCreate>({
    name: '',
    type: 'checking',
    balance: 0,
    currency: 'USD',
    is_active: true,
  })

  if (loadingList) return <Spinner />

  return (
    <section>
      <h2>Accounts</h2>
      <ul>
        {accounts.map(a => (
          <li key={a.account_id}>
            {a.name} — {a.balance.toFixed(2)} {a.currency}
            <button
              onClick={() => deleteMut.mutate(a.account_id)}
              disabled={deleteMut.status === 'pending'}
            >
              {deleteMut.status === 'pending' ? '…' : 'Delete'}
            </button>
          </li>
        ))}
      </ul>

      <h3>Add New Account</h3>
      <form
        onSubmit={e => {
          e.preventDefault()
          createMut.mutate(form)
        }}
      >
        <input
          placeholder="Name"
          value={form.name}
          onChange={e =>
            setForm(prev => ({ ...prev, name: e.target.value }))
          }
          required
        />

        <input
          placeholder="Type"
          value={form.type}
          onChange={e =>
            setForm(prev => ({ ...prev, type: e.target.value }))
          }
        />

        <input
          type="number"
          placeholder="Balance"
          value={form.balance}
          onChange={e =>
            setForm(prev => ({ ...prev, balance: +e.target.value }))
          }
        />

        <input
          placeholder="Currency"
          value={form.currency}
          onChange={e =>
            setForm(prev => ({ ...prev, currency: e.target.value }))
          }
        />

        <button type="submit" disabled={createMut.status === 'pending'}>
          {createMut.status === 'pending' ? <Spinner /> : 'Create'}
        </button>
      </form>
    </section>
  )
}
