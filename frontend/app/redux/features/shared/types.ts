/**
 * Class & StudySet Types
 * 
 * Types cho Class management và StudySet/Flashcard features
 * Sync với backend models
 */

// ==================== ENUMS ====================

export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN',
}

export enum ClassRole {
  OWNER = 'OWNER',
  MEMBER = 'MEMBER',
  CO_TEACHER = 'CO_TEACHER',
}

export enum ContentType {
  DEFAULT = 'DEFAULT',
  AI_GENERATED = 'AI_GENERATED',
}

// ==================== CLASS TYPES ====================

export interface Class {
  class_id: string;
  class_name: string;
  description?: string;
  created_by: string;
  owner_user_id: string;
  is_public: boolean;
  class_code?: string;
  created_at: string;
  updated_at: string;
  member_count?: number;  // Number of active members
  studyset_count?: number;  // Number of studysets in class
}

export type MembershipStatus = 'ACTIVE' | 'PENDING' | 'INVITED' | 'REJECTED' | 'LEFT';

export interface ClassMember {
  class_id: string;
  user_id: string;
  role: ClassRole;
  status: MembershipStatus;
  joined_at: string;
  invited_by?: string;
  approved_at?: string;
  user?: {
    user_id: string;
    username: string;
    email: string;
  };
}

export interface ClassCreate {
  class_name: string;
  description?: string;
  is_public?: boolean;
  class_code?: string;
}

export interface ClassUpdate {
  class_name?: string;
  description?: string;
  is_public?: boolean;
  class_code?: string;
}

export interface ClassesResponse {
  data: Class[];
  count: number;
}

export interface ClassMemberCreate {
  user_id: string;
  role?: ClassRole;
  status?: MembershipStatus;
}

export interface ClassMemberUpdate {
  role?: ClassRole;
  status?: MembershipStatus;
}

export interface ClassMembersResponse {
  data: ClassMember[];
  count: number;
}

// ==================== STUDYSET TYPES ====================

export interface StudySet {
  studyset_id: string;
  title: string;
  description?: string;
  owner_id: string;
  content_type: ContentType;
  category?: string;
  created_at: string;
  updated_at: string;
  term_count?: number;  // Number of terms (cards) in this studyset
  last_activity_at?: string | null;  // Last time user studied this set
  progress?: number;  // Completion rate (0-100)
}

export interface StudySetCreate {
  title: string;
  description?: string;
  content_type?: ContentType;
  category?: string;
}

export interface StudySetUpdate {
  title?: string;
  description?: string;
  content_type?: ContentType;
  category?: string;
}

export interface StudySetsResponse {
  data: StudySet[];
  count: number;
}

// ==================== TERM TYPES ====================

export interface Term {
  term_id: string;
  studyset_id: string;
  term_text: string;
  definition: string;
  example?: string;
  image_url?: string;
  attributes?: Record<string, any>;
  paragraphs?: Array<{
    paragraph: string;
    metadata: {
      key_concepts?: string[];
      word_count?: number;
      style?: string;
      generated_at?: string;
    };
  }>;
  created_at: string;
  updated_at: string;
}

export interface TermCreate {
  term_text: string;
  definition: string;
  example?: string;
  image_url?: string;
  attributes?: Record<string, any>;
}

export interface TermUpdate {
  term_text?: string;
  definition?: string;
  example?: string;
  image_url?: string;
  attributes?: Record<string, any>;
}

export interface TermsResponse {
  data: Term[];
  count: number;
}

// ==================== API RESPONSE TYPES ====================

export interface MessageResponse {
  message: string;
}

// ==================== QUERY PARAMS ====================

export interface PaginationParams {
  skip?: number;
  limit?: number;
  q?: string;  // Search query
}

// ==================== ANALYTICS TYPES ====================

export interface StudentProgressDetail {
  user_id: string;
  username: string;
  email: string;
  total_studysets: number;
  completed_studysets: number;
  total_terms_studied: number;
  average_accuracy: number;  // 0-100
  total_study_time: number;  // in seconds
  last_activity: string | null;
  mastery_percentage: number;  // 0-100
  weak_terms_count: number;
}

export interface ClassAnalyticsOverview {
  class_id: string;
  class_name: string;
  total_members: number;
  active_members: number;
  total_studysets: number;
  total_terms: number;
  average_completion_rate: number;  // 0-100
  average_accuracy: number;  // 0-100
  total_study_sessions: number;
  total_study_time: number;  // in seconds
  most_active_student: StudentProgressDetail | null;
  least_active_student: StudentProgressDetail | null;
}

export interface StudySetAnalytics {
  studyset_id: string;
  studyset_name: string;
  total_terms: number;
  students_started: number;
  students_completed: number;
  average_progress: number;  // 0-100
  average_accuracy: number;  // 0-100
  average_completion_time: number | null;  // in seconds
  most_difficult_terms: Array<{
    term_id: string;
    term_text: string;
    error_rate: number;
  }>;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  email: string;
  total_terms_mastered: number;
  accuracy: number;  // 0-100
  study_streak_days: number;
  total_study_time: number;  // in seconds
  last_study_date: string | null;
}

export interface ClassLeaderboard {
  class_id: string;
  entries: LeaderboardEntry[];
  count: number;
}

export interface StudentProgressList {
  data: StudentProgressDetail[];
  count: number;
}

// Time-series Analytics Types
export interface DailyStudyTime {
  date: string;  // "Mon", "Tue", etc. or "YYYY-MM-DD"
  hours: number;
  sessions: number;
  total_seconds: number;
}

export interface WeeklyRetention {
  week: string;  // "Week 1", "Week 2", etc.
  remember: number;  // Percentage
  forget: number;  // Percentage
  total_activities: number;
}

export interface TestPerformancePoint {
  test_id: string;
  test_name: string;
  score: number;  // 0-100
  average: number;  // Class average 0-100
  completed_at: string;
  attempt_number: number;
}

export interface ProgressOverTime {
  period: string;  // "Jan", "Feb", etc. or "YYYY-MM"
  mastered: number;
  learning: number;
  new: number;
  total: number;
}

export interface StudyCategoryDistribution {
  name: string;
  value: number;
  color: string | null;
}

export interface ClassTimeSeriesAnalytics {
  class_id: string;
  daily_study_time: DailyStudyTime[];
  weekly_retention: WeeklyRetention[];
  test_performance: TestPerformancePoint[];
  progress_over_time: ProgressOverTime[];
  study_categories: StudyCategoryDistribution[];
  pass_fail_distribution: {
    passed: number;
    failed: number;
  };
}
