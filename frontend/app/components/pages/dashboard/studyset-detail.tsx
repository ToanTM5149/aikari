import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
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
  Target,
  Filter,
  Play,
  ClipboardCheck,
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
  useGetStudysetProgressQuery,
  useGetStudysetStatsQuery,
} from "~/redux/features/learning";
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
import { CreateTestDialog } from "./create-test-dialog";
import {
  useGetTestsForStudysetQuery,
  useGetMyAttemptsQuery,
  useCreateReattemptRequestMutation,
  useGetAttemptResultQuery,
  useDeleteTestMutation,
  type Test,
  type TestAttempt,
} from "~/redux/features/test";
import { TestCard } from "./test-card";
import { TestResultDialog } from "./test-result-dialog";

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
  
  // Local state - moved before queries to avoid initialization error
  const [cardFilter, setCardFilter] = useState<string>("all");
  
  const {
    data: termsData,
    isLoading: loadingTerms,
    error: termsError,
  } = useGetTermsQuery(
    { 
      studysetId: studysetId!, 
      status: cardFilter === "all" ? undefined : cardFilter 
    }, 
    { skip: !studysetId }
  );

  // Progress and Stats
  const {
    data: progressData,
    isLoading: loadingProgress,
  } = useGetStudysetProgressQuery(studysetId!, { skip: !studysetId });

  const {
    data: statsData,
    isLoading: loadingStats,
  } = useGetStudysetStatsQuery(studysetId!, { skip: !studysetId });

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

  // Test dialog state
  const [createTestDialogOpen, setCreateTestDialogOpen] = useState(false);
  const [viewResultDialogOpen, setViewResultDialogOpen] = useState(false);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [deleteTestId, setDeleteTestId] = useState<string | null>(null);

  // Test queries
  const {
    data: testsData,
    isLoading: loadingTests,
    refetch: refetchTests,
  } = useGetTestsForStudysetQuery(
    { studysetId: studysetId! },
    { skip: !studysetId }
  );

  const [createReattemptRequest] = useCreateReattemptRequestMutation();
  const [deleteTest, { isLoading: deletingTest }] = useDeleteTestMutation();

  // Get attempt result for viewing
  const { data: attemptResult } = useGetAttemptResultQuery(
    selectedAttemptId!,
    { skip: !selectedAttemptId }
  );

  const tests = testsData?.data || [];

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

  // Display terms - API already filtered by status
  const displayTerms = isEditing ? editingTerms : (termsData?.data || []);

  // Test handlers
  const handleAttemptTest = (testId: string) => {
    navigate(`/dashboard/studysets/${studysetId}/test/${testId}`);
  };

  const handleViewResult = async (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setViewResultDialogOpen(true);
  };

  const handleRequestReattempt = async (attemptId: string) => {
    try {
      await createReattemptRequest({ attempt_id: attemptId }).unwrap();
      toast.success("Reattempt request sent. Please wait for approval.");
      refetchTests();
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      toast.error(errorMsg || "Failed to send reattempt request");
    }
  };

  const handleTestCreated = () => {
    setCreateTestDialogOpen(false);
    refetchTests();
  };

  const handleDeleteTest = async () => {
    if (!deleteTestId) return;

    try {
      await deleteTest(deleteTestId).unwrap();
      toast.success("Test deleted successfully!");
      setDeleteTestId(null);
      refetchTests();
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      toast.error(errorMsg || "Failed to delete test");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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

              {!isEditing && isOwner && (
                <Button size="sm" onClick={initializeEditMode}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Add flashcard
                </Button>
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

        <CardContent className="flex-1 overflow-hidden p-0">
          <Tabs defaultValue="statistics" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 rounded-none border-b">
              <TabsTrigger value="statistics" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Statistics
              </TabsTrigger>
              <TabsTrigger value="cards" className="gap-2">
                <Target className="w-4 h-4" />
                Cards
              </TabsTrigger>
              <TabsTrigger value="learn" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Learn
              </TabsTrigger>
              <TabsTrigger value="test" className="gap-2">
                <ClipboardCheck className="w-4 h-4" />
                Test
              </TabsTrigger>
            </TabsList>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="flex-1 overflow-auto p-6 mt-0">
              {loadingProgress || loadingStats ? (
                <div className="space-y-6">
                  <Skeleton className="h-8 w-48" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Learning Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Check className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Mastered Cards</p>
                            <p className="text-2xl font-bold">{statsData?.mastered_terms || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Studied Cards</p>
                            <p className="text-2xl font-bold">{statsData?.studied_terms || 0} / {statsData?.total_terms || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Average Recall Score</p>
                            <p className="text-2xl font-bold">{statsData?.average_recall_score ? `${statsData.average_recall_score.toFixed(1)}` : "0"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Progress Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Progress Overview</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Reviewed Rate</span>
                          <span className="font-medium">{progressData?.completion_rate ? `${progressData.completion_rate.toFixed(1)}%` : "0%"}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Study Streak</span>
                          <span className="font-medium">{progressData?.streak_days || 0} days</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Average Recall Score</span>
                          <span className="font-medium">{statsData?.average_recall_score ? statsData.average_recall_score.toFixed(1) : "0"} / 5</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total Study Time</span>
                          <span className="font-medium">{statsData?.total_study_time ? `${(statsData.total_study_time / 60).toFixed(0)} min` : "0 min"}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Card Status</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-muted-foreground">Mastered</span>
                          </div>
                          <span className="font-medium">{statsData?.mastered_terms || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-muted-foreground">Reviewing</span>
                          </div>
                          <span className="font-medium">{statsData?.reviewing_terms || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            <span className="text-muted-foreground">Forgotten</span>
                          </div>
                          <span className="font-medium">{statsData?.forgotten_terms || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                            <span className="text-muted-foreground">Not Studied</span>
                          </div>
                          <span className="font-medium">{statsData?.never_studied || 0}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Weak Terms */}
                  {statsData?.weak_terms && statsData.weak_terms.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Terms Needing Review</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {statsData.weak_terms.slice(0, 5).map((term) => (
                            <div key={term.term_id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-sm">{term.term_text}</p>
                                <Badge variant="destructive" className="text-xs">
                                  Score: {term.recall_score}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Reviewed {term.times_reviewed} times
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {!statsData?.studied_terms && (
                    <div className="text-center text-muted-foreground py-8">
                      <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No statistics yet</p>
                      <p className="text-sm mt-2">Start learning to see your progress!</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Cards Tab */}
            <TabsContent value="cards" className="flex-1 overflow-hidden flex flex-col mt-0">
              <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <Label className="text-sm font-medium">Filter by status:</Label>
                  <Select value={cardFilter} onValueChange={setCardFilter}>
                    <SelectTrigger className="w-[200px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cards ({termsData?.data?.length || 0})</SelectItem>
                      <SelectItem value="mastered">Mastered ({statsData?.mastered_terms || 0})</SelectItem>
                      <SelectItem value="learning">Reviewing ({statsData?.reviewing_terms || 0})</SelectItem>
                      <SelectItem value="weak">Weak Terms ({statsData?.forgotten_terms || 0})</SelectItem>
                      <SelectItem value="not-learned">Not Studied ({statsData?.never_studied || 0})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div id="terms-container" className="flex-1 overflow-auto p-6">
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
              </div>
            </TabsContent>

            {/* Learn Tab */}
            <TabsContent value="learn" className="flex-1 overflow-auto p-6 mt-0">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-semibold mb-2">Learn Mode</h3>
                  <p className="text-muted-foreground">Choose how you want to study the flashcards</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/dashboard/studysets/${studysetId}/study`)}>
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="p-4 bg-blue-100 rounded-full">
                          <Play className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg mb-2">Sequential Order</h4>
                          <p className="text-sm text-muted-foreground">Study cards in their original order from first to last</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/dashboard/studysets/${studysetId}/study?mode=random`)}>
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center gap-4">
                        <div className="p-4 bg-purple-100 rounded-full">
                          <Sparkles className="w-8 h-8 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg mb-2">Random Order</h4>
                          <p className="text-sm text-muted-foreground">Study cards in randomized order for better retention</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {(!termsData?.data || termsData.data.length === 0) && (
                  <div className="text-center text-muted-foreground py-8">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No flashcards available to study</p>
                    <p className="text-sm mt-2">Add flashcards first to start learning</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Test Tab */}
            <TabsContent value="test" className="flex-1 overflow-hidden flex flex-col mt-0">
              {loadingTests ? (
                <div className="flex-1 flex items-center justify-center p-6">
                  <Skeleton className="h-8 w-48 mb-4" />
                  <div className="space-y-4 w-full max-w-2xl">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                </div>
              ) : tests.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
                  <FileText className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No tests yet</p>
                  <p className="text-sm text-center max-w-md">
                    {isOwner
                      ? "Create your first test to start testing your knowledge"
                      : "No tests have been created for this study set"}
                  </p>
                  {isOwner && (
                    <Button className="mt-4" onClick={() => setCreateTestDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Test
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-6 border-b flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Tests</h3>
                    {isOwner && (
                      <Button size="sm" onClick={() => setCreateTestDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Test
                      </Button>
                    )}
                  </div>
                  <div className="flex-1 overflow-auto p-6">
                    <div className="space-y-4 max-w-4xl">
                      {tests.map((test) => (
                        <TestCard
                          key={test.test_id}
                          test={test}
                          studysetId={studysetId!}
                          isOwner={isOwner}
                          isMember={!isOwner}
                          userId={user?.user_id}
                          onAttemptTest={handleAttemptTest}
                          onViewResult={handleViewResult}
                          onRequestReattempt={handleRequestReattempt}
                          onDeleteTest={setDeleteTestId}
                          formatDate={formatDate}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
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

        {/* Create Test Dialog */}
        <CreateTestDialog
          open={createTestDialogOpen}
          onOpenChange={setCreateTestDialogOpen}
          studysetId={studysetId!}
          onTestCreated={handleTestCreated}
        />

        {/* Test Result Dialog */}
        {attemptResult && (
          <TestResultDialog
            open={viewResultDialogOpen}
            onOpenChange={setViewResultDialogOpen}
            result={{
              test_id: attemptResult.test_id,
              test_title: "",
              score: attemptResult.correct_answers,
              max_score: attemptResult.total_questions,
              percentage: attemptResult.total_questions > 0
                ? Math.round((attemptResult.correct_answers / attemptResult.total_questions) * 100)
                : 0,
              completed_at: attemptResult.completed_at || new Date().toISOString(),
              questions: attemptResult.questions.map((q, idx) => ({
                id: q.question_id,
                type: q.question_type.toLowerCase() as "true_false" | "multiple_choice" | "essay",
                question: q.question_text,
                user_answer: attemptResult.answers.find(a => a.question_id === q.question_id)?.user_answer || "",
                correct_answer: q.correct_answer,
                is_correct: attemptResult.answers.find(a => a.question_id === q.question_id)?.is_correct || false,
              })),
            }}
          />
        )}

        {/* Delete Test Confirmation Dialog */}
        <AlertDialog open={!!deleteTestId} onOpenChange={() => setDeleteTestId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this test? This action cannot be undone and will delete all related questions and results.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingTest}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTest}
                disabled={deletingTest}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingTest ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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

