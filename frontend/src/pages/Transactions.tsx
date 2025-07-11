// frontend/src/pages/Transactions.tsx
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTransactions, deleteTransaction } from '../services/transactions'
import type { TransactionRead, TransactionCreate, TransactionUpdate, Paged } from '../types'
import { fetchRecurring, createRecurring, deleteRecurring } from '../services/recurring'
import type { RecurringRead, RecurringCreate } from '../types'
import { fetchCategoryTree, createCategory, deleteCategory } from '../services/categories'
import type { CategoryRead, CategoryCreate } from '../types'
import { fetchAccounts } from '../services/accounts'
import type { AccountRead } from '../types'
import Spinner from '../components/Spinner'

type Tab = 'transactions' | 'recurring' | 'categories'

export default function TransactionsPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('transactions')

  // ─── Shared lookups ─────────────────────────────────
  const { data: accounts = [] } = useQuery<AccountRead[], Error>({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  })
  const { data: categories = [] } = useQuery<CategoryRead[], Error>({
    queryKey: ['categories', 'flat'],
    queryFn: fetchCategoryTree,
  })

  // ─── Transactions ──────────────────────────────────
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [filterAcct, setFilterAcct] = useState<number | ''>('')
  const [filterCat, setFilterCat] = useState<number | ''>('')

  const {
    data: txData,
    isLoading: txLoading,
    isError: txError,
    error: txErrorObj,
  } = useQuery<Paged<TransactionRead>, Error>({
    queryKey: ['transactions', { page, start, end, filterAcct, filterCat }],
    queryFn: () =>
      fetchTransactions({
        page,
        page_size: pageSize,
        start: start || undefined,
        end: end || undefined,
        account: filterAcct || undefined,
        category: filterCat || undefined,
      }),
  })

  const deleteTx = useMutation<void, Error, number>({
    mutationFn: (id: number) =>
      deleteTransaction(id).then(() => {
        // return void
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })

  // ─── Recurring ─────────────────────────────────────
  const {
    data: recs = [],
    isLoading: recLoading,
    isError: recError,
    error: recErrorObj,
  } = useQuery<RecurringRead[], Error>({
    queryKey: ['recurring'],
    queryFn: fetchRecurring,
  })

  const createRec = useMutation<RecurringRead, Error, RecurringCreate>({
    mutationFn: createRecurring,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  })
  const deleteRec = useMutation<void, Error, number>({
    mutationFn: deleteRecurring,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  })

  const [recAccount, setRecAccount] = useState<number | ''>('')
  const [recCategory, setRecCategory] = useState<number | ''>('')
  const [recAmount, setRecAmount] = useState('')
  const [recFreq, setRecFreq] =
    useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
  const [recStart, setRecStart] = useState('')
  const [recNextRun, setRecNextRun] = useState('')
  const [recEnd, setRecEnd] = useState('')

  const handleAddRecurring = (e: React.FormEvent) => {
    e.preventDefault()
    if (!recAccount || !recCategory || !recStart || !recNextRun) return
    createRec.mutate({
      account_id:    +recAccount,
      category_id:   +recCategory,
      amount:        parseFloat(recAmount),
      frequency:     recFreq,
      start_date:    recStart,
      next_run_date: recNextRun,
      end_date:      recEnd || undefined,
    })
  }

  // ─── Categories ────────────────────────────────────
  const {
    data: tree = [],
    isLoading: catLoading,
    isError: catError,
    error: catErrorObj,
  } = useQuery<CategoryRead[], Error>({
    queryKey: ['categories', 'tree'],
    queryFn: fetchCategoryTree,
  })

  const createCat = useMutation<CategoryRead, Error, CategoryCreate>({
    mutationFn: createCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories', 'tree'] }),
  })
  const deleteCat = useMutation<void, Error, number>({
    mutationFn: deleteCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories', 'tree'] }),
  })

  const [newName, setNewName] = useState('')
  const [parentId, setParentId] = useState<number | ''>('')

  function renderNode(cat: CategoryRead, depth = 0): JSX.Element {
    return (
      <div key={cat.category_id} style={{ marginLeft: depth * 20 }}>
        • {cat.name}{' '}
        <button
          onClick={() => deleteCat.mutate(cat.category_id)}
          disabled={deleteCat.status === 'pending'}
        >
          ❌
        </button>
        {cat.children.map(c => renderNode(c, depth + 1))}
      </div>
    )
  }

  return (
    <section>
      <h2>TrackVault</h2>

      {/* ─── Tabs ───────────────────────────────────────── */}
      <div style={{ marginBottom: '1rem' }}>
        {(['transactions','recurring','categories'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              fontWeight: tab === t ? 'bold' : 'normal',
              marginRight: '1rem',
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ────────────────────────────────────────────────── */}
      {tab === 'transactions' && (
        txLoading ? <Spinner /> :
        txError   ? <p style={{ color:'crimson' }}>{txErrorObj!.message}</p> :
        <>
          {/* Filters */}
          <div style={{ display:'flex', gap:'1rem', marginBottom:'1rem' }}>
            <label>
              Start:
              <input type="date" value={start} onChange={e=>setStart(e.target.value)} />
            </label>
            <label>
              End:
              <input type="date" value={end} onChange={e=>setEnd(e.target.value)} />
            </label>
            <label>
              Account:
              <select
                value={filterAcct}
                onChange={e=>setFilterAcct(e.target.value ? +e.target.value : '')}
              >
                <option value="">All</option>
                {accounts.map(a=>(
                  <option key={a.account_id} value={a.account_id}>{a.name}</option>
                ))}
              </select>
            </label>
            <label>
              Category:
              <select
                value={filterCat}
                onChange={e=>setFilterCat(e.target.value ? +e.target.value : '')}
              >
                <option value="">All</option>
                {categories.map(c=>(
                  <option key={c.category_id} value={c.category_id}>{c.name}</option>
                ))}
              </select>
            </label>
            <button onClick={()=>setPage(1)}>Apply</button>
          </div>

          {/* Table */}
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Description</th><th>Account</th><th>Category</th>
                <th>Type</th><th>Amount</th><th>Notes</th><th>🗑</th>
              </tr>
            </thead>
            <tbody>
              {txData!.items.map(tx=>(
                <tr key={tx.transaction_id}>
                  <td>{new Date(tx.date).toLocaleDateString()}</td>
                  <td>{tx.description}</td>
                  <td>{accounts.find(a=>a.account_id===tx.account_id)?.name}</td>
                  <td>{categories.find(c=>c.category_id===tx.category_id)?.name}</td>
                  <td>{tx.type}</td>
                  <td>${tx.amount.toFixed(2)}</td>
                  <td>{tx.notes||'—'}</td>
                  <td>
                    <button
                      onClick={()=>deleteTx.mutate(tx.transaction_id)}
                      disabled={deleteTx.status === 'pending'}
                    >
                      {deleteTx.status === 'pending' ? '…' : '❌'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ marginTop:'1rem' }}>
            <button
              onClick={()=>setPage(p=>Math.max(p-1,1))}
              disabled={page===1}
            >
              Previous
            </button>
            <span style={{ margin:'0 1rem' }}>
              Page {page} / {Math.ceil(txData!.total / pageSize)}
            </span>
            <button
              onClick={()=>setPage(p=>p+1)}
              disabled={page*pageSize >= txData!.total}
            >
              Next
            </button>
          </div>
        </>
      )}

      {tab === 'recurring' && (
        recLoading ? <Spinner /> :
        recError   ? <p style={{ color:'crimson' }}>{recErrorObj!.message}</p> :
        <>
          <h3>Recurring Transactions</h3>
          <form
            onSubmit={handleAddRecurring}
            style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem' }}
          >
            <select
              value={recAccount}
              onChange={e=>setRecAccount(e.target.value ? +e.target.value : '')}
            >
              <option value="">Account</option>
              {accounts.map(a=>(
                <option key={a.account_id} value={a.account_id}>{a.name}</option>
              ))}
            </select>

            <select
              value={recCategory}
              onChange={e=>setRecCategory(e.target.value ? +e.target.value : '')}
            >
              <option value="">Category</option>
              {categories.map(c=>(
                <option key={c.category_id} value={c.category_id}>{c.name}</option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Amount"
              value={recAmount}
              onChange={e=>setRecAmount(e.target.value)}
              step="0.01"
            />

            <select
              value={recFreq}
              onChange={e=>setRecFreq(e.target.value as any)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>

            <input
              type="date"
              value={recStart}
              onChange={e=>setRecStart(e.target.value)}
            />
            <input
              type="date"
              value={recNextRun}
              onChange={e=>setRecNextRun(e.target.value)}
            />
            <input
              type="date"
              value={recEnd}
              onChange={e=>setRecEnd(e.target.value)}
            />

            <button type="submit" disabled={createRec.status === 'pending'}>
              {createRec.status === 'pending' ? '…' : 'Add'}
            </button>
          </form>

          <table>
            <thead>
              <tr>
                <th>Account</th><th>Category</th><th>Amount</th>
                <th>Freq</th><th>Next Run</th><th>🗑</th>
              </tr>
            </thead>
            <tbody>
              {recs.map(r=>(
                <tr key={r.recurring_id}>
                  <td>{accounts.find(a=>a.account_id===r.account_id)?.name}</td>
                  <td>{categories.find(c=>c.category_id===r.category_id)?.name}</td>
                  <td>${r.amount.toFixed(2)}</td>
                  <td>{r.frequency}</td>
                  <td>{new Date(r.next_run_date).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={()=>deleteRec.mutate(r.recurring_id)}
                      disabled={deleteRec.status === 'pending'}
                    >
                      {deleteRec.status === 'pending' ? '…' : '❌'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {tab === 'categories' && (
        catLoading ? <Spinner /> :
        catError   ? <p style={{ color:'crimson' }}>{catErrorObj!.message}</p> :
        <>
          <h3>All Categories</h3>
          {tree.map(root => renderNode(root))}

          <h4>Add Category</h4>
          <form
            onSubmit={e => {
              e.preventDefault()
              if (!newName) return
              createCat.mutate({
                name: newName,
                parent_category_id: parentId === '' ? null : parentId,
              })
              setNewName('')
              setParentId('')
            }}
            style={{ marginTop:'1rem' }}
          >
            <input
              placeholder="Name"
              value={newName}
              onChange={e=>setNewName(e.target.value)}
              required
            />
            <select
              value={parentId}
              onChange={e=>setParentId(e.target.value ? +e.target.value : '')}
            >
              <option value="">-- root --</option>
              {tree.flatMap(cat =>
                [
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.name}
                  </option>,
                  ...cat.children.map(child => (
                    <option key={child.category_id} value={child.category_id}>
                      — {child.name}
                    </option>
                  )),
                ]
              )}
            </select>
            <button type="submit" disabled={createCat.status === 'pending'}>
              {createCat.status === 'pending' ? <Spinner/> : 'Create'}
            </button>
          </form>
        </>
      )}
    </section>
  )
}
