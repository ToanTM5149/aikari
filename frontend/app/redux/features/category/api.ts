/**
 * Category API Endpoints
 *
 * RTK Query endpoints cho category management
 * Sync với backend: /api/v1/categories
 */

import { baseApi } from '../../store/api/baseApi';
import type {
  Category,
  CategoryCreate,
  CategoryUpdate,
  CategoriesResponse,
  CategoriesWithCountResponse,
} from '../shared/types';

/**
 * Category API Endpoints
 */
export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get Categories
     * GET /categories/
     */
    getCategories: builder.query<CategoriesResponse, { skip?: number; limit?: number } | void>({
      query: (params = {}) => ({
        url: '/categories/',
        params,
      }),
      providesTags: ['Category'],
    }),

    /**
     * Get Categories with StudySet Count
     * GET /categories/with-count/
     */
    getCategoriesWithCount: builder.query<CategoriesWithCountResponse, void>({
      query: () => '/categories/with-count/',
      providesTags: ['Category'],
    }),

    /**
     * Get Category by ID
     * GET /categories/{category_id}/
     */
    getCategory: builder.query<Category, string>({
      query: (categoryId) => `/categories/${categoryId}/`,
      providesTags: (_result, _error, categoryId) => [{ type: 'Category', id: categoryId }],
    }),

    /**
     * Create Category
     * POST /categories/
     */
    createCategory: builder.mutation<Category, CategoryCreate>({
      query: (body) => ({
        url: '/categories/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Category', 'Flashcard'],
    }),

    /**
     * Update Category
     * PUT /categories/{category_id}/
     */
    updateCategory: builder.mutation<Category, { categoryId: string; body: CategoryUpdate }>({
      query: ({ categoryId, body }) => ({
        url: `/categories/${categoryId}/`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { categoryId }) => [
        'Category',
        { type: 'Category', id: categoryId },
        'Flashcard',
      ],
    }),

    /**
     * Delete Category
     * DELETE /categories/{category_id}/
     */
    deleteCategory: builder.mutation<{ message: string }, string>({
      query: (categoryId) => ({
        url: `/categories/${categoryId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category', 'Flashcard'],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoriesWithCountQuery,
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;
