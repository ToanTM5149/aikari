/**
 * Test API
 * 
 * RTK Query endpoints for test management
 */

import { baseApi } from "../../store/api/baseApi";
import type {
  Test,
  TestWithQuestions,
  TestsResponse,
  TestCreateRequest,
  TestAttempt,
  AttemptWithAnswers,
  AttemptWithQuestionsOnly,
  AttemptsResponse,
  AttemptCreateRequest,
  AttemptSubmitRequest,
  ReattemptRequest,
  ReattemptRequestsResponse,
  ReattemptRequestCreateRequest,
  ReattemptRequestUpdateRequest,
} from "./types";

export const testApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Test endpoints
    createTest: builder.mutation<TestWithQuestions, TestCreateRequest>({
      query: ({ studyset_id, ...data }) => ({
        url: `/tests/studysets/${studyset_id}/tests/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Test"],
    }),

    getTestsForStudyset: builder.query<
      TestsResponse,
      { studysetId: string; skip?: number; limit?: number }
    >({
      query: ({ studysetId, skip = 0, limit = 100 }) => ({
        url: `/tests/studysets/${studysetId}/tests/`,
        params: { skip, limit },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ test_id }) => ({
                type: "Test" as const,
                id: test_id,
              })),
              { type: "Test", id: "LIST" },
            ]
          : [{ type: "Test", id: "LIST" }],
    }),

    getTest: builder.query<TestWithQuestions, string>({
      query: (testId) => `/tests/tests/${testId}/`,
      providesTags: (result) =>
        result ? [{ type: "Test", id: result.test_id }] : [],
    }),

    deleteTest: builder.mutation<{ message: string }, string>({
      query: (testId) => ({
        url: `/tests/tests/${testId}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Test"],
    }),

    // Attempt endpoints
    startTestAttempt: builder.mutation<
      AttemptWithQuestionsOnly,
      AttemptCreateRequest
    >({
      query: ({ test_id, ...data }) => ({
        url: `/tests/tests/${test_id}/attempts/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Attempt"],
    }),

    submitTestAttempt: builder.mutation<
      AttemptWithAnswers,
      { attemptId: string; submission: AttemptSubmitRequest }
    >({
      query: ({ attemptId, submission }) => ({
        url: `/tests/attempts/${attemptId}/submit/`,
        method: "POST",
        body: submission,
      }),
      invalidatesTags: (result) =>
        result
          ? [
              { type: "Attempt", id: result.attempt_id },
              { type: "Attempt", id: "LIST" },
            ]
          : ["Attempt"],
    }),

    getAttemptResult: builder.query<AttemptWithAnswers, string>({
      query: (attemptId) => `/tests/attempts/${attemptId}/`,
      providesTags: (result) =>
        result ? [{ type: "Attempt", id: result.attempt_id }] : [],
    }),

    getMyAttempts: builder.query<
      AttemptsResponse,
      { testId: string; classId?: string }
    >({
      query: ({ testId, classId }) => ({
        url: `/tests/tests/${testId}/my-attempts/`,
        params: classId ? { class_id: classId } : undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ attempt_id }) => ({
                type: "Attempt" as const,
                id: attempt_id,
              })),
              { type: "Attempt", id: "LIST" },
            ]
          : [{ type: "Attempt", id: "LIST" }],
    }),

    getMyTestHistory: builder.query<
      AttemptsResponse,
      {
        classId?: string;
        testCreatorId?: string;
        search?: string;
        skip?: number;
        limit?: number;
      }
    >({
      query: (params) => {
        const queryParams: Record<string, string | number> = {
          skip: params.skip || 0,
          limit: params.limit || 100,
        };
        
        if (params.classId) {
          queryParams.class_id = params.classId;
        }
        if (params.testCreatorId) {
          queryParams.test_creator_id = params.testCreatorId;
        }
        if (params.search) {
          queryParams.search = params.search;
        }
        
        return {
          url: `/tests/attempts/my-history/`,
          params: queryParams,
        };
      },
      // Force refetch when params change by using serializeQueryArgs
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const { classId, testCreatorId, search, skip, limit } = queryArgs;
        return `${endpointName}(${classId || ''},${testCreatorId || ''},${search || ''},${skip || 0},${limit || 100})`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ attempt_id }) => ({
                type: "Attempt" as const,
                id: attempt_id,
              })),
              { type: "Attempt", id: "HISTORY" },
            ]
          : [{ type: "Attempt", id: "HISTORY" }],
    }),

    // Reattempt request endpoints
    createReattemptRequest: builder.mutation<
      ReattemptRequest,
      ReattemptRequestCreateRequest
    >({
      query: (data) => ({
        url: `/tests/reattempt-requests/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, request) => [
        "ReattemptRequest",
        { type: "ReattemptRequest", id: `attempt-${request.attempt_id}` },
      ],
    }),

    getReattemptRequestsForClass: builder.query<
      ReattemptRequestsResponse,
      { classId: string; status?: string }
    >({
      query: ({ classId, status }) => ({
        url: `/tests/classes/${classId}/reattempt-requests/`,
        params: status ? { status } : undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ request_id }) => ({
                type: "ReattemptRequest" as const,
                id: request_id,
              })),
              { type: "ReattemptRequest", id: "LIST" },
            ]
          : [{ type: "ReattemptRequest", id: "LIST" }],
    }),

    getReattemptRequestByAttempt: builder.query<
      ReattemptRequest | null,
      string
    >({
      query: (attemptId) => `/tests/reattempt-requests/attempt/${attemptId}/`,
      providesTags: (result, error, attemptId) =>
        result
          ? [{ type: "ReattemptRequest", id: result.request_id }]
          : [{ type: "ReattemptRequest", id: `attempt-${attemptId}` }],
    }),

    updateReattemptRequest: builder.mutation<
      ReattemptRequest,
      { requestId: string; data: ReattemptRequestUpdateRequest }
    >({
      query: ({ requestId, data }) => ({
        url: `/tests/reattempt-requests/${requestId}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result) =>
        result
          ? [
              { type: "ReattemptRequest", id: result.request_id },
              { type: "ReattemptRequest", id: "LIST" },
              { type: "ReattemptRequest", id: `attempt-${result.attempt_id}` },
            ]
          : ["ReattemptRequest"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateTestMutation,
  useGetTestsForStudysetQuery,
  useGetTestQuery,
  useDeleteTestMutation,
  useStartTestAttemptMutation,
  useSubmitTestAttemptMutation,
  useGetAttemptResultQuery,
  useGetMyAttemptsQuery,
  useGetMyTestHistoryQuery,
  useCreateReattemptRequestMutation,
  useGetReattemptRequestsForClassQuery,
  useGetReattemptRequestByAttemptQuery,
  useUpdateReattemptRequestMutation,
} = testApi;
