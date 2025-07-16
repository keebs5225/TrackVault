//frontend/src/pages/Budgets.tsx
import React, { useState } from 'react';
import '../styles/global.css';
import BudgetsTab   from './BudgetsPageTabs/BudgetsTab';
import CalculatorsTab from './BudgetsPageTabs/CalculatorsTab';
import GoalsTab     from './BudgetsPageTabs/GoalsTab';

type Tab = 'budgets' | 'calculators' | 'goals';

export default function BudgetsPage() {
  const [tab, setTab] = useState<Tab>('budgets');

  return (
    <section className="profile-page">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['budgets','calculators','goals'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            disabled={tab === t}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'budgets'   && <BudgetsTab />}
      {tab === 'calculators' && <CalculatorsTab />}
      {tab === 'goals'     && <GoalsTab />}
    </section>
  );
}
