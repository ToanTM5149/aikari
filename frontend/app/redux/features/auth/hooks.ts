/**
 * Auth Feature Hooks
 * 
 * Custom hooks cho authentication
 */

import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectIsAuthenticated,
  selectCurrentUser,
  selectAuthLoading,
  selectAuthError,
  setCredentials,
  logout,
} from './slice';
import {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
} from './api';
import type { LoginCredentials, RegisterCredentials } from './types';

/**
 * useAuth Hook
 * 
 * Hook tổng hợp để work với authentication
 * 
 * Usage:
 * ```tsx
 * const { isAuthenticated, user, loading, error, login, logout, register } = useAuth();
 * 
 * // Login
 * await login({ email: 'user@example.com', password: 'password123' });
 * 
 * // Logout
 * logout();
 * ```
 */
export function useAuth() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  
  const [loginMutation, { isLoading: isLoggingIn }] = useLoginMutation();
  const [registerMutation, { isLoading: isRegistering }] = useRegisterMutation();
  const [logoutMutation] = useLogoutMutation();

  // Login function
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        const result = await loginMutation(credentials).unwrap();
        return { success: true, data: result };
      } catch (error: any) {
        return { success: false, error: error?.data?.detail || 'Login failed' };
      }
    },
    [loginMutation]
  );

  // Logout function
  const handleLogout = useCallback(async () => {
    try {
      await logoutMutation().unwrap();
    } catch (error) {
      // Even if API call fails, clear local state
      dispatch(logout());
    }
  }, [logoutMutation, dispatch]);

  // Register function
  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      try {
        const result = await registerMutation(credentials).unwrap();
        return { success: true, data: result };
      } catch (error: any) {
        return { success: false, error: error?.data?.detail || 'Registration failed' };
      }
    },
    [registerMutation]
  );

  // Restore auth state từ localStorage khi mount
  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const userStr = localStorage.getItem('user');

    if (accessToken && refreshToken && userStr) {
      try {
        const user = JSON.parse(userStr);
        dispatch(setCredentials({ accessToken, refreshToken, user }));
      } catch (error) {
        console.error('Failed to restore auth state:', error);
      }
    }
  }, [dispatch]);

  return {
    isAuthenticated,
    user,
    loading: loading || isLoggingIn || isRegistering,
    error,
    login,
    logout: handleLogout,
    register,
  };
}

/**
 * useAuthGuard Hook
 * 
 * Hook để protect routes - redirect nếu chưa authenticated
 * 
 * Usage:
 * ```tsx
 * function ProtectedPage() {
 *   const { isChecking } = useAuthGuard('/login');
 *   
 *   if (isChecking) return <div>Loading...</div>;
 *   
 *   return <div>Protected Content</div>;
 * }
 * ```
 */
export function useAuthGuard(redirectTo: string = '/auth/login') {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectAuthLoading);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    }
  }, [isAuthenticated, loading, redirectTo]);

  return {
    isChecking: loading,
    isAuthenticated,
  };
}

/**
 * useCurrentUser Hook
 * 
 * Hook đơn giản để get current user
 * 
 * Usage:
 * ```tsx
 * const user = useCurrentUser();
 * ```
 */
export function useCurrentUser() {
  return useAppSelector(selectCurrentUser);
}

