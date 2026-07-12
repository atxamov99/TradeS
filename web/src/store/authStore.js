import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authApi from '../api/auth.api';
import toast from 'react-hot-toast';
import i18n from '../i18n';

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
          toast.success(i18n.t('toast_registration_success'));
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

      registerTestUser: async () => {
        set({ isLoading: true });
        try {
          const res = await authApi.registerTestUser();
          const { user } = res.data.data;
          set({ user, isLoading: false });
          return user;
        } catch (err) {
          set({ isLoading: false });
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

      // Ask backend to email a 6-digit OTP (register/login by email — Telegram analog).
      requestEmailOtp: async (email) => {
        set({ isLoading: true });
        try {
          const res = await authApi.requestEmailOtp(email);
          return res.data;
        } finally {
          set({ isLoading: false });
        }
      },

      // Verify email OTP → registers-or-logs-in by email, sets the user (cookie-based).
      verifyEmailOtp: async (data) => {
        set({ isLoading: true });
        try {
          const res = await authApi.verifyEmailOtp(data);
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
          toast.success(i18n.t('toast_welcome_back', { name: user.name }));
          return user;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      // Ask backend to send a reset OTP — only succeeds for phones with an existing account.
      forgotPassword: async (phone) => {
        set({ isLoading: true });
        try {
          const res = await authApi.forgotPassword({ phone });
          return res.data;
        } finally {
          set({ isLoading: false });
        }
      },

      // Verify OTP + set new password → logs the user in.
      resetPassword: async (data) => {
        set({ isLoading: true });
        try {
          const res = await authApi.resetPassword(data);
          const { user } = res.data.data;
          set({ user, isLoading: false });
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
          toast.success(i18n.t('toast_logged_out'));
        }
      },

      fetchMe: async () => {
        try {
          const res = await authApi.getMe();
          set({ user: res.data.data.user });
        } catch (err) {
          // Only drop the session on a real auth failure (401/403). A network
          // error or 5xx must NOT log the user out — keep the persisted user.
          const status = err.response?.status;
          if (status === 401 || status === 403) {
            set({ user: null });
          }
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
