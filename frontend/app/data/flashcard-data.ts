export interface FlashcardData {
  id: number
  front: string
  back: string
  category: string
}

export const sampleFlashcards: FlashcardData[] = [
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
  },
  {
    id: 6,
    front: "What is the largest planet in our solar system?",
    back: "Jupiter",
    category: "Astronomy"
  },
  {
    id: 7,
    front: "Who painted the Mona Lisa?",
    back: "Leonardo da Vinci",
    category: "Art"
  },
  {
    id: 8,
    front: "What is the speed of light?",
    back: "299,792,458 meters per second",
    category: "Physics"
  },
  {
    id: 9,
    front: "What is the smallest unit of life?",
    back: "Cell",
    category: "Biology"
  },
  {
    id: 10,
    front: "Who was the first President of the United States?",
    back: "George Washington",
    category: "History"
  }
]

export interface FlashcardSet {
  id: number
  title: string
  description: string
  cardCount: number
  category: string
  author: string
  createdAt: string
  lastModified: string
  isPublic: boolean
  flashcards: FlashcardData[]
}

export const flashcardSets: FlashcardSet[] = [
  {
    id: 1,
    title: "World Capitals",
    description: "Major capitals around the world",
    cardCount: 25,
    category: "Geography",
    author: "You",
    createdAt: "2024-01-15",
    lastModified: "2024-03-20",
    isPublic: true,
    flashcards: [
      { id: 1, front: "What is the capital of France?", back: "Paris", category: "Geography" },
      { id: 2, front: "What is the capital of Japan?", back: "Tokyo", category: "Geography" },
      { id: 3, front: "What is the capital of Brazil?", back: "Brasília", category: "Geography" },
      { id: 4, front: "What is the capital of Australia?", back: "Canberra", category: "Geography" },
      { id: 5, front: "What is the capital of Canada?", back: "Ottawa", category: "Geography" }
    ]
  },
  {
    id: 2,
    title: "Spanish Vocabulary",
    description: "Common Spanish words and phrases",
    cardCount: 50,
    category: "Language",
    author: "You",
    createdAt: "2024-02-10",
    lastModified: "2024-03-18",
    isPublic: true,
    flashcards: [
      { id: 6, front: "Hello", back: "Hola", category: "Spanish" },
      { id: 7, front: "Goodbye", back: "Adiós", category: "Spanish" },
      { id: 8, front: "Please", back: "Por favor", category: "Spanish" },
      { id: 9, front: "Thank you", back: "Gracias", category: "Spanish" },
      { id: 10, front: "How are you?", back: "¿Cómo estás?", category: "Spanish" }
    ]
  },
  {
    id: 3,
    title: "Chemistry Elements",
    description: "Periodic table elements and symbols",
    cardCount: 30,
    category: "Science",
    author: "You",
    createdAt: "2024-01-20",
    lastModified: "2024-03-15",
    isPublic: false,
    flashcards: [
      { id: 11, front: "What is the symbol for Gold?", back: "Au", category: "Chemistry" },
      { id: 12, front: "What is the symbol for Silver?", back: "Ag", category: "Chemistry" },
      { id: 13, front: "What is the symbol for Iron?", back: "Fe", category: "Chemistry" },
      { id: 14, front: "What is the symbol for Copper?", back: "Cu", category: "Chemistry" },
      { id: 15, front: "What is the symbol for Sodium?", back: "Na", category: "Chemistry" }
    ]
  },
  {
    id: 4,
    title: "Math Formulas",
    description: "Essential mathematical formulas",
    cardCount: 40,
    category: "Mathematics",
    author: "Prof. Johnson",
    createdAt: "2024-02-05",
    lastModified: "2024-03-10",
    isPublic: true,
    flashcards: [
      { id: 16, front: "Pythagorean Theorem", back: "a² + b² = c²", category: "Mathematics" },
      { id: 17, front: "Area of a Circle", back: "πr²", category: "Mathematics" },
      { id: 18, front: "Quadratic Formula", back: "x = (-b ± √(b²-4ac)) / 2a", category: "Mathematics" },
      { id: 19, front: "Distance Formula", back: "d = √((x₂-x₁)² + (y₂-y₁)²)", category: "Mathematics" },
      { id: 20, front: "Slope Formula", back: "m = (y₂-y₁) / (x₂-x₁)", category: "Mathematics" }
    ]
  }
]
