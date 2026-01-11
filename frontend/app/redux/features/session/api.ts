/**
 * Session API - New session-based learning
 */

import { baseApi } from '../../store/api/baseApi';
import type {
  StartSessionRequest,
  StartSessionResponse,
  EndSessionRequest,
  EndSessionResponse,
  SessionInfo,
} from './types';

export const sessionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Start session
    startSession: builder.mutation<StartSessionResponse, StartSessionRequest>({
      query: (data) => ({
        url: '/session/start',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Session'],
    }),

    // End session with batch reviews
    endSession: builder.mutation<EndSessionResponse, EndSessionRequest>({
      query: (data) => ({
        url: '/session/end',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Session', 'Learning', 'Progress', 'Flashcard'],
    }),

    // Get active session
    getActiveSession: builder.query<SessionInfo | null, string | undefined>({
      query: (studysetId) => ({
        url: '/session/active',
        params: studysetId ? { studyset_id: studysetId } : undefined,
      }),
      providesTags: ['Session'],
    }),
  }),
});

export const {
  useStartSessionMutation,
  useEndSessionMutation,
  useGetActiveSessionQuery,
} = sessionApi;
