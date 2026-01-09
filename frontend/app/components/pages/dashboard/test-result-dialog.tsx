import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { CheckCircle2, XCircle, FileText } from "lucide-react";

interface QuestionResult {
  id: string;
  type: "true_false" | "multiple_choice" | "essay";
  question: string;
  user_answer: string | boolean;
  correct_answer: string | boolean;
  is_correct: boolean;
}

interface TestResult {
  test_id: string;
  test_title: string;
  score: number;
  max_score: number;
  percentage: number;
  completed_at: string;
  questions: QuestionResult[];
}

interface TestResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: TestResult | null;
}

export function TestResultDialog({
  open,
  onOpenChange,
  result,
}: TestResultDialogProps) {
  if (!result) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAnswer = (answer: string | boolean, type: string) => {
    if (type === "true_false") {
      return answer ? "Đúng" : "Sai";
    }
    return String(answer);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Kết quả Test</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary */}
          <div className="bg-muted p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{result.test_title}</h3>
              <Badge
                variant={result.percentage >= 70 ? "default" : "secondary"}
                className="text-lg px-4 py-1"
              >
                {result.percentage >= 70 ? "Passed" : "Failed"}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {result.score}/{result.max_score}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {result.percentage}%
                </div>
                <div className="text-sm text-muted-foreground mt-1">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">
                  {formatDate(result.completed_at)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Completed</div>
              </div>
            </div>
          </div>

          {/* Questions Detail */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Answer Details:</h3>
            {result.questions.map((q, idx) => (
              <div
                key={q.id}
                className={`p-4 border rounded-lg ${
                  q.is_correct
                    ? "bg-green-50 dark:bg-green-950/20 border-green-200"
                    : "bg-red-50 dark:bg-red-950/20 border-red-200"
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  {q.is_correct ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {q.type === "true_false"
                          ? "Đúng/Sai"
                          : q.type === "multiple_choice"
                          ? "Trắc nghiệm"
                          : "Tự luận"}
                      </Badge>
                      <span className="font-medium">Câu {idx + 1}</span>
                    </div>
                    <p className="font-medium mb-3">{q.question}</p>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Đáp án của bạn: </span>
                        <span
                          className={`font-medium ${
                            q.is_correct ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatAnswer(q.user_answer, q.type)}
                        </span>
                      </div>
                      {!q.is_correct && (
                        <div>
                          <span className="text-muted-foreground">Đáp án đúng: </span>
                          <span className="font-medium text-green-600">
                            {formatAnswer(q.correct_answer, q.type)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Đóng</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

