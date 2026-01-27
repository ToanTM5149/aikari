import { useNavigate } from "react-router"
import { Card, CardContent } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { BookOpen, ArrowLeft } from "lucide-react"

export function Flashcard() {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-center h-full">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold">No Study Set Selected</h2>
          <p className="text-muted-foreground">
            Please select a study set from your classes or study sets to start learning.
          </p>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => navigate("/studysets")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Study Sets
            </Button>
            <Button onClick={() => navigate("/classes")}>
              View Classes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}