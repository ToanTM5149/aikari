import { useEffect } from "react"
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
import { toast } from "sonner"
import { useUpdateCategoryMutation } from "~/redux/features/category/api"
import type { CategoryUpdate, CategoryWithCount } from "~/redux/features/shared/types"
import { Loader2 } from "lucide-react"

interface EditCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: CategoryWithCount
}

const PRESET_COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#FFA07A", // Light Salmon
  "#98D8C8", // Mint
  "#F7DC6F", // Yellow
  "#BB8FCE", // Purple
  "#85C1E2", // Sky Blue
  "#F8B88B", // Peach
  "#A8E6CF", // Light Green
]

export function EditCategoryDialog({ open, onOpenChange, category }: EditCategoryDialogProps) {
  const [updateCategory, { isLoading }] = useUpdateCategoryMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CategoryUpdate>({
    defaultValues: {
      name: category.name,
      description: category.description || "",
      color: category.color || PRESET_COLORS[0],
    },
  })

  const selectedColor = watch("color")

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        description: category.description || "",
        color: category.color || PRESET_COLORS[0],
      })
    }
  }, [category, reset])

  const onSubmit = async (data: CategoryUpdate) => {
    try {
      await updateCategory({
        categoryId: category.category_id,
        body: data,
      }).unwrap()
      toast.success("Category updated successfully!")
      onOpenChange(false)
    } catch (error: any) {
      const errorMessage = error?.data?.detail || "Failed to update category"
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
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Update the category details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Mathematics, Science, Languages"
              {...register("name", {
                required: "Name is required",
                minLength: {
                  value: 2,
                  message: "Name must be at least 2 characters",
                },
                maxLength: {
                  value: 100,
                  message: "Name must be less than 100 characters",
                },
              })}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what this category is for..."
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

          {/* Color */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-full h-12 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedColor === color
                      ? "border-foreground ring-2 ring-foreground ring-offset-2"
                      : "border-border"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setValue("color", color)}
                  disabled={isLoading}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="text"
                placeholder="#FF6B6B"
                value={selectedColor}
                onChange={(e) => setValue("color", e.target.value)}
                className="flex-1 font-mono"
                disabled={isLoading}
              />
              <Input
                type="color"
                value={selectedColor}
                onChange={(e) => setValue("color", e.target.value)}
                className="w-16 h-10 cursor-pointer"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Studyset Count Info */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              This category is used by <span className="font-semibold text-foreground">{category.studyset_count}</span> study set(s)
            </p>
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
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
