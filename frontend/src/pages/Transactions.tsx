// frontend/src/pages/Transactions.tsx
import React, { useState } from 'react'
import TransactionsTab from './TransactionsPageTabs/TransactionsTab'
import RecurringTab    from './TransactionsPageTabs/RecurringTab'
import '../styles/global.css'

type Tab = 'transactions' | 'recurring'

export default function TransactionsPage() {
  const [tab, setTab] = useState<Tab>('transactions')
  const tabs: Tab[] = ['transactions', 'recurring']

  return (
    <section className="page-with-tabs">
      <nav className="tabs-container" role="tablist" aria-label="Transactions navigation">
        {tabs.map(t => {
          const active = tab === t
          return (
            <button
              key={t}
              role="tab"
              aria-selected={active}
              className={`tab-btn ${active ? 'is-active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          )
        })}
      </nav>

      {tab === 'transactions' && <TransactionsTab />}
      {tab === 'recurring'    && <RecurringTab />}
    </section>
  )
}
