import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Chatbot } from "~/components/shared/chatbot";
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Sparkles,
  Check,
  X,
  Edit2,
  AlertCircle,
  Loader2,
  BookOpen,
  Edit,
  BarChart3,
  FileText,
  ChevronDown,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetStudySetByIdQuery,
  useGetTermsQuery,
  useCreateTermMutation,
  useUpdateTermMutation,
  useDeleteTermMutation,
  useUpdateStudySetMutation,
  useDeleteStudySetMutation,
} from "~/redux/features/studyset";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { useAppSelector } from "~/redux/store";
import { selectCurrentUser } from "~/redux/features/auth/slice";

interface TermInput {
  id?: string; // UUID nếu đã tồn tại, undefined nếu mới
  term_text: string;
  definition: string;
  example?: string;
  image_url?: string;
  isNew?: boolean; // Flag để biết term này mới tạo hay đang edit
}

export function StudySetDetail() {
  const { studysetId } = useParams<{ studysetId: string }>();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);

  // Queries
  const {
    data: studyset,
    isLoading: loadingStudySet,
    error: studysetError,
  } = useGetStudySetByIdQuery(studysetId!, { skip: !studysetId });
  
  // Check if user is owner of this studyset
  const isOwner = studyset?.owner_id === user?.user_id;
  
  const {
    data: termsData,
    isLoading: loadingTerms,
    error: termsError,
  } = useGetTermsQuery({ studysetId: studysetId! }, { skip: !studysetId });

  // Mutations
  const [createTerm, { isLoading: creating }] = useCreateTermMutation();
  const [updateTerm, { isLoading: updating }] = useUpdateTermMutation();
  const [deleteTerm, { isLoading: deleting }] = useDeleteTermMutation();
  const [deleteStudySet, { isLoading: deletingSet }] = useDeleteStudySetMutation();

  // Local state
  const [editingTerms, setEditingTerms] = useState<TermInput[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit single term dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<{
    term_id: string;
    term_text: string;
    definition: string;
    example?: string;
    category?: string;
    image_url?: string;
  } | null>(null);

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

  // Initialize editing terms from API data
  const initializeEditMode = () => {
    if (!isEditing && termsData?.data) {
      const terms: TermInput[] = termsData.data.map((term) => ({
        id: term.term_id,
        term_text: term.term_text,
        definition: term.definition,
        example: term.example || "",
        image_url: term.image_url || "",
        isNew: false,
      }));
      setEditingTerms(terms);
      setIsEditing(true);
    } else if (!isEditing) {
      // No terms yet, start with one empty card
      setEditingTerms([
        {
          term_text: "",
          definition: "",
          example: "",
          image_url: "",
          isNew: true,
        },
      ]);
      setIsEditing(true);
    }
  };

  const addTerm = () => {
    const newTerm: TermInput = {
      term_text: "",
      definition: "",
      example: "",
      image_url: "",
      isNew: true,
    };
    setEditingTerms([...editingTerms, newTerm]);

    // Scroll to bottom after adding
    setTimeout(() => {
      const container = document.getElementById("terms-container");
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  const removeTerm = async (term: TermInput, index: number) => {
    if (term.isNew) {
      // Just remove from local state if it's new
      if (editingTerms.length === 1) {
        toast.error("You must have at least one flashcard");
        return;
      }
      setEditingTerms(editingTerms.filter((_, i) => i !== index));
      toast.success("Flashcard deleted");
    } else if (term.id) {
      // Delete from server if it exists
      try {
        await deleteTerm({
          studysetId: studysetId!,
          termId: term.id,
        }).unwrap();
        setEditingTerms(editingTerms.filter((_, i) => i !== index));
        toast.success("Flashcard deleted");
      } catch (error: any) {
        const errorMsg = getErrorMessage(error);
        toast.error(errorMsg);
      }
    }
  };

  const saveSingleTerm = async (term: TermInput, index: number) => {
    // Validate
    if (!term.term_text.trim() || !term.definition.trim()) {
      toast.error("Please fill in both term and definition");
      return;
    }

    try {
      if (term.isNew) {
        // Create new term
        const newTerm = await createTerm({
          studysetId: studysetId!,
          data: {
            term_text: term.term_text,
            definition: term.definition,
            example: term.example || undefined,
            image_url: term.image_url || undefined,
          },
        }).unwrap();
        
        // Update local state with the created term's ID
        setEditingTerms(
          editingTerms.map((t, i) =>
            i === index
              ? { ...t, id: newTerm.term_id, isNew: false }
              : t
          )
        );
        toast.success("Flashcard saved!");
      } else if (term.id) {
        // Update existing term
        await updateTerm({
          studysetId: studysetId!,
          termId: term.id,
          data: {
            term_text: term.term_text,
            definition: term.definition,
            example: term.example || undefined,
            image_url: term.image_url || undefined,
          },
        }).unwrap();
        toast.success("Flashcard updated!");
      }
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      toast.error(errorMsg);
    }
  };

  const getErrorMessage = (error: any): string => {
    if (typeof error?.data?.detail === "string") {
      return error.data.detail;
    }
    if (Array.isArray(error?.data?.detail)) {
      // FastAPI validation errors
      return error.data.detail.map((e: any) => e.msg).join(", ");
    }
    if (error?.data?.message) {
      return error.data.message;
    }
    return "An error occurred";
  };

  // Open edit dialog for single term
  const openEditDialog = (term: any) => {
    setEditingTerm({
      term_id: term.term_id,
      term_text: term.term_text,
      definition: term.definition,
      example: term.example || "",
      image_url: term.image_url || "",
    });
    setEditDialogOpen(true);
  };

  // Save single term from dialog
  const handleSaveSingleTermDialog = async () => {
    if (!editingTerm) return;

    if (!editingTerm.term_text.trim() || !editingTerm.definition.trim()) {
      toast.error("Please fill in both term and definition");
      return;
    }

    try {
      await updateTerm({
        studysetId: studysetId!,
        termId: editingTerm.term_id,
        data: {
          term_text: editingTerm.term_text,
          definition: editingTerm.definition,
          example: editingTerm.example || undefined,
          image_url: editingTerm.image_url || undefined,
        },
      }).unwrap();
      toast.success("Đã cập nhật flashcard!");
      setEditDialogOpen(false);
      setEditingTerm(null);
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      toast.error(errorMsg);
    }
  };

  const updateTermInput = (
    index: number,
    field: keyof TermInput,
    value: string
  ) => {
    setEditingTerms(
      editingTerms.map((term, i) =>
        i === index ? { ...term, [field]: value } : term
      )
    );
  };

  const handleImageUpload = (index: number, file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      updateTermInput(index, "image_url", base64);
      toast.success("Image uploaded successfully");
    };
    reader.onerror = () => {
      toast.error("Failed to upload image");
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    updateTermInput(index, "image_url", "");
    toast.success("Image removed");
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingTerms([]);
  };

  const handleSaveAll = async () => {
    // Validate
    const validTerms = editingTerms.filter(
      (term) => term.term_text.trim() || term.definition.trim()
    );

    if (validTerms.length === 0) {
      toast.error("Please add at least one flashcard with content");
      return;
    }

    const incompleteTerms = validTerms.filter(
      (term) => !term.term_text.trim() || !term.definition.trim()
    );
    if (incompleteTerms.length > 0) {
      toast.error(`${incompleteTerms.length} flashcard(s) incomplete`);
      return;
    }

    try {
      // Save all terms
      const promises = validTerms.map(async (term) => {
        if (term.isNew) {
          // Create new term
          return createTerm({
            studysetId: studysetId!,
            data: {
              term_text: term.term_text,
              definition: term.definition,
              example: term.example || undefined,
              image_url: term.image_url || undefined,
            },
          }).unwrap();
        } else if (term.id) {
          // Update existing term
          return updateTerm({
            studysetId: studysetId!,
            termId: term.id,
            data: {
              term_text: term.term_text,
              definition: term.definition,
              example: term.example || undefined,
              image_url: term.image_url || undefined,
            },
          }).unwrap();
        }
      });

      await Promise.all(promises);
      toast.success(`Saved ${validTerms.length} flashcard(s)!`);
      setIsEditing(false);
      setEditingTerms([]);
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      toast.error(errorMsg);
    }
  };

  const handleDeleteStudySet = async () => {
    try {
      await deleteStudySet(studysetId!).unwrap();
      toast.success("Study set deleted");
      navigate("/dashboard/studysets");
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      toast.error(errorMsg);
    }
  };

  const getValidCardCount = () => {
    if (isEditing) {
      return editingTerms.filter(
        (term) => term.term_text.trim() && term.definition.trim()
      ).length;
    }
    return termsData?.data?.length || 0;
  };

  const displayTerms = isEditing ? editingTerms : termsData?.data || [];

  // Loading state
  if (loadingStudySet || loadingTerms) {
    return (
      <div className="h-full flex flex-col p-6">
        <Skeleton className="h-20 w-full mb-6" />
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  // Error state
  if (studysetError || !studyset) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Study Set Not Found</h3>
          <p className="text-muted-foreground mb-4">
            This study set does not exist or you do not have access to it.
          </p>
          <Button onClick={() => navigate("/dashboard/studysets")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <Card className="h-full flex flex-col">
        <CardHeader className="border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/dashboard/studysets")}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-2xl">{studyset.title}</CardTitle>
                    {studyset.category && (
                      <Badge variant="outline" className="text-xs">
                        {studyset.category.name}
                      </Badge>
                    )}
                  </div>
                  {studyset.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {studyset.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="w-3 h-3" />
                {getValidCardCount()} Cards
              </Badge>

              {!isEditing && (
                <>
                  <Select
                    onValueChange={(value) => {
                      if (value === "study") {
                        navigate(`/dashboard/studysets/${studysetId}/study`);
                      } else if (value === "test") {
                        navigate(`/dashboard/studysets/${studysetId}/test`);
                      }
                    }}
                  >
                    <SelectTrigger className="w-[140px] h-8" disabled={!termsData?.data || termsData.data.length === 0}>
                      <SelectValue placeholder="Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="study">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          <span>Learn</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="test">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>Test</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/dashboard/studysets/${studysetId}/progress`)}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Progress
                  </Button>
                  {isOwner && (
                    <Button size="sm" onClick={initializeEditMode}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Add flashcard
                    </Button>
                  )}
                </>
              )}

              {isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelEditing}
                    disabled={creating || updating}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveAll}
                    disabled={creating || updating}
                  >
                    {creating || updating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save All
                      </>
                    )}
                  </Button>
                </>
              )}

              {isOwner && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Study Set?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The study set and all flashcards
                      will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteStudySet}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent
          id="terms-container"
          className="flex-1 overflow-auto p-6"
        >
          <AnimatePresence mode="wait">
            {isEditing ? (
              // Edit Mode
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {editingTerms.map((term, index) => (
                  <motion.div
                    key={term.id || `new-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="relative overflow-hidden transition-all hover:shadow-md">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-6">
                          {/* Card Number */}
                          <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-medium">
                              {index + 1}
                            </span>
                          </div>

                          {/* Card Content */}
                          <div className="flex-1 space-y-4">
                            {/* Term and Definition */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label
                                  htmlFor={`term-${index}`}
                                  className="text-sm mb-2 flex items-center gap-2"
                                >
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                  Term / Question
                                </Label>
                                <Textarea
                                  id={`term-${index}`}
                                  placeholder="Enter term or question..."
                                  value={term.term_text}
                                  onChange={(e) =>
                                    updateTermInput(
                                      index,
                                      "term_text",
                                      e.target.value
                                    )
                                  }
                                  className="min-h-[100px] resize-none"
                                />
                              </div>

                              <div>
                                <Label
                                  htmlFor={`definition-${index}`}
                                  className="text-sm mb-2 flex items-center gap-2"
                                >
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  Definition / Answer
                                </Label>
                                <Textarea
                                  id={`definition-${index}`}
                                  placeholder="Enter definition or answer..."
                                  value={term.definition}
                                  onChange={(e) =>
                                    updateTermInput(
                                      index,
                                      "definition",
                                      e.target.value
                                    )
                                  }
                                  className="min-h-[100px] resize-none"
                                />
                              </div>
                            </div>

                            {/* Example */}
                            <div>
                              <Label
                                htmlFor={`example-${index}`}
                                className="text-sm mb-2 block text-muted-foreground"
                              >
                                Example (optional)
                              </Label>
                              <Textarea
                                id={`example-${index}`}
                                placeholder="Enter example to illustrate..."
                                value={term.example || ""}
                                onChange={(e) =>
                                  updateTermInput(index, "example", e.target.value)
                                }
                                className="min-h-[60px] resize-none"
                              />
                            </div>

                            {/* Image Upload */}
                            <div>
                              <Label
                                htmlFor={`image-${index}`}
                                className="text-sm mb-2 flex items-center gap-2"
                              >
                                <ImageIcon className="w-4 h-4" />
                                Image (optional)
                              </Label>
                              <div className="space-y-2">
                                {term.image_url && (
                                  <div className="relative inline-block">
                                    <img
                                      src={term.image_url}
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
                                      onClick={() => removeImage(index)}
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
                                      if (file) handleImageUpload(index, file);
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

                          {/* Action Buttons */}
                          <div className="shrink-0 flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => saveSingleTerm(term, index)}
                              disabled={creating || updating || !term.term_text.trim() || !term.definition.trim()}
                              className="text-primary hover:text-primary hover:bg-primary/10"
                              title="Save this flashcard"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeTerm(term, index)}
                              disabled={deleting}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Delete flashcard"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Validation Indicators */}
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                          <div className="flex items-center gap-1 text-xs">
                            {term.term_text.trim() ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <X className="w-3 h-3 text-muted-foreground" />
                            )}
                            <span
                              className={
                                term.term_text.trim()
                                  ? "text-green-600"
                                  : "text-muted-foreground"
                              }
                            >
                              Term
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            {term.definition.trim() ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <X className="w-3 h-3 text-muted-foreground" />
                            )}
                            <span
                              className={
                                term.definition.trim()
                                  ? "text-green-600"
                                  : "text-muted-foreground"
                              }
                            >
                              Definition
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {/* Add Card Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: editingTerms.length * 0.05 }}
                >
                  <Button
                    variant="outline"
                    className="w-full h-24 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={addTerm}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Flashcard
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              // List Mode
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
                {termsData?.data && termsData.data.length > 0 ? (
                  termsData.data.map((term, index) => (
                    <motion.div
                      key={term.term_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card className="transition-all hover:shadow-md">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm text-primary font-medium">
                                {index + 1}
                              </span>
                            </div>
                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                  <span className="text-xs font-medium text-muted-foreground">
                                    TERM
                                  </span>
                                </div>
                                <p className="text-sm">{term.term_text}</p>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  <span className="text-xs font-medium text-muted-foreground">
                                    DEFINITION
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {term.definition}
                                </p>
                                {term.example && (
                                  <p className="text-xs text-muted-foreground mt-2 italic">
                                    Example: {term.example}
                                  </p>
                                )}
                              </div>
                            </div>
                            {isOwner && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/dashboard/studysets/${studysetId}/terms/${term.term_id}`)}
                                className="shrink-0"
                                title="View details"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No flashcards yet</p>
                      <p className="text-sm mt-2">
                        Click "Add flashcard" to create flashcards
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        </Card>

        {/* Edit Term Dialog */}
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
                      <span className="text-sm">Upload từ máy tính</span>
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
              Hủy
            </Button>
            <Button
              onClick={handleSaveSingleTermDialog}
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
      </div>
      
      {/* Right Chatbot Sidebar */}
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
          studysetId={studysetId!}
        />
      </div>
    </div>
  );
}

