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
import { useCreateCategoryMutation } from "~/redux/features/category/api"
import type { CategoryCreate } from "~/redux/features/shared/types"
import { Loader2 } from "lucide-react"

interface CreateCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function CreateCategoryDialog({ open, onOpenChange }: CreateCategoryDialogProps) {
  const [createCategory, { isLoading }] = useCreateCategoryMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CategoryCreate>({
    defaultValues: {
      name: "",
      description: "",
      color: PRESET_COLORS[0],
    },
  })

  const selectedColor = watch("color")

  const onSubmit = async (data: CategoryCreate) => {
    try {
      await createCategory(data).unwrap()
      toast.success("Category created successfully!")
      reset()
      onOpenChange(false)
    } catch (error: any) {
      const errorMessage = error?.data?.detail || "Failed to create category"
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
          <DialogTitle>Create New Category</DialogTitle>
          <DialogDescription>
            Create a category to organize your study sets
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
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
