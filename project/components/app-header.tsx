import { Input } from "./ui/input"
import { Bell } from "lucide-react"
import { Button } from "./ui/button"

export function AppHeader() {
  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6">
      <div className="flex-1 max-w-md">
        <Input 
          placeholder="search - header" 
          className="w-full"
        />
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="w-5 h-5" />
        </Button>
      </div>
    </header>
  )
}