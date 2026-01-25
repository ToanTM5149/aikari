import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { ImageIcon, Upload, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Term, TermCreate, TermUpdate } from "~/redux/features/shared/types"

interface TermEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  term?: Term | null
  studysetId: string
  onCreateTerm?: (data: { studysetId: string; data: TermCreate }) => Promise<any>
  onUpdateTerm?: (data: { studysetId: string; termId: string; data: TermUpdate }) => Promise<any>
  isCreating?: boolean
  isUpdating?: boolean
  onSuccess?: () => void
}

export function TermEditDialog({
  open,
  onOpenChange,
  mode,
  term,
  studysetId,
  onCreateTerm,
  onUpdateTerm,
  isCreating = false,
  isUpdating = false,
  onSuccess,
}: TermEditDialogProps) {
  const [formData, setFormData] = useState<{
    term_text: string
    definition: string
    example?: string
    image_url?: string
  }>({
    term_text: "",
    definition: "",
    example: "",
    image_url: "",
  })

  // Initialize form data when dialog opens or term changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && term) {
        setFormData({
          term_text: term.term_text,
          definition: term.definition,
          example: term.example || "",
          image_url: term.image_url || "",
        })
      } else {
        // Reset for create mode
        setFormData({
          term_text: "",
          definition: "",
          example: "",
          image_url: "",
        })
      }
    }
  }, [open, mode, term])

  const handleSave = async () => {
    if (!formData.term_text.trim() || !formData.definition.trim()) {
      toast.error("Please fill in both term and definition")
      return
    }

    try {
      if (mode === "create" && onCreateTerm) {
        await onCreateTerm({
          studysetId,
          data: {
            term_text: formData.term_text,
            definition: formData.definition,
            example: formData.example || undefined,
            image_url: formData.image_url || undefined,
          },
        })
        toast.success("Term created successfully")
      } else if (mode === "edit" && term && onUpdateTerm) {
        await onUpdateTerm({
          studysetId,
          termId: term.term_id,
          data: {
            term_text: formData.term_text,
            definition: formData.definition,
            example: formData.example || undefined,
            image_url: formData.image_url || undefined,
          },
        })
        toast.success("Term updated successfully")
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast.error(error?.data?.detail || `Failed to ${mode === "create" ? "create" : "update"} term`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Flashcard" : "Edit Flashcard"}</DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Add a new flashcard to this study set"
              : "Update information for this flashcard"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="term-text">
              Term / Question <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="term-text"
              placeholder="Enter term or question..."
              value={formData.term_text}
              onChange={(e) => setFormData({ ...formData, term_text: e.target.value })}
              className="mt-2 min-h-[100px]"
            />
          </div>
          <div>
            <Label htmlFor="definition">
              Definition / Answer <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="definition"
              placeholder="Enter definition or answer..."
              value={formData.definition}
              onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
              className="mt-2 min-h-[100px]"
            />
          </div>
          <div>
            <Label htmlFor="example">Example (optional)</Label>
            <Textarea
              id="example"
              placeholder="Enter example to illustrate..."
              value={formData.example || ""}
              onChange={(e) => setFormData({ ...formData, example: e.target.value })}
              className="mt-2 min-h-[60px]"
            />
          </div>
          <div>
            <Label htmlFor="image" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Image (optional)
            </Label>
            <div className="space-y-2 mt-2">
              {formData.image_url && (
                <div className="relative inline-block">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full max-w-xs h-32 object-cover rounded-md border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => setFormData({ ...formData, image_url: "" })}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file type
                      if (!file.type.startsWith('image/')) {
                        toast.error("Please select an image file");
                        return;
                      }
                      // Validate file size (max 2MB)
                      const maxSize = 2 * 1024 * 1024;
                      if (file.size > maxSize) {
                        toast.error("Image size must be less than 2MB");
                        return;
                      }
                      // Convert to base64
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const base64 = event.target?.result as string;
                        setFormData({ ...formData, image_url: base64 });
                        toast.success("Image uploaded successfully");
                      };
                      reader.onerror = () => {
                        toast.error("Failed to upload image");
                      };
                      reader.readAsDataURL(file);
                    }
                    // Reset input để có thể chọn lại file cùng tên
                    e.target.value = '';
                  }}
                />
                <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-md hover:bg-accent transition-colors">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Upload từ máy tính</span>
                </div>
              </label>
              <span className="text-xs text-muted-foreground">Max 2MB</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.term_text.trim() || !formData.definition.trim() || isCreating || isUpdating}
          >
            {isCreating || isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {mode === "create" ? "Creating..." : "Saving..."}
              </>
            ) : (
              mode === "create" ? "Create" : "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
