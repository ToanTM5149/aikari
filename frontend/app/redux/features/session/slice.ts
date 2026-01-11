/**
 * Session slice - Local state for session-based learning
 */

import { createSlice} from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { SessionReviewInput } from './types';

interface SessionState {
  sessionId: string | null;
  studysetId: string | null;
  isActive: boolean;
  startedAt: string | null;
  reviews: SessionReviewInput[]; // Local reviews storage
  currentTermId: string | null;
  totalCards: number;
}

const initialState: SessionState = {
  sessionId: null,
  studysetId: null,
  isActive: false,
  startedAt: null,
  reviews: [],
  currentTermId: null,
  totalCards: 0,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    // Start local session tracking
    sessionStarted: (state, action: PayloadAction<{
      sessionId: string;
      studysetId?: string;
      startedAt: string;
      totalCards: number;
    }>) => {
      state.sessionId = action.payload.sessionId;
      state.studysetId = action.payload.studysetId || null;
      state.isActive = true;
      state.startedAt = action.payload.startedAt;
      state.totalCards = action.payload.totalCards;
      state.reviews = [];
    },

    // Add or update review locally (not sent to API yet)
    reviewAdded: (state, action: PayloadAction<SessionReviewInput>) => {
      const existingIndex = state.reviews.findIndex(
        r => r.term_id === action.payload.term_id
      );
      
      if (existingIndex >= 0) {
        // Update existing review
        state.reviews[existingIndex] = action.payload;
      } else {
        // Add new review
        state.reviews.push(action.payload);
      }
      
      state.currentTermId = action.payload.term_id;
    },

    // Set current term
    currentTermSet: (state, action: PayloadAction<string>) => {
      state.currentTermId = action.payload;
    },

    // End session (clear local state)
    sessionEnded: (state) => {
      return initialState;
    },

    // Reset session
    sessionReset: () => initialState,
  },
});

export const {
  sessionStarted,
  reviewAdded,
  currentTermSet,
  sessionEnded,
  sessionReset,
} = sessionSlice.actions;

export default sessionSlice.reducer;
