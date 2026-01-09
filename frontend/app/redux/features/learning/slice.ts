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
  difficultyDistribution: {
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  },
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
      state.difficultyDistribution = {
        again: 0,
        hard: 0,
        good: 0,
        easy: 0,
      };
      state.isFlipped = false;
    },

    setCurrentTerm: (state, action: PayloadAction<NextTermResponse | undefined>) => {
      state.currentTerm = action.payload;
      state.isFlipped = false;
    },

    flipCard: (state) => {
      state.isFlipped = !state.isFlipped;
    },

    recordReview: (
      state,
      action: PayloadAction<{ recallScore: number }>
    ) => {
      state.cardsReviewed += 1;
      const score = action.payload.recallScore;
      
      // Track difficulty distribution
      if (score <= 1) {
        state.difficultyDistribution.again += 1;
      } else if (score === 2) {
        state.difficultyDistribution.hard += 1;
      } else if (score <= 4) {
        state.difficultyDistribution.good += 1;
      } else {
        state.difficultyDistribution.easy += 1;
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
