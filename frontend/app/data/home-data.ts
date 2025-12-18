import { GraduationCap, Folder } from "lucide-react"

export interface StudySet {
  id: number
  title: string
  description: string
  cardCount: number
  lastStudied?: string
  category: string
  progress: number
  author?: string
  rating?: number
  studyCount?: number
}

export interface FolderOrClass {
  id: number
  name: string
  type: "class" | "folder"
  itemCount: number
  icon: any
  color: string
}

export interface FeaturedContent {
  id: number
  title: string
  description: string
  author: string
  featured: boolean
  cardCount: number
  views: number
}

export const recentStudySets: StudySet[] = [
  {
    id: 1,
    title: "World Capitals",
    description: "Major capitals around the world",
    cardCount: 25,
    lastStudied: "2 hours ago",
    category: "Geography",
    progress: 80
  },
  {
    id: 2,
    title: "Spanish Vocabulary",
    description: "Common Spanish words and phrases",
    cardCount: 50,
    lastStudied: "1 day ago",
    category: "Language",
    progress: 60
  },
  {
    id: 3,
    title: "Chemistry Elements",
    description: "Periodic table elements and symbols",
    cardCount: 30,
    lastStudied: "3 days ago",
    category: "Science",
    progress: 45
  }
]

export const recommendedSets: StudySet[] = [
  {
    id: 4,
    title: "Math Formulas",
    description: "Essential mathematical formulas",
    cardCount: 40,
    author: "Prof. Johnson",
    rating: 4.8,
    studyCount: 1250,
    category: "Mathematics",
    progress: 0
  },
  {
    id: 5,
    title: "History Timeline",
    description: "Important dates in world history",
    cardCount: 35,
    author: "Sarah M.",
    rating: 4.6,
    studyCount: 890,
    category: "History",
    progress: 0
  },
  {
    id: 6,
    title: "Biology Terms",
    description: "Key biology terminology",
    cardCount: 45,
    author: "Dr. Smith",
    rating: 4.9,
    studyCount: 2100,
    category: "Biology",
    progress: 0
  }
]

export const foldersAndClasses: FolderOrClass[] = [
  {
    id: 1,
    name: "AP Biology",
    type: "class",
    itemCount: 12,
    icon: GraduationCap,
    color: "bg-blue-500"
  },
  {
    id: 2,
    name: "Language Learning",
    type: "folder",
    itemCount: 8,
    icon: Folder,
    color: "bg-green-500"
  },
  {
    id: 3,
    name: "Math Study Group",
    type: "class",
    itemCount: 15,
    icon: GraduationCap,
    color: "bg-purple-500"
  }
]

export const featuredContent: FeaturedContent[] = [
  {
    id: 1,
    title: "SAT Prep Vocabulary",
    description: "Essential words for SAT success",
    author: "EduPartner",
    featured: true,
    cardCount: 100,
    views: 15000
  },
  {
    id: 2,
    title: "Medical Terminology",
    description: "Healthcare professional vocabulary",
    author: "MedSchool Pro",
    featured: true,
    cardCount: 200,
    views: 8500
  }
]
