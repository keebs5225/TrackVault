// frontend/src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Splash from './pages/Splash';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Profile  from './pages/Profile';
import AccountsPage from './pages/Accounts'
import CategoriesPage from './pages/Categories'

function App() {
  const token = localStorage.getItem('access_token');
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/profile"
        element={token ? <Profile /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/dashboard"
        element={
          token ? <Dashboard /> : <Navigate to="/login" replace />
        }
      />
      <Route path="/accounts"   element={<AccountsPage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
