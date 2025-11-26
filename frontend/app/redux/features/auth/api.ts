/**
 * Auth API Endpoints
 * 
 * RTK Query endpoints cho authentication
 * Inject vào baseApi
 * 
 * ⚠️ SECURITY NOTES:
 * - Access token: Trả về trong response body, lưu trong memory
 * - Refresh token: Server set trong HTTP-only cookie, client không đọc được
 */

import { baseApi } from '../../store/api/baseApi';
import type { TokenResponse } from '../shared/types';
import type { LoginCredentials, RegisterCredentials } from './types';
import { setCredentials, logout, setLoading, setError } from './slice';

/**
 * Auth API Endpoints
 * 
 * Inject endpoints vào baseApi
 */
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Login
     * 
     * Login user và nhận access token
     * Refresh token được server set trong HTTP-only cookie
     */
    login: builder.mutation<TokenResponse, LoginCredentials>({
      query: (credentials) => ({
        url: '/login/access-token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: credentials.email,
          password: credentials.password,
        }),
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        dispatch(setLoading(true));
        dispatch(setError(null));
        
        try {
          const { data } = await queryFulfilled;
          
          // ⚠️ SECURITY: Chỉ set access token và user
          // Refresh token đã được server set trong HTTP-only cookie
          dispatch(setCredentials({
            accessToken: data.access_token,
            user: data.user,
          }));
        } catch (error: any) {
          dispatch(setError(error?.data?.detail || 'Login failed'));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),
    
    /**
     * Register
     * 
     * Đăng ký user mới
     * Refresh token được server set trong HTTP-only cookie
     */
    register: builder.mutation<TokenResponse, RegisterCredentials>({
      query: (credentials) => ({
        url: '/users/signup',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        dispatch(setLoading(true));
        dispatch(setError(null));
        
        try {
          const { data } = await queryFulfilled;
          
          // ⚠️ SECURITY: Chỉ set access token và user
          dispatch(setCredentials({
            accessToken: data.access_token,
            user: data.user,
          }));
        } catch (error: any) {
          dispatch(setError(error?.data?.detail || 'Registration failed'));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),
    
    /**
     * Refresh Token
     * 
     * Refresh access token khi hết hạn
     * 
     * ⚠️ SECURITY: KHÔNG gửi refresh token trong body
     * Refresh token tự động được gửi qua HTTP-only cookie
     * Server đọc từ cookie và trả về access token mới
     */
    refreshToken: builder.mutation<{ access_token: string }, void>({
      query: () => ({
        url: '/login/refresh-token',
        method: 'POST',
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          
          // Update access token trong auth state
          dispatch({
            type: 'auth/updateAccessToken',
            payload: data.access_token,
          });
        } catch (error) {
          // Refresh failed => logout
          dispatch(logout());
        }
      },
    }),
    
    /**
     * Logout
     * 
     * Đăng xuất user
     * Server sẽ revoke refresh token và clear HTTP-only cookie
     */
    logoutUser: builder.mutation<void, void>({
      query: () => ({
        url: '/logout',
        method: 'POST',
      }),
      async onQueryStarted(_, { dispatch }) {
        // Clear auth state
        // Cookie sẽ được server clear tự động
        dispatch(logout());
      },
    }),
  }),
});

/**
 * Export Hooks
 * 
 * RTK Query tự động generate hooks cho mỗi endpoint
 */
export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useLogoutUserMutation,
} = authApi;

