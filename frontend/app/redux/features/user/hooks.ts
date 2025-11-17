/**
 * User Feature Hooks
 * 
 * Custom hooks cho user
 */

import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  updatePreferences,
  loadPreferences,
  selectUserPreferences,
  selectUserTheme,
  selectUserLanguage,
  setCurrentUser,
} from './slice';
import { useGetCurrentUserQuery } from './api';
import { useCurrentUser as useAuthCurrentUser } from '../auth/hooks';

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
    [dispatch, preferences]
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
 * useUser Hook
 * 
 * Hook để work với user data
 * Tự động sync user từ auth state
 * 
 * Usage:
 * ```tsx
 * const { user, profile, loading, error, refreshUser } = useUser();
 * ```
 */
export function useUser() {
  const dispatch = useAppDispatch();
  const authUser = useAuthCurrentUser();
  const { data: currentUser, isLoading, error, refetch } = useGetCurrentUserQuery(undefined, {
    skip: !authUser, // Skip nếu chưa có auth user
  });

  // Sync user từ auth state
  useEffect(() => {
    if (authUser && !currentUser) {
      dispatch(setCurrentUser(authUser));
    } else if (currentUser) {
      dispatch(setCurrentUser(currentUser));
    }
  }, [authUser, currentUser, dispatch]);

  return {
    user: currentUser || authUser,
    loading: isLoading,
    error: error ? (error as any)?.data?.detail || 'Failed to fetch user' : null,
    refreshUser: refetch,
  };
}

/**
 * useCurrentUser Hook
 * 
 * Hook đơn giản để get current user từ user state
 * 
 * Usage:
 * ```tsx
 * const user = useCurrentUser();
 * ```
 */
export function useCurrentUser() {
  return useAppSelector((state) => state.user.currentUser);
}

