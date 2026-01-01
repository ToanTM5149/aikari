/**
 * JoinClassDialog Component
 * 
 * Dialog for searching and joining public classes
 */

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Badge } from "~/components/ui/badge"
import { Card, CardContent } from "~/components/ui/card"
import { toast } from "sonner"
import { Search, GraduationCap, Users, Loader2, Clock } from "lucide-react"
import { useSearchClassesQuery, useJoinClassMutation } from "~/redux/features/class"

interface JoinClassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function JoinClassDialog({ open, onOpenChange }: JoinClassDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  
  // Debounce search
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    // Simple debounce
    const timer = setTimeout(() => {
      setDebouncedQuery(value)
    }, 500)
    return () => clearTimeout(timer)
  }

  const { data, isLoading, isFetching } = useSearchClassesQuery(
    { q: debouncedQuery },
    { skip: !debouncedQuery || debouncedQuery.length < 2 }
  )

  const [joinClass, { isLoading: isJoining }] = useJoinClassMutation()

  const classes = data?.data || []

  const handleJoinClass = async (classId: string, className: string) => {
    try {
      await joinClass(classId).unwrap()
      toast.success(`Successfully joined "${className}"!`)
      setSearchQuery("")
      setDebouncedQuery("")
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to join class")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Join a Class</DialogTitle>
          <DialogDescription>
            Search for public classes by name or class code
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by class name or code..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {!debouncedQuery || debouncedQuery.length < 2 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Search className="w-12 h-12 mb-3 opacity-50" />
                <p>Enter at least 2 characters to search</p>
              </div>
            ) : isLoading || isFetching ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : classes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <GraduationCap className="w-12 h-12 mb-3 opacity-50" />
                <p>No classes found</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="space-y-2">
                {classes.map((classItem) => (
                  <Card key={classItem.class_id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <GraduationCap className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold truncate">
                                {classItem.class_name}
                              </h3>
                              {classItem.class_code && (
                                <Badge variant="outline" className="shrink-0">
                                  {classItem.class_code}
                                </Badge>
                              )}
                            </div>
                            {classItem.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {classItem.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                Instructor: {classItem.created_by}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(classItem.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleJoinClass(classItem.class_id, classItem.class_name)}
                          disabled={isJoining}
                        >
                          {isJoining ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Join"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

