import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { ArrowLeft, ImageIcon, Upload, X, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Chatbot } from "~/components/shared/chatbot"
import { Skeleton } from "~/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import {
  useGetTermByIdOnlyQuery,
  useUpdateTermMutation,
} from "~/redux/features/studyset"
import type { TermUpdate } from "~/redux/features/shared/types"

export function TermEditPage() {
  const { termId } = useParams<{ termId: string }>()
  const navigate = useNavigate()

  // Query
  const {
    data: termData,
    isLoading: loadingTerm,
    error: termError,
    refetch: refetchTerm,
  } = useGetTermByIdOnlyQuery(termId!, { skip: !termId })

  // Mutation
  const [updateTerm, { isLoading: updating }] = useUpdateTermMutation()

  // Form state
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

  // Chatbot state
  const [isChatbotCollapsed, setIsChatbotCollapsed] = useState(false)
  const [chatbotWidth, setChatbotWidth] = useState(320)

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("chatbot-collapsed")
    const savedWidth = localStorage.getItem("chatbot-width")
    
    if (savedCollapsed) {
      setIsChatbotCollapsed(savedCollapsed === "true")
    }
    if (savedWidth) {
      setChatbotWidth(parseInt(savedWidth, 10))
    }
  }, [])

  // Initialize form data when term loads
  useEffect(() => {
    if (termData) {
      setFormData({
        term_text: termData.term_text,
        definition: termData.definition,
        example: termData.example || "",
        image_url: termData.image_url || "",
      })
    }
  }, [termData])

  const handleSave = async () => {
    if (!formData.term_text.trim() || !formData.definition.trim()) {
      toast.error("Please fill in both term and definition")
      return
    }

    if (!termData) return

    try {
      await updateTerm({
        studysetId: termData.studyset_id,
        termId: termId!,
        data: {
          term_text: formData.term_text,
          definition: formData.definition,
          example: formData.example || undefined,
          image_url: formData.image_url || undefined,
        },
      }).unwrap()
      toast.success("Term updated successfully")
      navigate(`/dashboard/terms/${termId}`)
    } catch (error: any) {
      const errorMsg =
        typeof error?.data?.detail === "string"
          ? error.data.detail
          : Array.isArray(error?.data?.detail)
          ? error.data.detail.map((e: any) => e.msg).join(", ")
          : error?.data?.message || "An error occurred"
      toast.error(errorMsg)
    }
  }

  const handleBack = () => {
    navigate(`/dashboard/terms/${termId}`)
  }

  // Save preferences to localStorage
  const handleToggleChatbot = () => {
    const newState = !isChatbotCollapsed
    setIsChatbotCollapsed(newState)
    localStorage.setItem("chatbot-collapsed", String(newState))
  }

  const handleChatbotWidthChange = (width: number) => {
    setChatbotWidth(width)
    localStorage.setItem("chatbot-width", String(width))
  }

  // Loading state
  if (loadingTerm) {
    return (
      <div className="h-full flex overflow-hidden">
        <div className="flex-1 flex flex-col p-6">
          <Skeleton className="h-20 w-full mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  // Error state
  if (termError || !termData) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Flashcard Not Found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                This flashcard does not exist or you do not have access to it.
              </p>
            </div>
            <Button onClick={() => navigate("/dashboard/terms")}>Go Back</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex overflow-hidden">
      <div className="flex-1 flex flex-col overflow-auto">
        <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleBack}>
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={updating || !formData.term_text.trim() || !formData.definition.trim()}
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Edit Form */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Edit Flashcard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                          if (!file.type.startsWith('image/')) {
                            toast.error("Please select an image file");
                            return;
                          }
                          const maxSize = 2 * 1024 * 1024;
                          if (file.size > maxSize) {
                            toast.error("Image size must be less than 2MB");
                            return;
                          }
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Chatbot Sidebar */}
      {termData && (
        <div 
          className="flex-shrink-0 overflow-hidden border-l"
          style={{ 
            width: isChatbotCollapsed ? '48px' : `${chatbotWidth}px`,
            transition: isChatbotCollapsed ? 'width 0.2s ease' : 'none'
          }}
        >
          <Chatbot 
            isCollapsed={isChatbotCollapsed}
            onToggleCollapse={handleToggleChatbot}
            width={chatbotWidth}
            onWidthChange={handleChatbotWidthChange}
            studysetId={termData.studyset_id}
            termId={termId!}
            onParagraphGenerated={refetchTerm}
          />
        </div>
      )}
    </div>
  )
}
