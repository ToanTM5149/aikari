/**
 * RTK Query API Service
 * 
 * RTK Query là powerful data fetching và caching tool từ Redux Toolkit
 * 
 * Ưu điểm:
 * 1. Automatic caching - Tự động cache API responses
 * 2. Automatic refetching - Tự động refetch khi cần
 * 3. Loading states - Tự động manage loading, error states
 * 4. Optimistic updates - Support optimistic UI updates
 * 5. Polling - Support auto-polling data
 * 6. Cache invalidation - Smart cache invalidation với tags
 * 
 * Best Practices:
 * - Dùng RTK Query cho tất cả API calls
 * - Tag-based invalidation cho cache management
 * - Transform responses nếu cần
 * - Handle errors globally với baseQuery
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { RootState } from '../index';
import type { User, LoginCredentials, RegisterCredentials, TokenResponse } from '../types';

/**
 * Base Query với Auth Token
 * 
 * Tự động thêm Authorization header vào mọi request
 * Tự động retry khi token expired (401)
 */
const baseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:8000/api/v1',
  
  /**
   * Prepare Headers
   * Tự động thêm Authorization header nếu có token
   */
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.accessToken;
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  },
});

/**
 * Base Query với Retry Logic
 * 
 * Tự động retry request nếu token expired
 * Refresh token và retry request
 */
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  // Nếu response là 401 (Unauthorized) => token expired
  if (result.error && result.error.status === 401) {
    // Try to refresh token
    const state = api.getState() as RootState;
    const refreshToken = state.auth.refreshToken;
    
    if (refreshToken) {
      // Call refresh token endpoint
      const refreshResult = await baseQuery(
        {
          url: '/login/refresh-token',
          method: 'POST',
          body: { refresh_token: refreshToken },
        },
        api,
        extraOptions
      );
      
      if (refreshResult.data) {
        // Store new token
        const newToken = (refreshResult.data as any).access_token;
        localStorage.setItem('access_token', newToken);
        
        // Dispatch action to update token in store
        api.dispatch({
          type: 'auth/setCredentials',
          payload: { accessToken: newToken, refreshToken },
        });
        
        // Retry original request với new token
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Refresh failed => logout
        api.dispatch({ type: 'auth/logout' });
      }
    }
  }
  
  return result;
};

/**
 * API Service Definition
 * 
 * Define tất cả API endpoints ở đây
 */
export const apiService = createApi({
  reducerPath: 'api', // Key trong Redux state
  baseQuery: baseQueryWithReauth,
  
  /**
   * Tag Types
   * 
   * Tags dùng cho cache invalidation
   * Khi một mutation thành công, có thể invalidate tags để trigger refetch
   */
  tagTypes: ['User', 'Class', 'Flashcard', 'Study'],
  
  /**
   * Endpoints
   * 
   * Define các API endpoints
   * - query: GET requests (fetch data)
   * - mutation: POST/PUT/DELETE requests (modify data)
   */
  endpoints: (builder) => ({
    /**
     * Authentication Endpoints
     */
    
    // Login
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
    }),
    
    // Register
    register: builder.mutation<TokenResponse, RegisterCredentials>({
      query: (credentials) => ({
        url: '/users/signup',
        method: 'POST',
        body: credentials,
      }),
    }),
    
    /**
     * User Endpoints
     */
    
    // Get Current User
    getCurrentUser: builder.query<User, void>({
      query: () => '/users/me',
      providesTags: ['User'],
    }),
    
    // Get User by ID
    getUserById: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    
    // Update User
    updateUser: builder.mutation<User, { id: string; data: Partial<User> }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        'User',
      ],
    }),
    
    // Delete User
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
    
    /**
     * Class Endpoints (Example)
     */
    
    // Get All Classes
    getClasses: builder.query<any[], void>({
      query: () => '/classes',
      providesTags: ['Class'],
    }),
    
    // Get Class by ID
    getClassById: builder.query<any, string>({
      query: (id) => `/classes/${id}`,
      providesTags: (result, error, id) => [{ type: 'Class', id }],
    }),
    
    // Create Class
    createClass: builder.mutation<any, any>({
      query: (data) => ({
        url: '/classes',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Class'],
    }),
    
    // Update Class
    updateClass: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/classes/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Class', id }],
    }),
    
    // Delete Class
    deleteClass: builder.mutation<void, string>({
      query: (id) => ({
        url: `/classes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Class'],
    }),
  }),
});

/**
 * Export Hooks
 * 
 * RTK Query tự động generate hooks cho mỗi endpoint
 * - useXxxQuery: Hook cho query endpoints
 * - useXxxMutation: Hook cho mutation endpoints
 * 
 * Naming convention:
 * - use[EndpointName]Query
 * - use[EndpointName]Mutation
 */
export const {
  // Auth
  useLoginMutation,
  useRegisterMutation,
  
  // User
  useGetCurrentUserQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  
  // Class
  useGetClassesQuery,
  useGetClassByIdQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
} = apiService;

/**
 * Export Utility Functions
 * 
 * Các utility functions để work với RTK Query
 */

// Reset API state (clear all cache)
export const resetApiState = () => apiService.util.resetApiState();
