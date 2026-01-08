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
import { useGetCategoriesQuery, useCreateCategoryMutation } from "~/redux/features/category/api"
import type { StudySetCreate, ContentType } from "~/redux/features/studyset/types"
import { Loader2, Plus } from "lucide-react"

interface CreateStudySetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateStudySetDialog({ open, onOpenChange }: CreateStudySetDialogProps) {
  const [createStudySet, { isLoading }] = useCreateStudySetMutation()
  const { data: categoriesData } = useGetCategoriesQuery()
  const [createCategory, { isLoading: isCreatingCategory }] = useCreateCategoryMutation()

  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")

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
      category_id: undefined,
    },
  })

  const contentType = watch("content_type")
  const categoryId = watch("category_id")

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
    setShowNewCategoryInput(false)
    setNewCategoryName("")
    onOpenChange(false)
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required")
      return
    }

    try {
      const newCategory = await createCategory({ name: newCategoryName.trim() }).unwrap()
      toast.success("Category created successfully!")
      setValue("category_id", newCategory.category_id)
      setShowNewCategoryInput(false)
      setNewCategoryName("")
    } catch (error: any) {
      const errorMessage = error?.data?.detail || "Failed to create category"
      toast.error(errorMessage)
    }
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
            <Label htmlFor="category_id">Category (Optional)</Label>

            {!showNewCategoryInput ? (
              <div className="flex gap-2">
                <Select
                  value={categoryId || "__no_category__"}
                  onValueChange={(value) => {
                    if (value === "__create_new__") {
                      setShowNewCategoryInput(true)
                    } else if (value === "__no_category__") {
                      setValue("category_id", undefined)
                    } else {
                      setValue("category_id", value)
                    }
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger id="category_id" className="flex-1">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__no_category__">No category</SelectItem>
                    {categoriesData?.data.map((category) => (
                      <SelectItem key={category.category_id} value={category.category_id}>
                        {category.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="__create_new__" className="text-primary">
                      <div className="flex items-center">
                        <Plus className="mr-2 h-4 w-4" />
                        Create new category
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter category name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleCreateCategory()
                      } else if (e.key === "Escape") {
                        setShowNewCategoryInput(false)
                        setNewCategoryName("")
                      }
                    }}
                    disabled={isCreatingCategory}
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateCategory}
                    disabled={isCreatingCategory || !newCategoryName.trim()}
                  >
                    {isCreatingCategory ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Create"
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowNewCategoryInput(false)
                      setNewCategoryName("")
                    }}
                    disabled={isCreatingCategory}
                  >
                    Cancel
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Press Enter to create, Escape to cancel
                </p>
              </div>
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

