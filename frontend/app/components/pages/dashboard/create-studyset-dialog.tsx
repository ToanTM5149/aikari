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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { toast } from "sonner"
import { useCreateStudySetMutation } from "~/redux/features/studyset"
import type { StudySetCreate, ContentType } from "~/redux/features/studyset/types"
import { Loader2 } from "lucide-react"

interface CreateStudySetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateStudySetDialog({ open, onOpenChange }: CreateStudySetDialogProps) {
  const [createStudySet, { isLoading }] = useCreateStudySetMutation()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<StudySetCreate>({
    defaultValues: {
      title: "",
      description: "",
      content_type: "DEFAULT",
      category: "",
      subcategory: "",
    },
  })

  const contentType = watch("content_type")

  const onSubmit = async (data: StudySetCreate) => {
    try {
      await createStudySet(data).unwrap()
      toast.success("Study set created successfully!")
      reset()
      onOpenChange(false)
    } catch (error: any) {
      const errorMessage = error?.data?.detail || "Failed to create study set"
      toast.error(errorMessage)
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
          <DialogTitle>Create New Study Set</DialogTitle>
          <DialogDescription>
            Create a new study set to organize your flashcards
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., English Vocabulary, Math Formulas"
              {...register("title", {
                required: "Title is required",
                minLength: {
                  value: 3,
                  message: "Title must be at least 3 characters",
                },
                maxLength: {
                  value: 255,
                  message: "Title must be less than 255 characters",
                },
              })}
              disabled={isLoading}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what this study set is about..."
              rows={3}
              {...register("description", {
                maxLength: {
                  value: 500,
                  message: "Description must be less than 500 characters",
                },
              })}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Content Type */}
          <div className="space-y-2">
            <Label htmlFor="content_type">Content Type</Label>
            <Select
              value={contentType}
              onValueChange={(value) => setValue("content_type", value as ContentType)}
              disabled={isLoading}
            >
              <SelectTrigger id="content_type">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEFAULT">Default (Manual)</SelectItem>
                <SelectItem value="AI_GENERATED">AI Generated</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose how you want to create flashcards in this set
            </p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category (Optional)</Label>
            <Input
              id="category"
              placeholder="e.g., Mathematics, History, Science..."
              {...register("category", {
                maxLength: {
                  value: 100,
                  message: "Category must be less than 100 characters",
                },
              })}
              disabled={isLoading}
            />
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          {/* Subcategory */}
          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory (Optional)</Label>
            <Input
              id="subcategory"
              placeholder="e.g., Algebra, World War II, Chemistry..."
              {...register("subcategory", {
                maxLength: {
                  value: 100,
                  message: "Subcategory must be less than 100 characters",
                },
              })}
              disabled={isLoading}
            />
            {errors.subcategory && (
              <p className="text-sm text-destructive">{errors.subcategory.message}</p>
            )}
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
              Create Study Set
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

