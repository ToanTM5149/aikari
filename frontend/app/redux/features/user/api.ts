/**
 * User API Endpoints
 * 
 * RTK Query endpoints cho user
 * Inject vào baseApi
 */

import { baseApi } from '../../store/api/baseApi';
import type { User } from '../shared/types';
import { setLoading, setError } from './slice';

/**
 * User API Endpoints
 * 
 * Inject endpoints vào baseApi
 */
export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get Current User
     * 
     * Lấy thông tin user hiện tại
     */
    getCurrentUser: builder.query<User, void>({
      query: () => '/users/me',
      providesTags: ['User'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        dispatch(setLoading(true));
        dispatch(setError(null));
        
        try {
          await queryFulfilled;
        } catch (error: any) {
          dispatch(setError(error?.data?.detail || 'Failed to fetch user'));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),
    
    /**
     * Get User by ID
     * 
     * Lấy thông tin user theo ID
     */
    getUserById: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    
    /**
     * Update User
     * 
     * Cập nhật thông tin user (admin only)
     */
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
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        dispatch(setLoading(true));
        dispatch(setError(null));
        
        try {
          await queryFulfilled;
        } catch (error: any) {
          dispatch(setError(error?.data?.detail || 'Failed to update user'));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),
    
    /**
     * Delete User
     * 
     * Xóa user (admin only)
     */
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

/**
 * Export Hooks
 * 
 * RTK Query tự động generate hooks cho mỗi endpoint
 */
export const {
  useGetCurrentUserQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = userApi;

