/**
 * Learning Types
 */

export interface LearningSessionStart {
  studyset_id: string;
  session_size?: number; // Default 20
}

export interface LearningSessionStartResponse {
  session_id: string;
  studyset_id: string;
  total_terms: number;
  terms_in_session: number;
  terms: NextTermResponse[];  // List of terms for this session
  started_at: string;
}

export interface NextTermResponse {
  term_id: string;
  term_text: string;
  definition: string;
  example?: string;
  image_url?: string;
  category?: string;
  is_new: boolean;
  previous_recall_score?: number;
  next_review_date?: string;
  studyset_id?: string; // Used in quick review
}

export interface ReviewSubmission {
  term_id: string;
  recall_score: number; // 0-5
  hint_used?: boolean;
  response_time?: number; // seconds
}

export interface ReviewResponse {
  activity_id: string;
  term_id: string;
  recall_score: number;
  ef: number;
  interval: number;
  next_review_date: string;
  message: string;
}

export interface SessionSummary {
  studyset_id: string;
  session_duration: number; // minutes
  total_reviewed: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  average_recall_score: number;
  cards_due_next: number;
  next_review_date?: string;
}

export interface ProgressSummaryPublic {
  progress_id: string;
  studyset_id: string;
  user_id: string;
  mastered_terms: number;
  reviewing_terms: number;
  forgotten_terms: number;
  average_recall_score: number;
  average_response_time: number;
  streak_days: number;
  completion_rate: number;
  next_due_date?: string;
  updated_at: string;
}

export interface WeakTerm {
  term_id: string;
  term_text: string;
  definition: string;
  recall_score: number;
  times_reviewed: number;
  last_reviewed: string;
  next_review?: string;
}

export interface StudyStats {
  studyset_id: string;
  total_terms: number;
  studied_terms: number;
  mastered_terms: number;
  reviewing_terms: number;
  forgotten_terms: number;
  never_studied: number;
  accuracy: number;
  average_recall_score: number;
  total_study_time: number;
  weak_terms: WeakTerm[];
}

// Due Cards and Quick Review
export interface DueCardInfo {
  term_id: string;
  studyset_id: string;
  studyset_name: string;
  term_text: string;
  definition: string;
  example?: string;
  image_url?: string;
  next_review_date: string;
  ef: number;
  interval: number;
  last_reviewed: string;
}

export interface DueCardsResponse {
  total_due: number;
  due_today: number;
  due_this_week: number;
  cards: DueCardInfo[];
  studysets_affected: string[];
}

export interface QuickReviewSessionRequest {
  studyset_ids?: string[] | null;
  max_cards?: number; // Default 20
}

export interface QuickReviewSessionResponse {
  session_id: string;
  total_cards: number;
  cards: NextTermResponse[];
  studysets_included: string[];
  started_at: string;
}

// Learning Session State
export interface LearningSessionState {
  sessionId?: string;
  studysetId?: string;
  sessionStartTime?: string;
  currentCardIndex: number;
  totalCards: number;
  cardsReviewed: number;
  difficultyDistribution: {
    again: number;    // recall_score 0-1
    hard: number;     // recall_score 2
    good: number;     // recall_score 3-4
    easy: number;     // recall_score 5
  };
  isFlipped: boolean;
  currentTerm?: NextTermResponse;
}
