/**
 * Auth Slice - Quản lý Authentication State
 * 
 * Slice này quản lý:
 * 1. Authentication status (logged in/out)
 * 2. Access & Refresh tokens
 * 3. Current user info
 * 4. Auth loading states và errors
 * 
 * Lưu ý: Không có async thunks ở đây
 * Async operations sẽ được handle bởi RTK Query trong api.ts
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, SetCredentialsPayload } from './types';

/**
 * Initial State
 * 
 * State ban đầu của auth slice
 */
const initialState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  user: null,
  loading: false,
  error: null,
};

/**
 * Auth Slice Definition
 * 
 * createSlice tự động generate:
 * - Action creators
 * - Action types
 * - Reducer function
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  
  /**
   * Reducers - Sync actions
   * 
   * Các actions đồng bộ để update state trực tiếp
   */
  reducers: {
    /**
     * Set Credentials
     * Dùng để set auth state sau khi login/register thành công
     */
    setCredentials: (state, action: PayloadAction<SetCredentialsPayload>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.error = null;
      
      // Lưu tokens vào localStorage
      localStorage.setItem('access_token', action.payload.accessToken);
      localStorage.setItem('refresh_token', action.payload.refreshToken);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    
    /**
     * Update Access Token
     * Dùng khi refresh token thành công
     */
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      localStorage.setItem('access_token', action.payload);
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
     * Clear error message
     */
    clearError: (state) => {
      state.error = null;
    },
    
    /**
     * Update User
     * Update thông tin user
     */
    updateUser: (state, action: PayloadAction<Partial<AuthState['user']>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    
    /**
     * Logout
     * Clear tất cả auth state
     */
    logout: (state) => {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.error = null;
      state.loading = false;
      
      // Clear localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    },
  },
});

/**
 * Export Actions
 * 
 * Có thể dispatch các actions này từ components
 */
export const {
  setCredentials,
  updateAccessToken,
  setLoading,
  setError,
  clearError,
  updateUser,
  logout,
} = authSlice.actions;

/**
 * Export Selectors
 * 
 * Selectors để lấy data từ auth state
 * Best practice: Define selectors ở đây thay vì inline trong components
 */
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectAccessToken = (state: { auth: AuthState }) => state.auth.accessToken;
export const selectRefreshToken = (state: { auth: AuthState }) => state.auth.refreshToken;

/**
 * Export Reducer
 * 
 * Reducer này sẽ được add vào store
 */
export default authSlice.reducer;

