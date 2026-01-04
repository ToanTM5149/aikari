/**
 * Learning API - Redux Toolkit Query
 * API hooks for learning sessions and progress tracking
 */

import { baseApi } from '../../store/api/baseApi';
import type {
  LearningSessionStart,
  LearningSessionStartResponse,
  NextTermResponse,
  ReviewSubmission,
  ReviewResponse,
  SessionSummary,
  ProgressSummaryPublic,
  StudyStats,
} from './types';

export const learningApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Start learning session
    startLearningSession: builder.mutation<
      LearningSessionStartResponse,
      LearningSessionStart
    >({
      query: (data) => ({
        url: '/learning/session/start/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Learning'],
    }),

    // Get next term to review
    getNextTerm: builder.query<NextTermResponse, string>({
      query: (studysetId) => `/learning/studysets/${studysetId}/next/`,
      providesTags: (result, error, studysetId) => [
        { type: 'Learning', id: studysetId },
      ],
    }),

    // Submit review
    submitReview: builder.mutation<
      ReviewResponse,
      { studysetId: string; review: ReviewSubmission }
    >({
      query: ({ studysetId, review }) => ({
        url: `/learning/studysets/${studysetId}/review/`,
        method: 'POST',
        body: review,
      }),
      invalidatesTags: (result, error, { studysetId }) => [
        { type: 'Learning', id: studysetId },
        { type: 'Progress', id: studysetId },
        'Flashcard', // Invalidate studyset list to refresh last_activity_at and progress
      ],
    }),

    // End learning session
    endLearningSession: builder.mutation<
      SessionSummary,
      { studysetId: string; sessionStart: string }
    >({
      query: ({ studysetId, sessionStart }) => ({
        url: '/learning/session/end/',
        method: 'POST',
        params: {
          studyset_id: studysetId,
          session_start: sessionStart,
        },
      }),
      invalidatesTags: ['Learning', 'Progress', 'Flashcard'], // Invalidate studyset list to refresh last_activity_at and progress
    }),

    // Get studyset progress
    getStudysetProgress: builder.query<ProgressSummaryPublic, string>({
      query: (studysetId) => `/learning/progress/studysets/${studysetId}/`,
      providesTags: (result, error, studysetId) => [
        { type: 'Progress', id: studysetId },
      ],
    }),

    // Get studyset stats
    getStudysetStats: builder.query<StudyStats, string>({
      query: (studysetId) => `/learning/progress/studysets/${studysetId}/stats/`,
      providesTags: (result, error, studysetId) => [
        { type: 'Progress', id: studysetId },
      ],
    }),
  }),
});

export const {
  useStartLearningSessionMutation,
  useGetNextTermQuery,
  useLazyGetNextTermQuery,
  useSubmitReviewMutation,
  useEndLearningSessionMutation,
  useGetStudysetProgressQuery,
  useGetStudysetStatsQuery,
} = learningApi;
