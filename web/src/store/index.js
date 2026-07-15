import useAuthStore from './authStore';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  return {
    user,
    profile: user,
    isAuthenticated: isAuthenticated(),
    isAdmin: isAdmin(),
    fetchMe,
  };
}
