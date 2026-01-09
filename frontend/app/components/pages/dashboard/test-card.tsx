import { motion } from "motion/react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Eye,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  useGetMyAttemptsQuery,
  useGetReattemptRequestByAttemptQuery,
  type Test,
  type TestAttempt,
  ReattemptStatus,
} from "~/redux/features/test";

interface TestCardProps {
  test: Test;
  studysetId: string;
  isOwner: boolean;
  isMember: boolean;
  userId?: string;
  onAttemptTest: (testId: string) => void;
  onViewResult: (attemptId: string) => void;
  onRequestReattempt: (attemptId: string) => void;
  onDeleteTest: (testId: string) => void;
  formatDate: (dateString: string) => string;
}

interface TestWithAttemptInfo extends Test {
  latestAttempt?: TestAttempt;
  attemptCount: number;
  canReattempt: boolean;
  reattemptRequestStatus?: "none" | "pending" | "approved" | "rejected";
}

export function TestCard({
  test,
  studysetId,
  isOwner,
  isMember,
  userId,
  onAttemptTest,
  onViewResult,
  onRequestReattempt,
  onDeleteTest,
  formatDate,
}: TestCardProps) {
  // Check if user is owner of this test
  const isTestOwner = test.created_by === userId;
  
  // Fetch attempts for this test
  const { data: attemptsData, refetch: refetchAttempts } = useGetMyAttemptsQuery(
    { testId: test.test_id },
    { skip: !test.test_id }
  );

  const attempts = attemptsData?.data || [];
  const latestAttempt = attempts.find(a => a.is_completed) || attempts[0];
  const attemptCount = attempts.length;
  // Test owner can always reattempt, others need to check canReattempt
  const canReattempt = isTestOwner || !latestAttempt?.is_completed || false;
  
  // Fetch reattempt request status
  const { data: reattemptRequest } = useGetReattemptRequestByAttemptQuery(
    latestAttempt?.attempt_id || "",
    { skip: !latestAttempt?.attempt_id || isTestOwner }
  );
  
  const reattemptRequestStatus: "none" | "pending" | "approved" | "rejected" = 
    !reattemptRequest ? "none" :
    reattemptRequest.status === ReattemptStatus.PENDING ? "pending" :
    reattemptRequest.status === ReattemptStatus.APPROVED ? "approved" :
    reattemptRequest.status === ReattemptStatus.REJECTED ? "rejected" :
    "none";

  const testWithAttempts: TestWithAttemptInfo = {
    ...test,
    attemptCount,
    canReattempt,
    latestAttempt,
    reattemptRequestStatus,
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
            Completed
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
            <FileText className="w-3 h-3" />
            Not Started
          </Badge>
        );
    }
  };

  const status = getTestStatus(testWithAttempts);

  return (
    <motion.div
      key={test.test_id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">{test.title}</h3>
                {getStatusBadge(testWithAttempts)}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  <span>{test.total_questions} questions</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Created: {formatDate(test.created_at)}</span>
                </div>
                {status === "completed" && latestAttempt && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">
                      Score: {latestAttempt.correct_answers}/{latestAttempt.total_questions}
                    </span>
                  </div>
                )}
                {attemptCount > 0 && (
                  <div className="flex items-center gap-1">
                    <span>Attempted: {attemptCount} time(s)</span>
                  </div>
                )}
              </div>
              {status === "completed" && !canReattempt && attemptCount > 0 && !isTestOwner && (
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 dark:bg-orange-950/20 px-3 py-2 rounded-md">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    You have completed this test. A request is required to retake it.
                  </span>
                </div>
              )}
              {reattemptRequestStatus === "pending" && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-3 py-2 rounded-md">
                  <Clock className="w-4 h-4" />
                  <span>
                    Waiting for approval of retake request
                  </span>
                </div>
              )}
              {reattemptRequestStatus === "approved" && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 px-3 py-2 rounded-md">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Retake request has been approved. Old results have been deleted.
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {status === "not_started" || canReattempt || isTestOwner ? (
                <>
                  <Button
                    onClick={() => onAttemptTest(test.test_id)}
                    size="sm"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    {status === "completed" && isTestOwner ? "Retake" : "Take Test"}
                  </Button>
                  {isTestOwner && (
                    <Button
                      onClick={() => onDeleteTest(test.test_id)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </>
              ) : status === "in_progress" ? (
                <>
                  <Button
                    onClick={() => onAttemptTest(test.test_id)}
                    size="sm"
                    variant="secondary"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Continue
                  </Button>
                  {isTestOwner && (
                    <Button
                      onClick={() => onDeleteTest(test.test_id)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {latestAttempt && (
                    <Button
                      onClick={() => onViewResult(latestAttempt.attempt_id)}
                      size="sm"
                      variant="outline"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Results
                    </Button>
                  )}
                  {/* Test owner can always reattempt without request */}
                  {isTestOwner && (
                    <Button
                      onClick={() => onAttemptTest(test.test_id)}
                      size="sm"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Retake
                    </Button>
                  )}
                  {/* Member needs to request reattempt */}
                  {isMember && !isTestOwner && !canReattempt && reattemptRequestStatus === "none" && latestAttempt && (
                    <Button
                      onClick={() => onRequestReattempt(latestAttempt.attempt_id)}
                      size="sm"
                      variant="outline"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Request Retake
                    </Button>
                  )}
                  {isMember && !isTestOwner && reattemptRequestStatus === "approved" && (
                    <Button
                      onClick={() => onAttemptTest(test.test_id)}
                      size="sm"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Retake
                    </Button>
                  )}
                  {isTestOwner && (
                    <Button
                      onClick={() => onDeleteTest(test.test_id)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

