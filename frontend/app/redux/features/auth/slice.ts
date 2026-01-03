/**
 * Auth Slice - Quản lý Authentication State
 * 
 * Slice này quản lý:
 * 1. Authentication status (logged in/out)
 * 2. Access token (CHỈ LƯU TRONG MEMORY - không localStorage)
 * 3. Refresh token (LƯU TRONG HTTP-ONLY COOKIE - server-side)
 * 4. Current user info
 * 5. Auth loading states và errors
 * 
 * ⚠️ SECURITY BEST PRACTICES:
 * - Access token: Lưu trong memory (Redux state), sống ngắn (5-15 phút)
 * - Refresh token: KHÔNG lưu trong state, chỉ trong HTTP-only cookie
 * - Khi reload page: Access token mất → gọi refresh endpoint
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
  refreshToken: null, // Deprecated - sẽ xóa trong version sau
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
     * 
     * ⚠️ SECURITY: Chỉ lưu access token trong memory (Redux state)
     * Refresh token được lưu trong HTTP-only cookie bởi server
     */
    setCredentials: (state, action: PayloadAction<SetCredentialsPayload>) => {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.error = null;
      
      // ⚠️ KHÔNG lưu access token vào localStorage
      // Access token chỉ tồn tại trong memory
      // Khi reload page → mất token → gọi refresh từ cookie
      
      // Chỉ lưu user info để UX tốt hơn (không cần re-fetch)
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    
    /**
     * Update Access Token
     * Dùng khi refresh token thành công
     */
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      // Nếu có user trong localStorage nhưng chưa authenticated → restore user
      if (!state.user) {
        const savedUserStr = localStorage.getItem('user');
        if (savedUserStr) {
          try {
            state.user = JSON.parse(savedUserStr);
            state.isAuthenticated = true;
          } catch (error) {
            console.error('Failed to parse user from localStorage:', error);
          }
        }
      } else {
        // Đã có user → chỉ cần set authenticated
        state.isAuthenticated = true;
      }
      // ⚠️ KHÔNG lưu vào localStorage
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
     * 
     * ⚠️ SECURITY: Chỉ clear memory state
     * HTTP-only cookie sẽ được clear bởi server khi gọi logout API
     */
    logout: (state) => {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null; // Deprecated field
      state.user = null;
      state.error = null;
      state.loading = false;
      
      // Clear user info từ localStorage
      localStorage.removeItem('user');
      
      // ⚠️ KHÔNG cần clear tokens vì không lưu trong localStorage nữa
      // Refresh token cookie sẽ được server clear khi logout
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

