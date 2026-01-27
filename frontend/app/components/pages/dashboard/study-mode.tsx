import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  useGetStudySetByIdQuery,
  useGetTermsQuery,
} from "~/redux/features/studyset";
import { Skeleton } from "~/components/ui/skeleton";

export function StudyMode() {
  const { studysetId } = useParams<{ studysetId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRandomMode = searchParams.get("mode") === "random";

  // Queries
  const {
    data: studyset,
    isLoading: loadingStudySet,
  } = useGetStudySetByIdQuery(studysetId!, { skip: !studysetId });

  const {
    data: termsData,
    isLoading: loadingTerms,
  } = useGetTermsQuery({ studysetId: studysetId! }, { skip: !studysetId });

  // Local state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Shuffle terms if random mode
  const terms = useMemo(() => {
    const allTerms = termsData?.data || [];
    if (isRandomMode && allTerms.length > 0) {
      // Create a shuffled copy
      const shuffled = [...allTerms];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
    return allTerms;
  }, [termsData?.data, isRandomMode]);

  const currentTerm = terms[currentIndex];

  // Reset index when terms change
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [isRandomMode, terms.length]);

  const handleFlip = () => {
    if (isAnimating) return;
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % terms.length);
      setIsAnimating(false);
    }, 200);
  };

  const prevCard = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + terms.length) % terms.length);
      setIsAnimating(false);
    }, 200);
  };

  const resetCard = () => {
    if (isAnimating) return;
    setIsFlipped(false);
  };

  const goToStart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Loading state
  if (loadingStudySet || loadingTerms) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  // Error/Empty state
  if (!studyset || !terms || terms.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            No Flashcards Available
          </h3>
          <p className="text-muted-foreground mb-4">
            Add flashcards to this study set before starting
          </p>
          <Button onClick={() => navigate(`/studysets/${studysetId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/studysets/${studysetId}`)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{studyset.title} - Study Mode</h1>
            {studyset.description && (
              <p className="text-sm text-muted-foreground">
                {studyset.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8">
        {/* Flashcard */}
        <div className="relative w-full max-w-2xl h-80">
          <motion.div
            className="w-full h-full cursor-pointer"
            style={{ perspective: 1000 }}
            onClick={handleFlip}
            animate={{
              scale: isAnimating ? 0.9 : 1,
              opacity: isAnimating ? 0.7 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="relative w-full h-full"
              style={{ transformStyle: "preserve-3d" }}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              {/* Front of card */}
              <Card className="absolute inset-0 backface-hidden shadow-lg">
                <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
                  {currentTerm.image_url && (
                    <div className="mb-4 w-full max-w-sm">
                      <img
                        src={currentTerm.image_url}
                        alt={currentTerm.term_text}
                        className="w-full h-32 object-cover rounded-lg shadow-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <p className="text-2xl mb-6">{currentTerm.term_text}</p>
                  <p className="text-sm text-muted-foreground">
                    Click to reveal answer
                  </p>
                </CardContent>
              </Card>

              {/* Back of card */}
              <Card
                className="absolute inset-0 backface-hidden shadow-lg bg-primary/5"
                style={{ transform: "rotateY(180deg)" }}
              >
                <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center overflow-auto">
                  <Badge variant="secondary" className="mb-4 text-base px-4 py-1">
                    Answer
                  </Badge>
                  {currentTerm.image_url && (
                    <div className="mb-4 w-full max-w-sm">
                      <img
                        src={currentTerm.image_url}
                        alt={currentTerm.definition}
                        className="w-full h-24 object-cover rounded-lg shadow-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <p className="text-xl font-semibold text-primary mb-3 px-2">
                    {currentTerm.definition}
                  </p>
                  {currentTerm.example && (
                    <p className="text-sm text-muted-foreground italic mt-2">
                      Example: {currentTerm.example}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-auto pt-4">
                    Click to see question
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            size="icon"
            onClick={prevCard}
            disabled={isAnimating}
            className="h-12 w-12"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex flex-col items-center gap-3">
            <span className="text-base font-medium text-muted-foreground">
              {currentIndex + 1} of {terms.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={resetCard}
              disabled={isAnimating}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={nextCard}
            disabled={isAnimating}
            className="h-12 w-12"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-2xl">
          <div className="flex space-x-2">
            {terms.map((_, index) => (
              <motion.div
                key={index}
                className={`h-2 rounded-full flex-1 ${
                  index === currentIndex ? "bg-primary" : "bg-muted"
                }`}
                animate={{
                  backgroundColor:
                    index === currentIndex
                      ? "hsl(var(--primary))"
                      : "hsl(var(--muted))",
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </div>

        {/* Additional Controls */}
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={goToStart}>
            Về đầu
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/studysets/${studysetId}`)}
          >
            Kết thúc học
          </Button>
        </div>
      </div>

      {/* CSS for backface visibility */}
      <style>{`
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}

