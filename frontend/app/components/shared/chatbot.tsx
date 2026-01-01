import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { MessageCircle, Send, ChevronRight, ChevronLeft } from "lucide-react";

interface ChatbotProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  width: number;
  onWidthChange: (width: number) => void;
}

export function Chatbot({ isCollapsed, onToggleCollapse, width, onWidthChange }: ChatbotProps) {
  const [message, setMessage] = useState("");
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    // TODO: Implement chat functionality later
    console.log("Message:", message);
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
              {/* Welcome Message */}
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

              {/* TODO: Chat messages will appear here */}
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
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!message.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

