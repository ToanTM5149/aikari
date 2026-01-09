/**
 * Flashcard Component
 * Reusable flashcard display with integrated recall buttons
 */

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Check, X, HelpCircle, AlertCircle } from "lucide-react";

interface RecallButton {
  score: number;
  label: string;
  subtitle: string;
  variant?: "destructive" | "outline" | "default";
  icon?: any;
}

interface FlashcardProps {
  termText: string;
  definition: string;
  example?: string | null;
  imageUrl?: string | null;
  isFlipped: boolean;
  isNew?: boolean;
  onFlip: () => void;
  onRecallScore?: (score: number) => void;
  recallButtons?: RecallButton[];
  isSubmitting?: boolean;
  showSkipButton?: boolean;
  onSkip?: () => void;
  className?: string;
}

export function Flashcard({
  termText,
  definition,
  example,
  imageUrl,
  isFlipped,
  isNew = false,
  onFlip,
  onRecallScore,
  recallButtons,
  isSubmitting = false,
  showSkipButton = false,
  onSkip,
  className = "",
}: FlashcardProps) {
  // Default recall buttons if not provided
  const defaultButtons: RecallButton[] = [
    { score: 0, label: "Forgot", subtitle: "Didn't remember", variant: "destructive", icon: X },
    { score: 2, label: "Hard", subtitle: "Struggled", variant: "outline", icon: HelpCircle },
    { score: 3, label: "Good", subtitle: "Got it right", variant: "outline", icon: Check },
    { score: 5, label: "Easy", subtitle: "Too easy", variant: "default", icon: Check },
  ];

  const buttons = recallButtons || defaultButtons;

  const getIconComponent = (button: RecallButton) => {
    const IconComponent = button.icon;
    return IconComponent ? <IconComponent className="h-6 w-6 mb-2" /> : null;
  };

  return (
    <div className={className}>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {isFlipped ? 'Definition' : 'Term'}
            </CardTitle>
            {isNew && (
              <Badge variant="secondary">New</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div
            onClick={onFlip}
            className="min-h-[300px] flex flex-col items-center justify-center cursor-pointer rounded-lg p-8"
          >
            {/* Image display */}
            {imageUrl && (
              <div className="mb-6 w-full max-w-md">
                <img
                  src={imageUrl}
                  alt={isFlipped ? definition : termText}
                  className="w-full h-48 object-cover rounded-lg shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <div className="text-center">
              <p className="text-3xl font-bold mb-4">
                {isFlipped ? definition : termText}
              </p>
              
              {isFlipped && example && (
                <p className="text-gray-600 dark:text-gray-400 italic mt-4">
                  Example: {example}
                </p>
              )}
              
              {!isFlipped && (
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">
                  Click to reveal definition
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recall Buttons */}
      {isFlipped && onRecallScore && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {buttons.map((button) => (
            <Button
              key={button.score}
              onClick={() => onRecallScore(button.score)}
              disabled={isSubmitting}
              variant={button.variant}
              className="flex-col h-auto py-4"
            >
              {getIconComponent(button)}
              <span className="font-semibold">{button.label}</span>
              <span className="text-xs opacity-90">{button.subtitle}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Skip Button */}
      {showSkipButton && onSkip && (
        <div className="mt-4 text-center">
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Skip Card
          </Button>
        </div>
      )}

      {/* Show Answer Button */}
      {!isFlipped && onRecallScore && (
        <div className="text-center">
          <Button onClick={onFlip} size="lg">
            Show Answer
          </Button>
        </div>
      )}
    </div>
  );
}
