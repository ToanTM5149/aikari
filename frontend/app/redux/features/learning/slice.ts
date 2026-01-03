/**
 * Learning Slice - State Management
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { LearningSessionState, NextTermResponse } from './types';

const initialState: LearningSessionState = {
  sessionId: undefined,
  studysetId: undefined,
  sessionStartTime: undefined,
  currentCardIndex: 0,
  totalCards: 0,
  cardsReviewed: 0,
  correctCount: 0,
  incorrectCount: 0,
  isFlipped: false,
  currentTerm: undefined,
};

export const learningSlice = createSlice({
  name: 'learning',
  initialState,
  reducers: {
    startSession: (
      state,
      action: PayloadAction<{
        sessionId: string;
        studysetId: string;
        totalCards: number;
      }>
    ) => {
      state.sessionId = action.payload.sessionId;
      state.studysetId = action.payload.studysetId;
      state.totalCards = action.payload.totalCards;
      state.sessionStartTime = new Date().toISOString();
      state.currentCardIndex = 0;
      state.cardsReviewed = 0;
      state.correctCount = 0;
      state.incorrectCount = 0;
      state.isFlipped = false;
    },

    setCurrentTerm: (state, action: PayloadAction<NextTermResponse>) => {
      state.currentTerm = action.payload;
      state.isFlipped = false;
    },

    flipCard: (state) => {
      state.isFlipped = !state.isFlipped;
    },

    recordReview: (
      state,
      action: PayloadAction<{ isCorrect: boolean }>
    ) => {
      state.cardsReviewed += 1;
      if (action.payload.isCorrect) {
        state.correctCount += 1;
      } else {
        state.incorrectCount += 1;
      }
    },

    nextCard: (state) => {
      if (state.currentCardIndex < state.totalCards - 1) {
        state.currentCardIndex += 1;
        state.isFlipped = false;
      }
    },

    previousCard: (state) => {
      if (state.currentCardIndex > 0) {
        state.currentCardIndex -= 1;
        state.isFlipped = false;
      }
    },

    endSession: (state) => {
      return initialState;
    },

    resetSession: () => initialState,
  },
});

export const {
  startSession,
  setCurrentTerm,
  flipCard,
  recordReview,
  nextCard,
  previousCard,
  endSession,
  resetSession,
} = learningSlice.actions;

export default learningSlice.reducer;
