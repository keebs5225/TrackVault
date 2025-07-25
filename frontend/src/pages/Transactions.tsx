// frontend/src/pages/Transactions.tsx
import React, { useState } from 'react'
import TransactionsTab from './TransactionsPageTabs/TransactionsTab'
import RecurringTab    from './TransactionsPageTabs/RecurringTab'
import '../styles/global.css'

export default function TransactionsPage() {
  /* ── Tab selection state ───────────────────────── */
  const [tab, setTab] = useState<'transactions' | 'recurring'>('transactions')
  const tabs = ['transactions', 'recurring'] as const

  return (
    <section className="page-with-tabs">
      {/* ── Tab navigation ─────────────────────────────── */}
      <nav
        className="tabs-container"
        role="tablist"
        aria-label="Transactions navigation"
      >
        {tabs.map(t => {
          const active = tab === t
          return (
            <button
              key={t}
              role="tab"
              aria-selected={active}
              className={`tab-btn${active ? ' is-active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          )
        })}
      </nav>

      {/* ── Tab content ───────────────────────────────── */}
      {tab === 'transactions' && <TransactionsTab />}
      {tab === 'recurring'    && <RecurringTab />}
    </section>
  )
}
