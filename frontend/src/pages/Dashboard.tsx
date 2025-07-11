// frontend/src/pages/Dashboard.tsx
import React from 'react';
import '../styles/global.css';

export default function Dashboard() {
  return (
    <section>
      <h1>Dashboard</h1>
          <h2>Summary</h2>
          <div className="summary-cards">
            <div className="project-item">
              <strong>Total Income</strong><br/>$12,345
            </div>
            <div className="project-item">
              <strong>Total Expenses</strong><br/>$8,765
            </div>
            <div className="project-item">
              <strong>Balance</strong><br/>$3,580
            </div>
          </div>

          <h3>Recent Transactions</h3>
          <div className="project-item">[Table Placeholder]</div>

          <h3>Budget Overview</h3>
          <div className="project-item">[Progress Bars Placeholder]</div>

          <h3>Charts</h3>
          <div className="project-item">[Monthly Trends Bar Chart]</div>
          <div className="project-item">[Category Breakdown Pie Chart]</div>
          <div className="project-item">[Income vs Expense Line Chart]</div>

          <h3>Upcoming Recurring</h3>
          <div className="project-item">[Next 3 Entries Placeholder]</div>

    </section>
  )
}
