import { Bell, BookOpen, Clock, Tag } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useAppSelector } from "~/redux/store";
import { selectCurrentUser } from "~/redux/features/auth/slice";
import { useGetAllDueCardsQuery } from "~/redux/features/learning";
import { formatDate } from "~/utils/date";

export function AppHeader() {
  const user = useAppSelector(selectCurrentUser);
  const userName = user?.full_name || user?.username || "User";
  const navigate = useNavigate();
  
  const { data: dueCards, isLoading } = useGetAllDueCardsQuery({
    includeFuture: false,
  });

  const totalDue = dueCards?.total_due || 0;

  const handleCardClick = (studysetId: string, categoryId?: string | null) => {
    // Navigate to due cards review page with filters
    const params = new URLSearchParams();
    params.set('studyset', studysetId);
    if (categoryId) {
      params.set('category', categoryId);
    }
    navigate(`/dashboard/due-cards?${params.toString()}`);
  };

  const handleReviewAll = () => {
    // Navigate to due cards review without filters
    navigate('/dashboard/due-cards');
  };

  return (
    <header className="sticky top-0 z-10 h-16 bg-background border-b border-border flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold">
          Welcome back, <span className="text-primary">{userName}</span>
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {totalDue > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {totalDue > 99 ? "99+" : totalDue}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Due Cards</span>
              {totalDue > 0 && (
                <Badge variant="secondary">{totalDue} cards</Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {totalDue > 0 && (
              <>
                <div className="p-2">
                  <Button 
                    className="w-full" 
                    size="sm"
                    onClick={handleReviewAll}
                  >
                    Review All Due Cards
                  </Button>
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : totalDue === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No cards due for review 🎉
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                {dueCards?.cards.map((card) => (
                  <DropdownMenuItem
                    key={card.term_id}
                    className="cursor-pointer p-3 flex flex-col items-start gap-2 hover:bg-accent"
                    onClick={() => handleCardClick(card.studyset_id, card.category_id)}
                  >
                    <div className="flex items-start justify-between w-full gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm mb-1">
                          {card.term_text}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {card.definition}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full flex-wrap">
                      {card.category_name && (
                        <Badge variant="secondary" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {card.category_name}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        <BookOpen className="w-3 h-3 mr-1" />
                        {card.studyset_name}
                      </Badge>
                      <div className="flex items-center text-xs text-muted-foreground ml-auto">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(card.next_review_date)}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
