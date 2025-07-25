// frontend/src/pages/Budgets.tsx
import React, { useState } from 'react'
import BudgetsTab from './BudgetsPageTabs/BudgetsTab'
import CalculatorsTab from './BudgetsPageTabs/CalculatorsTab'
import GoalsTab from './BudgetsPageTabs/GoalsTab'
import '../styles/global.css'

type Tab = 'budgets' | 'calculators' | 'goals'

export default function BudgetsPage() {
  // ── Selected tab state ──────────────────────────  
  const [tab, setTab] = useState<Tab>('budgets')
  const tabs: Tab[] = ['budgets', 'calculators', 'goals']

  return (
    <section className="page-with-tabs">
      {/* ── Tab navigation ─────────────────────────── */}
      <nav className="tabs-container" role="tablist" aria-label="Budgets navigation">
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
      {/* ── Tab content ────────────────────────────── */}
      {tab === 'budgets'     && <BudgetsTab />}
      {tab === 'calculators' && <CalculatorsTab />}
      {tab === 'goals'       && <GoalsTab />}
    </section>
  )
}
