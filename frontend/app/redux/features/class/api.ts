/**
 * Class API Endpoints
 * 
 * RTK Query endpoints cho class management
 * Sync với backend: /api/v1/classes
 */

import { baseApi } from '../../store/api/baseApi';
import type {
  Class,
  ClassCreate,
  ClassUpdate,
  ClassesResponse,
  ClassMember,
  ClassMemberCreate,
  ClassMemberUpdate,
  ClassMembersResponse,
  MessageResponse,
  PaginationParams,
} from '../shared/types';

/**
 * Class API Endpoints
 * 
 * Inject endpoints vào baseApi
 */
export const classApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get Classes - Lấy danh sách classes mà user là member
     * GET /classes
     */
    getClasses: builder.query<ClassesResponse, PaginationParams | void>({
      query: (params = {}) => ({
        url: '/classes/',
        params,
      }),
      providesTags: ['Class'],
    }),
    
    /**
     * Get Owned Classes - Lấy classes mà user là owner
     * GET /classes/owned
     */
    getOwnedClasses: builder.query<ClassesResponse, PaginationParams | void>({
      query: (params = {}) => ({
        url: '/classes/owned/',
        params,
      }),
      providesTags: ['Class'],
    }),
    
    /**
     * Get Class by ID
     * GET /classes/{class_id}
     */
    getClassById: builder.query<Class, string>({
      query: (id) => `/classes/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Class', id }],
    }),
    
    /**
     * Create Class
     * POST /classes
     */
    createClass: builder.mutation<Class, ClassCreate>({
      query: (data) => ({
        url: '/classes/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Class'],
    }),
    
    /**
     * Update Class
     * PUT /classes/{class_id}
     */
    updateClass: builder.mutation<Class, { id: string; data: ClassUpdate }>({
      query: ({ id, data }) => ({
        url: `/classes/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Class', id },
        'Class',
      ],
    }),
    
    /**
     * Delete Class
     * DELETE /classes/{class_id}
     */
    deleteClass: builder.mutation<MessageResponse, string>({
      query: (id) => ({
        url: `/classes/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Class'],
    }),
    
    /**
     * Get Class Members
     * GET /classes/{class_id}/members
     */
    getClassMembers: builder.query<ClassMembersResponse, string>({
      query: (classId) => `/classes/${classId}/members/`,
      providesTags: (result, error, classId) => [
        { type: 'Class', id: `${classId}-members` },
      ],
    }),
    
    /**
     * Add Class Member
     * POST /classes/{class_id}/members
     */
    addClassMember: builder.mutation<
      ClassMember,
      { classId: string; data: ClassMemberCreate }
    >({
      query: ({ classId, data }) => ({
        url: `/classes/${classId}/members/`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { classId }) => [
        { type: 'Class', id: `${classId}-members` },
        'Class',
      ],
    }),
    
    /**
     * Update Class Member
     * PUT /classes/{class_id}/members/{member_id}
     */
    updateClassMember: builder.mutation<
      ClassMember,
      { classId: string; memberId: string; data: ClassMemberUpdate }
    >({
      query: ({ classId, memberId, data }) => ({
        url: `/classes/${classId}/members/${memberId}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { classId }) => [
        { type: 'Class', id: `${classId}-members` },
      ],
    }),
    
    /**
     * Remove Class Member
     * DELETE /classes/{class_id}/members/{member_id}
     */
    removeClassMember: builder.mutation<
      MessageResponse,
      { classId: string; memberId: string }
    >({
      query: ({ classId, memberId }) => ({
        url: `/classes/${classId}/members/${memberId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { classId }) => [
        { type: 'Class', id: `${classId}-members` },
        'Class',
      ],
    }),
    
    /**
     * Search Classes - Tìm kiếm public classes
     * GET /classes/search?q={query}
     */
    searchClasses: builder.query<ClassesResponse, { q: string } & PaginationParams>({
      query: ({ q, ...params }) => ({
        url: '/classes/search/',
        params: { q, ...params },
      }),
      // Don't cache search results
      keepUnusedDataFor: 0,
    }),
    
    /**
     * Join Class - Student tự join vào public class
     * POST /classes/{class_id}/join
     */
    joinClass: builder.mutation<ClassMember, string>({
      query: (classId) => ({
        url: `/classes/${classId}/join/`,
        method: 'POST',
      }),
      invalidatesTags: ['Class'],
    }),
    
    /**
     * Leave Class - Rời khỏi class
     * POST /classes/{class_id}/leave
     */
    leaveClass: builder.mutation<MessageResponse, string>({
      query: (classId) => ({
        url: `/classes/${classId}/leave/`,
        method: 'POST',
      }),
      invalidatesTags: ['Class'],
    }),
  }),
});

/**
 * Export Hooks
 * 
 * Auto-generated hooks từ endpoints
 */
export const {
  useGetClassesQuery,
  useGetOwnedClassesQuery,
  useGetClassByIdQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useGetClassMembersQuery,
  useAddClassMemberMutation,
  useUpdateClassMemberMutation,
  useRemoveClassMemberMutation,
  useSearchClassesQuery,
  useJoinClassMutation,
  useLeaveClassMutation,
} = classApi;
