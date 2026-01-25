/**
 * Enrollment API Endpoints
 * 
 * RTK Query endpoints cho enrollment management
 * Sync với backend: /api/v1/enrollment
 */

import { baseApi } from '../../store/api/baseApi';

// Types
export interface EnrolledStudySetDetail {
  studyset_id: string;
  title: string;
  description: string | null;
  owner_id: string;
  content_type: string;
  category_id: string | null;
  enrolled_at: string;
  last_studied_at: string | null;
  created_at: string;
  updated_at: string;
  term_count: number; 
}

export interface EnrollmentStats {
  total_enrolled: number;
  recently_studied: number;
  never_studied: number;
}

export interface EnrolledStudySetListResponse {
  data: EnrolledStudySetDetail[];
  count: number;
}

export interface GetEnrolledStudysetsParams {
  skip?: number;
  limit?: number;
  q?: string;
  category_id?: string;
  sort_by?: 'last_studied_at' | 'enrolled_at' | 'created_at' | 'title';
  sort_order?: 'asc' | 'desc';
}

/**
 * Enrollment API Endpoints
 */
export const enrollmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get My Enrolled Studysets
     * GET /enrollment/me/studysets
     * 
     * Supports:
     * - Search (q parameter)
     * - Filter by category (category_id parameter)
     * - Sorting (sort_by, sort_order parameters)
     * - Pagination (skip, limit parameters)
     */
    getMyEnrolledStudysets: builder.query<
      EnrolledStudySetListResponse,
      GetEnrolledStudysetsParams | void
    >({
      query: (params) => {
        if (!params || typeof params !== 'object') {
          return '/enrollment/me/studysets';
        }
        const queryParams: Record<string, any> = {};
        if (params.skip !== undefined) queryParams.skip = params.skip;
        if (params.limit !== undefined) queryParams.limit = params.limit;
        if (params.q !== undefined && params.q !== '') queryParams.q = params.q;
        if (params.category_id !== undefined) queryParams.category_id = params.category_id;
        if (params.sort_by !== undefined) queryParams.sort_by = params.sort_by;
        if (params.sort_order !== undefined) queryParams.sort_order = params.sort_order;
        return {
          url: '/enrollment/me/studysets',
          params: queryParams,
        };
      },
      providesTags: ['Enrollment'],
    }),

    /**
     * Get Enrollment Stats
     * GET /enrollment/me/stats
     */
    getEnrollmentStats: builder.query<EnrollmentStats, void>({
      query: () => '/enrollment/me/stats',
      providesTags: ['Enrollment'],
    }),

    /**
     * Check Enrollment Status
     * GET /enrollment/studysets/{studyset_id}/is-enrolled
     */
    checkEnrollmentStatus: builder.query<boolean, string>({
      query: (studysetId) => `/enrollment/studysets/${studysetId}/is-enrolled`,
      providesTags: (result, error, studysetId) => [
        { type: 'Flashcard', id: studysetId },
      ],
    }),

    /**
     * Enroll in StudySet
     * POST /enrollment/studysets/{studyset_id}/enroll
     */
    enrollInStudySet: builder.mutation<{ enrolled_at: string; last_studied_at: string | null }, string>({
      query: (studysetId) => ({
        url: `/enrollment/studysets/${studysetId}/enroll`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, studysetId) => [
        { type: 'Enrollment', id: studysetId },
        'Enrollment',
        'Flashcard',
      ],
    }),

    /**
     * Unenroll from StudySet
     * DELETE /enrollment/studysets/{studyset_id}/unenroll
     */
    unenrollFromStudySet: builder.mutation<void, string>({
      query: (studysetId) => ({
        url: `/enrollment/studysets/${studysetId}/unenroll`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, studysetId) => [
        { type: 'Enrollment', id: studysetId },
        'Enrollment',
        'Flashcard',
      ],
    }),
  }),
});

/**
 * Export Hooks
 */
export const {
  useGetMyEnrolledStudysetsQuery,
  useGetEnrollmentStatsQuery,
  useCheckEnrollmentStatusQuery,
  useEnrollInStudySetMutation,
  useUnenrollFromStudySetMutation,
} = enrollmentApi;
