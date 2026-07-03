import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

// Auth is cookie-based (httpOnly). The store no longer holds an accessToken,
// so `user` (set on login, persisted to localStorage) is the auth indicator.
export function ProtectedRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export function GuestRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}
