import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Progress } from "./ui/progress"
import {
  GraduationCap,
  Users,
  BookOpen,
  Search,
  MoreVertical,
  Grid,
  List,
  Clock,
  Star,
  Trash2,
  Edit,
  Share2,
  UserPlus,
  Calendar,
  Trophy,
  TrendingUp,
  ChevronRight,
  Plus,
  Filter,
  Settings,
  BarChart3,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { toast } from "sonner"

const classes = [
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

interface ClassPageProps {
  onStudySetClick?: () => void
  onStatisticsClick?: (className: string) => void
}

export function ClassPage({ onStudySetClick, onStatisticsClick }: ClassPageProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedClass, setSelectedClass] = useState<number | null>(null)
  const [starredClasses, setStarredClasses] = useState<Set<number>>(
    new Set(classes.filter(c => c.isStarred).map(c => c.id))
  )

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleStar = (classId: number) => {
    const newStarred = new Set(starredClasses)
    if (newStarred.has(classId)) {
      newStarred.delete(classId)
      toast.success("Removed from favorites")
    } else {
      newStarred.add(classId)
      toast.success("Added to favorites")
    }
    setStarredClasses(newStarred)
  }

  const handleClassAction = (action: string, className: string) => {
    switch (action) {
      case "edit":
        toast.success(`Editing "${className}"`)
        break
      case "invite":
        toast.success(`Inviting members to "${className}"`)
        break
      case "settings":
        toast.success(`Opening settings for "${className}"`)
        break
      case "leave":
        toast.error(`Left "${className}"`)
        break
    }
  }

  if (selectedClass !== null) {
    const cls = classes.find(c => c.id === selectedClass)
    if (!cls) return null

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="h-full"
      >
        <Card className="h-full flex flex-col">
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedClass(null)}
              >
                ← Back
              </Button>
              <div className={`w-12 h-12 rounded-lg ${cls.color} flex items-center justify-center`}>
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle>{cls.name}</CardTitle>
                  <Badge variant="outline">{cls.code}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{cls.instructor}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStatisticsClick?.(cls.name)}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Statistics
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Members</span>
                  </div>
                  <p className="text-2xl">{cls.memberCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-sm">Study Sets</span>
                  </div>
                  <p className="text-2xl">{cls.studySetCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">Progress</span>
                  </div>
                  <p className="text-2xl">{cls.progress}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Schedule</span>
                  </div>
                  <p className="text-sm">{cls.schedule}</p>
                </CardContent>
              </Card>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-auto p-6">
            <Tabs defaultValue="sets" className="h-full">
              <TabsList>
                <TabsTrigger value="sets">Study Sets</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
              </TabsList>

              <TabsContent value="sets" className="space-y-4 mt-6">
                {cls.studySets.map((set, index) => (
                  <motion.div
                    key={set.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onStudySetClick}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3>{set.title}</h3>
                          <Badge variant="secondary">{set.cardCount} cards</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Your progress</span>
                            <span>{set.progress}%</span>
                          </div>
                          <Progress value={set.progress} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </TabsContent>

              <TabsContent value="assignments" className="space-y-4 mt-6">
                {cls.assignments.map((assignment, index) => (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${assignment.completed ? 'bg-green-500' : 'bg-muted'} flex items-center justify-center`}>
                              {assignment.completed ? (
                                <Trophy className="w-5 h-5 text-white" />
                              ) : (
                                <Calendar className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-sm">{assignment.title}</h3>
                              <p className="text-sm text-muted-foreground">Due: {assignment.dueDate}</p>
                            </div>
                          </div>
                          <Badge variant={assignment.completed ? "default" : "secondary"}>
                            {assignment.completed ? "Completed" : "Pending"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </TabsContent>

              <TabsContent value="members" className="mt-6">
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {String.fromCharCode(65 + index)}{String.fromCharCode(65 + (index + 1) % 26)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="text-sm">Student {index + 1}</h4>
                            <p className="text-xs text-muted-foreground">
                              {Math.floor(Math.random() * 40 + 60)}% progress
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="h-full">
      <Card className="h-full flex flex-col">
        <CardHeader className="border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>My Classes</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {filteredClasses.length} classes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <div className="flex items-center border border-border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Join Class
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            {viewMode === "grid" ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {filteredClasses.map((cls, index) => (
                  <motion.div
                    key={cls.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-md transition-all group"
                      onClick={() => setSelectedClass(cls.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-lg ${cls.color} flex items-center justify-center`}>
                              <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3>{cls.name}</h3>
                              <Badge variant="outline" className="mt-1">{cls.code}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleStar(cls.id)
                              }}
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  starredClasses.has(cls.id)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                }`}
                              />
                            </Button>
                            <div onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleClassAction("edit", cls.name)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleClassAction("invite", cls.name)}>
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Invite Members
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleClassAction("settings", cls.name)}>
                                    <Settings className="w-4 h-4 mr-2" />
                                    Settings
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleClassAction("leave", cls.name)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Leave Class
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {cls.description}
                        </p>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Users className="w-4 h-4" />
                              {cls.memberCount} members
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <BookOpen className="w-4 h-4" />
                              {cls.studySetCount} sets
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>Class Progress</span>
                              <span>{cls.progress}%</span>
                            </div>
                            <Progress value={cls.progress} className="h-2" />
                          </div>

                          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border">
                            <span>{cls.instructor}</span>
                            <span>{cls.recentActivity}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-sm group-hover:text-primary transition-colors">
                          <span>View class</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {filteredClasses.map((cls, index) => (
                  <motion.div
                    key={cls.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-sm transition-shadow"
                      onClick={() => setSelectedClass(cls.id)}
                    >
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className={`w-10 h-10 rounded-lg ${cls.color} flex items-center justify-center shrink-0`}>
                          <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate">{cls.name}</h3>
                            <Badge variant="outline" className="shrink-0">{cls.code}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {cls.instructor} • {cls.semester}
                          </p>
                        </div>
                        <div className="flex items-center gap-6 shrink-0 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {cls.memberCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {cls.studySetCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            {cls.progress}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleStar(cls.id)
                            }}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                starredClasses.has(cls.id)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          </Button>
                          <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleClassAction("edit", cls.name)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleClassAction("invite", cls.name)}>
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  Invite Members
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleClassAction("settings", cls.name)}>
                                  <Settings className="w-4 h-4 mr-2" />
                                  Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleClassAction("leave", cls.name)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Leave Class
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {filteredClasses.length === 0 && (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No classes found</p>
                <p className="text-sm mt-2">Try adjusting your search</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}