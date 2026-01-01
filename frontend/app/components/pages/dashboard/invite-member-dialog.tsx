/**
 * InviteMemberDialog Component
 * 
 * Dialog for inviting members to a class by email/username
 */

import { useState } from "react"
import { useForm } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { toast } from "sonner"
import { useAddClassMemberMutation } from "~/redux/features/class"
import { Loader2, UserPlus } from "lucide-react"

interface InviteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classId: string
  className: string
}

interface InviteMemberForm {
  user_identifier: string  // email or username
  role: "MEMBER" | "CO_TEACHER"
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  classId,
  className,
}: InviteMemberDialogProps) {
  const [addMember, { isLoading }] = useAddClassMemberMutation()
  const [selectedRole, setSelectedRole] = useState<"MEMBER" | "CO_TEACHER">("MEMBER")

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InviteMemberForm>({
    defaultValues: {
      user_identifier: "",
      role: "MEMBER",
    },
  })

  const onSubmit = async (data: InviteMemberForm) => {
    try {
      // Note: Backend expects user_id, but we're sending email/username
      // Backend needs to be updated to search user by email/username first
      // For now, we'll show an error message to use user ID
      
      toast.error(
        "Feature coming soon! Currently, you need to know the user's ID. " +
        "We're working on email/username invite support."
      )
      
      // TODO: Update backend to accept email/username and look up user_id
      // await addMember({
      //   classId,
      //   data: {
      //     user_id: resolvedUserId,
      //     role: selectedRole,
      //   },
      // }).unwrap()

      // toast.success(`Member invited to "${className}"!`)
      // reset()
      // onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to invite member")
    }
  }

  const handleClose = () => {
    reset()
    setSelectedRole("MEMBER")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite Member
          </DialogTitle>
          <DialogDescription>
            Invite a student or co-teacher to "{className}"
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            {/* Email or Username */}
            <div className="space-y-2">
              <Label htmlFor="user_identifier">
                Email or Username <span className="text-destructive">*</span>
              </Label>
              <Input
                id="user_identifier"
                type="text"
                placeholder="student@example.com or username"
                {...register("user_identifier", {
                  required: "Email or username is required",
                })}
              />
              {errors.user_identifier && (
                <p className="text-sm text-destructive">
                  {errors.user_identifier.message}
                </p>
              )}
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={(value: "MEMBER" | "CO_TEACHER") => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Student</span>
                      <span className="text-xs text-muted-foreground">
                        Can view and study content
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="CO_TEACHER">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Co-Teacher</span>
                      <span className="text-xs text-muted-foreground">
                        Can manage content and members
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedRole === "MEMBER" 
                  ? "Students can access class materials and study sets"
                  : "Co-teachers can help manage the class and invite members"}
              </p>
            </div>

            {/* Info Box */}
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Tip:</strong> The user must have an account on the platform. 
                They will receive a notification about the invitation.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

