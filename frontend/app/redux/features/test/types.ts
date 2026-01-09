/**
 * Test Types
 * 
 * Type definitions for test-related data
 */

export enum QuestionType {
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  TRUE_FALSE = "TRUE_FALSE",
  ESSAY = "ESSAY",
}

export enum ReattemptStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface Test {
  test_id: string;
  studyset_id: string;
  title: string;
  description?: string;
  total_questions: number;
  show_answers: boolean;
  question_types: string[];
  time_limit?: number | null; // Time limit in seconds (null = no limit)
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Question {
  question_id: string;
  test_id: string;
  term_id: string;
  question_type: QuestionType;
  question_text: string;
  correct_answer: string;
  options?: string[];
  explanation?: string;  // Explanation for the correct answer
  order: number;
}

export interface QuestionWithoutAnswer {
  question_id: string;
  test_id: string;
  term_id: string;
  question_type: QuestionType;
  question_text: string;
  options?: string[];
  order: number;
}

export interface TestWithQuestions extends Test {
  questions: Question[];
}

export interface TestAttempt {
  attempt_id: string;
  test_id: string;
  user_id: string;
  class_id?: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  is_completed: boolean;
  started_at: string;
  completed_at?: string;
  // Additional fields from history endpoint
  test_title?: string;
  test_description?: string;
  studyset_id?: string;
  studyset_title?: string;
  class_name?: string;
  test_creator_id?: string;
  test_creator_username?: string;
}

export interface Answer {
  answer_id: string;
  attempt_id: string;
  question_id: string;
  user_answer?: string;
  is_correct: boolean;
}

export interface AttemptWithAnswers extends TestAttempt {
  answers: Answer[];
  questions: Question[];
}

export interface AttemptWithQuestionsOnly extends TestAttempt {
  questions: QuestionWithoutAnswer[];
}

export interface ReattemptRequest {
  request_id: string;
  attempt_id: string;
  user_id: string;
  class_id: string;
  status: ReattemptStatus;
  requested_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  // Additional fields from backend
  test_title?: string;
  test_id?: string;
  studyset_id?: string;
  attempt_score?: number;
  attempt_correct_answers?: number;
  attempt_total_questions?: number;
  attempt_completed_at?: string;
}

// Request/Response types
export interface TestCreateRequest {
  studyset_id: string;
  title: string;
  description?: string;
  total_questions: number;
  show_answers: boolean;
  question_types: string[];
  time_limit?: number | null; // Time limit in seconds (null = no limit)
}

export interface AttemptCreateRequest {
  test_id: string;
  class_id?: string;
}

export interface AnswerSubmit {
  question_id: string;
  user_answer: string;
}

export interface AttemptSubmitRequest {
  answers: AnswerSubmit[];
}

export interface ReattemptRequestCreateRequest {
  attempt_id: string;
}

export interface ReattemptRequestUpdateRequest {
  status: ReattemptStatus;
}

// List responses
export interface TestsResponse {
  data: Test[];
  count: number;
}

export interface AttemptsResponse {
  data: TestAttempt[];
  count: number;
}

export interface ReattemptRequestsResponse {
  data: ReattemptRequest[];
  count: number;
}
