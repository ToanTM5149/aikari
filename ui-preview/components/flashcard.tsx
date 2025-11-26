import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"

interface FlashcardData {
  id: number
  front: string
  back: string
  category: string
}

const sampleFlashcards: FlashcardData[] = [
  {
    id: 1,
    front: "What is the capital of France?",
    back: "Paris",
    category: "Geography"
  },
  {
    id: 2,
    front: "What is 2 + 2?",
    back: "4",
    category: "Mathematics"
  },
  {
    id: 3,
    front: "Who wrote Romeo and Juliet?",
    back: "William Shakespeare",
    category: "Literature"
  },
  {
    id: 4,
    front: "What is the chemical symbol for gold?",
    back: "Au",
    category: "Chemistry"
  },
  {
    id: 5,
    front: "In what year was the Declaration of Independence signed?",
    back: "1776",
    category: "History"
  }
]

export function Flashcard() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const currentCard = sampleFlashcards[currentIndex]

  const handleFlip = () => {
    if (isAnimating) return
    setIsFlipped(!isFlipped)
  }

  const nextCard = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % sampleFlashcards.length)
      setIsAnimating(false)
    }, 200)
  }

  const prevCard = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + sampleFlashcards.length) % sampleFlashcards.length)
      setIsAnimating(false)
    }, 200)
  }

  const resetCard = () => {
    if (isAnimating) return
    setIsFlipped(false)
  }

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      <div className="relative w-full max-w-md h-64">
        <motion.div
          className="w-full h-full cursor-pointer"
          style={{ perspective: 1000 }}
          onClick={handleFlip}
          animate={{ 
            scale: isAnimating ? 0.9 : 1,
            opacity: isAnimating ? 0.7 : 1
          }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="relative w-full h-full"
            style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            {/* Front of card */}
            <Card className="absolute inset-0 backface-hidden">
              <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {currentCard.category}
                  </span>
                </div>
                <p className="text-lg">{currentCard.front}</p>
                <p className="text-sm text-muted-foreground mt-4">Click to reveal answer</p>
              </CardContent>
            </Card>

            {/* Back of card */}
            <Card className="absolute inset-0 backface-hidden" style={{ transform: "rotateY(180deg)" }}>
              <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center bg-primary/5">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    Answer
                  </span>
                </div>
                <p className="text-xl text-primary">{currentCard.back}</p>
                <p className="text-sm text-muted-foreground mt-4">Click to see question</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={prevCard}
          disabled={isAnimating}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <div className="flex flex-col items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} of {sampleFlashcards.length}
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={resetCard}
            disabled={isAnimating}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={nextCard}
          disabled={isAnimating}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="w-full max-w-md">
        <div className="flex space-x-1">
          {sampleFlashcards.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 rounded-full flex-1 ${
                index === currentIndex ? 'bg-primary' : 'bg-muted'
              }`}
              animate={{
                backgroundColor: index === currentIndex ? "var(--primary)" : "var(--muted)"
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}