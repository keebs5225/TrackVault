// frontend/src/pages/TransactionsPageTabs/TransactionsTab.tsx
import React, { useState, FormEvent, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Spinner from '../../components/Spinner'
import { fetchAccounts } from '../../services/accounts'
import {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../../services/transactions'
import type {
  TransactionRead,
  TransactionCreate,
  TransactionUpdate,
  AccountRead,
  Paged,
} from '../../types'
import '../../styles/global.css'
import '../../styles/transactions.css'

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const pageSize = 100

/* ---------- sorting ------------ */
type BaseSortKey =
  | 'date_desc'
  | 'date_asc'
  | 'amount_desc'
  | 'amount_asc'
  | 'title_az'
  | 'title_za'
  | 'account_az'
  | 'deposit_first'
  | 'withdraw_first'

type SortKey = BaseSortKey | `acc_${number}` // dynamic “account first” keys

export default function TransactionsTab(): JSX.Element {
  const qc = useQueryClient()

  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], [])

  /* Lookups */
  const { data: accounts = [] } = useQuery<AccountRead[], Error>({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  })

  /* Fetch transactions */
  const {
    data: txs = {
      items: [],
      total: 0,
      page: 1,
      page_size: pageSize,
    } as Paged<TransactionRead>,
    isLoading,
    isError,
    error,
  } = useQuery<Paged<TransactionRead>, Error>({
    queryKey: ['transactions'],
    queryFn: () => fetchTransactions({ page: 1, page_size: pageSize }),
  })

  /* Mutations */
  const createMut = useMutation<TransactionRead, Error, TransactionCreate>({
    mutationFn: createTransaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
  const updateMut = useMutation<
    TransactionRead,
    Error,
    { id: number; data: TransactionUpdate }
  >({
    mutationFn: ({ id, data }) => updateTransaction(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['accounts'] })
    },
    onError: err => console.error('Update failed:', err),
  })

  const deleteMut = useMutation<void, Error, number>({
    mutationFn: id => deleteTransaction(id).then(() => {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  /* UI state */
  const [showForm, setShowForm] = useState(false)

  // create form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayISO)
  const [acct, setAcct] = useState<number | ''>('')
  const [amount, setAmount] = useState('')
  const [direction, setDirection] = useState<'deposit' | 'withdrawal'>('deposit')

  // inline edit
  const [editing, setEditing] = useState<Record<number, boolean>>({})
  const [editForm, setEditForm] = useState<Record<number, TransactionUpdate>>({})

  // sort state
  const [sortBy, setSortBy] = useState<SortKey>('date_desc')

  const acctName = (id: number) =>
    accounts.find(a => a.account_id === id)?.name ?? '—'

  /* Sort functions */
  const defaultTieBreak = (a: TransactionRead, b: TransactionRead) =>
    new Date(b.date).getTime() - new Date(a.date).getTime() // newest first as secondary criteria

  const SORTS: Record<SortKey, (a: TransactionRead, b: TransactionRead) => number> =
    useMemo(() => {
      const base: Record<BaseSortKey, (a: TransactionRead, b: TransactionRead) => number> = {
        date_desc: (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        date_asc: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        amount_desc: (a, b) => b.amount - a.amount,
        amount_asc: (a, b) => a.amount - b.amount,
        title_az: (a, b) => a.title.localeCompare(b.title),
        title_za: (a, b) => b.title.localeCompare(a.title),
        account_az: (a, b) =>
          acctName(a.account_id).localeCompare(acctName(b.account_id)),
        deposit_first: (a, b) =>
          (a.direction === 'withdrawal' ? 1 : 0) - (b.direction === 'withdrawal' ? 1 : 0),
        withdraw_first: (a, b) =>
          (a.direction === 'deposit' ? 1 : 0) - (b.direction === 'deposit' ? 1 : 0),
      }

      // build account-first keys
      const accSortsEntries = accounts.map<[SortKey, (a: TransactionRead, b: TransactionRead) => number]>(
        acc => {
          const key: SortKey = `acc_${acc.account_id}`
          return [
            key,
            (a, b) => {
              const aIs = a.account_id === acc.account_id
              const bIs = b.account_id === acc.account_id
              if (aIs && !bIs) return -1
              if (!aIs && bIs) return 1
              return defaultTieBreak(a, b)
            },
          ]
        }
      )

      return { ...base, ...Object.fromEntries(accSortsEntries) }
    }, [accounts])

  const sortedTxs = useMemo(
    () => [...txs.items].sort(SORTS[sortBy]),
    [txs.items, SORTS, sortBy]
  )

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!title || !date || !acct || !amount) return
    createMut.mutate({
      title,
      description,
      date,
      account_id: +acct,
      amount: parseFloat(amount),
      direction,
    })
    setTitle('')
    setDescription('')
    setDate(todayISO)
    setAcct('')
    setAmount('')
    setDirection('deposit')
    setShowForm(false)
  }

  if (isLoading) return <Spinner />
  if (isError) {
    return (
      <section className="transactions-page">
        <h1>Transactions</h1>
        <p className="error-message">{error?.message}</p>
      </section>
    )
  }

  /* Summary */
  const showing = txs.items.length
  const total = txs.total

  return (
    <section className="transactions-page">
      <h1>Transactions</h1>

      <div className="header-row">
        <button
          className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => setShowForm(s => !s)}
        >
          {showForm ? 'Close Form' : '+ New Transaction'}
        </button>

        {/* Sort dropdown with optgroups */}
        <select
          className="tv-select sort-select"
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortKey)}
        >
          <optgroup label="Title">
            <option value="title_az">Title (A→Z)</option>
            <option value="title_za">Title (Z→A)</option>
          </optgroup>

          <optgroup label="Date">
            <option value="date_desc">Date (Newest)</option>
            <option value="date_asc">Date (Oldest)</option>
          </optgroup>

          <optgroup label="Account">
            {accounts.map(a => (<option key={a.account_id} value={`acc_${a.account_id}`}>{a.name}</option>))}
          </optgroup>

          <optgroup label="Amount">
            <option value="amount_desc">Amount (Highest)</option>
            <option value="amount_asc">Amount (Lowest)</option>
          </optgroup>

          <optgroup label="Action">
            <option value="deposit_first">Deposits</option>
            <option value="withdraw_first">Withdrawals</option>
          </optgroup>
        </select>
      </div>

      <p className="summary">
        Showing {showing} of {total}
      </p>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="card tv-form-card tv-form">
          <label className="tv-field">
            <span className="tv-label">Title</span>
            <input
              className="tv-input"
              placeholder="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </label>

          <label className="tv-field">
            <span className="tv-label">Description (Optional)</span>
            <input
              className="tv-input"
              placeholder="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </label>

          <label className="tv-field">
            <span className="tv-label">Date of Transaction</span>
            <input
              className="tv-input"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </label>

          <label className="tv-field">
            <span className="tv-label">Account</span>
            <select
              className="tv-select"
              value={acct}
              onChange={e => setAcct(e.target.value ? +e.target.value : '')}
              required
            >
              <option value="">Select account</option>
              {accounts.map(a => (
                <option key={a.account_id} value={a.account_id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          <label className="tv-field">
            <span className="tv-label">Amount</span>
            <input
              className="tv-input"
              type="number"
              placeholder="$0.00"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </label>

          <label className="tv-field">
            <span className="tv-label">Action</span>
            <select
              className="tv-select"
              value={direction}
              onChange={e => setDirection(e.target.value as 'deposit' | 'withdrawal')}
            >
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
            </select>
          </label>

          <div className="tv-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMut.status === 'pending'}
            >
              {createMut.status === 'pending' ? <Spinner /> : 'Add Transaction'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="transactions-grid">
        {sortedTxs.map(tx => {
          const isEdit = !!editing[tx.transaction_id]
          const base: TransactionUpdate = {
            title: tx.title,
            description: tx.description,
            date: tx.date.split('T')[0],
            account_id: tx.account_id,
            amount: tx.amount,
            direction: tx.direction as 'deposit' | 'withdrawal',
          }
          const form = editForm[tx.transaction_id] ?? base

          return (
            <div key={tx.transaction_id} className="transaction-card">
              {isEdit ? (
                <>
                  <label className="tv-field">
                    <span className="tv-label">Title</span>
                    <input
                      className="tv-input"
                      value={form.title}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [tx.transaction_id]: { ...form, title: e.target.value },
                        }))
                      }
                    />
                  </label>

                  <label className="tv-field">
                    <span className="tv-label">Description</span>
                    <input
                      className="tv-input"
                      value={form.description}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [tx.transaction_id]: { ...form, description: e.target.value },
                        }))
                      }
                    />
                  </label>

                  <label className="tv-field">
                    <span className="tv-label">Date of Transaction</span>
                    <input
                      className="tv-input"
                      type="date"
                      value={form.date as string}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [tx.transaction_id]: { ...form, date: e.target.value },
                        }))
                      }
                    />
                  </label>

                  <label className="tv-field">
                    <span className="tv-label">Account</span>
                    <select
                      className="tv-select"
                      value={form.account_id}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [tx.transaction_id]: { ...form, account_id: +e.target.value },
                        }))
                      }
                    >
                      {accounts.map(a => (
                        <option key={a.account_id} value={a.account_id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="tv-field">
                    <span className="tv-label">Amount ($)</span>
                    <input
                      className="tv-input"
                      type="number"
                      step="1"
                      value={form.amount}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [tx.transaction_id]: {
                            ...form,
                            amount: parseFloat(e.target.value),
                          },
                        }))
                      }
                    />
                  </label>

                  <label className="tv-field">
                    <span className="tv-label">Action</span>
                    <select
                      className="tv-select"
                      value={form.direction}
                      onChange={e =>
                        setEditForm(f => ({
                          ...f,
                          [tx.transaction_id]: {
                            ...form,
                            direction: e.target.value as 'deposit' | 'withdrawal',
                          },
                        }))
                      }
                    >
                      <option value="deposit">Deposit</option>
                      <option value="withdrawal">Withdrawal</option>
                    </select>
                  </label>

                  <div className="tv-actions--split">
                    <div className="left">
                      <button
                        className="btn btn-danger"
                        onClick={() => deleteMut.mutate(tx.transaction_id)}
                        disabled={deleteMut.status === 'pending'}
                      >
                        {deleteMut.status === 'pending' ? '…' : 'Delete'}
                      </button>
                    </div>

                    <div className="right">
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          updateMut.mutate({ id: tx.transaction_id, data: form })
                          setEditing(e => ({ ...e, [tx.transaction_id]: false }))
                        }}
                        disabled={updateMut.status === 'pending'}
                      >
                        {updateMut.status === 'pending' ? '…' : 'Save'}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() =>
                          setEditing(e => ({ ...e, [tx.transaction_id]: false }))
                        }
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    <b>{capitalize(tx.title)}</b> —{' '}
                    {new Date(tx.date).toLocaleDateString()} —{' '}
                    <em>{tx.direction.toUpperCase()}</em>
                  </p>
                  {tx.description && (
                    <p>
                      <strong>Description:</strong> {tx.description}
                    </p>
                  )}
                  <p><strong>Account:</strong>{' '}{acctName(tx.account_id)}</p>
                  <p><strong>Amount:</strong> ${tx.amount.toFixed(2)}</p>

                  <div className="tv-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setEditForm(f => ({ ...f, [tx.transaction_id]: base }))
                        setEditing(e => ({ ...e, [tx.transaction_id]: true }))
                      }}
                    >
                      Edit
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
