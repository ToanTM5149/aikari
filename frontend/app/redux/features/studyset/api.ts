/**
 * StudySet API Endpoints
 * 
 * RTK Query endpoints cho studyset & terms (flashcards)
 * Sync với backend: /api/v1/studysets
 */

import { baseApi } from '../../store/api/baseApi';
import type {
  StudySet,
  StudySetCreate,
  StudySetUpdate,
  StudySetsResponse,
  Term,
  TermCreate,
  TermUpdate,
  TermsResponse,
  MessageResponse,
  PaginationParams,
} from '../shared/types';

/**
 * StudySet API Endpoints
 */
export const studySetApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get StudySets - Lấy danh sách studysets của user
     * GET /studysets/
     */
    getStudySets: builder.query<StudySetsResponse, PaginationParams & { category_id?: string } | void>({
      query: (params = {}) => ({
        url: '/studysets/',
        params,
      }),
      providesTags: ['Flashcard'],
    }),
    
    /**
     * Get StudySet by ID
     * GET /studysets/{studyset_id}/
     */
    getStudySetById: builder.query<StudySet, string>({
      query: (id) => `/studysets/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Flashcard', id }],
    }),
    
    /**
     * Create StudySet
     * POST /studysets/
     */
    createStudySet: builder.mutation<StudySet, StudySetCreate>({
      query: (data) => ({
        url: '/studysets/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Flashcard'],
    }),
    
    /**
     * Update StudySet
     * PUT /studysets/{studyset_id}/
     */
    updateStudySet: builder.mutation<
      StudySet,
      { id: string; data: StudySetUpdate }
    >({
      query: ({ id, data }) => ({
        url: `/studysets/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Flashcard', id },
        'Flashcard',
      ],
    }),
    
    /**
     * Delete StudySet
     * DELETE /studysets/{studyset_id}/
     */
    deleteStudySet: builder.mutation<MessageResponse, string>({
      query: (id) => ({
        url: `/studysets/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Flashcard'],
    }),
    
    /**
     * Get Terms in a StudySet
     * GET /studysets/{studyset_id}/terms/
     */
    getTerms: builder.query<
      TermsResponse,
      { studysetId: string; category?: string } & PaginationParams
    >({
      query: ({ studysetId, ...params }) => ({
        url: `/studysets/${studysetId}/terms/`,
        params,
      }),
      providesTags: (result, error, { studysetId }) => [
        { type: 'Flashcard', id: `${studysetId}-terms` },
      ],
    }),
    
    /**
     * Get Term by ID
     * GET /studysets/{studyset_id}/terms/{term_id}/
     */
    getTermById: builder.query<Term, { studysetId: string; termId: string }>({
      query: ({ studysetId, termId }) =>
        `/studysets/${studysetId}/terms/${termId}/`,
      providesTags: (result, error, { studysetId, termId }) => [
        { type: 'Flashcard', id: `${studysetId}-term-${termId}` },
      ],
    }),
    
    /**
     * Create Term
     * POST /studysets/{studyset_id}/terms/
     */
    createTerm: builder.mutation<Term, { studysetId: string; data: TermCreate }>(
      {
        query: ({ studysetId, data }) => ({
          url: `/studysets/${studysetId}/terms/`,
          method: 'POST',
          body: data,
        }),
        invalidatesTags: (result, error, { studysetId }) => [
          { type: 'Flashcard', id: `${studysetId}-terms` },
          'Flashcard',
        ],
      }
    ),
    
    /**
     * Update Term
     * PUT /studysets/{studyset_id}/terms/{term_id}/
     */
    updateTerm: builder.mutation<
      Term,
      { studysetId: string; termId: string; data: TermUpdate }
    >({
      query: ({ studysetId, termId, data }) => ({
        url: `/studysets/${studysetId}/terms/${termId}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { studysetId, termId }) => [
        { type: 'Flashcard', id: `${studysetId}-term-${termId}` },
        { type: 'Flashcard', id: `${studysetId}-terms` },
      ],
    }),
    
    /**
     * Delete Term
     * DELETE /studysets/{studyset_id}/terms/{term_id}/
     */
    deleteTerm: builder.mutation<
      MessageResponse,
      { studysetId: string; termId: string }
    >({
      query: ({ studysetId, termId }) => ({
        url: `/studysets/${studysetId}/terms/${termId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { studysetId }) => [
        { type: 'Flashcard', id: `${studysetId}-terms` },
        'Flashcard',
      ],
    }),
  }),
});

/**
 * Export Hooks
 */
export const {
  useGetCategoriesQuery,
  useGetStudySetsQuery,
  useGetStudySetByIdQuery,
  useCreateStudySetMutation,
  useUpdateStudySetMutation,
  useDeleteStudySetMutation,
  useGetTermsQuery,
  useGetTermByIdQuery,
  useCreateTermMutation,
  useUpdateTermMutation,
  useDeleteTermMutation,
} = studySetApi;

