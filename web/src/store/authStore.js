import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authApi from '../api/auth.api';
import toast from 'react-hot-toast';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,

      setTokens: () => {
        // Tokens are now handled via HttpOnly cookies
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await authApi.register(data);
          toast.success('Registration successful!');
          return res.data;
        } catch (err) {
          const errors = err.response?.data?.errors;
          const message = err.response?.data?.message || 'Registration failed';
          if (errors?.length) {
            errors.forEach((e) => toast.error(e));
          } else {
            toast.error(message);
          }
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      googleLogin: async (credential) => {
        set({ isLoading: true });
        try {
          const res = await authApi.googleAuth(credential);
          const { user } = res.data.data;
          set({ user, isLoading: false });
          toast.success(`Xush kelibsiz, ${user.name}!`);

          if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';
            const params = new URLSearchParams({
              name:    user.name  || '',
              email:   user.email || '',
              role:    user.role  || '',
            });
            window.location.href = `${adminUrl}/sso?${params.toString()}`;
            return user;
          }

          return user;
        } catch (err) {
          set({ isLoading: false });
          const message = err.response?.data?.message || 'Google orqali kirish muvaffaqiyatsiz';
          toast.error(message);
          throw err;
        }
      },

      // Ask backend to send a 6-digit OTP to the user's Telegram.
      // Throws with err.response.status === 428 when the phone isn't linked yet.
      requestOtp: async (phone) => {
        set({ isLoading: true });
        try {
          const res = await authApi.requestOtp(phone);
          return res.data;
        } finally {
          set({ isLoading: false });
        }
      },

      // Verify OTP → registers-or-logs-in by phone, sets the user (cookie-based).
      verifyOtp: async (data) => {
        set({ isLoading: true });
        try {
          const res = await authApi.verifyOtp(data);
          const { user } = res.data.data;
          set({ user, isLoading: false });
          return user;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const res = await authApi.login(credentials);
          const { user } = res.data.data;
          set({ user, isLoading: false });
          toast.success(`Welcome back, ${user.name}!`);

          // ADMIN / SUPER_ADMIN — admin panelga SSO orqali yo'naltirish
          if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';
            const params = new URLSearchParams({
              name:    user.name  || '',
              email:   user.email || '',
              role:    user.role  || '',
            });
            window.location.href = `${adminUrl}/sso?${params.toString()}`;
            return user;
          }

          return user;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        try {
          await authApi.logout({});
        } catch (_) {
          // ignore network errors on logout
        } finally {
          set({ user: null });
          toast.success('Logged out');
        }
      },

      fetchMe: async () => {
        try {
          const res = await authApi.getMe();
          set({ user: res.data.data.user });
        } catch (_) {
          set({ user: null });
        }
      },

      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),

      isAuthenticated: () => !!get().user,
      isAdmin: () => ['ADMIN', 'SUPER_ADMIN'].includes(get().user?.role),
    }),
    {
      name: 'savdo-auth',
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);

export default useAuthStore;
