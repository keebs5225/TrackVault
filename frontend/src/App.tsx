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

function PrivateRoute({ token }: { token: string | null }) {
  return token ? <Outlet /> : <Navigate to="/login" replace />
}

export default function App() {
  const token = localStorage.getItem('access_token')

  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/login"  element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* protected + chrome */}
      <Route element={<PrivateRoute token={token}/>}>
        <Route element={<Layout/>}>
          <Route path="dashboard"    element={<Dashboard/>} />
          <Route path="profile"      element={<Profile/>} />
          <Route path="accounts"     element={<Accounts/>} />
          <Route path="transactions" element={<Transactions/>} />
          <Route path="budgets"      element={<BudgetsPage/>} />
        </Route>
      </Route>

      {/* catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
