/**
 * Session API types - New session-based learning
 */

export interface SessionReviewInput {
  term_id: string;
  recall_score: number; // 0-5
  response_time?: number;
  hint_used?: boolean;
}

export interface StartSessionRequest {
  studyset_id?: string;
  session_type?: 'flashcard' | 'quick_review' | 'test';
  total_cards?: number;
}

export interface StartSessionResponse {
  session_id: string;
  studyset_id?: string;
  session_type: string;
  started_at: string;
  total_cards: number;
  terms: NextTermResponse[]; // All terms for the session
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
}

export interface EndSessionRequest {
  session_id: string;
  reviews: SessionReviewInput[]; // Batch reviews
}

export interface EndSessionResponse {
  session_id: string;
  total_cards: number;
  completed_cards: number;
  activities_created: number;
  duration_seconds: number;
  next_review_dates_calculated: number;
}

export interface SessionInfo {
  session_id: string;
  studyset_id?: string;
  session_type: string;
  status: 'active' | 'completed' | 'abandoned';
  started_at: string;
  ended_at?: string;
  total_cards: number;
  completed_cards: number;
}
