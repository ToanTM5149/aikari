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
  type NextTermResponse,
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
import { Flashcard } from '~/components/shared/flashcard';

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
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [sessionSize, setSessionSize] = useState<number>(10); // Default 10 cards
  const [sessionTerms, setSessionTerms] = useState<NextTermResponse[]>([]); // All terms in session
  const [currentTermIndex, setCurrentTermIndex] = useState(0); // Current position

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

  const handleStartSession = async () => {
    if (!studysetId) return;

    try {
      const response = await startSessionMutation({
        studyset_id: studysetId,
        session_size: sessionSize,  
      }).unwrap();

      dispatch(
        startSession({
          sessionId: response.session_id,
          studysetId: response.studyset_id,
          totalCards: response.terms_in_session,
        })
      );

      // Set session terms from response
      setSessionTerms(response.terms);
      setSessionStarted(true);
      setStartTime(Date.now());
      
      // Load first term
      if (response.terms.length > 0) {
        dispatch(setCurrentTerm(response.terms[0]));
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleFlipCard = () => {
    dispatch(flipCard());
  };

  const handleReview = async (recallScore: number) => {
    if (!studysetId || !learningState.currentTerm) return;

    const responseTime = (Date.now() - startTime) / 1000; // seconds

    try {
      await submitReviewMutation({
        studysetId,
        review: {
          term_id: learningState.currentTerm.term_id,
          recall_score: recallScore,
          hint_used: false,
          response_time: responseTime,
        },
      }).unwrap();

      dispatch(recordReview({ recallScore }));

      const nextIndex = currentTermIndex + 1;
      if (nextIndex >= sessionTerms.length) {
        setSessionCompleted(true);
        dispatch(setCurrentTerm(undefined));
        return;
      }

      setCurrentTermIndex(nextIndex);
      setStartTime(Date.now());
      dispatch(setCurrentTerm(sessionTerms[nextIndex]));
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

  const { again, hard, good, easy } = learningState.difficultyDistribution;
  const averageScore = learningState.cardsReviewed > 0
    ? ((again * 0 + hard * 2 + good * 3.5 + easy * 5) / learningState.cardsReviewed).toFixed(1)
    : '0.0';

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
                Average Score: <strong>{averageScore}/5</strong>
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-red-50 rounded">
                  <span className="text-red-700">Again: {again}</span>
                </div>
                <div className="p-2 bg-yellow-50 rounded">
                  <span className="text-yellow-700">Hard: {hard}</span>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <span className="text-green-700">Good: {good}</span>
                </div>
                <div className="p-2 bg-blue-50 rounded">
                  <span className="text-blue-700">Easy: {easy}</span>
                </div>
              </div>
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
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Flashcard */}
      <Flashcard
        termText={learningState.currentTerm.term_text}
        definition={learningState.currentTerm.definition}
        example={learningState.currentTerm.example}
        imageUrl={learningState.currentTerm.image_url}
        isFlipped={learningState.isFlipped}
        isNew={learningState.currentTerm.is_new}
        onFlip={handleFlipCard}
        onRecallScore={handleReview}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
