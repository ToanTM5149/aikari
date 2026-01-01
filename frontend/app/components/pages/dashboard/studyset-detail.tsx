import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import {
  Plus,
  Trash2,
  Save,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  Check,
  X,
  Edit2,
  AlertCircle,
  Loader2,
  BookOpen,
  Edit,
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
import { Skeleton } from "~/components/ui/skeleton";

interface TermInput {
  id?: string; // UUID nếu đã tồn tại, undefined nếu mới
  term_text: string;
  definition: string;
  example?: string;
  category?: string;
  isNew?: boolean; // Flag để biết term này mới tạo hay đang edit
}

export function StudySetDetail() {
  const { studysetId } = useParams<{ studysetId: string }>();
  const navigate = useNavigate();

  // Queries
  const {
    data: studyset,
    isLoading: loadingStudySet,
    error: studysetError,
  } = useGetStudySetByIdQuery(studysetId!, { skip: !studysetId });
  
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
  const [previewMode, setPreviewMode] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
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
  } | null>(null);

  // Initialize editing terms from API data
  const initializeEditMode = () => {
    if (!isEditing && termsData?.data) {
      const terms: TermInput[] = termsData.data.map((term) => ({
        id: term.term_id,
        term_text: term.term_text,
        definition: term.definition,
        example: term.example || "",
        category: term.category || "",
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
          category: "",
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
      category: "",
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
        toast.error("Bạn phải có ít nhất một flashcard");
        return;
      }
      setEditingTerms(editingTerms.filter((_, i) => i !== index));
      toast.success("Đã xóa flashcard");
    } else if (term.id) {
      // Delete from server if it exists
      try {
        await deleteTerm({
          studysetId: studysetId!,
          termId: term.id,
        }).unwrap();
        setEditingTerms(editingTerms.filter((_, i) => i !== index));
        toast.success("Đã xóa flashcard");
      } catch (error: any) {
        const errorMsg = getErrorMessage(error);
        toast.error(errorMsg);
      }
    }
  };

  const saveSingleTerm = async (term: TermInput, index: number) => {
    // Validate
    if (!term.term_text.trim() || !term.definition.trim()) {
      toast.error("Vui lòng điền đầy đủ thuật ngữ và định nghĩa");
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
            category: term.category || undefined,
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
        toast.success("Đã lưu flashcard!");
      } else if (term.id) {
        // Update existing term
        await updateTerm({
          studysetId: studysetId!,
          termId: term.id,
          data: {
            term_text: term.term_text,
            definition: term.definition,
            example: term.example || undefined,
            category: term.category || undefined,
          },
        }).unwrap();
        toast.success("Đã cập nhật flashcard!");
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
    return "Đã xảy ra lỗi";
  };

  // Open edit dialog for single term
  const openEditDialog = (term: any) => {
    setEditingTerm({
      term_id: term.term_id,
      term_text: term.term_text,
      definition: term.definition,
      example: term.example || "",
      category: term.category || "",
    });
    setEditDialogOpen(true);
  };

  // Save single term from dialog
  const handleSaveSingleTermDialog = async () => {
    if (!editingTerm) return;

    if (!editingTerm.term_text.trim() || !editingTerm.definition.trim()) {
      toast.error("Vui lòng điền đầy đủ thuật ngữ và định nghĩa");
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
          category: editingTerm.category || undefined,
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

  const handleFlipCard = (id: string) => {
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(id)) {
      newFlipped.delete(id);
    } else {
      newFlipped.add(id);
    }
    setFlippedCards(newFlipped);
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
      toast.error("Vui lòng thêm ít nhất một flashcard với nội dung");
      return;
    }

    const incompleteTerms = validTerms.filter(
      (term) => !term.term_text.trim() || !term.definition.trim()
    );
    if (incompleteTerms.length > 0) {
      toast.error(`${incompleteTerms.length} flashcard(s) chưa hoàn thành`);
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
              category: term.category || undefined,
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
              category: term.category || undefined,
            },
          }).unwrap();
        }
      });

      await Promise.all(promises);
      toast.success(`Đã lưu ${validTerms.length} flashcard(s)!`);
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
      toast.success("Đã xóa study set");
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
          <h3 className="text-lg font-semibold mb-2">Không tìm thấy Study Set</h3>
          <p className="text-muted-foreground mb-4">
            Study set này không tồn tại hoặc bạn không có quyền truy cập.
          </p>
          <Button onClick={() => navigate("/dashboard/studysets")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
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
                  <CardTitle className="text-2xl">{studyset.title}</CardTitle>
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
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => navigate(`/dashboard/studysets/${studysetId}/study`)}
                    disabled={!termsData?.data || termsData.data.length === 0}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Học
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewMode(!previewMode)}
                  >
                    {previewMode ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Xem danh sách
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </>
                    )}
                  </Button>
                  <Button size="sm" onClick={initializeEditMode}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Chỉnh sửa tất cả
                  </Button>
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
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveAll}
                    disabled={creating || updating}
                  >
                    {creating || updating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Lưu tất cả
                      </>
                    )}
                  </Button>
                </>
              )}

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
                    <AlertDialogTitle>Xóa Study Set?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Hành động này không thể hoàn tác. Study set và tất cả flashcards
                      sẽ bị xóa vĩnh viễn.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteStudySet}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Xóa
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>

        <CardContent
          id="terms-container"
          className="flex-1 overflow-auto p-6"
        >
          <AnimatePresence mode="wait">
            {previewMode && !isEditing ? (
              // Preview Mode
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 gap-4"
              >
                {termsData?.data && termsData.data.length > 0 ? (
                  termsData.data.map((term, index) => (
                    <motion.div
                      key={term.term_id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="h-48"
                      style={{ perspective: 1000 }}
                    >
                      <motion.div
                        className="relative w-full h-full cursor-pointer"
                        style={{ transformStyle: "preserve-3d" }}
                        animate={{
                          rotateY: flippedCards.has(term.term_id) ? 180 : 0,
                        }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        onClick={() => handleFlipCard(term.term_id)}
                      >
                        {/* Front */}
                        <Card className="absolute inset-0 backface-hidden">
                          <CardContent className="flex flex-col items-center justify-center h-full p-4 text-center">
                            {term.category && (
                              <Badge variant="secondary" className="mb-3">
                                {term.category}
                              </Badge>
                            )}
                            <p className="line-clamp-4 text-lg font-medium">
                              {term.term_text}
                            </p>
                            <p className="text-xs text-muted-foreground mt-3">
                              Click để lật
                            </p>
                          </CardContent>
                        </Card>

                        {/* Back */}
                        <Card
                          className="absolute inset-0 backface-hidden bg-primary/5"
                          style={{ transform: "rotateY(180deg)" }}
                        >
                          <CardContent className="flex flex-col items-center justify-center h-full p-4 text-center">
                            <Badge variant="secondary" className="mb-3">
                              Định nghĩa
                            </Badge>
                            <p className="line-clamp-4 text-primary">
                              {term.definition}
                            </p>
                            {term.example && (
                              <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">
                                Ví dụ: {term.example}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-3">
                              Click để lật
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-2 flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Chưa có flashcard nào</p>
                      <p className="text-sm mt-2">
                        Click "Chỉnh sửa" để tạo flashcards
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : isEditing ? (
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
                            {/* Category */}
                            <div>
                              <Label
                                htmlFor={`category-${index}`}
                                className="text-sm mb-2 block"
                              >
                                Danh mục (tùy chọn)
                              </Label>
                              <Input
                                id={`category-${index}`}
                                placeholder="VD: Toán học, Lịch sử, Khoa học..."
                                value={term.category || ""}
                                onChange={(e) =>
                                  updateTermInput(index, "category", e.target.value)
                                }
                                className="max-w-xs"
                              />
                            </div>

                            {/* Term and Definition */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label
                                  htmlFor={`term-${index}`}
                                  className="text-sm mb-2 flex items-center gap-2"
                                >
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                  Thuật ngữ / Câu hỏi
                                </Label>
                                <Textarea
                                  id={`term-${index}`}
                                  placeholder="Nhập thuật ngữ hoặc câu hỏi..."
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
                                  Định nghĩa / Câu trả lời
                                </Label>
                                <Textarea
                                  id={`definition-${index}`}
                                  placeholder="Nhập định nghĩa hoặc câu trả lời..."
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
                                Ví dụ (tùy chọn)
                              </Label>
                              <Textarea
                                id={`example-${index}`}
                                placeholder="Nhập ví dụ để minh họa..."
                                value={term.example || ""}
                                onChange={(e) =>
                                  updateTermInput(index, "example", e.target.value)
                                }
                                className="min-h-[60px] resize-none"
                              />
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
                              title="Lưu flashcard này"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeTerm(term, index)}
                              disabled={deleting}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Xóa flashcard"
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
                              Thuật ngữ
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
                              Định nghĩa
                            </span>
                          </div>
                          {term.category && (
                            <Badge variant="outline" className="text-xs">
                              {term.category}
                            </Badge>
                          )}
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
                    Thêm Flashcard
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
                                    THUẬT NGỮ
                                  </span>
                                  {term.category && (
                                    <Badge variant="outline" className="text-xs">
                                      {term.category}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm">{term.term_text}</p>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  <span className="text-xs font-medium text-muted-foreground">
                                    ĐỊNH NGHĨA
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {term.definition}
                                </p>
                                {term.example && (
                                  <p className="text-xs text-muted-foreground mt-2 italic">
                                    Ví dụ: {term.example}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(term)}
                              className="shrink-0"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Chưa có flashcard nào</p>
                      <p className="text-sm mt-2">
                        Click "Chỉnh sửa" để tạo flashcards
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
            <DialogTitle>Chỉnh sửa Flashcard</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cho flashcard này
            </DialogDescription>
          </DialogHeader>
          {editingTerm && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-category">Danh mục (tùy chọn)</Label>
                <Input
                  id="edit-category"
                  placeholder="VD: Toán học, Lịch sử..."
                  value={editingTerm.category || ""}
                  onChange={(e) =>
                    setEditingTerm({ ...editingTerm, category: e.target.value })
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="edit-term">
                  Thuật ngữ / Câu hỏi <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="edit-term"
                  placeholder="Nhập thuật ngữ hoặc câu hỏi..."
                  value={editingTerm.term_text}
                  onChange={(e) =>
                    setEditingTerm({ ...editingTerm, term_text: e.target.value })
                  }
                  className="mt-2 min-h-[100px]"
                />
              </div>
              <div>
                <Label htmlFor="edit-definition">
                  Định nghĩa / Câu trả lời <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="edit-definition"
                  placeholder="Nhập định nghĩa hoặc câu trả lời..."
                  value={editingTerm.definition}
                  onChange={(e) =>
                    setEditingTerm({ ...editingTerm, definition: e.target.value })
                  }
                  className="mt-2 min-h-[100px]"
                />
              </div>
              <div>
                <Label htmlFor="edit-example">Ví dụ (tùy chọn)</Label>
                <Textarea
                  id="edit-example"
                  placeholder="Nhập ví dụ để minh họa..."
                  value={editingTerm.example || ""}
                  onChange={(e) =>
                    setEditingTerm({ ...editingTerm, example: e.target.value })
                  }
                  className="mt-2 min-h-[60px]"
                />
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
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSS for backface visibility */}
      <style>{`
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}

