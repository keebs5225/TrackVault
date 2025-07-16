// frontend/src/pages/Dashboard.tsx
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import '../styles/global.css'

interface Summary {
  totalIncome: number
  totalExpenses: number
  leftover: number
}

export default function Dashboard() {
  const { data: summary = { totalIncome: 0, totalExpenses: 0, leftover: 0 } } =
    useQuery<Summary, Error>({
      queryKey: ['budget-summary'],
      // BudgetsPage will inject real data via setQueryData
      queryFn: () => ({
        totalIncome: 0,
        totalExpenses: 0,
        leftover: 0,
      }),
      initialData: {
        totalIncome: 0,
        totalExpenses: 0,
        leftover: 0,
      },
    })

  return (
    <section>
      <h1>Dashboard</h1>

      <h2>Summary</h2>
      <div className="summary-cards">
        <div className="project-item">
          <strong>Total Income</strong><br/>
          ${summary.totalIncome.toFixed(2)}
        </div>
        <div className="project-item">
          <strong>Total Expenses</strong><br/>
          ${summary.totalExpenses.toFixed(2)}
        </div>
        <div className="project-item">
          <strong>Leftover Buffer</strong><br/>
          ${summary.leftover.toFixed(2)}
        </div>
      </div>

      <h3>Recent Transactions</h3>
      <div className="project-item">[Table Placeholder]</div>

      <h3>Budget Overview</h3>
      <div className="project-item">[Progress Bars Placeholder]</div>

      <h3>Charts</h3>
      <div className="project-item">[Monthly Trends Bar Chart]</div>
      <div className="project-item">[Income vs Expense Line Chart]</div>

      <h3>Upcoming Recurring</h3>
      <div className="project-item">[Next 3 Entries Placeholder]</div>
    </section>
  )
}
