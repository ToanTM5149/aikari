import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Chatbot } from "~/components/shared/chatbot";
import {
  ArrowLeft,
  Edit2,
  Save,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetTermByIdQuery,
  useGetTermByIdOnlyQuery,
  useUpdateTermMutation,
} from "~/redux/features/studyset";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { formatDateTime } from "~/utils/date";

export function TermDetail() {
  const { studysetId, termId } = useParams<{ studysetId?: string; termId: string }>();
  const navigate = useNavigate();
  
  // Check if we're from terms management page (no studysetId)
  const isFromTermsManagement = !studysetId;

  // Query - use different endpoint based on whether studysetId is available
  const {
    data: termDataFromStudyset,
    isLoading: loadingTermFromStudyset,
    error: termErrorFromStudyset,
    refetch: refetchTermFromStudyset,
  } = useGetTermByIdQuery(
    { studysetId: studysetId!, termId: termId! },
    { skip: !studysetId || !termId || isFromTermsManagement }
  );

  const {
    data: termDataFromTerms,
    isLoading: loadingTermFromTerms,
    error: termErrorFromTerms,
    refetch: refetchTermFromTerms,
  } = useGetTermByIdOnlyQuery(
    termId!,
    { skip: !termId || !isFromTermsManagement }
  );

  // Use appropriate data based on mode
  const termData = isFromTermsManagement ? termDataFromTerms : termDataFromStudyset;
  const loadingTerm = isFromTermsManagement ? loadingTermFromTerms : loadingTermFromStudyset;
  const termError = isFromTermsManagement ? termErrorFromTerms : termErrorFromStudyset;
  const refetchTerm = isFromTermsManagement ? refetchTermFromTerms : refetchTermFromStudyset;

  // Mutation (only for dialog edit mode from studyset)
  const [updateTerm, { isLoading: updating }] = useUpdateTermMutation();

  // Local state for edit dialog (only when from studyset)
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<{
    term_text: string;
    definition: string;
    example?: string;
    image_url?: string;
  } | null>(null);

  // Flip card state
  const [isFlipped, setIsFlipped] = useState(false);

  // Chatbot state
  const [isChatbotCollapsed, setIsChatbotCollapsed] = useState(false);
  const [chatbotWidth, setChatbotWidth] = useState(320); // Default 320px

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("chatbot-collapsed");
    const savedWidth = localStorage.getItem("chatbot-width");
    
    if (savedCollapsed) {
      setIsChatbotCollapsed(savedCollapsed === "true");
    }
    if (savedWidth) {
      setChatbotWidth(parseInt(savedWidth, 10));
    }
  }, []);

  // Save preferences to localStorage
  const handleToggleChatbot = () => {
    const newState = !isChatbotCollapsed;
    setIsChatbotCollapsed(newState);
    localStorage.setItem("chatbot-collapsed", String(newState));
  };

  const handleChatbotWidthChange = (width: number) => {
    setChatbotWidth(width);
    localStorage.setItem("chatbot-width", String(width));
  };

  // Initialize edit dialog state when term data loads
  useEffect(() => {
    if (termData) {
      setEditingTerm({
        term_text: termData.term_text,
        definition: termData.definition,
        example: termData.example || "",
        image_url: termData.image_url || "",
      });
    }
  }, [termData]);

  const handleBack = () => {
    if (isFromTermsManagement) {
      navigate('/terms');
    } else {
      navigate(`/studysets/${studysetId}`);
    }
  };

  const handleOpenEditDialog = () => {
    if (termData) {
      setEditingTerm({
        term_text: termData.term_text,
        definition: termData.definition,
        example: termData.example || "",
        image_url: termData.image_url || "",
      });
      setEditDialogOpen(true);
    }
  };

  const handleSaveEditDialog = async () => {
    if (!editingTerm || !termId || !termData) return;

    if (!editingTerm.term_text.trim() || !editingTerm.definition.trim()) {
      toast.error("Please fill in both term and definition");
      return;
    }

    try {
      await updateTerm({
        studysetId: termData.studyset_id,
        termId: termId,
        data: {
          term_text: editingTerm.term_text,
          definition: editingTerm.definition,
          example: editingTerm.example || undefined,
          image_url: editingTerm.image_url || undefined,
        },
      }).unwrap();
      toast.success("Flashcard updated!");
      setEditDialogOpen(false);
      refetchTerm();
    } catch (error: any) {
      const errorMsg =
        typeof error?.data?.detail === "string"
          ? error.data.detail
          : Array.isArray(error?.data?.detail)
          ? error.data.detail.map((e: any) => e.msg).join(", ")
          : error?.data?.message || "An error occurred";
      toast.error(errorMsg);
    }
  };

  // Loading state
  if (loadingTerm) {
    return (
      <div className="h-full flex flex-col p-6">
        <Skeleton className="h-20 w-full mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
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
            <Button onClick={handleBack}>Go Back</Button>
          </div>
        </Card>
      </div>
    );
  }

  const term = termData;

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
          <Button size="sm" onClick={() => navigate(`/terms/${termId}/edit`)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        {/* Flashcard - 2 mặt */}
          <Card className="w-full">
            <CardContent className="p-8">
              <div className="aspect-[4/3] max-w-2xl mx-auto" style={{ perspective: 1000 }}>
                <motion.div
                  className="relative w-full h-full cursor-pointer"
                  style={{ transformStyle: "preserve-3d" }}
                  animate={{
                    rotateY: isFlipped ? 180 : 0,
                  }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  {/* Front - Term */}
                  <Card className="absolute inset-0 backface-hidden">
                    <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
                      {term.image_url && (
                        <div className="mb-4 w-full max-w-xs">
                          <img
                            src={term.image_url}
                            alt={term.term_text}
                            className="w-full h-40 object-cover rounded-lg shadow-md"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <p className="text-2xl font-medium line-clamp-6">
                        {term.term_text}
                      </p>
                      <p className="text-xs text-muted-foreground mt-6">
                        Click to flip
                      </p>
                    </CardContent>
                  </Card>

                  {/* Back - Definition */}
                  <Card
                    className="absolute inset-0 backface-hidden bg-primary/5"
                    style={{ transform: "rotateY(180deg)" }}
                  >
                    <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
                      <Badge variant="secondary" className="mb-4">
                        Definition
                      </Badge>
                      {term.image_url && (
                        <div className="mb-4 w-full max-w-xs">
                          <img
                            src={term.image_url}
                            alt={term.definition}
                            className="w-full h-40 object-cover rounded-lg shadow-md"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <p className="text-2xl text-primary line-clamp-6">
                        {term.definition}
                      </p>
                      <p className="text-xs text-muted-foreground mt-6">
                        Click to flip
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </CardContent>
          </Card>

        {/* Tabs: Example và AI Example */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="example" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="example">Example</TabsTrigger>
                <TabsTrigger value="ai-example">AI Example</TabsTrigger>
              </TabsList>
              <TabsContent value="example" className="mt-4">
                {term.example ? (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm">{term.example}</p>
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>No example yet</p>
                    <p className="text-xs mt-2">
                      Click "Edit" to add an example
                    </p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="ai-example" className="mt-4">
                {(() => {
                  // Debug: log term data
                  console.log('Term data for AI Example:', {
                    term_id: term.term_id,
                    paragraphs: term.paragraphs,
                    attributes: term.attributes,
                    paragraphs_type: typeof term.paragraphs,
                    paragraphs_is_array: Array.isArray(term.paragraphs)
                  });
                  
                  // Lấy paragraphs từ field paragraphs (mới) hoặc fallback về attributes.paragraphs (backward compatibility)
                  let paragraphs: Array<{paragraph: string; metadata: any}> = [];
                  
                  if (term.paragraphs && Array.isArray(term.paragraphs)) {
                    // Sử dụng field paragraphs mới
                    paragraphs = term.paragraphs;
                    console.log('Using term.paragraphs:', paragraphs);
                  } else if (term.attributes?.paragraphs) {
                    // Fallback: sử dụng attributes.paragraphs (backward compatibility)
                    if (Array.isArray(term.attributes.paragraphs)) {
                      paragraphs = term.attributes.paragraphs;
                      console.log('Using term.attributes.paragraphs:', paragraphs);
                    }
                  } else if (term.attributes?.paragraph) {
                    // Fallback: nếu chỉ có single paragraph trong attributes
                    paragraphs = [{
                      paragraph: term.attributes.paragraph,
                      metadata: term.attributes.paragraph_metadata || {}
                    }];
                    console.log('Using term.attributes.paragraph (single):', paragraphs);
                  } else {
                    console.log('No paragraphs found in term data');
                  }
                  
                  console.log('Final paragraphs array:', paragraphs);
                  
                  if (paragraphs.length === 0) {
                    return (
                      <div className="p-8 text-center text-muted-foreground">
                        <p>No AI Example yet</p>
                        <p className="text-xs mt-2">
                          Use the chatbot on the right to generate a paragraph for this term
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-6">
                      {paragraphs.map((item, index) => {
                        // Đảm bảo item có structure đúng
                        const paragraphText = item.paragraph || '';
                        const metadata = item.metadata || {};
                        
                        if (!paragraphText) {
                          return null;
                        }
                        
                        return (
                          <div key={index} className="space-y-3">
                            <div className="p-4 rounded-lg bg-muted/50 border">
                              <p className="text-sm whitespace-pre-wrap">{paragraphText}</p>
                            </div>
                            {metadata && Object.keys(metadata).length > 0 && (
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {metadata.word_count && (
                                  <Badge variant="outline">
                                    {metadata.word_count} words
                                  </Badge>
                                )}
                                {metadata.generated_at && (
                                  <span className="text-xs">
                                    {formatDateTime(metadata.generated_at)}
                                  </span>
                                )}
                                {metadata.key_concepts && 
                                 Array.isArray(metadata.key_concepts) &&
                                 metadata.key_concepts.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {metadata.key_concepts.map((concept: string, idx: number) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {concept}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            {index < paragraphs.length - 1 && (
                              <div className="border-t my-4"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        </div>

        {/* Edit Dialog - Only show when from studyset (not from terms management) */}
        {!isFromTermsManagement && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Flashcard</DialogTitle>
            <DialogDescription>
              Update information for this flashcard
            </DialogDescription>
          </DialogHeader>
          {editingTerm && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-term">
                  Term / Question <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="edit-term"
                  placeholder="Enter term or question..."
                  value={editingTerm.term_text}
                  onChange={(e) =>
                    setEditingTerm({ ...editingTerm, term_text: e.target.value })
                  }
                  className="mt-2 min-h-[100px]"
                />
              </div>
              <div>
                <Label htmlFor="edit-definition">
                  Definition / Answer <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="edit-definition"
                  placeholder="Enter definition or answer..."
                  value={editingTerm.definition}
                  onChange={(e) =>
                    setEditingTerm({ ...editingTerm, definition: e.target.value })
                  }
                  className="mt-2 min-h-[100px]"
                />
              </div>
              <div>
                <Label htmlFor="edit-example">Example (optional)</Label>
                <Textarea
                  id="edit-example"
                  placeholder="Enter example to illustrate..."
                  value={editingTerm.example || ""}
                  onChange={(e) =>
                    setEditingTerm({ ...editingTerm, example: e.target.value })
                  }
                  className="mt-2 min-h-[60px]"
                />
              </div>
              <div>
                <Label htmlFor="edit-image" className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Image (optional)
                </Label>
                <div className="space-y-2 mt-2">
                  {editingTerm.image_url && (
                    <div className="relative inline-block">
                      <img
                        src={editingTerm.image_url}
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
                        onClick={() => setEditingTerm({ ...editingTerm, image_url: "" })}
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
                            setEditingTerm({ ...editingTerm, image_url: base64 });
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
                      <span className="text-sm">Upload from computer</span>
                    </div>
                  </label>
                  <span className="text-xs text-muted-foreground">Max 2MB</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEditDialog}
              disabled={updating || !editingTerm?.term_text.trim() || !editingTerm?.definition.trim()}
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
          </DialogFooter>
        </DialogContent>
        </Dialog>
        )}

        {/* CSS for backface visibility */}
        <style>{`
          .backface-hidden {
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
          }
        `}</style>
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
            termId={termId}
            onParagraphGenerated={refetchTerm}
          />
        </div>
      )}
    </div>
  );
}

