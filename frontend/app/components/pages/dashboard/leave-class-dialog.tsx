import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog"
import { LogOut } from "lucide-react"

interface LeaveClassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  className: string
  isPublic: boolean
  onConfirm: () => void
  isLeaving?: boolean
}

export function LeaveClassDialog({
  open,
  onOpenChange,
  className,
  isPublic,
  onConfirm,
  isLeaving = false,
}: LeaveClassDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-orange-500" />
            </div>
            <AlertDialogTitle className="text-xl">Leave Class</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            Are you sure you want to leave <span className="font-semibold text-foreground">"{className}"</span>?
            <br />
            <br />
            {isPublic ? (
              "You can rejoin this class later since it's public."
            ) : (
              <span className="text-orange-600 dark:text-orange-400">
                This is a private class. You will need to be invited again to rejoin.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLeaving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLeaving}
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            {isLeaving ? "Leaving..." : "Leave Class"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

