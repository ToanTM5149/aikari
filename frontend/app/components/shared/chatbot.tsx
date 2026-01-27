import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { MessageCircle, Send, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { useSendChatMessageMutation } from "~/redux/features/chatbot";
import type { ChatMessage, QuickReplyButton } from "~/redux/features/chatbot/types";
import { QuickReplyButtons } from "./quick-reply-buttons";

interface ChatbotProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  width: number;
  onWidthChange: (width: number) => void;
  studysetId: string;
  termId?: string;  // Optional: term_id khi đang xem một term cụ thể
  onParagraphGenerated?: () => void;  // Callback khi paragraph được generate thành công
}

export function Chatbot({ 
  isCollapsed, 
  onToggleCollapse, 
  width, 
  onWidthChange,
  studysetId,
  termId,
  onParagraphGenerated 
}: ChatbotProps) {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isResizing, setIsResizing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);
  
  const [sendChatMessage, { isLoading }] = useSendChatMessageMutation();

  // Auto scroll to bottom when new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (text?: string, buttonValue?: string, isInitial = false) => {
    const messageToSend = text || message.trim();
    if (!messageToSend && !buttonValue && !isInitial) return;

    // Don't show initial message in UI
    if (!isInitial) {
      // Add user message to UI (skip for initial message)
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: buttonValue || messageToSend,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setMessage("");
    }

    try {
      const response = await sendChatMessage({
        studyset_id: studysetId,
        message: isInitial ? "" : (buttonValue || messageToSend),
        conversation_id: conversationId || undefined,
        button_clicked: buttonValue || undefined,
        term_id: termId || undefined,  // Truyền term_id nếu có
      }).unwrap();

      // Update conversation ID
      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }

      // Add assistant message to UI (always show assistant response)
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
        quick_replies: response.quick_replies || undefined,
        metadata: response.metadata || undefined,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Handle navigation if test_id in metadata
      if (response.metadata?.test_id) {
        // Navigate to test page after a short delay
        setTimeout(() => {
          navigate(`/studysets/${studysetId}/test/${response.metadata.test_id}`);
        }, 2000);
      }
      
      // Nếu có term_id và có paragraph trong metadata, gọi callback để refetch term data
      if (termId && response.metadata?.paragraph && onParagraphGenerated) {
        // Delay một chút để đảm bảo backend đã lưu xong
        setTimeout(() => {
          onParagraphGenerated();
        }, 500);
      }
    } catch (error: any) {
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `Error: ${error?.data?.detail || error?.message || "An error occurred"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      if (isInitial) {
        setIsInitializing(false);
      }
    }
  };

  const handleButtonClick = (value: string) => {
    handleSendMessage(undefined, value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Start conversation on mount if no messages (only once)
  useEffect(() => {
    if (
      !hasInitializedRef.current &&
      messages.length === 0 &&
      !isLoading &&
      !isInitializing &&
      studysetId &&
      !conversationId
    ) {
      hasInitializedRef.current = true;
      setIsInitializing(true);
      // Send empty message to start conversation in background
      handleSendMessage("", undefined, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studysetId]); // Only on studysetId change

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      // Min width: 280px, Max width: 600px
      if (newWidth >= 280 && newWidth <= 600) {
        onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  if (isCollapsed) {
    return (
      <div className="h-full border-l bg-background flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <MessageCircle className="w-5 h-5" />
          <span className="text-xs writing-mode-vertical rotate-180">Chatbot</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Resize Handle */}
      <div
        ref={resizeRef}
        onMouseDown={handleMouseDown}
        className={`w-1 hover:w-1.5 bg-border hover:bg-primary/50 cursor-col-resize transition-all ${
          isResizing ? "bg-primary w-1.5" : ""
        }`}
        style={{ userSelect: "none" }}
      />
      
      {/* Chatbot Content */}
      <Card className="flex-1 h-full flex flex-col border-0 border-l rounded-none">
        <CardHeader className="border-b border-border p-4 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="w-5 h-5 text-primary" />
              Chatbot
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Chat Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                /* Welcome Message */
                <div className="flex flex-col items-center justify-center text-center space-y-3 py-12">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-2 px-4">
                    <p className="text-sm font-medium">
                      Ask me anything about your flashcards!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      I can help you study and create content.
                    </p>
                  </div>
                </div>
              ) : (
                /* Chat Messages */
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.quick_replies && msg.quick_replies.length > 0 && (
                        <QuickReplyButtons
                          buttons={msg.quick_replies}
                          onButtonClick={handleButtonClick}
                          disabled={isLoading}
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
              
              {/* Loading indicator */}
              {(isLoading || isInitializing) && messages.length === 0 && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
              {isLoading && messages.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border p-4 shrink-0 bg-background">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={() => handleSendMessage()}
                disabled={!message.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

