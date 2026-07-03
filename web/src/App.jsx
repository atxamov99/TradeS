import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

import AppLayout from './components/layout/AppLayout';
import PosLayout from './components/layout/PosLayout';
import { ProtectedRoute, GuestRoute } from './components/common/ProtectedRoute';

import PosDashboard from './pages/pos/PosDashboard';
import PosSales from './pages/pos/PosSales';
import PosNewSale from './pages/pos/PosNewSale';
import PosProducts from './pages/pos/PosProducts';
import PosReports from './pages/pos/PosReports';

import Login from './pages/Login';
import Register from './pages/Register';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Landing from './pages/Landing';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOrders from './pages/admin/AdminOrders';
import AdminProducts from './pages/admin/AdminProducts';

import useAuthStore from './store/authStore';

function AdminRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!['ADMIN', 'SUPER_ADMIN'].includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (accessToken && !user) {
      fetchMe();
    }
  }, [accessToken]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '500',
            padding: '12px 16px',
          },
        }}
      />

      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<Landing />} />

        {/* Public routes */}
        <Route path="/login" element={
          <GuestRoute><Login /></GuestRoute>
        } />
        <Route path="/register" element={
          <GuestRoute><Register /></GuestRoute>
        } />
        <Route path="/forgot-password" element={
          <GuestRoute><ForgotPasswordPage /></GuestRoute>
        } />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected user routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute><AppLayout /></ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="sales" element={<Sales />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />

          {/* Admin-only routes */}
          <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
          <Route path="admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
        </Route>

        {/* POS routes */}
        <Route path="pos" element={
          <ProtectedRoute><PosLayout /></ProtectedRoute>
        }>
          <Route index element={<PosDashboard />} />
          <Route path="products" element={<PosProducts />} />
          <Route path="sales" element={<PosSales />} />
          <Route path="sales/new" element={<PosNewSale />} />
          <Route path="reports" element={<PosReports />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
