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
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UserState, User, UserProfile, UserPreferences } from '../types';

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
 * Async Thunks
 */

/**
 * Fetch User Profile
 * 
 * Lấy thông tin chi tiết của user profile
 */
export const fetchUserProfile = createAsyncThunk<
  UserProfile,
  string, // user ID
  { rejectValue: string }
>(
  'user/fetchProfile',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { accessToken: string } };
      const token = state.auth.accessToken;

      const response = await fetch(`http://localhost:8000/api/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return rejectWithValue('Failed to fetch user profile');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

/**
 * Update User Profile
 * 
 * Cập nhật thông tin user profile
 */
export const updateUserProfile = createAsyncThunk<
  UserProfile,
  Partial<UserProfile>,
  { rejectValue: string }
>(
  'user/updateProfile',
  async (profileData, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { accessToken: string; user: User | null } };
      const token = state.auth.accessToken;
      const userId = state.auth.user?.id;

      if (!userId) {
        return rejectWithValue('User not found');
      }

      const response = await fetch(`http://localhost:8000/api/v1/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        return rejectWithValue('Failed to update profile');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

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
     * Clear User Data
     * Clear all user data (khi logout)
     */
    clearUserData: (state) => {
      state.currentUser = null;
      state.profile = null;
      state.error = null;
    },
    
    /**
     * Clear Error
     */
    clearError: (state) => {
      state.error = null;
    },
  },
  
  /**
   * Async Reducers
   */
  extraReducers: (builder) => {
    // Fetch User Profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch profile';
      });
    
    // Update User Profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update profile';
      });
  },
});

/**
 * Export Actions
 */
export const {
  setCurrentUser,
  updatePreferences,
  loadPreferences,
  clearUserData,
  clearError,
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
