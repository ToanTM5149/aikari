import { useState } from "react"
import { Button } from "~/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Badge } from "~/components/ui/badge"
import { ScrollArea } from "~/components/ui/scroll-area"
import { Skeleton } from "~/components/ui/skeleton"
import { BookOpen, Check, Plus } from "lucide-react"
import { toast } from "sonner"
import { 
  useGetStudySetsQuery 
} from "~/redux/features/studyset"
import { 
  useAddStudySetToClassMutation,
  useGetClassStudySetsQuery 
} from "~/redux/features/class"

interface AddStudySetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId: string
}

export function AddStudySetDialog({
  open,
  onOpenChange,
  classId,
}: AddStudySetDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Get user's study sets
  const { data: studySetsData, isLoading: loadingStudySets } = useGetStudySetsQuery()
  
  // Get class's current study sets
  const { data: classStudySetsData } = useGetClassStudySetsQuery(classId)
  
  // Add mutation
  const [addStudySet, { isLoading: adding }] = useAddStudySetToClassMutation()

  const studySets = studySetsData?.data || []
  const classStudySetIds = new Set(
    classStudySetsData?.data?.map((s: any) => s.studyset_id) || []
  )

  // Filter out study sets already in class
  const availableStudySets = studySets.filter(
    (set) => !classStudySetIds.has(set.studyset_id)
  )

  const handleAdd = async () => {
    if (!selectedId) {
      toast.error("Please select a study set")
      return
    }

    try {
      await addStudySet({
        classId,
        studysetId: selectedId,
      }).unwrap()

      toast.success("Study set added to class successfully")
      setSelectedId(null)
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to add study set")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Study Set to Class</DialogTitle>
          <DialogDescription>
            Select a study set from your library to add to this class.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {loadingStudySets ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : availableStudySets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
              <BookOpen className="w-12 h-12 mb-4 opacity-50" />
              <p>No study sets available</p>
              <p className="text-sm mt-2">
                All your study sets are already in this class or you don't have any study sets yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableStudySets.map((set) => (
                <div
                  key={set.studyset_id}
                  className={`
                    flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer
                    transition-all hover:bg-accent/50
                    ${
                      selectedId === set.studyset_id
                        ? "border-primary bg-accent"
                        : "border-border"
                    }
                  `}
                  onClick={() => setSelectedId(set.studyset_id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{set.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {set.content_type}
                        </Badge>
                        {set.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {set.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedId === set.studyset_id && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={adding}>
            Cancel
          </Button>
          <Button 
            onClick={handleAdd} 
            disabled={!selectedId || adding}
          >
            <Plus className="w-4 h-4 mr-2" />
            {adding ? "Adding..." : "Add to Class"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

