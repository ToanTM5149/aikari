import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Checkbox } from "~/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateTestMutation,
  QuestionType,
} from "~/redux/features/test";

interface CreateTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studysetId: string;
  onTestCreated?: () => void;
}

export function CreateTestDialog({
  open,
  onOpenChange,
  studysetId,
  onTestCreated,
}: CreateTestDialogProps) {
  const [testTitle, setTestTitle] = useState("");
  const [testDescription, setTestDescription] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [questionTypes, setQuestionTypes] = useState<string[]>([
    QuestionType.MULTIPLE_CHOICE,
  ]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [timeLimitUnit, setTimeLimitUnit] = useState<"minutes" | "seconds">("minutes");
  
  const [createTest, { isLoading: isCreating }] = useCreateTestMutation();

  const handleCreate = async () => {
    if (!testTitle.trim()) {
      toast.error("Please enter a test title");
      return;
    }

    if (questionCount < 1 || questionCount > 100) {
      toast.error("Number of questions must be between 1 and 100");
      return;
    }

    if (questionTypes.length === 0) {
      toast.error("Please select at least one question type");
      return;
    }

    try {
      // Convert time limit to seconds if provided
      const timeLimitInSeconds = timeLimit 
        ? (timeLimitUnit === "minutes" ? timeLimit * 60 : timeLimit)
        : null;

      await createTest({
        studyset_id: studysetId,
        title: testTitle.trim(),
        description: testDescription.trim() || undefined,
        total_questions: questionCount,
        show_answers: showAnswers,
        question_types: questionTypes,
        time_limit: timeLimitInSeconds,
      }).unwrap();

      toast.success("Test created successfully!");
      onOpenChange(false);
      
      // Reset form
      setTestTitle("");
      setTestDescription("");
      setQuestionCount(10);
      setQuestionTypes([QuestionType.MULTIPLE_CHOICE]);
      setShowAnswers(false);
      setTimeLimit(null);
      setTimeLimitUnit("minutes");
      
      // Notify parent
      onTestCreated?.();
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      toast.error(errorMsg || "Failed to create test");
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
    return "An error occurred";
  };

  const toggleQuestionType = (type: string) => {
    setQuestionTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Test</DialogTitle>
          <DialogDescription>
            Configure options for your test
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="test-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="test-title"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="Example: Mid-term exam"
              className="w-full"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="test-description">Description</Label>
            <Textarea
              id="test-description"
              value={testDescription}
              onChange={(e) => setTestDescription(e.target.value)}
              placeholder="Add a description for the test..."
              rows={3}
              className="w-full"
            />
          </div>

          {/* Số câu hỏi */}
          <div className="space-y-2">
            <Label htmlFor="question-count">
              Number of Questions <span className="text-destructive">*</span>
            </Label>
            <Input
              id="question-count"
              type="number"
              min="1"
              max="100"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value) || 1)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Number of questions from 1 to 100
            </p>
          </div>

          {/* Time Limit */}
          <div className="space-y-2">
            <Label htmlFor="time-limit">Time Limit (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="time-limit"
                type="number"
                min="1"
                value={timeLimit || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setTimeLimit(value ? parseInt(value) : null);
                }}
                placeholder="Enter time"
                className="flex-1"
              />
              <select
                value={timeLimitUnit}
                onChange={(e) => setTimeLimitUnit(e.target.value as "minutes" | "seconds")}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="minutes">Minutes</option>
                <option value="seconds">Seconds</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty if you don't want a time limit. When time runs out, the test will be automatically submitted.
            </p>
          </div>

          {/* Loại câu hỏi */}
          <div className="space-y-3">
            <Label>Question Type <span className="text-destructive">*</span></Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="true-false"
                  checked={questionTypes.includes(QuestionType.TRUE_FALSE)}
                  onCheckedChange={() => toggleQuestionType(QuestionType.TRUE_FALSE)}
                />
                <Label
                  htmlFor="true-false"
                  className="font-normal cursor-pointer flex-1"
                >
                  <div>
                    <div className="font-medium">True/False</div>
                    <div className="text-xs text-muted-foreground">
                      Questions with true or false answers
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="multiple-choice"
                  checked={questionTypes.includes(QuestionType.MULTIPLE_CHOICE)}
                  onCheckedChange={() => toggleQuestionType(QuestionType.MULTIPLE_CHOICE)}
                />
                <Label
                  htmlFor="multiple-choice"
                  className="font-normal cursor-pointer flex-1"
                >
                  <div>
                    <div className="font-medium">Multiple Choice (ABCD)</div>
                    <div className="text-xs text-muted-foreground">
                      Questions with multiple choices
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="essay"
                  checked={questionTypes.includes(QuestionType.ESSAY)}
                  onCheckedChange={() => toggleQuestionType(QuestionType.ESSAY)}
                />
                <Label
                  htmlFor="essay"
                  className="font-normal cursor-pointer flex-1"
                >
                  <div>
                    <div className="font-medium">Essay</div>
                    <div className="text-xs text-muted-foreground">
                      Show definition or term, require entering the remaining part
                    </div>
                  </div>
                </Label>
              </div>
            </div>
          </div>

          {/* Show Answers */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-answers"
              checked={showAnswers}
              onCheckedChange={(checked) => setShowAnswers(checked as boolean)}
            />
            <Label
              htmlFor="show-answers"
              className="font-normal cursor-pointer flex-1"
            >
              <div>
                <div className="font-medium">Show Answers Immediately</div>
                <div className="text-xs text-muted-foreground">
                  Show answer immediately after answering each question
                </div>
              </div>
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Test"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

