/**
 * Auth Slice - Quản lý Authentication State
 * 
 * Slice này quản lý:
 * 1. Authentication status (logged in/out)
 * 2. Access & Refresh tokens
 * 3. Current user info
 * 4. Auth loading states và errors
 * 
 * Best Practices:
 * - Sử dụng createSlice từ Redux Toolkit (tự động tạo actions)
 * - Không mutate state trực tiếp (Immer tự động handle)
 * - Tách biệt sync actions và async actions (createAsyncThunk)
 * - Lưu sensitive data (tokens) vào localStorage/sessionStorage cẩn thận
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, LoginCredentials, RegisterCredentials, TokenResponse, ApiError } from '../types';

/**
 * Initial State
 * 
 * State ban đầu của auth slice
 * Cố gắng restore từ localStorage nếu có
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
 * Async Thunks - Xử lý async operations
 * 
 * createAsyncThunk tự động generate 3 action types:
 * - pending: Khi bắt đầu async operation
 * - fulfilled: Khi thành công
 * - rejected: Khi thất bại
 */

/**
 * Login Async Thunk
 * 
 * Thực hiện login và lưu tokens + user info
 * 
 * Usage:
 * ```tsx
 * dispatch(loginUser({ email: 'user@example.com', password: 'password123' }));
 * ```
 */
export const loginUser = createAsyncThunk<
  TokenResponse, // Return type khi fulfilled
  LoginCredentials, // Argument type
  { rejectValue: string } // Type của error khi rejected
>(
  'auth/login', // Action type prefix
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/login/access-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: credentials.email,
          password: credentials.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.detail || 'Login failed');
      }

      const data = await response.json();
      
      // Lưu tokens vào localStorage
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      
      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

/**
 * Register Async Thunk
 * 
 * Đăng ký user mới
 */
export const registerUser = createAsyncThunk<
  TokenResponse,
  RegisterCredentials,
  { rejectValue: string }
>(
  'auth/register',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.detail || 'Registration failed');
      }

      const data = await response.json();
      
      // Lưu tokens vào localStorage
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      
      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

/**
 * Logout Async Thunk
 * 
 * Đăng xuất user (có thể call API để invalidate token)
 */
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    // Clear localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Optional: Call API để revoke token
    // await fetch('/api/logout', { method: 'POST' });
    
    return;
  }
);

/**
 * Refresh Token Async Thunk
 * 
 * Refresh access token khi hết hạn
 */
export const refreshAccessToken = createAsyncThunk<
  { access_token: string },
  void,
  { rejectValue: string }
>(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const refreshToken = state.auth.refreshToken;

      if (!refreshToken) {
        return rejectWithValue('No refresh token available');
      }

      const response = await fetch('http://localhost:8000/api/v1/login/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        return rejectWithValue('Failed to refresh token');
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      
      return data;
    } catch (error) {
      return rejectWithValue('Network error occurred');
    }
  }
);

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
     * Dùng để restore auth state từ localStorage khi app load
     */
    setCredentials: (state, action: PayloadAction<{ accessToken: string; refreshToken: string; user: any }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.isAuthenticated = true;
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
    updateUser: (state, action: PayloadAction<any>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  
  /**
   * Extra Reducers - Async actions
   * 
   * Xử lý các async thunks (pending, fulfilled, rejected)
   */
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.accessToken = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
      });
    
    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.accessToken = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Registration failed';
      });
    
    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
        state.error = null;
      });
    
    // Refresh Token
    builder
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.access_token;
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        // Token refresh failed - logout user
        state.isAuthenticated = false;
        state.accessToken = null;
        state.refreshToken = null;
        state.user = null;
      });
  },
});

/**
 * Export Actions
 * 
 * Có thể dispatch các actions này từ components
 */
export const { setCredentials, clearError, updateUser } = authSlice.actions;

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

/**
 * Export Reducer
 * 
 * Reducer này sẽ được add vào store
 */
export default authSlice.reducer;
