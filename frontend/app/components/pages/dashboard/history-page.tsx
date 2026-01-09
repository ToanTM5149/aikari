import { useState, useEffect } from "react";
import * as React from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
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
import {
  FileText,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  Eye,
  BookOpen,
  Users,
  User,
  Bot,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetMyTestHistoryQuery,
  useDeleteAttemptMutation,
  type TestAttempt,
} from "~/redux/features/test";
import { useGetClassesQuery } from "~/redux/features/class";
import { useAppSelector } from "~/redux/store";
import { selectCurrentUser } from "~/redux/features/auth/slice";

export function HistoryPage() {
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attemptToDelete, setAttemptToDelete] = useState<string | null>(null);
  
  // Filters state
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);
  const [testCreatorFilter, setTestCreatorFilter] = useState<"all" | "user" | "ai">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch all user's classes for filter dropdown
  const { data: classesData } = useGetClassesQuery({ limit: 1000 });
  const allClasses = classesData?.data || [];
  
  // Delete mutation
  const [deleteAttempt, { isLoading: isDeleting }] = useDeleteAttemptMutation();

  // Prepare query params
  const queryParams = {
    ...(selectedClassId && { classId: selectedClassId }),
    ...(testCreatorFilter === "user" && user?.user_id && { testCreatorId: user.user_id }),
    ...(testCreatorFilter === "ai" && { testCreatorId: "AI" }), // Special value for AI filter
    ...(debouncedSearch && { search: debouncedSearch }),
    skip: 0,
    limit: 100,
  };

  const {
    data: historyData,
    isLoading: loadingHistory,
    error: historyError,
  } = useGetMyTestHistoryQuery(queryParams, {
    // Refetch when query params change
    refetchOnMountOrArgChange: true,
  });

  const attempts = historyData?.data || [];

  const handleViewResult = (attemptId: string) => {
    navigate(`/dashboard/attempts/${attemptId}/result`);
  };

  const handleDeleteClick = (attemptId: string) => {
    setAttemptToDelete(attemptId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!attemptToDelete) return;

    try {
      await deleteAttempt(attemptToDelete).unwrap();
      toast.success("Đã xóa lịch sử làm bài thành công");
      setDeleteDialogOpen(false);
      setAttemptToDelete(null);
    } catch (error: any) {
      toast.error(error?.data?.detail || "Không thể xóa lịch sử làm bài");
    }
  };

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

  // Use all classes from API for filter dropdown
  const uniqueClasses = allClasses.map((cls) => ({
    id: cls.class_id,
    name: cls.class_name,
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lịch sử làm bài</h1>
          <p className="text-muted-foreground mt-1">
            Xem lại tất cả các bài test bạn đã hoàn thành
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <CardTitle>Bộ lọc</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm theo tên test..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Class Filter */}
            <Select
              value={selectedClassId || "all"}
              onValueChange={(value) =>
                setSelectedClassId(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả lớp học" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả lớp học</SelectItem>
                {uniqueClasses.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id!}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Test Creator Filter */}
            <Select
              value={testCreatorFilter}
              onValueChange={(value: "all" | "user" | "ai") =>
                setTestCreatorFilter(value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Người tạo test" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="user">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>User tạo</span>
                  </div>
                </SelectItem>
                <SelectItem value="ai">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    <span>AI tạo</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loadingHistory ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : historyError ? (
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            <p>Đã xảy ra lỗi khi tải lịch sử</p>
          </CardContent>
        </Card>
      ) : attempts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium">Chưa có lịch sử làm bài</p>
            <p className="text-sm text-muted-foreground mt-2">
              Hoàn thành bài test để xem lịch sử ở đây
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt) => (
            <motion.div
              key={attempt.attempt_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            {attempt.test_title || "Test"}
                          </h3>
                          {attempt.test_description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {attempt.test_description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground ml-13">
                        {attempt.studyset_title && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            <span>{attempt.studyset_title}</span>
                          </div>
                        )}
                        {attempt.class_name && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{attempt.class_name}</span>
                          </div>
                        )}
                        {attempt.test_creator_username && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>Tạo bởi: {attempt.test_creator_username}</span>
                          </div>
                        )}
                        {attempt.completed_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDate(attempt.completed_at)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 ml-13">
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Điểm: {attempt.correct_answers}/{attempt.total_questions} ({formatScore(attempt.score)}%)
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewResult(attempt.attempt_id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Xem kết quả
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClick(attempt.attempt_id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa lịch sử làm bài này không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAttemptToDelete(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
