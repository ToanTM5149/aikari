import { Input } from "./ui/input"
import { Bell } from "lucide-react"
import { Button } from "./ui/button"

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 h-16 bg-background border-b border-border flex items-center justify-center px-6 shrink-0 relative">
      <div className="w-full max-w-md">
        <Input 
          placeholder="search " 
          className="w-full"
        />
      </div>
      <div className="absolute right-6 flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="w-5 h-5" />
        </Button>
      </div>
    </header>
  )
}