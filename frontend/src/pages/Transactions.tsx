// frontend/src/pages/Transactions.tsx
import React, { useState } from 'react'
import TransactionsTab from './TransactionsPageTabs/TransactionsTab'
import RecurringTab    from './TransactionsPageTabs/RecurringTab'
import '../styles/global.css'

type Tab = 'transactions' | 'recurring' 

export default function TransactionsPage() {
  const [tab, setTab] = useState<Tab>('transactions')

  return (
    <section>
      <div style={{ marginBottom:'1rem' }}>
        {(['transactions','recurring'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              fontWeight: tab===t ? 'bold' : 'normal',
              marginRight: '1rem'
            }}
          >
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'transactions' && <TransactionsTab />}
      {tab === 'recurring'    && <RecurringTab    />}
    </section>
  )
}
