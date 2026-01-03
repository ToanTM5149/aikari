/**
 * Flashcard Learning Page
 * Main page for learning flashcards with spaced repetition
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '~/redux/store/hooks';
import {
  useStartLearningSessionMutation,
  useLazyGetNextTermQuery,
  useSubmitReviewMutation,
  useEndLearningSessionMutation,
} from '~/redux/features/learning';
import {
  startSession,
  setCurrentTerm,
  flipCard,
  recordReview,
  resetSession,
} from '~/redux/features/learning';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Progress } from '~/components/ui/progress';
import { ArrowLeft, RefreshCw, Check, X, HelpCircle } from 'lucide-react';
import type { RootState } from '~/redux/store';

export function FlashcardLearningPage() {
  const { studysetId } = useParams<{ studysetId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Redux state
  const learningState = useAppSelector((state: RootState) => state.learning);

  // API hooks
  const [startSessionMutation] = useStartLearningSessionMutation();
  const [getNextTerm, { data: nextTerm, isLoading: isLoadingTerm }] =
    useLazyGetNextTermQuery();
  const [submitReviewMutation, { isLoading: isSubmitting }] =
    useSubmitReviewMutation();
  const [endSessionMutation] = useEndLearningSessionMutation();

  // Local state
  const [sessionStarted, setSessionStarted] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  // Start session on mount
  useEffect(() => {
    if (studysetId && !sessionStarted) {
      handleStartSession();
    }

    return () => {
      // Cleanup on unmount
      dispatch(resetSession());
    };
  }, [studysetId]);

  // Load next term when term data is available
  useEffect(() => {
    if (nextTerm) {
      dispatch(setCurrentTerm(nextTerm));
    }
  }, [nextTerm, dispatch]);

  const handleStartSession = async () => {
    if (!studysetId) return;

    try {
      const response = await startSessionMutation({
        studyset_id: studysetId,
        session_size: 10,  // Start with 10 cards per session
      }).unwrap();

      dispatch(
        startSession({
          sessionId: response.session_id,
          studysetId: response.studyset_id,
          totalCards: response.terms_in_session,
        })
      );

      setSessionStarted(true);
      setStartTime(Date.now());

      // Load first term
      const result = await getNextTerm(studysetId);
      if (result.isError) {
        // No terms available
        dispatch(setCurrentTerm(undefined));
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleFlipCard = () => {
    dispatch(flipCard());
  };

  const handleReview = async (recallScore: number, isCorrect: boolean) => {
    if (!studysetId || !learningState.currentTerm) return;

    const responseTime = (Date.now() - startTime) / 1000; // seconds

    try {
      await submitReviewMutation({
        studysetId,
        review: {
          term_id: learningState.currentTerm.term_id,
          recall_score: recallScore,
          is_correct: isCorrect,
          hint_used: false,
          response_time: responseTime,
        },
      }).unwrap();

      // Record in local state
      dispatch(recordReview({ isCorrect }));

      // Load next term
      setStartTime(Date.now());
      const result = await getNextTerm(studysetId);
      
      // Check if no more terms available (404 response)
      if (result.isError) {
        dispatch(setCurrentTerm(undefined));
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      // Clear current term on error
      dispatch(setCurrentTerm(undefined));
    }
  };

  const handleEndSession = async () => {
    if (!studysetId) return;

    try {
      if (learningState.sessionStartTime) {
        await endSessionMutation({
          studysetId,
          sessionStart: learningState.sessionStartTime,
        }).unwrap();
      }

      dispatch(resetSession());
      navigate(`/dashboard/studysets/${studysetId}`);
    } catch (error) {
      console.error('Failed to end session:', error);
      // Navigate anyway even if end session fails
      dispatch(resetSession());
      navigate(`/dashboard/studysets/${studysetId}`);
    }
  };

  const progressPercentage =
    learningState.totalCards > 0
      ? (learningState.cardsReviewed / learningState.totalCards) * 100
      : 0;

  const accuracy =
    learningState.cardsReviewed > 0
      ? (learningState.correctCount / learningState.cardsReviewed) * 100
      : 0;

  if (!sessionStarted || isLoadingTerm) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (!learningState.currentTerm) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Session Complete! 🎉</h2>
            <p className="text-gray-600 mb-4">
              You've reviewed all available cards.
            </p>
            <div className="space-y-2 mb-6">
              <p>
                Total Reviewed: <strong>{learningState.cardsReviewed}</strong>
              </p>
              <p>
                Accuracy: <strong>{accuracy.toFixed(1)}%</strong>
              </p>
            </div>
            <Button onClick={handleEndSession}>Back to Study Set</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleEndSession}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          End Session
        </Button>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              Progress: {learningState.cardsReviewed} / {learningState.totalCards}
            </span>
            <span>Accuracy: {accuracy.toFixed(0)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Flashcard */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {learningState.isFlipped ? 'Definition' : 'Term'}
            </CardTitle>
            {learningState.currentTerm.is_new && (
              <Badge variant="secondary">New</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div
            onClick={handleFlipCard}
            className="min-h-[300px] flex items-center justify-center cursor-pointer rounded-lg p-8"
          >
            <div className="text-center">
              <p className="text-3xl font-bold mb-4">
                {learningState.isFlipped
                  ? learningState.currentTerm.definition
                  : learningState.currentTerm.term_text}
              </p>
              {learningState.isFlipped &&
                learningState.currentTerm.example && (
                  <p className="text-gray-600 italic mt-4">
                    Example: {learningState.currentTerm.example}
                  </p>
                )}
              {!learningState.isFlipped && (
                <p className="text-gray-500 text-sm mt-4">
                  Click to reveal definition
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Buttons */}
      {learningState.isFlipped && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            onClick={() => handleReview(0, false)}
            disabled={isSubmitting}
            variant="destructive"
            className="flex-col h-auto py-4"
          >
            <X className="h-6 w-6 mb-2" />
            <span>Again</span>
            <span className="text-xs opacity-75">&lt; 1 min</span>
          </Button>

          <Button
            onClick={() => handleReview(2, false)}
            disabled={isSubmitting}
            variant="outline"
            className="flex-col h-auto py-4"
          >
            <HelpCircle className="h-6 w-6 mb-2" />
            <span>Hard</span>
            <span className="text-xs opacity-75">1 day</span>
          </Button>

          <Button
            onClick={() => handleReview(3, true)}
            disabled={isSubmitting}
            variant="outline"
            className="flex-col h-auto py-4"
          >
            <Check className="h-6 w-6 mb-2" />
            <span>Good</span>
            <span className="text-xs opacity-75">3 days</span>
          </Button>

          <Button
            onClick={() => handleReview(5, true)}
            disabled={isSubmitting}
            className="flex-col h-auto py-4"
          >
            <Check className="h-6 w-6 mb-2" />
            <span>Easy</span>
            <span className="text-xs opacity-75">7 days</span>
          </Button>
        </div>
      )}

      {!learningState.isFlipped && (
        <div className="text-center">
          <Button onClick={handleFlipCard} size="lg">
            Show Answer
          </Button>
        </div>
      )}
    </div>
  );
}
