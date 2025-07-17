// frontend/src/pages/Accounts.tsx
import React, { useState, FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Spinner from '../components/Spinner'
import { fetchAccounts, createAccount, updateAccount, deleteAccount } from '../services/accounts'
import type { AccountRead, AccountCreate, AccountUpdate } from '../types'

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export default function AccountsPage(): JSX.Element {
  const qc = useQueryClient()

  // ── Fetch list of accounts ──────────────────────────
  const {
    data: accounts = [],
    isLoading,
    isError,
    error,
  } = useQuery<AccountRead[], Error>({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  })

  // ── Mutations ────────────────────────────────────────
  const createMut = useMutation<AccountRead, Error, AccountCreate>({
    mutationFn: createAccount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] })
      setShowForm(false)
    },
  })

   const updateMut = useMutation<AccountRead, Error, { id: number; data: AccountUpdate }>({
    mutationFn: ({ id, data }) => updateAccount(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  })

  const deleteMut = useMutation<void, Error, number>({
    mutationFn: deleteAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  })

  // ── UI state ────────────────────────────────────────
  const [showForm, setShowForm] = useState(false)
  const [newForm, setNewForm] = useState<AccountCreate>({
    name: '',
    account_type: 'checking',
    balance: 0,
    currency: 'USD',
    is_active: true,
  })
  const [editing, setEditing] = useState<Record<number, boolean>>({})
  const [editForm, setEditForm] = useState<Record<number, AccountUpdate>>({})

  if (isLoading) return <Spinner />
  if (isError) return <p style={{ color: 'crimson' }}>{error.message}</p>

  // ── Summary ─────────────────────────────────────────
  const totalBalance = accounts
    .reduce((sum, a) => sum + a.balance, 0)
    .toFixed(2)

  return (
    <section className="accounts-page">
      <h2>Accounts</h2>

      {/* Toggle add form */}
      <button onClick={() => setShowForm(f => !f)}>
        {showForm ? 'Cancel' : '+ Add Account'}
      </button>

      {/* Summary */}
      <p style={{ marginTop: 8 }}>
        Total Accounts: {accounts.length} | Total Balance: ${totalBalance}
      </p>

      {/* Add-account form */}
      {showForm && (
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            createMut.mutate(newForm)
          }}
          style={{ margin: '1rem 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}
        >
          <label>
            Name<br/>
            <input
              placeholder="Name"
              value={newForm.name}
              onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </label>

          <label>
            Type<br/>
            <select
              value={newForm.account_type}
              onChange={e =>
                setNewForm(f => ({
                  ...f,
                  account_type: e.target.value as AccountCreate['account_type'],
                }))
              }
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="credit">Credit</option>
              <option value="cash">Cash</option>
            </select>
          </label>

          <label>
            Balance<br/>
            <input
              type="number"
              step="0.01"
              value={newForm.balance}
              onChange={e =>
                setNewForm(f => ({ ...f, balance: +e.target.value }))
              }
            />
          </label>

          <button type="submit" disabled={createMut.status == 'pending'}>
            {createMut.status == 'pending' ? <Spinner /> : 'Create'}
          </button>
        </form>
      )}

      {/* Account cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))',
          gap: 16,
          marginTop: 16,
        }}
      >
        {accounts.map(a => {
          const isEdit = !!editing[a.account_id]
          const base: AccountUpdate = {
            name:          a.name,
            account_type:  a.account_type,
            balance:       a.balance,
            currency:      a.currency,
            is_active:     a.is_active,
          }
          
          const form = editForm[a.account_id] ?? base

          return (
            <div
              key={a.account_id}
              style={{ border: '1px solid #ccc', padding: 16, borderRadius: 8 }}
            >
              {isEdit ? (
                <>
                  {/* Inline edit form with labels */}
                  <label>
                    Name 
                    <input
                      value={form.name}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [a.account_id]: { ...form, name: e.target.value },
                        }))
                      }
                    />
                    <br/>
                  </label>

                  <label>
                    Type
                    <select
                      value={form.account_type}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [a.account_id]: {
                            ...form,
                            account_type: e.target.value as AccountUpdate['account_type'],
                          },
                        }))
                      }
                    >
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                      <option value="credit">Credit</option>
                      <option value="cash">Cash</option>
                    </select>
                    <br/>
                  </label>

                  <label>
                    Balance
                    <input
                      type="number"
                      step="0.01"
                      value={form.balance}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [a.account_id]: {
                            ...form,
                            balance: +e.target.value,
                          },
                        }))
                      }
                    />
                    <br/>
                  </label>


                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button
                      onClick={() =>
                        updateMut.mutate({ id: a.account_id, data: form })
                      }
                      disabled={updateMut.status == 'pending'}
                    >
                      {updateMut.status == 'pending' ? '…' : 'Save'}
                    </button>
                    <button
                      onClick={() =>
                        setEditing(e => ({ ...e, [a.account_id]: false }))
                      }
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Read-only view */}
                  <h4>{a.name}</h4>
                  <p>
                    <strong>Type:</strong> {capitalize(a.account_type)}
                  </p>
                  <p>
                    <strong>Balance:</strong> ${a.balance.toFixed(2)}{' '}
                    {a.currency}
                  </p>

                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        setEditForm(f => ({ ...f, [a.account_id]: base }))
                        setEditing(e => ({ ...e, [a.account_id]: true }))
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteMut.mutate(a.account_id)}
                      disabled={deleteMut.status == 'pending'}
                    >
                      {deleteMut.status == 'pending' ? '…' : 'Delete'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
