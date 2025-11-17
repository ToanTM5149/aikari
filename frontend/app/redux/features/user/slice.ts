/**
 * User Slice - Quản lý User State và Profile
 * 
 * Slice này quản lý:
 * 1. User profile information
 * 2. User preferences (theme, language, etc.)
 * 3. User settings
 * 
 * Khác với authSlice (quản lý authentication),
 * userSlice quản lý user data và preferences
 * 
 * Lưu ý: Không có async thunks ở đây
 * Async operations sẽ được handle bởi RTK Query trong api.ts
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UserState, User, UserProfile, UserPreferences } from './types';

/**
 * Initial State
 */
const initialState: UserState = {
  currentUser: null,
  profile: null,
  preferences: {
    theme: 'system',
    language: 'vi',
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
  },
  loading: false,
  error: null,
};

/**
 * User Slice Definition
 */
const userSlice = createSlice({
  name: 'user',
  initialState,
  
  /**
   * Sync Reducers
   */
  reducers: {
    /**
     * Set Current User
     * Dùng khi sync user data từ auth
     */
    setCurrentUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
    },
    
    /**
     * Set User Profile
     * Set user profile data
     */
    setUserProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
    },
    
    /**
     * Update Preferences
     * Cập nhật user preferences (theme, language, etc.)
     */
    updatePreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      state.preferences = {
        ...state.preferences,
        ...action.payload,
      };
      
      // Lưu preferences vào localStorage
      localStorage.setItem('user_preferences', JSON.stringify(state.preferences));
    },
    
    /**
     * Load Preferences from LocalStorage
     * Restore preferences khi app load
     */
    loadPreferences: (state) => {
      const saved = localStorage.getItem('user_preferences');
      if (saved) {
        try {
          state.preferences = JSON.parse(saved);
        } catch (error) {
          console.error('Failed to parse user preferences:', error);
        }
      }
    },
    
    /**
     * Set Loading
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    /**
     * Set Error
     * Set error message
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    /**
     * Clear Error
     */
    clearError: (state) => {
      state.error = null;
    },
    
    /**
     * Clear User Data
     * Clear all user data (khi logout)
     */
    clearUserData: (state) => {
      state.currentUser = null;
      state.profile = null;
      state.error = null;
    },
  },
});

/**
 * Export Actions
 */
export const {
  setCurrentUser,
  setUserProfile,
  updatePreferences,
  loadPreferences,
  setLoading,
  setError,
  clearError,
  clearUserData,
} = userSlice.actions;

/**
 * Export Selectors
 */
export const selectUser = (state: { user: UserState }) => state.user;
export const selectCurrentUser = (state: { user: UserState }) => state.user.currentUser;
export const selectUserProfile = (state: { user: UserState }) => state.user.profile;
export const selectUserPreferences = (state: { user: UserState }) => state.user.preferences;
export const selectUserTheme = (state: { user: UserState }) => state.user.preferences.theme;
export const selectUserLanguage = (state: { user: UserState }) => state.user.preferences.language;
export const selectUserLoading = (state: { user: UserState }) => state.user.loading;
export const selectUserError = (state: { user: UserState }) => state.user.error;

/**
 * Export Reducer
 */
export default userSlice.reducer;

