/**
 * StudySet Card Component
 * 
 * Shared component for displaying study set cards consistently across the app
 */

import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  BookOpen,
  Play,
  MoreVertical,
  FileText,
  Edit,
  Trash2,
  Clock,
} from "lucide-react";
import type { StudySet } from "~/redux/features/studyset/types";
import { formatLastStudied } from "~/utils/date";

interface StudySetCardProps {
  studySet: StudySet;
  variant?: "default" | "recent" | "compact";
  onDelete?: (id: string, title: string) => void;
  onEdit?: (studySet: StudySet) => void;
  currentUserId?: string;
  showActions?: boolean;
  showProgress?: boolean;
  animationDelay?: number;
  className?: string;
}

export function StudySetCard({
  studySet,
  variant = "default",
  onDelete,
  onEdit,
  currentUserId,
  showActions = true,
  showProgress = false,
  animationDelay = 0,
  className = "",
}: StudySetCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/studysets/${studySet.studyset_id}`);
  };

  const handleStartStudy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/studysets/${studySet.studyset_id}/study`);
  };

  const isOwner = currentUserId && studySet.owner_id === currentUserId;

  // Compact variant (for list view)
  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: animationDelay }}
        className={className}
      >
        <Card
          className="cursor-pointer hover:shadow-sm transition-all group"
          onClick={handleClick}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold truncate">{studySet.title}</h3>
                {studySet.category && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    {studySet.category.name}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {studySet.description || "No description"}
              </p>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span>{studySet.term_count || 0} terms</span>
                <Badge variant="secondary" className="text-xs">
                  {studySet.content_type}
                </Badge>
              </div>
            </div>
            {showActions && (
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleClick}>
                      <FileText className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {isOwner && onEdit && (
                      <>
                        <DropdownMenuItem onClick={() => onEdit(studySet)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(studySet.studyset_id, studySet.title)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Recent variant (with progress and last studied)
  if (variant === "recent") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: animationDelay }}
        className={className}
      >
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleClick}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base">{studySet.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {studySet.category && (
                    <Badge variant="outline" className="text-xs">
                      {studySet.category.name}
                    </Badge>
                  )}
                  <Badge variant="secondary">{studySet.content_type}</Badge>
                </div>
              </div>
            </div>
            {studySet.description && (
              <p className="text-sm text-muted-foreground mt-2">{studySet.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {studySet.term_count || 0} cards
                </span>
                <span className="text-muted-foreground">
                  {formatLastStudied(studySet.last_activity_at || undefined)}
                </span>
              </div>
              {showProgress && studySet.progress !== undefined && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{studySet.progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <motion.div
                      className="bg-primary rounded-full h-2"
                      initial={{ width: 0 }}
                      animate={{ width: `${studySet.progress}%` }}
                      transition={{ delay: animationDelay + 0.3, duration: 0.8 }}
                    />
                  </div>
                </div>
              )}
              <Button
                className="w-full"
                size="sm"
                disabled={!studySet.term_count || studySet.term_count === 0}
                onClick={handleStartStudy}
              >
                <Play className="w-4 h-4 mr-2" />
                {studySet.last_activity_at ? "Continue Studying" : "Start Learning"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Default variant (grid view)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
      className={className}
    >
      <Card
        className="cursor-pointer hover:shadow-lg transition-all group overflow-hidden"
        onClick={handleClick}
      >
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="font-semibold text-lg truncate">{studySet.title}</h3>
                {studySet.category && (
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {studySet.category.name}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {studySet.description || "No description"}
              </p>
            </div>
            {showActions && (
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleClick}>
                      <FileText className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {isOwner && onEdit && (
                      <>
                        <DropdownMenuItem onClick={() => onEdit(studySet)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(studySet.studyset_id, studySet.title)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {studySet.term_count || 0} terms
            </span>
            {studySet.last_activity_at && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatLastStudied(studySet.last_activity_at)}
              </span>
            )}
            <Badge variant="secondary" className="ml-auto">
              {studySet.content_type}
            </Badge>
          </div>

          {/* Progress */}
          {showProgress && studySet.progress !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{studySet.progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <motion.div
                  className="bg-primary rounded-full h-2"
                  initial={{ width: 0 }}
                  animate={{ width: `${studySet.progress}%` }}
                  transition={{ delay: animationDelay + 0.3, duration: 0.8 }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              className="flex-1"
              size="sm"
              disabled={!studySet.term_count || studySet.term_count === 0}
              onClick={handleStartStudy}
            >
              <Play className="w-4 h-4 mr-2" />
              Study
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
