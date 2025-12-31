import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import {
  Folder,
  FolderPlus,
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
  ChevronRight,
  Plus,
  Filter
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { toast } from "sonner"

const folders = [
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

interface FolderPageProps {
  onStudySetClick?: () => void
}

export function FolderPage({ onStudySetClick }: FolderPageProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null)
  const [starredFolders, setStarredFolders] = useState<Set<number>>(
    new Set(folders.filter(f => f.isStarred).map(f => f.id))
  )

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    folder.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleStar = (folderId: number) => {
    const newStarred = new Set(starredFolders)
    if (newStarred.has(folderId)) {
      newStarred.delete(folderId)
      toast.success("Removed from favorites")
    } else {
      newStarred.add(folderId)
      toast.success("Added to favorites")
    }
    setStarredFolders(newStarred)
  }

  const handleFolderAction = (action: string, folderName: string) => {
    switch (action) {
      case "edit":
        toast.success(`Editing "${folderName}"`)
        break
      case "share":
        toast.success(`Sharing "${folderName}"`)
        break
      case "delete":
        toast.error(`Deleted "${folderName}"`)
        break
    }
  }

  if (selectedFolder !== null) {
    const folder = folders.find(f => f.id === selectedFolder)
    if (!folder) return null

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="h-full"
      >
        <Card className="h-full flex flex-col">
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFolder(null)}
              >
                ← Back
              </Button>
              <div className={`w-12 h-12 rounded-lg ${folder.color} flex items-center justify-center`}>
                <Folder className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle>{folder.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{folder.description}</p>
              </div>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Set
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-6">
            <div className="space-y-4">
              {folder.studySets.map((set, index) => (
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
                          <span>Progress</span>
                          <span>{set.progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <motion.div
                            className="bg-primary rounded-full h-2"
                            initial={{ width: 0 }}
                            animate={{ width: `${set.progress}%` }}
                            transition={{ delay: index * 0.05 + 0.2, duration: 0.8 }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
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
                <Folder className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>My Folders</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {filteredFolders.length} folders
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
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search folders..."
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
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filteredFolders.map((folder, index) => (
                  <motion.div
                    key={folder.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-md transition-all group"
                      onClick={() => setSelectedFolder(folder.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-12 h-12 rounded-lg ${folder.color} flex items-center justify-center`}>
                            <Folder className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleStar(folder.id)
                              }}
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  starredFolders.has(folder.id)
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
                                  <DropdownMenuItem onClick={() => handleFolderAction("edit", folder.name)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleFolderAction("share", folder.name)}>
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Share
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleFolderAction("delete", folder.name)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="line-clamp-1">{folder.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {folder.description}
                          </p>
                          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {folder.itemCount} sets
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {folder.lastModified}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-sm group-hover:text-primary transition-colors">
                          <span>View folder</span>
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
                {filteredFolders.map((folder, index) => (
                  <motion.div
                    key={folder.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-sm transition-shadow"
                      onClick={() => setSelectedFolder(folder.id)}
                    >
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className={`w-10 h-10 rounded-lg ${folder.color} flex items-center justify-center shrink-0`}>
                          <Folder className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="truncate">{folder.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {folder.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-6 shrink-0 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {folder.itemCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {folder.lastModified}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleStar(folder.id)
                            }}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                starredFolders.has(folder.id)
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
                                <DropdownMenuItem onClick={() => handleFolderAction("edit", folder.name)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFolderAction("share", folder.name)}>
                                  <Share2 className="w-4 h-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleFolderAction("delete", folder.name)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
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

          {filteredFolders.length === 0 && (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No folders found</p>
                <p className="text-sm mt-2">Try adjusting your search</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
