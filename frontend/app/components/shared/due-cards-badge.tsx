/**
 * Due Cards Badge Component
 * 
 * Displays the number of cards due for review
 * Can be clicked to navigate to quick review
 */

import { Bell, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useGetAllDueCardsQuery } from "~/redux/features/learning";
import { cn } from "~/components/ui/utils";

interface DueCardsBadgeProps {
  variant?: "button" | "badge";
  className?: string;
  showLabel?: boolean;
}

export function DueCardsBadge({
  variant = "badge",
  className = "",
  showLabel = false,
}: DueCardsBadgeProps) {
  const navigate = useNavigate();
  const { data: dueCards, isLoading } = useGetAllDueCardsQuery({
    includeFuture: false,
  });

  const handleClick = () => {
    if (dueCards && dueCards.total_due > 0) {
      navigate("/dashboard/quick-review");
    }
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!dueCards || dueCards.total_due === 0) {
    return null; // Don't show badge if no cards are due
  }

  const content = (
    <>
      <Bell className="h-4 w-4" />
      {dueCards.total_due > 0 && (
        <span className="font-semibold">{dueCards.total_due}</span>
      )}
      {showLabel && <span>Cards Due</span>}
    </>
  );

  if (variant === "button") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "relative gap-2",
                dueCards.total_due > 0 && "animate-pulse",
                className
              )}
              onClick={handleClick}
            >
              {content}
              {dueCards.total_due > 10 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  !
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">
              {dueCards.total_due} card{dueCards.total_due !== 1 ? "s" : ""} ready to review
            </p>
            <p className="text-xs text-muted-foreground">
              Click to start quick review
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Badge variant
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="default"
            className={cn(
              "cursor-pointer gap-1.5 px-3 py-1.5 hover:bg-primary/90 transition-colors",
              dueCards.total_due > 10 && "bg-orange-500 hover:bg-orange-600",
              className
            )}
            onClick={handleClick}
          >
            {content}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">
            {dueCards.total_due} card{dueCards.total_due !== 1 ? "s" : ""} ready to review
          </p>
          <p className="text-xs text-muted-foreground">
            Click to start quick review
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
