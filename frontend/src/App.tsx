// frontend/src/App.tsx
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Splash from './pages/Splash'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Accounts from './pages/Accounts'
import Transactions from './pages/Transactions'
import BudgetsPage from './pages/Budgets'
import Layout from './components/Layout'

/* ── PrivateRoute: protect pages ───────────────────── */
function PrivateRoute({ token }: { token: string | null }) {
  return token ? <Outlet /> : <Navigate to="/login" replace />
}

export default function App() {
  const token = localStorage.getItem('access_token')

  /* ── App routes ───────────────────────────────────── */
  return (
    <Routes>
      {/* public splash + auth */}
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* protected area */}
      <Route element={<PrivateRoute token={token} />}>
        <Route element={<Layout />}>
          {/* main pages */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="budgets" element={<BudgetsPage />} />
        </Route>
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
