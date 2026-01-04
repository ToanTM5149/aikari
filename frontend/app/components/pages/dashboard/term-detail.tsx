import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Chatbot } from "~/components/shared/chatbot";
import {
  ArrowLeft,
  Edit2,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetTermByIdQuery,
  useUpdateTermMutation,
} from "~/redux/features/studyset";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export function TermDetail() {
  const { studysetId, termId } = useParams<{ studysetId: string; termId: string }>();
  const navigate = useNavigate();

  // Query
  const {
    data: termData,
    isLoading: loadingTerm,
    error: termError,
  } = useGetTermByIdQuery(
    { studysetId: studysetId!, termId: termId! },
    { skip: !studysetId || !termId }
  );

  // Mutation
  const [updateTerm, { isLoading: updating }] = useUpdateTermMutation();

  // Local state for edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<{
    term_text: string;
    definition: string;
    example?: string;
    category?: string;
  } | null>(null);

  // Flip card state
  const [isFlipped, setIsFlipped] = useState(false);

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

  // Initialize edit dialog state when term data loads
  useEffect(() => {
    if (termData) {
      setEditingTerm({
        term_text: termData.term_text,
        definition: termData.definition,
        example: termData.example || "",
        category: termData.category || "",
      });
    }
  }, [termData]);

  const handleBack = () => {
    navigate(`/dashboard/studysets/${studysetId}`);
  };

  const handleOpenEditDialog = () => {
    if (termData) {
      setEditingTerm({
        term_text: termData.term_text,
        definition: termData.definition,
        example: termData.example || "",
        category: termData.category || "",
      });
      setEditDialogOpen(true);
    }
  };

  const handleSaveEditDialog = async () => {
    if (!editingTerm || !termId) return;

    if (!editingTerm.term_text.trim() || !editingTerm.definition.trim()) {
      toast.error("Vui lòng điền đầy đủ thuật ngữ và định nghĩa");
      return;
    }

    try {
      await updateTerm({
        studysetId: studysetId!,
        termId: termId,
        data: {
          term_text: editingTerm.term_text,
          definition: editingTerm.definition,
          example: editingTerm.example || undefined,
          category: editingTerm.category || undefined,
        },
      }).unwrap();
      toast.success("Đã cập nhật flashcard!");
      setEditDialogOpen(false);
    } catch (error: any) {
      const errorMsg =
        typeof error?.data?.detail === "string"
          ? error.data.detail
          : Array.isArray(error?.data?.detail)
          ? error.data.detail.map((e: any) => e.msg).join(", ")
          : error?.data?.message || "Đã xảy ra lỗi";
      toast.error(errorMsg);
    }
  };

  // Loading state
  if (loadingTerm) {
    return (
      <div className="h-full flex flex-col p-6">
        <Skeleton className="h-20 w-full mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Error state
  if (termError || !termData) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Không tìm thấy Flashcard</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Flashcard này không tồn tại hoặc bạn không có quyền truy cập.
              </p>
            </div>
            <Button onClick={handleBack}>Quay lại</Button>
          </div>
        </Card>
      </div>
    );
  }

  const term = termData;

  return (
    <div className="h-full flex overflow-hidden">
      <div className="flex-1 flex flex-col overflow-auto">
        <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <Button size="sm" onClick={handleOpenEditDialog}>
            <Edit2 className="w-4 h-4 mr-2" />
            Chỉnh sửa
          </Button>
        </div>

        {/* Flashcard - 2 mặt */}
        <Card className="w-full">
          <CardContent className="p-8">
            <div className="aspect-[4/3] max-w-2xl mx-auto" style={{ perspective: 1000 }}>
              <motion.div
                className="relative w-full h-full cursor-pointer"
                style={{ transformStyle: "preserve-3d" }}
                animate={{
                  rotateY: isFlipped ? 180 : 0,
                }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                {/* Front - Term */}
                <Card className="absolute inset-0 backface-hidden">
                  <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
                    {term.category && (
                      <Badge variant="secondary" className="mb-4">
                        {term.category}
                      </Badge>
                    )}
                    <p className="text-2xl font-medium line-clamp-6">
                      {term.term_text}
                    </p>
                    <p className="text-xs text-muted-foreground mt-6">
                      Click để lật
                    </p>
                  </CardContent>
                </Card>

                {/* Back - Definition */}
                <Card
                  className="absolute inset-0 backface-hidden bg-primary/5"
                  style={{ transform: "rotateY(180deg)" }}
                >
                  <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <Badge variant="secondary" className="mb-4">
                      Định nghĩa
                    </Badge>
                    <p className="text-2xl text-primary line-clamp-6">
                      {term.definition}
                    </p>
                    <p className="text-xs text-muted-foreground mt-6">
                      Click để lật
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs: Example và AI Example */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin bổ sung</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="example" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="example">Example</TabsTrigger>
                <TabsTrigger value="ai-example">AI Example</TabsTrigger>
              </TabsList>
              <TabsContent value="example" className="mt-4">
                {term.example ? (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm">{term.example}</p>
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>Chưa có ví dụ</p>
                    <p className="text-xs mt-2">
                      Click "Chỉnh sửa" để thêm ví dụ
                    </p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="ai-example" className="mt-4">
                <div className="p-8 text-center text-muted-foreground">
                  <p>Tính năng AI Example đang được phát triển</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        </div>

        {/* Edit Dialog */}
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
              onClick={handleSaveEditDialog}
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
        />
      </div>
    </div>
  );
}

