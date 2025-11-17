/**
 * Class API Endpoints
 * 
 * RTK Query endpoints cho class
 * Inject vào baseApi
 */

import { baseApi } from '../../store/api/baseApi';

/**
 * Class API Endpoints
 * 
 * Inject endpoints vào baseApi
 */
export const classApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get All Classes
     */
    getClasses: builder.query<any[], void>({
      query: () => '/classes',
      providesTags: ['Class'],
    }),
    
    /**
     * Get Class by ID
     */
    getClassById: builder.query<any, string>({
      query: (id) => `/classes/${id}`,
      providesTags: (result, error, id) => [{ type: 'Class', id }],
    }),
    
    /**
     * Create Class
     */
    createClass: builder.mutation<any, any>({
      query: (data) => ({
        url: '/classes',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Class'],
    }),
    
    /**
     * Update Class
     */
    updateClass: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/classes/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Class', id }],
    }),
    
    /**
     * Delete Class
     */
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
 */
export const {
  useGetClassesQuery,
  useGetClassByIdQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
} = classApi;

