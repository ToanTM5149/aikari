import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Flashcard } from "./flashcard"

interface FlashcardContentProps {
  isStudying: boolean
}

export function FlashcardContent({ isStudying }: FlashcardContentProps) {
  if (isStudying) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>World Capitals - Study Mode</CardTitle>
        </CardHeader>
        <CardContent className="h-full">
          <Flashcard />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Flashcard Content</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p>Your flashcards will appear here</p>
          <p className="mt-2">Select a flashcard set to get started</p>
        </div>
      </CardContent>
    </Card>
  )
}