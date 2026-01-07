import { Bell } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useAppSelector } from "~/redux/store";
import { selectCurrentUser } from "~/redux/features/auth/slice";

export function AppHeader() {
  const user = useAppSelector(selectCurrentUser);
  const userName = user?.full_name || user?.username || "User";

  return (
    <header className="sticky top-0 z-10 h-16 bg-background border-b border-border flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold">
          Welcome back, <span className="text-primary">{userName}</span>
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
