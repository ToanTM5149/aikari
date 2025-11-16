/**
 * Custom Redux Hooks
 * 
 * File này chứa các custom hooks để work với Redux state
 * Giúp code cleaner và reusable
 */

import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './index';
import {
  loginUser,
  logoutUser,
  registerUser,
  selectIsAuthenticated,
  selectCurrentUser,
  selectAuthLoading,
  selectAuthError,
  setCredentials,
} from './slices/authSlice';
import {
  updatePreferences,
  loadPreferences,
  selectUserPreferences,
  selectUserTheme,
  selectUserLanguage,
} from './slices/userSlice';
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

  // Login function
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await dispatch(loginUser(credentials));
      return result;
    },
    [dispatch]
  );

  // Logout function
  const logout = useCallback(() => {
    dispatch(logoutUser());
  }, [dispatch]);

  // Register function
  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      const result = await dispatch(registerUser(credentials));
      return result;
    },
    [dispatch]
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
    loading,
    error,
    login,
    logout,
    register,
  };
}

/**
 * useUserPreferences Hook
 * 
 * Hook để work với user preferences
 * 
 * Usage:
 * ```tsx
 * const { preferences, theme, language, updateTheme, updateLanguage } = useUserPreferences();
 * 
 * // Update theme
 * updateTheme('dark');
 * 
 * // Update language
 * updateLanguage('vi');
 * ```
 */
export function useUserPreferences() {
  const dispatch = useAppDispatch();
  const preferences = useAppSelector(selectUserPreferences);
  const theme = useAppSelector(selectUserTheme);
  const language = useAppSelector(selectUserLanguage);

  // Load preferences từ localStorage khi mount
  useEffect(() => {
    dispatch(loadPreferences());
  }, [dispatch]);

  // Update theme
  const updateTheme = useCallback(
    (theme: 'light' | 'dark' | 'system') => {
      dispatch(updatePreferences({ theme }));
    },
    [dispatch]
  );

  // Update language
  const updateLanguage = useCallback(
    (language: 'en' | 'vi' | 'ja') => {
      dispatch(updatePreferences({ language }));
    },
    [dispatch]
  );

  // Update all preferences
  const updateAllPreferences = useCallback(
    (prefs: Partial<typeof preferences>) => {
      dispatch(updatePreferences(prefs));
    },
    [dispatch]
  );

  return {
    preferences,
    theme,
    language,
    updateTheme,
    updateLanguage,
    updatePreferences: updateAllPreferences,
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
