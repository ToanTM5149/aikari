/**
 * CreateClassDialog Component
 * 
 * Dialog for creating a new class
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
import { Textarea } from "~/components/ui/textarea"
import { Switch } from "~/components/ui/switch"
import { toast } from "sonner"
import { useCreateClassMutation } from "~/redux/features/class"
import { Loader2 } from "lucide-react"

interface CreateClassDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CreateClassForm {
  class_name: string
  description: string
  is_public: boolean
  class_code: string
}

export function CreateClassDialog({ open, onOpenChange }: CreateClassDialogProps) {
  const [createClass, { isLoading }] = useCreateClassMutation()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreateClassForm>({
    defaultValues: {
      class_name: "",
      description: "",
      is_public: false,
      class_code: "",
    },
  })

  const isPublic = watch("is_public")

  const onSubmit = async (data: CreateClassForm) => {
    try {
      await createClass({
        class_name: data.class_name,
        description: data.description || undefined,
        is_public: data.is_public,
        class_code: data.class_code || undefined,
      }).unwrap()

      toast.success("Class created successfully!")
      reset()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to create class")
    }
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
          <DialogDescription>
            Create a class to organize students and study materials.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            {/* Class Name */}
            <div className="space-y-2">
              <Label htmlFor="class_name">
                Class Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="class_name"
                placeholder="e.g., English 101, Math Advanced"
                {...register("class_name", {
                  required: "Class name is required",
                  minLength: {
                    value: 3,
                    message: "Class name must be at least 3 characters",
                  },
                })}
              />
              {errors.class_name && (
                <p className="text-sm text-destructive">
                  {errors.class_name.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What will students learn in this class?"
                rows={3}
                {...register("description")}
              />
            </div>

            {/* Public/Private Toggle */}
            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="is_public" className="text-base">
                  Public Class
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow students to search and join this class
                </p>
              </div>
              <Switch
                id="is_public"
                checked={isPublic}
                onCheckedChange={(checked) => setValue("is_public", checked)}
              />
            </div>

            {/* Class Code (optional) */}
            <div className="space-y-2">
              <Label htmlFor="class_code">
                Class Code (Optional)
              </Label>
              <Input
                id="class_code"
                placeholder="e.g., ENG101-2024"
                maxLength={20}
                {...register("class_code", {
                  maxLength: {
                    value: 20,
                    message: "Class code must be at most 20 characters",
                  },
                })}
              />
              <p className="text-xs text-muted-foreground">
                A unique code students can use to find your class
              </p>
              {errors.class_code && (
                <p className="text-sm text-destructive">
                  {errors.class_code.message}
                </p>
              )}
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
              Create Class
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

