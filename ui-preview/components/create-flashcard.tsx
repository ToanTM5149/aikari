import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { Badge } from "./ui/badge"
import { 
  Plus, 
  Trash2, 
  Save, 
  Eye, 
  EyeOff, 
  RotateCcw,
  Sparkles,
  FolderPlus,
  Check,
  X
} from "lucide-react"
import { toast } from "sonner"

interface FlashcardInput {
  id: string
  front: string
  back: string
  category: string
}

export function CreateFlashcard() {
  const [flashcards, setFlashcards] = useState<FlashcardInput[]>([
    { id: "1", front: "", back: "", category: "" }
  ])
  const [setTitle, setSetTitle] = useState("")
  const [setDescription, setSetDescription] = useState("")
  const [previewMode, setPreviewMode] = useState(false)
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())

  const addFlashcard = () => {
    const newCard: FlashcardInput = {
      id: Date.now().toString(),
      front: "",
      back: "",
      category: ""
    }
    setFlashcards([...flashcards, newCard])
    
    // Scroll to bottom after adding
    setTimeout(() => {
      const element = document.getElementById(`card-${newCard.id}`)
      element?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 100)
  }

  const removeFlashcard = (id: string) => {
    if (flashcards.length === 1) {
      toast.error("You must have at least one flashcard")
      return
    }
    setFlashcards(flashcards.filter(card => card.id !== id))
    toast.success("Flashcard removed")
  }

  const updateFlashcard = (id: string, field: keyof FlashcardInput, value: string) => {
    setFlashcards(flashcards.map(card => 
      card.id === id ? { ...card, [field]: value } : card
    ))
  }

  const handleFlipCard = (id: string) => {
    const newFlipped = new Set(flippedCards)
    if (newFlipped.has(id)) {
      newFlipped.delete(id)
    } else {
      newFlipped.add(id)
    }
    setFlippedCards(newFlipped)
  }

  const resetAll = () => {
    setFlashcards([{ id: Date.now().toString(), front: "", back: "", category: "" }])
    setSetTitle("")
    setSetDescription("")
    setPreviewMode(false)
    setFlippedCards(new Set())
    toast.success("Reset complete")
  }

  const handleSave = () => {
    // Validate
    if (!setTitle.trim()) {
      toast.error("Please enter a title for your flashcard set")
      return
    }

    const validCards = flashcards.filter(card => card.front.trim() || card.back.trim())
    if (validCards.length === 0) {
      toast.error("Please add at least one flashcard with content")
      return
    }

    const incompleteCards = validCards.filter(card => !card.front.trim() || !card.back.trim())
    if (incompleteCards.length > 0) {
      toast.error(`${incompleteCards.length} flashcard(s) are incomplete`)
      return
    }

    // Success
    toast.success(`Saved "${setTitle}" with ${validCards.length} flashcards!`)
    console.log("Saved flashcard set:", { setTitle, setDescription, flashcards: validCards })
  }

  const getCardCount = () => {
    return flashcards.filter(card => card.front.trim() && card.back.trim()).length
  }

  return (
    <div className="h-full flex flex-col">
      <Card className="h-full flex flex-col">
        <CardHeader className="border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-2xl">
              <Input
                placeholder="Enter flashcard set title..."
                value={setTitle}
                onChange={(e) => setSetTitle(e.target.value)}
                className="mb-2 border-none bg-transparent p-0 h-auto focus-visible:ring-0"
              />
              <Input
                placeholder="Add a description (optional)"
                value={setDescription}
                onChange={(e) => setSetDescription(e.target.value)}
                className="border-none bg-transparent p-0 h-auto text-sm text-muted-foreground focus-visible:ring-0"
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="w-3 h-3" />
                {getCardCount()} Cards
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Edit
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetAll}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Set
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            {previewMode ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 gap-4"
              >
                {flashcards.filter(card => card.front.trim() || card.back.trim()).map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="h-48"
                    style={{ perspective: 1000 }}
                  >
                    <motion.div
                      className="relative w-full h-full cursor-pointer"
                      style={{ transformStyle: "preserve-3d" }}
                      animate={{ rotateY: flippedCards.has(card.id) ? 180 : 0 }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      onClick={() => handleFlipCard(card.id)}
                    >
                      {/* Front */}
                      <Card className="absolute inset-0 backface-hidden">
                        <CardContent className="flex flex-col items-center justify-center h-full p-4 text-center">
                          {card.category && (
                            <Badge variant="secondary" className="mb-3">
                              {card.category}
                            </Badge>
                          )}
                          <p className="line-clamp-4">{card.front || "Empty front"}</p>
                          <p className="text-xs text-muted-foreground mt-3">Click to flip</p>
                        </CardContent>
                      </Card>

                      {/* Back */}
                      <Card className="absolute inset-0 backface-hidden bg-primary/5" style={{ transform: "rotateY(180deg)" }}>
                        <CardContent className="flex flex-col items-center justify-center h-full p-4 text-center">
                          <Badge variant="secondary" className="mb-3">Answer</Badge>
                          <p className="line-clamp-4 text-primary">{card.back || "Empty back"}</p>
                          <p className="text-xs text-muted-foreground mt-3">Click to flip</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </motion.div>
                ))}
                
                {flashcards.filter(card => card.front.trim() || card.back.trim()).length === 0 && (
                  <div className="col-span-2 flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No flashcards to preview yet</p>
                      <p className="text-sm mt-2">Switch to edit mode to create flashcards</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {flashcards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    id={`card-${card.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="relative overflow-hidden transition-all hover:shadow-md">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-6">
                          {/* Card Number */}
                          <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary">{index + 1}</span>
                          </div>

                          {/* Card Content */}
                          <div className="flex-1 space-y-4">
                            {/* Category */}
                            <div>
                              <Label htmlFor={`category-${card.id}`} className="text-sm mb-2 block">
                                Category (optional)
                              </Label>
                              <Input
                                id={`category-${card.id}`}
                                placeholder="e.g., Mathematics, History, Science..."
                                value={card.category}
                                onChange={(e) => updateFlashcard(card.id, "category", e.target.value)}
                                className="max-w-xs"
                              />
                            </div>

                            {/* Front and Back */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`front-${card.id}`} className="text-sm mb-2 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                  Front (Question)
                                </Label>
                                <Textarea
                                  id={`front-${card.id}`}
                                  placeholder="Enter the question or prompt..."
                                  value={card.front}
                                  onChange={(e) => updateFlashcard(card.id, "front", e.target.value)}
                                  className="min-h-[120px] resize-none"
                                />
                              </div>

                              <div>
                                <Label htmlFor={`back-${card.id}`} className="text-sm mb-2 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  Back (Answer)
                                </Label>
                                <Textarea
                                  id={`back-${card.id}`}
                                  placeholder="Enter the answer or definition..."
                                  value={card.back}
                                  onChange={(e) => updateFlashcard(card.id, "back", e.target.value)}
                                  className="min-h-[120px] resize-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFlashcard(card.id)}
                            className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Validation Indicators */}
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                          <div className="flex items-center gap-1 text-xs">
                            {card.front.trim() ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <X className="w-3 h-3 text-muted-foreground" />
                            )}
                            <span className={card.front.trim() ? "text-green-600" : "text-muted-foreground"}>
                              Front
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            {card.back.trim() ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <X className="w-3 h-3 text-muted-foreground" />
                            )}
                            <span className={card.back.trim() ? "text-green-600" : "text-muted-foreground"}>
                              Back
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {/* Add Card Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: flashcards.length * 0.05 }}
                >
                  <Button
                    variant="outline"
                    className="w-full h-24 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={addFlashcard}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Flashcard
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* CSS for backface visibility */}
      <style>{`
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>
    </div>
  )
}
