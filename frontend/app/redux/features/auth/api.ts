/**
 * Auth API Endpoints
 * 
 * RTK Query endpoints cho authentication
 * Inject vào baseApi
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
     * Login user và nhận tokens
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
          
          // Set credentials vào auth state
          dispatch(setCredentials({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
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
          
          // Set credentials vào auth state
          dispatch(setCredentials({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
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
     */
    refreshToken: builder.mutation<{ access_token: string }, { refresh_token: string }>({
      query: (body) => ({
        url: '/login/refresh-token',
        method: 'POST',
        body,
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
     * Đăng xuất user (có thể call API để invalidate token)
     */
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/login/logout',
        method: 'POST',
      }),
      async onQueryStarted(_, { dispatch }) {
        // Clear auth state
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
  useLogoutMutation,
} = authApi;

