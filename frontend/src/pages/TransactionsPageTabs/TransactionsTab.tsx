// frontend/src/pages/TransactionsPageTabs/TransactionsTab.tsx
import React, { useState, FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Spinner from '../../components/Spinner'
import { fetchAccounts } from '../../services/accounts'
import { fetchTransactions, createTransaction, updateTransaction, deleteTransaction } from '../../services/transactions'
import type { TransactionRead, TransactionCreate, TransactionUpdate, AccountRead, Paged } from '../../types'

const pageSize = 1000  // load all, or you can keep pagination

export default function TransactionsTab(): JSX.Element {
  const qc = useQueryClient()

  // Lookups
  const { data: accounts = [] } = useQuery<AccountRead[], Error>({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  })

  // Fetch all transactions
  const {
    data: txs = { items: [], total: 0, page: 1, page_size: pageSize } as Paged<TransactionRead>,
    isLoading,
    isError,
    error,
  } = useQuery<Paged<TransactionRead>, Error>({
    queryKey: ['transactions'],
    queryFn: () => fetchTransactions({ page: 1, page_size: pageSize }),
  })

  // Mutations
  const createMut = useMutation<TransactionRead, Error, TransactionCreate>({
    mutationFn: createTransaction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })
  const updateMut = useMutation<TransactionRead, Error, { id: number; data: TransactionUpdate }>({
    mutationFn: ({ id, data }) => updateTransaction(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })
  const deleteMut = useMutation<void, Error, number>({
    mutationFn: id => deleteTransaction(id).then(() => {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })

  // Top form state
  const [date, setDate] = useState('')
  const [desc, setDesc] = useState('')
  const [acct, setAcct] = useState<number | ''>('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')

  // Per‐item edit state
  const [editing, setEditing] = useState<Record<number, boolean>>({})
  const [editForm, setEditForm] = useState<Record<number, TransactionUpdate>>({})

  function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!date || !acct || !amount) return
    createMut.mutate({
      date,
      description: desc,
      account_id: +acct,
      amount: parseFloat(amount),
      notes: notes || undefined,
    })
    setDate(''); setDesc(''); setAcct(''); setAmount(''); setNotes('')
  }

  if (isLoading) return <Spinner />
  if (isError) return <p style={{ color:'crimson' }}>{error?.message}</p>

  return (
    <>
      <h3>Transactions</h3>

      {/* Create Form */}
      <form style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }} onSubmit={handleAdd}>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} required />
        <input placeholder="Description" value={desc} onChange={e=>setDesc(e.target.value)} />
        <select value={acct} onChange={e=>setAcct(e.target.value?+e.target.value:'')} required>
          <option value="">Account</option>
          {accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.name}</option>)}
        </select>
        <input type="number" placeholder="Amount" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} required/>
        <input placeholder="Notes" value={notes} onChange={e=>setNotes(e.target.value)}/>
        <button type="submit" disabled={createMut.status === 'pending'}>
          {createMut.status === 'pending' ? '…' : 'Add'}
        </button>
      </form>

      {/* List */}
      <div style={{ display:'grid', gap:16 }}>
        {txs.items.map(tx => {
          const isEdit = !!editing[tx.transaction_id]
          const form = editForm[tx.transaction_id] ?? {
            date: tx.date.split('T')[0],
            description: tx.description,
            account_id: tx.account_id,
            amount: tx.amount,
            notes: tx.notes,
          }

          return (
            <div key={tx.transaction_id} style={{border:'1px solid #ccc',padding:16,borderRadius:4}}>
              {isEdit ? (
                <>
                  {/* Inline Edit */}
                  <input type="date" value={form.date} onChange={e=>setEditForm(f=>(
                    {...f, [tx.transaction_id]:{...form, date:e.target.value}}
                  ))}/>
                  <input placeholder="Desc" value={form.description||''}
                    onChange={e=>setEditForm(f=>(
                      {...f, [tx.transaction_id]:{...form, description:e.target.value}}
                    ))}/>
                  <select value={form.account_id} onChange={e=>setEditForm(f=>(
                    {...f, [tx.transaction_id]:{...form, account_id:+e.target.value}}
                  ))}>
                    {accounts.map(a=><option key={a.account_id} value={a.account_id}>{a.name}</option>)}
                  </select>
                  <input type="number" step="0.01" value={form.amount}
                    onChange={e=>setEditForm(f=>(
                      {...f, [tx.transaction_id]:{...form, amount:parseFloat(e.target.value)}}
                    ))}/>
                  <input placeholder="Notes" value={form.notes||''}
                    onChange={e=>setEditForm(f=>(
                      {...f, [tx.transaction_id]:{...form, notes:e.target.value}}
                    ))}/>
                  <div style={{display:'flex',gap:8,marginTop:8}}>
                    <button onClick={()=>updateMut.mutate({ id: tx.transaction_id, data: form })}
                      disabled={updateMut.status === 'pending'}
                    >
                      {updateMut.status === 'pending' ? '…' : 'Save'}
                    </button>
                    <button onClick={()=>setEditing(e=>({...e,[tx.transaction_id]:false}))}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Read Only */}
                  <p><strong>{new Date(tx.date).toLocaleDateString()}</strong></p>
                  <p>{tx.description}</p>
                  <p>{accounts.find(a=>a.account_id===tx.account_id)?.name}</p>
                  <p>${tx.amount.toFixed(2)}</p>
                  <p>{tx.notes||'—'}</p>
                  <div style={{display:'flex',gap:8,marginTop:8}}>
                    <button onClick={()=>{
                      setEditForm(f=>({...f,[tx.transaction_id]:form}))
                      setEditing(e=>({...e,[tx.transaction_id]:true}))
                    }}>Edit</button>
                    <button onClick={()=>deleteMut.mutate(tx.transaction_id)} disabled={deleteMut.status === 'pending'}>
                      {deleteMut.status === 'pending' ? '…' : '❌'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
