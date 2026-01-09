import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import {
  ArrowLeft,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
  Eye,
  RefreshCw,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  useGetStudySetByIdQuery,
} from "~/redux/features/studyset";
import { useAppSelector } from "~/redux/store";
import { selectCurrentUser } from "~/redux/features/auth/slice";
import {
  useGetTestsForStudysetQuery,
  useGetMyAttemptsQuery,
  useCreateReattemptRequestMutation,
  useGetAttemptResultQuery,
  useDeleteTestMutation,
  type Test,
  type TestAttempt,
} from "~/redux/features/test";
import { CreateTestDialog } from "./create-test-dialog";
import { TestResultDialog } from "./test-result-dialog";
import { TestCard } from "./test-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { toast } from "sonner";

// Helper interface for test with attempt info
interface TestWithAttemptInfo extends Test {
  latestAttempt?: TestAttempt;
  attemptCount: number;
  canReattempt: boolean;
  reattemptRequestStatus?: "none" | "pending" | "approved" | "rejected";
}

export function TestMode() {
  const { studysetId } = useParams<{ studysetId: string }>();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);

  const {
    data: studyset,
    isLoading: loadingStudySet,
  } = useGetStudySetByIdQuery(studysetId!, { skip: !studysetId });

  const {
    data: testsData,
    isLoading: loadingTests,
    refetch: refetchTests,
  } = useGetTestsForStudysetQuery(
    { studysetId: studysetId! },
    { skip: !studysetId }
  );

  const [createTestDialogOpen, setCreateTestDialogOpen] = useState(false);
  const [viewResultDialogOpen, setViewResultDialogOpen] = useState(false);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [deleteTestId, setDeleteTestId] = useState<string | null>(null);
  const [createReattemptRequest] = useCreateReattemptRequestMutation();
  const [deleteTest, { isLoading: deleting }] = useDeleteTestMutation();

  // Get attempt result for viewing
  const { data: attemptResult } = useGetAttemptResultQuery(
    selectedAttemptId!,
    { skip: !selectedAttemptId }
  );

  // Check if user is owner of this studyset
  const isOwner = studyset?.owner_id === user?.user_id;
  const isMember = !isOwner; // If not owner, assume member (accessing through class)

  const tests = testsData?.data || [];

  const handleAttemptTest = (testId: string) => {
    navigate(`/dashboard/studysets/${studysetId}/test/${testId}`);
  };

  const handleCreateTest = () => {
    setCreateTestDialogOpen(true);
  };

  const handleViewResult = async (attemptId: string) => {
    setSelectedAttemptId(attemptId);
    setViewResultDialogOpen(true);
  };

  const getErrorMessage = (error: any): string => {
    if (typeof error?.data?.detail === "string") {
      return error.data.detail;
    }
    if (Array.isArray(error?.data?.detail)) {
      // FastAPI validation errors
      return error.data.detail.map((e: any) => e.msg || e.message || String(e)).join(", ");
    }
    if (error?.data?.message) {
      return error.data.message;
    }
    return "An error occurred";
  };

  const handleRequestReattempt = async (attemptId: string) => {
    try {
      await createReattemptRequest({ attempt_id: attemptId }).unwrap();
      toast.success("Reattempt request sent. Please wait for approval.");
      refetchTests();
    } catch (error: any) {
      toast.error(getErrorMessage(error) || "Failed to send reattempt request");
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

  const getTestStatus = (test: TestWithAttemptInfo) => {
    if (!test.latestAttempt) {
      return "not_started";
    }
    if (test.latestAttempt.is_completed) {
      return "completed";
    }
    return "in_progress";
  };

  const getStatusBadge = (test: TestWithAttemptInfo) => {
    const status = getTestStatus(test);
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Hoàn thành
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="w-3 h-3" />
            Chưa làm
          </Badge>
        );
    }
  };

  if (loadingStudySet || loadingTests) {
    return (
      <div className="h-full flex flex-col p-6">
        <Skeleton className="h-20 w-full mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
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
                  onClick={() => navigate(`/dashboard/studysets/${studysetId}`)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    Test Mode
                  </CardTitle>
                  {studyset && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {studyset.title}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOwner && (
                <Button size="sm" onClick={handleCreateTest}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Test
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto p-6">
          {tests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <FileText className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No tests yet</p>
              <p className="text-sm text-center max-w-md">
                {isOwner
                  ? "Create your first test to start testing your knowledge"
                  : "No tests have been created for this study set"}
              </p>
              {isOwner && (
                <Button className="mt-4" onClick={handleCreateTest}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Test
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {tests.map((test) => (
                <TestCard
                  key={test.test_id}
                  test={test}
                  studysetId={studysetId!}
                  isOwner={isOwner}
                  isMember={isMember}
                  userId={user?.user_id}
                  onAttemptTest={handleAttemptTest}
                  onViewResult={handleViewResult}
                  onRequestReattempt={handleRequestReattempt}
                  onDeleteTest={setDeleteTestId}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateTestDialog
        open={createTestDialogOpen}
        onOpenChange={setCreateTestDialogOpen}
        studysetId={studysetId!}
        onTestCreated={handleTestCreated}
      />

      {attemptResult && (
        <TestResultDialog
          open={viewResultDialogOpen}
          onOpenChange={setViewResultDialogOpen}
          result={{
            test_id: attemptResult.test_id,
            test_title: "", // Will need to fetch test details if needed
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTestId} onOpenChange={() => setDeleteTestId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this test? This action cannot be undone and will delete all related questions and results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTest}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
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
  );
}

