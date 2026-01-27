/**
 * Flashcard Learning Page
 * Main page for learning flashcards with spaced repetition
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { useAppDispatch, useAppSelector } from '~/redux/store/hooks';
import {
  useLazyGetNextTermQuery,
  type NextTermResponse,
} from '~/redux/features/learning';
import {
  useStartSessionMutation,
  useEndSessionMutation,
} from '~/redux/features/session';
import {
  sessionStarted,
  reviewAdded,
  sessionEnded,
  currentTermSet,
} from '~/redux/features/session/slice';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Progress } from '~/components/ui/progress';
import { ArrowLeft, RefreshCw, Check, X, HelpCircle, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import type { RootState } from '~/redux/store';
import { Flashcard } from '~/components/shared/flashcard';
import { useGetStudySetByIdQuery } from '~/redux/features/studyset';

interface FlashcardLearningPageProps {
  initialTerms?: NextTermResponse[];
  title?: string;
  onEndNavigate?: () => void;
  autoAdvance?: boolean;
}

export function FlashcardLearningPage(props: FlashcardLearningPageProps = {}) {
  const {
    initialTerms,
    title,
    onEndNavigate,
    autoAdvance = true,
  } = props;
  const { studysetId } = useParams<{ studysetId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();

  // Redux state
  const sessionState = useAppSelector((state: RootState) => state.session);

  // API hooks
  const [startSession, { isLoading: isStarting }] = useStartSessionMutation();
  const [endSession, { isLoading: isEnding }] = useEndSessionMutation();
  const [getNextTerm, { isLoading: isLoadingTerm }] = useLazyGetNextTermQuery();
  const { data: studyset } = useGetStudySetByIdQuery(studysetId || '', {
    skip: !studysetId,
  });

  // Local state
  const [sessionTerms, setSessionTerms] = useState<NextTermResponse[]>([]);
  const [currentTermIndex, setCurrentTermIndex] = useState(0);
  const [currentTerm, setCurrentTerm] = useState<NextTermResponse | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [termStartTime, setTermStartTime] = useState<number>(Date.now());
  const [reviewedTermIds, setReviewedTermIds] = useState<Set<string>>(new Set());
  
  // Ref to track session for cleanup
  const sessionRef = useRef<{ sessionId: string | null; reviews: any[] }>({
    sessionId: null,
    reviews: [],
  });

  // Shuffle array utility
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleStartSession = useCallback(async () => {
    if (!studysetId) return;

    try {
      const response = await startSession({
        studyset_id: studysetId,
        session_type: 'flashcard',
        total_cards: 0,
      }).unwrap();

      dispatch(
        sessionStarted({
          sessionId: response.session_id,
          studysetId: response.studyset_id,
          startedAt: response.started_at,
          totalCards: response.terms.length, // Use actual terms count
        })
      );

      // Check if random mode is enabled
      const isRandomMode = searchParams.get('mode') === 'random';
      const terms = isRandomMode ? shuffleArray(response.terms) : response.terms;

      // Save all terms for this session
      setSessionTerms(terms);
      setCurrentTermIndex(0);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  }, [studysetId, startSession, dispatch, searchParams]);

  const handleStartSessionForDueCards = useCallback(async () => {
    if (!initialTerms || initialTerms.length === 0) return;

    try {
      // Create session in database for due cards review
      const response = await startSession({
        studyset_id: undefined, // No specific studyset for due cards
        session_type: 'quick_review',
        total_cards: initialTerms.length,
      }).unwrap();

      dispatch(
        sessionStarted({
          sessionId: response.session_id,
          studysetId: response.studyset_id,
          startedAt: response.started_at,
          totalCards: initialTerms.length,
        })
      );

      // Use the initialTerms provided (due cards)
      setSessionTerms(initialTerms);
      setCurrentTermIndex(0);
    } catch (error) {
      console.error('Failed to start session for due cards:', error);
    }
  }, [initialTerms, startSession, dispatch]);

  // Start session on mount
  useEffect(() => {
    // Check if we need to start a new session
    // For due cards: start if we have initialTerms and (no active session OR active session is for a studyset)
    const needsNewDueCardsSession = 
      initialTerms && 
      initialTerms.length > 0 && 
      (!sessionState.isActive || sessionState.studysetId !== null);
    
    // For studyset: start if no active session OR active session is for different studyset
    const needsNewStudysetSession = 
      studysetId && 
      (!sessionState.isActive || sessionState.studysetId !== studysetId);

    if (needsNewDueCardsSession) {
      handleStartSessionForDueCards();
    } else if (needsNewStudysetSession) {
      handleStartSession();
    } else if (studysetId && sessionState.isActive && sessionState.studysetId === studysetId && sessionState.sessionId) {
      // Session already exists for this studyset, try to load terms
      if (sessionTerms.length === 0) {
        handleStartSession(); // This will return existing session from backend
      }
    }
  }, [studysetId, initialTerms, sessionState.isActive, sessionState.studysetId, sessionState.sessionId, sessionTerms.length, handleStartSession, handleStartSessionForDueCards]);

  useEffect(() => {
    sessionRef.current = {
      sessionId: sessionState.sessionId,
      reviews: sessionState.reviews,
    };
  }, [sessionState.sessionId, sessionState.reviews]);

  // Cleanup: Auto-end session when component unmounts or user navigates away
  useEffect(() => {
    return () => {
      // This cleanup function runs when component unmounts
      const { sessionId, reviews } = sessionRef.current;
      if (sessionId) {
        // End session silently in background
        endSession({
          session_id: sessionId,
          reviews: reviews,
        })
          .unwrap()
          .then(() => {
            dispatch(sessionEnded());
          })
          .catch((error) => {
            console.error('Failed to auto-end session on unmount:', error);
            // Still clear local state even if API call fails
            dispatch(sessionEnded());
          });
      }
    };
  }, [endSession, dispatch]);

  // Load next term from sessionTerms array
  useEffect(() => {
    if (sessionTerms.length > 0 && currentTermIndex < sessionTerms.length) {
      const nextTerm = sessionTerms[currentTermIndex];
      setCurrentTerm(nextTerm);
      setIsFlipped(false);
      setTermStartTime(Date.now()); // Reset timer for new term
      dispatch(currentTermSet(nextTerm.term_id));
    } else if (sessionTerms.length > 0 && currentTermIndex >= sessionTerms.length) {
      // Reviewed all terms
      setSessionComplete(true);
    }
  }, [currentTermIndex, sessionTerms]);


  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const handleReview = async (recallScore: number) => {
    if (!currentTerm) return;

    // Calculate response time from when this term was shown
    const responseTime = (Date.now() - termStartTime) / 1000;

    // Add review to local state (NOT sending to API yet)
    dispatch(
      reviewAdded({
        term_id: currentTerm.term_id,
        recall_score: recallScore,
        response_time: responseTime,
        hint_used: false,
      })
    );

    // Track this term as reviewed
    setReviewedTermIds(prev => new Set([...prev, currentTerm.term_id]));

    // Auto-advance to next term after review (if enabled)
    if (autoAdvance) {
      if (currentTermIndex < sessionTerms.length - 1) {
        setTimeout(() => {
          setCurrentTermIndex(prev => prev + 1);
        }, 300); // Small delay for better UX
      } else {
        // All terms reviewed
        setSessionComplete(true);
      }
    }
  };

  const handlePrevious = () => {
    if (currentTermIndex > 0) {
      setCurrentTermIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentTermIndex < sessionTerms.length - 1) {
      setCurrentTermIndex(prev => prev + 1);
    }
  };

  const handleEndSession = async (skipNavigation = false) => {
    if (!sessionState.sessionId) {
      // No session to end, just navigate if needed
      if (!skipNavigation) {
        if (onEndNavigate) {
          onEndNavigate();
        } else if (studysetId) {
          navigate(`/studysets/${studysetId}`);
        } else {
          navigate('/home');
        }
      }
      return;
    }

    try {
      // Send all reviews in batch
      await endSession({
        session_id: sessionState.sessionId,
        reviews: sessionState.reviews,
      }).unwrap();

      // Clear local state
      dispatch(sessionEnded());

      // Navigate back (unless skipNavigation is true)
      if (!skipNavigation) {
        if (onEndNavigate) {
          onEndNavigate();
        } else if (studysetId) {
          navigate(`/studysets/${studysetId}`);
        } else {
          navigate('/home');
        }
      }
    } catch (error) {
      console.error('Failed to end session:', error);
      // Clear local state anyway
      dispatch(sessionEnded());
      
      // Navigate anyway (unless skipNavigation is true)
      if (!skipNavigation) {
        if (onEndNavigate) {
          onEndNavigate();
        } else if (studysetId) {
          navigate(`/studysets/${studysetId}`);
        } else {
          navigate('/home');
        }
      }
    }
  };

  // Wrapper for onClick handler
  const handleEndSessionClick = () => {
    handleEndSession(false);
  };

  const completedCards = sessionState.reviews.length;
  const totalCards = sessionState.totalCards || 1;
  const progressPercentage = (completedCards / totalCards) * 100;

  // Calculate difficulty distribution from reviews
  const difficultyDist = sessionState.reviews.reduce(
    (acc, r) => {
      if (r.recall_score === 0) acc.again++;
      else if (r.recall_score <= 2) acc.hard++;
      else if (r.recall_score <= 4) acc.good++;
      else acc.easy++;
      return acc;
    },
    { again: 0, hard: 0, good: 0, easy: 0 }
  );

  const averageScore = completedCards > 0
    ? (
        sessionState.reviews.reduce((sum, r) => sum + r.recall_score, 0) / completedCards
      ).toFixed(1)
    : '0.0';

  if (isStarting || (sessionTerms.length === 0 && !sessionComplete)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading flashcards...</p>
        </div>
      </div>
    );
  }

  if (sessionComplete || !currentTerm) {
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
                Total Reviewed: <strong>{completedCards}</strong>
              </p>
              <p>
                Average Score: <strong>{averageScore}/5</strong>
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-red-50 rounded">
                  <span className="text-red-700">Again: {difficultyDist.again}</span>
                </div>
                <div className="p-2 bg-yellow-50 rounded">
                  <span className="text-yellow-700">Hard: {difficultyDist.hard}</span>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <span className="text-green-700">Good: {difficultyDist.good}</span>
                </div>
                <div className="p-2 bg-blue-50 rounded">
                  <span className="text-blue-700">Easy: {difficultyDist.easy}</span>
                </div>
              </div>
            </div>
            <Button onClick={handleEndSessionClick} disabled={isEnding}>
              {isEnding ? 'Saving...' : 'Finish & Save Progress'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get current term's review status
  const currentTermReview = currentTerm 
    ? sessionState.reviews.find(r => r.term_id === currentTerm.term_id)
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - StudySet Name */}
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-2xl font-semibold text-center">
          {title || studyset?.title || 'Learning Session'}
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center px-4 py-8 max-w-4xl mx-auto w-full">
        {/* Flashcard - Fixed position to prevent layout shift */}
        <div className="w-full mb-8 mt-8">
          <Flashcard
            termText={currentTerm.term_text}
            definition={currentTerm.definition}
            example={currentTerm.example}
            imageUrl={currentTerm.image_url}
            isFlipped={isFlipped}
            isNew={currentTerm.is_new}
            onFlip={handleFlipCard}
            onRecallScore={handleReview}
            isSubmitting={false}
            selectedRecallScore={currentTermReview?.recall_score ?? null}
          />
        </div>

        {/* Navigation Buttons - Previous/Next */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevious}
            disabled={currentTermIndex === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-5 w-5" />
            Previous
          </Button>
          
          <div className="text-sm text-muted-foreground px-4">
            {currentTermIndex + 1} / {sessionTerms.length}
          </div>
          
          <Button
            variant="outline"
            size="lg"
            onClick={handleNext}
            disabled={currentTermIndex >= sessionTerms.length - 1}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* End Session Button - Bottom Right */}
      <div className="fixed bottom-6 right-6">
        <Button
          variant="destructive"
          size="lg"
          onClick={handleEndSessionClick}
          disabled={isEnding}
          className="flex items-center gap-2 shadow-lg"
        >
          <XCircle className="h-5 w-5" />
          {isEnding ? 'Saving...' : 'End Session'}
        </Button>
      </div>
    </div>
  );
}
