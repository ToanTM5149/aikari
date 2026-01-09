import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Textarea } from "~/components/ui/textarea";
import { Skeleton } from "~/components/ui/skeleton";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useStartTestAttemptMutation,
  useSubmitTestAttemptMutation,
  useGetAttemptResultQuery,
  useGetTestQuery,
  QuestionType,
  type QuestionWithoutAnswer,
  type AnswerSubmit,
} from "~/redux/features/test";

export function TestAttempt() {
  const { studysetId, testId } = useParams<{ studysetId: string; testId: string }>();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeQuestions, setActiveQuestions] = useState<QuestionWithoutAnswer[]>([]);
  const autoSubmitRef = useRef(false);

  const [startAttempt, { isLoading: startingAttempt }] = useStartTestAttemptMutation();
  const [submitAttempt, { isLoading: submitting }] = useSubmitTestAttemptMutation();
  
  // Get test info to check time_limit
  const { data: testData } = useGetTestQuery(testId!, { skip: !testId });

  // Initialize time remaining when test data is loaded
  useEffect(() => {
    if (testData?.time_limit && attemptId && !isSubmitted) {
      setTimeRemaining(testData.time_limit);
    } else if (testData && !testData.time_limit) {
      setTimeRemaining(null);
    }
  }, [testData, attemptId, isSubmitted]);

  // Get attempt result after submission
  const { data: attemptResult, isLoading: loadingResult } = useGetAttemptResultQuery(
    attemptId!,
    { skip: !attemptId || !isSubmitted }
  );

  // Start attempt on mount
  useEffect(() => {
    if (testId && !attemptId && !startingAttempt) {
      handleStartAttempt();
    }
  }, [testId]);

  const handleStartAttempt = async () => {
    if (!testId) return;

    try {
      const result = await startAttempt({
        test_id: testId,
      }).unwrap();

      setAttemptId(result.attempt_id);
      setActiveQuestions(result.questions || []);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setTimeElapsed(0);
      setIsSubmitted(false);
      autoSubmitRef.current = false;
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      toast.error(errorMsg || "Không thể bắt đầu bài test");
      navigate(`/dashboard/studysets/${studysetId}/test`);
    }
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
    return "Đã xảy ra lỗi";
  };

  // Use activeQuestions during attempt, attemptResult.questions after submission
  const questions = isSubmitted ? (attemptResult?.questions || []) : activeQuestions;
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).filter(
    (qId) => answers[qId] && answers[qId].trim() !== ""
  ).length;

  // Define handleAutoSubmit before useEffect hooks
  const handleAutoSubmit = useCallback(async () => {
    if (!attemptId || isSubmitted || autoSubmitRef.current) return;

    autoSubmitRef.current = true;

    // Convert answers to array format using activeQuestions
    const answerArray: AnswerSubmit[] = activeQuestions.map((q) => ({
      question_id: q.question_id,
      user_answer: answers[q.question_id] || "",
    }));

    try {
      await submitAttempt({
        attemptId,
        submission: { answers: answerArray },
      }).unwrap();

      setIsSubmitted(true);
      toast.warning("Hết thời gian! Bài test đã được tự động nộp.");
      // Keep the result modal open - removed automatic navigation
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      toast.error(errorMsg || "Không thể tự động nộp bài");
      autoSubmitRef.current = false; // Reset on error
    }
  }, [attemptId, isSubmitted, activeQuestions, answers, submitAttempt, studysetId, navigate]);

  // Timer for elapsed time
  useEffect(() => {
    if (isSubmitted) return;
    
    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted]);

  // Countdown timer for time limit
  useEffect(() => {
    if (isSubmitted || timeRemaining === null || !attemptId || autoSubmitRef.current) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          return 0;
        }
        
        const newTime = prev - 1;
        
        // Auto submit when time runs out
        if (newTime <= 0) {
          handleAutoSubmit();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isSubmitted, timeRemaining, attemptId, handleAutoSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!attemptId) return;

    if (!confirm("Bạn có chắc chắn muốn nộp bài? Bạn sẽ không thể chỉnh sửa sau khi nộp.")) {
      return;
    }

    // Convert answers to array format
    const answerArray: AnswerSubmit[] = questions.map((q) => ({
      question_id: q.question_id,
      user_answer: answers[q.question_id] || "",
    }));

    try {
      await submitAttempt({
        attemptId,
        submission: { answers: answerArray },
      }).unwrap();

      setIsSubmitted(true);
      toast.success("Đã nộp bài thành công!");
      // Keep the result modal open - removed automatic navigation
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      toast.error(errorMsg || "Không thể nộp bài");
    }
  };

  const getScore = () => {
    if (!attemptResult) {
      return { correct: 0, total: 0, percentage: 0 };
    }
    const correct = attemptResult.correct_answers;
    const total = attemptResult.total_questions;
    return {
      correct,
      total,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.question_type) {
      case QuestionType.TRUE_FALSE:
        return (
          <RadioGroup
            value={answers[currentQuestion.question_id] || ""}
            onValueChange={(value) => handleAnswerChange(currentQuestion.question_id, value)}
            disabled={isSubmitted}
          >
            <div className="space-y-3">
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="true" id="true" />
                <Label htmlFor="true" className="cursor-pointer flex-1 font-normal">
                  Đúng
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="false" id="false" />
                <Label htmlFor="false" className="cursor-pointer flex-1 font-normal">
                  Sai
                </Label>
              </div>
            </div>
          </RadioGroup>
        );

      case QuestionType.MULTIPLE_CHOICE:
        return (
          <RadioGroup
            value={answers[currentQuestion.question_id] || ""}
            onValueChange={(value) => handleAnswerChange(currentQuestion.question_id, value)}
            disabled={isSubmitted}
          >
            <div className="space-y-3">
              {currentQuestion.options?.map((option, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer"
                >
                  <RadioGroupItem value={option} id={`option-${idx}`} />
                  <Label
                    htmlFor={`option-${idx}`}
                    className="cursor-pointer flex-1 font-normal"
                  >
                    {String.fromCharCode(65 + idx)}. {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );

      case QuestionType.ESSAY:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="essay-answer" className="mb-2 block">
                Nhập câu trả lời:
              </Label>
              <Textarea
                id="essay-answer"
                value={answers[currentQuestion.question_id] || ""}
                onChange={(e) => handleAnswerChange(currentQuestion.question_id, e.target.value)}
                disabled={isSubmitted}
                placeholder="Nhập câu trả lời của bạn..."
                rows={5}
                className="w-full"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderAnswerFeedback = () => {
    if (!isSubmitted || !attemptResult || !currentQuestion) return null;

    const answer = attemptResult.answers.find(
      (a) => a.question_id === currentQuestion.question_id
    );
    if (!answer) return null;

    const isCorrect = answer.is_correct;
    const correctAnswer = attemptResult.questions.find(
      (q) => q.question_id === currentQuestion.question_id
    )?.correct_answer;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-4 p-4 rounded-lg ${
          isCorrect ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          {isCorrect ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <span className={`font-semibold ${isCorrect ? "text-green-600" : "text-red-600"}`}>
            {isCorrect ? "Đúng!" : "Sai"}
          </span>
        </div>
        {!isCorrect && correctAnswer && (
          <div className="text-sm">
            <p className="text-muted-foreground mb-1">Đáp án đúng:</p>
            <p className="font-medium">{correctAnswer}</p>
          </div>
        )}
      </motion.div>
    );
  };

  // Loading state
  if (startingAttempt || (isSubmitted && loadingResult)) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show result after submission
  if (isSubmitted && attemptResult) {
    const score = getScore();
    return (
      <div className="h-full flex flex-col p-6">
        <Card className="max-w-2xl mx-auto w-full">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Kết quả Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-primary">
                {score.correct}/{score.total}
              </div>
              <div className="text-2xl font-semibold">{score.percentage}%</div>
              <Badge variant={score.percentage >= 70 ? "default" : "secondary"} className="text-lg px-4 py-1">
                {score.percentage >= 70 ? "Đạt" : "Chưa đạt"}
              </Badge>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Chi tiết câu trả lời:</h3>
              {attemptResult.questions.map((q, idx) => {
                const answer = attemptResult.answers.find((a) => a.question_id === q.question_id);
                const isCorrect = answer?.is_correct || false;
                return (
                  <div
                    key={q.question_id}
                    className={`p-4 border rounded-lg ${
                      isCorrect
                        ? "bg-green-50 dark:bg-green-950/20 border-green-200"
                        : "bg-red-50 dark:bg-red-950/20 border-red-200"
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">Câu {idx + 1}: {q.question_text}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Đáp án của bạn:{" "}
                          <span className="font-medium">
                            {answer?.user_answer || "Chưa trả lời"}
                          </span>
                        </p>
                        {!isCorrect && (
                          <p className="text-sm text-muted-foreground">
                            Đáp án đúng:{" "}
                            <span className="font-medium text-green-600">
                              {q.correct_answer}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate(`/dashboard/studysets/${studysetId}/test`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại danh sách
              </Button>
              <Button
                className="flex-1"
                onClick={() => navigate(`/dashboard/studysets/${studysetId}`)}
              >
                Về Study Set
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state - show when starting attempt or when no attemptId and no questions
  if (startingAttempt || (!attemptId && !questions.length)) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải câu hỏi...</p>
        </div>
      </div>
    );
  }

  // No questions yet (error case)
  if (!questions.length && attemptId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Không có câu hỏi nào</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Card className="h-full flex flex-col">
        <CardHeader className="border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/dashboard/studysets/${studysetId}/test`)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <CardTitle>Làm Test</CardTitle>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>
                      Câu {currentQuestionIndex + 1}/{totalQuestions}
                    </span>
                  </div>
                  {timeRemaining !== null ? (
                    <div className={`flex items-center gap-1 ${timeRemaining <= 60 ? "text-red-600 font-semibold" : ""}`}>
                      <Clock className="w-4 h-4" />
                      <span>
                        Còn lại: {formatTime(timeRemaining)}
                        {timeRemaining <= 60 && " ⚠️"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Đã làm: {formatTime(timeElapsed)}</span>
                    </div>
                  )}
                  <Badge variant="secondary">
                    Đã trả lời: {answeredCount}/{totalQuestions}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>

            {/* Question */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline">
                      {currentQuestion.question_type === QuestionType.TRUE_FALSE
                        ? "Đúng/Sai"
                        : currentQuestion.question_type === QuestionType.MULTIPLE_CHOICE
                        ? "Trắc nghiệm"
                        : "Tự luận"}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-semibold">{currentQuestion.question_text}</h2>
                  {renderQuestion()}
                  {renderAnswerFeedback()}
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Câu trước
              </Button>

              <div className="flex gap-2">
                {questions.map((q, idx) => (
                  <button
                    key={q.question_id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                      idx === currentQuestionIndex
                        ? "bg-primary text-primary-foreground"
                        : answers[q.question_id] && answers[q.question_id].trim() !== ""
                        ? "bg-green-500 text-white"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              {currentQuestionIndex < totalQuestions - 1 ? (
                <Button onClick={handleNext}>
                  Câu sau
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Nộp bài
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

