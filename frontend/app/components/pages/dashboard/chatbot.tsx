import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { MessageCircle, Send } from "lucide-react"
import { Input } from "~/components/ui/input"

export function Chatbot() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Chatbot
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 bg-muted/30 rounded-lg p-4 mb-4">
          <div className="text-center text-muted-foreground">
            <p>Ask me anything about your flashcards!</p>
            <p className="mt-2">I can help you study and create content.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Type your message..." className="flex-1" />
          <Button size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}