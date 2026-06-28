import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WalletPage from './pages/Wallet';
import SendMoney from './pages/SendMoney';
import Receive from './pages/Receive';
import Transactions from './pages/Transactions';
import Withdraw from './pages/Withdraw';
import Deposit from './pages/Deposit';
import Settings from './pages/Settings';
import Admin from './pages/Admin';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 16px', color: 'var(--primary)' }} />
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading TRIP...</div>
        </div>
      </div>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  return user?.is_admin ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { initialize, isAuthenticated } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} />

      {/* Protected */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="send" element={<SendMoney />} />
        <Route path="receive" element={<Receive />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="withdraw" element={<Withdraw />} />
        <Route path="deposit" element={<Deposit />} />
        <Route path="settings" element={<Settings />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin" element={<AdminRoute><Admin /></AdminRoute>} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
