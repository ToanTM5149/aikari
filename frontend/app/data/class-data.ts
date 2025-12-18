export interface Assignment {
  id: number
  title: string
  dueDate: string
  completed: boolean
}

export interface ClassStudySet {
  id: number
  title: string
  cardCount: number
  progress: number
}

export interface Class {
  id: number
  name: string
  code: string
  description: string
  instructor: string
  memberCount: number
  studySetCount: number
  color: string
  schedule: string
  semester: string
  progress: number
  assignments: Assignment[]
  studySets: ClassStudySet[]
  recentActivity: string
  isStarred: boolean
}

export const classes: Class[] = [
  {
    id: 1,
    name: "AP Biology",
    code: "BIO401",
    description: "Advanced Placement Biology - College Level",
    instructor: "Dr. Sarah Johnson",
    memberCount: 32,
    studySetCount: 12,
    color: "bg-blue-500",
    schedule: "Mon, Wed, Fri 9:00 AM",
    semester: "Spring 2024",
    progress: 75,
    assignments: [
      { id: 1, title: "Cell Structure Quiz", dueDate: "Nov 5", completed: true },
      { id: 2, title: "Photosynthesis Review", dueDate: "Nov 8", completed: false },
      { id: 3, title: "DNA Replication Test", dueDate: "Nov 12", completed: false }
    ],
    studySets: [
      { id: 1, title: "Cell Biology", cardCount: 45, progress: 80 },
      { id: 2, title: "Genetics Basics", cardCount: 38, progress: 65 },
      { id: 3, title: "Ecology Terms", cardCount: 52, progress: 90 }
    ],
    recentActivity: "Active today",
    isStarred: true
  },
  {
    id: 2,
    name: "Calculus I",
    code: "MATH201",
    description: "Introduction to Differential Calculus",
    instructor: "Prof. Michael Chen",
    memberCount: 28,
    studySetCount: 15,
    color: "bg-purple-500",
    schedule: "Tue, Thu 11:00 AM",
    semester: "Spring 2024",
    progress: 60,
    assignments: [
      { id: 4, title: "Derivatives Practice", dueDate: "Nov 6", completed: false },
      { id: 5, title: "Limits Assessment", dueDate: "Nov 10", completed: true },
      { id: 6, title: "Integration Intro", dueDate: "Nov 15", completed: false }
    ],
    studySets: [
      { id: 4, title: "Limit Theorems", cardCount: 30, progress: 70 },
      { id: 5, title: "Derivative Rules", cardCount: 42, progress: 55 },
      { id: 6, title: "Applications", cardCount: 35, progress: 45 }
    ],
    recentActivity: "Active 2 hours ago",
    isStarred: true
  },
  {
    id: 3,
    name: "World History",
    code: "HIST301",
    description: "Modern World History 1500-Present",
    instructor: "Dr. Emma Williams",
    memberCount: 35,
    studySetCount: 18,
    color: "bg-amber-500",
    schedule: "Mon, Wed 2:00 PM",
    semester: "Spring 2024",
    progress: 82,
    assignments: [
      { id: 7, title: "Renaissance Period", dueDate: "Nov 4", completed: true },
      { id: 8, title: "Industrial Revolution", dueDate: "Nov 9", completed: false },
      { id: 9, title: "WWI Analysis", dueDate: "Nov 14", completed: false }
    ],
    studySets: [
      { id: 7, title: "Renaissance Art", cardCount: 28, progress: 85 },
      { id: 8, title: "Key Battles", cardCount: 45, progress: 75 },
      { id: 9, title: "Important Dates", cardCount: 60, progress: 90 }
    ],
    recentActivity: "Active 1 day ago",
    isStarred: false
  },
  {
    id: 4,
    name: "Spanish III",
    code: "SPAN301",
    description: "Intermediate Spanish Language & Culture",
    instructor: "Señora Maria Rodriguez",
    memberCount: 22,
    studySetCount: 20,
    color: "bg-red-500",
    schedule: "Daily 10:00 AM",
    semester: "Spring 2024",
    progress: 70,
    assignments: [
      { id: 10, title: "Verb Conjugations", dueDate: "Nov 5", completed: true },
      { id: 11, title: "Vocabulary Chapter 5", dueDate: "Nov 7", completed: false },
      { id: 12, title: "Cultural Essay", dueDate: "Nov 11", completed: false }
    ],
    studySets: [
      { id: 10, title: "Irregular Verbs", cardCount: 55, progress: 68 },
      { id: 11, title: "Travel Vocabulary", cardCount: 40, progress: 72 },
      { id: 12, title: "Common Phrases", cardCount: 35, progress: 70 }
    ],
    recentActivity: "Active today",
    isStarred: true
  },
  {
    id: 5,
    name: "Computer Science 101",
    code: "CS101",
    description: "Introduction to Programming with Python",
    instructor: "Prof. David Kumar",
    memberCount: 40,
    studySetCount: 10,
    color: "bg-green-500",
    schedule: "Tue, Thu 1:00 PM",
    semester: "Spring 2024",
    progress: 55,
    assignments: [
      { id: 13, title: "Variables & Data Types", dueDate: "Nov 6", completed: true },
      { id: 14, title: "Loops & Conditionals", dueDate: "Nov 8", completed: false },
      { id: 15, title: "Functions Project", dueDate: "Nov 13", completed: false }
    ],
    studySets: [
      { id: 13, title: "Python Syntax", cardCount: 50, progress: 60 },
      { id: 14, title: "Data Structures", cardCount: 40, progress: 50 },
      { id: 15, title: "Algorithms", cardCount: 35, progress: 55 }
    ],
    recentActivity: "Active 3 hours ago",
    isStarred: false
  },
  {
    id: 6,
    name: "Chemistry II",
    code: "CHEM202",
    description: "Organic Chemistry Fundamentals",
    instructor: "Dr. Lisa Anderson",
    memberCount: 26,
    studySetCount: 14,
    color: "bg-teal-500",
    schedule: "Mon, Wed, Fri 11:00 AM",
    semester: "Spring 2024",
    progress: 68,
    assignments: [
      { id: 16, title: "Organic Compounds", dueDate: "Nov 7", completed: false },
      { id: 17, title: "Reaction Mechanisms", dueDate: "Nov 10", completed: true },
      { id: 18, title: "Lab Report 3", dueDate: "Nov 14", completed: false }
    ],
    studySets: [
      { id: 16, title: "Functional Groups", cardCount: 42, progress: 70 },
      { id: 17, title: "Reactions", cardCount: 38, progress: 65 },
      { id: 18, title: "Nomenclature", cardCount: 45, progress: 70 }
    ],
    recentActivity: "Active 5 hours ago",
    isStarred: true
  }
]
