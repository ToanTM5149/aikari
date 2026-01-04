import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  BookOpen,
  Users,
} from "lucide-react";
import {
  useGetAttemptResultQuery,
} from "~/redux/features/test";
import { QuestionType } from "~/redux/features/test";

export function AttemptResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const {
    data: attemptResult,
    isLoading: loadingResult,
    error: resultError,
  } = useGetAttemptResultQuery(attemptId!, { skip: !attemptId });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatScore = (score: number) => {
    return Math.round(score);
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case QuestionType.TRUE_FALSE:
        return "Đúng/Sai";
      case QuestionType.MULTIPLE_CHOICE:
        return "Trắc nghiệm";
      case QuestionType.ESSAY:
        return "Tự luận";
      default:
        return type;
    }
  };

  const formatAnswer = (answer: string | undefined, type: string) => {
    if (!answer) return "Chưa trả lời";
    if (type === QuestionType.TRUE_FALSE) {
      return answer.toLowerCase() === "true" || answer === "Đúng" ? "Đúng" : "Sai";
    }
    return answer;
  };

  if (loadingResult) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (resultError || !attemptResult) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/history")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">
              Không thể tải kết quả bài test. Vui lòng thử lại.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const percentage = attemptResult.total_questions > 0
    ? Math.round((attemptResult.correct_answers / attemptResult.total_questions) * 100)
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/history")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Kết quả bài test</h1>
          <p className="text-muted-foreground mt-1">
            {attemptResult.completed_at && formatDate(attemptResult.completed_at)}
          </p>
        </div>
      </div>

      {/* Score Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tổng kết</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center space-x-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">
                {attemptResult.correct_answers}/{attemptResult.total_questions}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Câu đúng</p>
            </div>
            <div className="h-16 w-px bg-border" />
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">
                {formatScore(attemptResult.score)}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">Điểm số</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Detail */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết câu trả lời</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {attemptResult.questions.map((q, idx) => {
              const answer = attemptResult.answers.find(
                (a) => a.question_id === q.question_id
              );
              const isCorrect = answer?.is_correct || false;
              
              return (
                <motion.div
                  key={q.question_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-4 border rounded-lg ${
                    isCorrect
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200"
                      : "bg-red-50 dark:bg-red-950/20 border-red-200"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {getQuestionTypeLabel(q.question_type)}
                        </Badge>
                        <span className="font-medium">Câu {idx + 1}</span>
                      </div>
                      <p className="font-medium mb-3">{q.question_text}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Đáp án của bạn: </span>
                          <span className={`font-medium ${
                            isCorrect ? "text-green-600" : "text-red-600"
                          }`}>
                            {formatAnswer(answer?.user_answer, q.question_type)}
                          </span>
                        </div>
                        
                        {!isCorrect && (
                          <div>
                            <span className="text-muted-foreground">Đáp án đúng: </span>
                            <span className="font-medium text-green-600">
                              {formatAnswer(q.correct_answer, q.question_type)}
                            </span>
                          </div>
                        )}
                        
                        {q.question_type === QuestionType.MULTIPLE_CHOICE && q.options && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Các lựa chọn:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {q.options.map((option, optIdx) => (
                                <div
                                  key={optIdx}
                                  className={`text-xs p-2 rounded ${
                                    option === q.correct_answer
                                      ? "bg-green-100 dark:bg-green-900/30 font-medium"
                                      : option === answer?.user_answer && !isCorrect
                                      ? "bg-red-100 dark:bg-red-900/30"
                                      : "bg-muted"
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIdx)}. {option}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button onClick={() => navigate("/history")}>
          Quay lại lịch sử
        </Button>
      </div>
    </div>
  );
}

