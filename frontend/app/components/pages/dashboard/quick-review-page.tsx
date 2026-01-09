/**
 * Quick Review Page
 * 
 * Allows users to review all cards that are due across multiple studysets
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  BookOpen,
  Trophy,
  Sparkles,
  Check,
  X,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  useGetAllDueCardsQuery,
  useStartQuickReviewMutation,
  useSubmitReviewMutation,
  useEndLearningSessionMutation,
  type NextTermResponse,
} from "~/redux/features/learning";
import { toast } from "sonner";
import { Flashcard } from "~/components/shared/flashcard";

const RECALL_BUTTONS = [
  { 
    score: 0, 
    label: "Forgot", 
    subtitle: "Didn't remember",
    variant: "destructive" as const,
    icon: X 
  },
  { 
    score: 1, 
    label: "Hard", 
    subtitle: "Struggled",
    variant: "outline" as const,
    icon: AlertCircle 
  },
  { 
    score: 3, 
    label: "Good", 
    subtitle: "Got it right",
    variant: "outline" as const,
    icon: Check 
  },
  { 
    score: 5, 
    label: "Easy", 
    subtitle: "Too easy",
    variant: "default" as const,
    icon: Check 
  },
];

export function QuickReviewPage() {
  const navigate = useNavigate();
  
  // State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [sessionStartTime, setSessionStartTime] = useState<string>("");
  const [cards, setCards] = useState<NextTermResponse[]>([]);
  const [maxCards, setMaxCards] = useState(20);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [difficulty, setDifficulty] = useState({ again: 0, hard: 0, good: 0, easy: 0 });

  // Queries & Mutations
  const { data: dueCards, isLoading: loadingDueCards } = useGetAllDueCardsQuery({
    includeFuture: false,
  });
  const [startQuickReview, { isLoading: starting }] = useStartQuickReviewMutation();
  const [submitReview, { isLoading: submitting }] = useSubmitReviewMutation();
  const [endSession] = useEndLearningSessionMutation();

  const currentCard = cards[currentCardIndex];
  const progress = cards.length > 0 ? ((currentCardIndex + 1) / cards.length) * 100 : 0;

  const handleStartSession = async () => {
    try {
      const response = await startQuickReview({
        studyset_ids: null, // Include all studysets
        max_cards: maxCards,
      }).unwrap();

      if (response.total_cards === 0) {
        toast.info("No cards to review right now!");
        return;
      }

      setCards(response.cards);
      setSessionId(response.session_id);
      setSessionStartTime(response.started_at);
      setSessionStarted(true);
      toast.success(`Started review session with ${response.total_cards} cards!`);
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to start session");
    }
  };

  const handleRecallScore = async (score: number) => {
    if (!currentCard || submitting) return;

    try {
      // Use studyset_id from card (populated in quick review session)
      const studysetId = currentCard.studyset_id || "";
      if (!studysetId) {
        toast.error("Missing studyset information");
        return;
      }

      const response = await submitReview({
        studysetId,
        review: {
          term_id: currentCard.term_id,
          recall_score: score,
          hint_used: false,
          response_time: 0,
        },
      }).unwrap();

      // Update difficulty distribution
      if (score <= 1) setDifficulty((prev) => ({ ...prev, again: prev.again + 1 }));
      else if (score === 2) setDifficulty((prev) => ({ ...prev, hard: prev.hard + 1 }));
      else if (score <= 4) setDifficulty((prev) => ({ ...prev, good: prev.good + 1 }));
      else setDifficulty((prev) => ({ ...prev, easy: prev.easy + 1 }));

      setReviewedCount((prev) => prev + 1);

      // Move to next card or finish
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex((prev) => prev + 1);
        setIsFlipped(false);
      } else {
        // Session complete
        handleCompleteSession();
      }

      toast.success(response.message);
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to submit review");
    }
  };

  const handleCompleteSession = () => {
    toast.success("🎉 Review session completed!");
    navigate("/dashboard");
  };

  const handleSkip = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      handleCompleteSession();
    }
  };

  // Loading state
  if (loadingDueCards) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading due cards...</p>
        </div>
      </div>
    );
  }

  // No cards due
  if (!dueCards || dueCards.total_due === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-2">All Caught Up! 🎉</h2>
            <p className="text-muted-foreground mb-6">
              You have no cards due for review right now. Great job!
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Session not started - Setup screen
  if (!sessionStarted) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Setup Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Quick Review Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-primary/10 text-center">
                  <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{dueCards.total_due}</p>
                  <p className="text-sm text-muted-foreground">Cards Due Now</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 text-center">
                  <BookOpen className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{dueCards.studysets_affected.length}</p>
                  <p className="text-sm text-muted-foreground">Study Sets</p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 text-center">
                  <Trophy className="w-6 h-6 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{dueCards.due_this_week}</p>
                  <p className="text-sm text-muted-foreground">Due This Week</p>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Maximum Cards per Session
                  </label>
                  <Select
                    value={maxCards.toString()}
                    onValueChange={(value) => setMaxCards(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 cards</SelectItem>
                      <SelectItem value="20">20 cards</SelectItem>
                      <SelectItem value="30">30 cards</SelectItem>
                      <SelectItem value="50">50 cards</SelectItem>
                      <SelectItem value="100">All cards</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Start Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handleStartSession}
                disabled={starting}
              >
                {starting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Review Session
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Learning Session - Flashcard Review
  if (!sessionStarted) {
    // Should show setup screen instead
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* This should not happen - redirect to setup */}
          <div className="text-center">
            <p>Loading session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    // No more cards - session complete
    handleCompleteSession();
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h2 className="text-2xl font-bold mb-2">Review Complete! 🎉</h2>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quick Review</h1>
          <p className="text-sm text-muted-foreground">
            {reviewedCount} / {cards.length} reviewed
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <BookOpen className="w-3 h-3" />
          {cards.length} cards
        </Badge>
      </div>

      {/* Progress */}
      <Progress value={progress} className="mb-6" />

      {/* Flashcard */}
      <div className="flex-1 flex items-center justify-center mb-6">
        {currentCard && (
          <div className="w-full max-w-2xl">
            <Flashcard
              key={currentCard.term_id}
              termText={currentCard.term_text}
              definition={currentCard.definition}
              example={currentCard.example}
              imageUrl={currentCard.image_url}
              isFlipped={isFlipped}
              onFlip={() => setIsFlipped(!isFlipped)}
              onRecallScore={handleRecallScore}
              recallButtons={RECALL_BUTTONS}
              isSubmitting={submitting}
              showSkipButton={true}
              onSkip={handleSkip}
            />
          </div>
        )}
      </div>
    </div>
  );
}
