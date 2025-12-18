export interface FolderStudySet {
  id: number
  title: string
  cardCount: number
  progress: number
}

export interface Folder {
  id: number
  name: string
  description: string
  itemCount: number
  color: string
  lastModified: string
  studySets: FolderStudySet[]
  creator: string
  isStarred: boolean
}

export const folders: Folder[] = [
  {
    id: 1,
    name: "Language Learning",
    description: "Spanish, French, and German vocabulary sets",
    itemCount: 8,
    color: "bg-green-500",
    lastModified: "2 days ago",
    studySets: [
      { id: 1, title: "Spanish Vocabulary", cardCount: 50, progress: 60 },
      { id: 2, title: "French Basics", cardCount: 40, progress: 75 },
      { id: 3, title: "German Phrases", cardCount: 35, progress: 45 }
    ],
    creator: "You",
    isStarred: true
  },
  {
    id: 2,
    name: "Science Collection",
    description: "Biology, Chemistry, and Physics study materials",
    itemCount: 12,
    color: "bg-blue-500",
    lastModified: "5 days ago",
    studySets: [
      { id: 4, title: "Chemistry Elements", cardCount: 30, progress: 45 },
      { id: 5, title: "Biology Terms", cardCount: 45, progress: 80 },
      { id: 6, title: "Physics Formulas", cardCount: 25, progress: 30 }
    ],
    creator: "You",
    isStarred: false
  },
  {
    id: 3,
    name: "History & Geography",
    description: "World history events and geographical facts",
    itemCount: 15,
    color: "bg-amber-500",
    lastModified: "1 week ago",
    studySets: [
      { id: 7, title: "World Capitals", cardCount: 25, progress: 80 },
      { id: 8, title: "Historical Events", cardCount: 60, progress: 55 },
      { id: 9, title: "US States & Capitals", cardCount: 50, progress: 90 }
    ],
    creator: "You",
    isStarred: true
  },
  {
    id: 4,
    name: "Computer Science",
    description: "Programming concepts and algorithms",
    itemCount: 10,
    color: "bg-purple-500",
    lastModified: "3 days ago",
    studySets: [
      { id: 10, title: "Python Basics", cardCount: 55, progress: 70 },
      { id: 11, title: "Data Structures", cardCount: 40, progress: 50 },
      { id: 12, title: "Algorithms", cardCount: 35, progress: 35 }
    ],
    creator: "You",
    isStarred: false
  },
  {
    id: 5,
    name: "Medical Terminology",
    description: "Healthcare and medical vocabulary",
    itemCount: 20,
    color: "bg-red-500",
    lastModified: "4 days ago",
    studySets: [
      { id: 13, title: "Anatomy Terms", cardCount: 80, progress: 65 },
      { id: 14, title: "Medical Abbreviations", cardCount: 45, progress: 70 },
      { id: 15, title: "Pharmacology", cardCount: 60, progress: 40 }
    ],
    creator: "You",
    isStarred: true
  },
  {
    id: 6,
    name: "Literature & Writing",
    description: "Literary terms and writing techniques",
    itemCount: 9,
    color: "bg-pink-500",
    lastModified: "6 days ago",
    studySets: [
      { id: 16, title: "Literary Devices", cardCount: 30, progress: 85 },
      { id: 17, title: "Shakespeare Quotes", cardCount: 50, progress: 60 },
      { id: 18, title: "Poetry Analysis", cardCount: 25, progress: 55 }
    ],
    creator: "You",
    isStarred: false
  },
  {
    id: 7,
    name: "Business & Economics",
    description: "Business terminology and economic concepts",
    itemCount: 11,
    color: "bg-teal-500",
    lastModified: "1 day ago",
    studySets: [
      { id: 19, title: "Business Terms", cardCount: 40, progress: 50 },
      { id: 20, title: "Economic Theory", cardCount: 35, progress: 45 },
      { id: 21, title: "Marketing Concepts", cardCount: 30, progress: 60 }
    ],
    creator: "You",
    isStarred: true
  },
  {
    id: 8,
    name: "Art & Music",
    description: "Art history and music theory",
    itemCount: 7,
    color: "bg-orange-500",
    lastModified: "2 weeks ago",
    studySets: [
      { id: 22, title: "Art Movements", cardCount: 45, progress: 40 },
      { id: 23, title: "Music Theory", cardCount: 35, progress: 75 },
      { id: 24, title: "Famous Artists", cardCount: 40, progress: 50 }
    ],
    creator: "You",
    isStarred: false
  }
]
