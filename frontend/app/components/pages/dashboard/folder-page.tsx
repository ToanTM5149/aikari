import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Input } from "~/components/ui/input"
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
} from "~/components/ui/dropdown-menu"
import { toast } from "sonner"
import { folders } from "~/data"

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
