/**
 * Admin API Service
 * 
 * RTK Query endpoints cho Admin Statistics
 */

import { baseApi } from './baseApi';

/**
 * Type Definitions cho Admin Statistics
 */

// System Overview
export interface SystemOverviewStats {
  total_users: number;
  total_students: number;
  total_teachers: number;
  total_admins: number;
  total_classes: number;
  total_studysets: number;
  total_terms: number;
  total_study_activities: number;
  total_ai_generations: number;
  total_chat_messages: number;
  active_users_last_7_days: number;
  active_users_last_30_days: number;
  new_users_last_7_days: number;
  new_users_last_30_days: number;
  generated_at: string;
}

// User Statistics
export interface UserRoleDistribution {
  role: string;
  count: number;
  percentage: number;
}

export interface UserActivityMetrics {
  user_id: string;
  username: string;
  full_name: string;
  email: string;
  role: string;
  total_studysets: number;
  total_study_time_minutes: number;
  total_activities: number;
  last_active_at: string | null;
  created_at: string;
}

export interface UserStatistics {
  total_users: number;
  active_users_today: number;
  active_users_week: number;
  active_users_month: number;
  role_distribution: UserRoleDistribution[];
  top_active_users: UserActivityMetrics[];
}

// Learning Statistics
export interface LearningOverviewStats {
  total_study_sessions: number;
  total_study_time_hours: number;
  total_terms_studied: number;
  total_terms_mastered: number;
  average_session_duration_minutes: number;
  average_accuracy_percentage: number;
  study_sessions_last_7_days: number;
  study_sessions_last_30_days: number;
}

export interface DailyActivityPoint {
  date: string;
  study_sessions: number;
  active_users: number;
  study_time_hours: number;
}

export interface LearningTrendStats {
  daily_activities: DailyActivityPoint[];
  period_start: string;
  period_end: string;
}

// Class Statistics
export interface ClassOverviewStats {
  total_classes: number;
  total_public_classes: number;
  total_private_classes: number;
  total_class_members: number;
  average_members_per_class: number;
  classes_created_last_7_days: number;
  classes_created_last_30_days: number;
}

export interface TopClassMetrics {
  class_id: string;
  class_name: string;
  owner_username: string;
  member_count: number;
  studyset_count: number;
  total_study_activities: number;
  is_public: boolean;
  created_at: string;
}

export interface ClassStatistics {
  overview: ClassOverviewStats;
  top_classes_by_members: TopClassMetrics[];
  top_classes_by_activity: TopClassMetrics[];
}

// AI Usage Statistics
export interface AIGenerationStats {
  total_generations: number;
  total_tests_generated: number;
  total_paragraphs_generated: number;
  total_chat_conversations: number;
  total_chat_messages: number;
  generations_last_7_days: number;
  generations_last_30_days: number;
  chat_messages_last_7_days: number;
  chat_messages_last_30_days: number;
  average_test_questions_per_generation: number;
}

export interface DailyAIUsagePoint {
  date: string;
  generations: number;
  chat_messages: number;
}

export interface AIUsageTrendStats {
  daily_usage: DailyAIUsagePoint[];
  period_start: string;
  period_end: string;
}

// Content Statistics
export interface PopularStudySetMetrics {
  studyset_id: string;
  title: string;
  owner_username: string;
  term_count: number;
  total_learners: number;
  total_activities: number;
  average_completion_rate: number;
  created_at: string;
}

export interface ContentStatistics {
  total_studysets: number;
  total_terms: number;
  average_terms_per_studyset: number;
  studysets_with_ai_content: number;
  top_studysets_by_learners: PopularStudySetMetrics[];
  top_studysets_by_activities: PopularStudySetMetrics[];
  categories: Array<{ category: string; count: number }>;
}

// Complete Dashboard
export interface AdminDashboardStats {
  system_overview: SystemOverviewStats;
  user_stats: UserStatistics;
  learning_stats: LearningOverviewStats;
  class_stats: ClassStatistics;
  ai_usage_stats: AIGenerationStats;
  content_stats: ContentStatistics;
  generated_at: string;
}

/**
 * Admin API Endpoints
 */
export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Complete Dashboard
    getAdminDashboard: builder.query<AdminDashboardStats, void>({
      query: () => '/admin/dashboard/',
      providesTags: ['AdminDashboard'],
    }),
    
    // System Overview
    getSystemOverview: builder.query<SystemOverviewStats, void>({
      query: () => '/admin/statistics/overview/',
      providesTags: ['SystemOverview'],
    }),
    
    // User Statistics
    getUserStatistics: builder.query<UserStatistics, { topLimit?: number }>({
      query: ({ topLimit = 10 }) => ({
        url: '/admin/statistics/users/',
        params: { top_limit: topLimit },
      }),
      providesTags: ['UserStatistics'],
    }),
    
    // Learning Overview
    getLearningOverview: builder.query<LearningOverviewStats, void>({
      query: () => '/admin/statistics/learning/overview/',
      providesTags: ['LearningOverview'],
    }),
    
    // Learning Trends
    getLearningTrends: builder.query<LearningTrendStats, { days?: number }>({
      query: ({ days = 30 }) => ({
        url: '/admin/statistics/learning/trends/',
        params: { days },
      }),
      providesTags: ['LearningTrends'],
    }),
    
    // Class Statistics
    getClassStatistics: builder.query<ClassStatistics, { topLimit?: number }>({
      query: ({ topLimit = 10 }) => ({
        url: '/admin/statistics/classes/',
        params: { top_limit: topLimit },
      }),
      providesTags: ['ClassStatistics'],
    }),
    
    // AI Usage Overview
    getAIUsageOverview: builder.query<AIGenerationStats, void>({
      query: () => '/admin/statistics/ai/overview/',
      providesTags: ['AIUsageOverview'],
    }),
    
    // AI Usage Trends
    getAIUsageTrends: builder.query<AIUsageTrendStats, { days?: number }>({
      query: ({ days = 30 }) => ({
        url: '/admin/statistics/ai/trends/',
        params: { days },
      }),
      providesTags: ['AIUsageTrends'],
    }),
    
    // Content Statistics
    getContentStatistics: builder.query<ContentStatistics, { topLimit?: number }>({
      query: ({ topLimit = 10 }) => ({
        url: '/admin/statistics/content/',
        params: { top_limit: topLimit },
      }),
      providesTags: ['ContentStatistics'],
    }),
  }),
  overrideExisting: false,
});

/**
 * Export hooks for components
 */
export const {
  useGetAdminDashboardQuery,
  useGetSystemOverviewQuery,
  useGetUserStatisticsQuery,
  useGetLearningOverviewQuery,
  useGetLearningTrendsQuery,
  useGetClassStatisticsQuery,
  useGetAIUsageOverviewQuery,
  useGetAIUsageTrendsQuery,
  useGetContentStatisticsQuery,
} = adminApi;
