/**
 * User API Endpoints
 * 
 * RTK Query endpoints cho user
 * Inject vào baseApi
 */

import { baseApi } from '../../store/api/baseApi';
import type { User } from '../shared/types';
import type { UserProfile } from './types';
import { setUserProfile, setLoading, setError } from './slice';

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
     * Get User Profile
     * 
     * Lấy thông tin profile của user
     */
    getUserProfile: builder.query<UserProfile, string>({
      query: (userId) => `/users/${userId}/profile`,
      providesTags: (result, error, userId) => [{ type: 'User', id: userId }],
      async onQueryStarted(userId, { dispatch, queryFulfilled }) {
        dispatch(setLoading(true));
        dispatch(setError(null));
        
        try {
          const { data } = await queryFulfilled;
          dispatch(setUserProfile(data));
        } catch (error: any) {
          dispatch(setError(error?.data?.detail || 'Failed to fetch profile'));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),
    
    /**
     * Update User
     * 
     * Cập nhật thông tin user
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
     * Update User Profile
     * 
     * Cập nhật thông tin profile của user
     */
    updateUserProfile: builder.mutation<UserProfile, { userId: string; data: Partial<UserProfile> }>({
      query: ({ userId, data }) => ({
        url: `/users/${userId}/profile`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: 'User', id: userId },
        'User',
      ],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        dispatch(setLoading(true));
        dispatch(setError(null));
        
        try {
          const { data } = await queryFulfilled;
          dispatch(setUserProfile(data));
        } catch (error: any) {
          dispatch(setError(error?.data?.detail || 'Failed to update profile'));
        } finally {
          dispatch(setLoading(false));
        }
      },
    }),
    
    /**
     * Delete User
     * 
     * Xóa user
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
  useGetUserProfileQuery,
  useUpdateUserMutation,
  useUpdateUserProfileMutation,
  useDeleteUserMutation,
} = userApi;

