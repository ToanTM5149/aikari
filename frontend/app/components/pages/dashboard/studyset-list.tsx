import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useNavigate } from "react-router"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Input } from "~/components/ui/input"
import {
  BookOpen,
  Search,
  MoreVertical,
  Grid,
  List,
  Plus,
  Edit,
  Trash2,
  Clock,
  FileText,
  Layers,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { toast } from "sonner"
import { 
  useGetStudySetsQuery, 
  useDeleteStudySetMutation 
} from "~/redux/features/studyset"
import { CreateStudySetDialog } from "./create-studyset-dialog"
import { Skeleton } from "~/components/ui/skeleton"

export function StudySetList() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // API calls
  const { data, isLoading, error } = useGetStudySetsQuery()
  const [deleteStudySet] = useDeleteStudySetMutation()

  const studySets = data?.data || []

  // Filter studysets based on search
  const filteredStudySets = studySets.filter(set =>
    set.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    set.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle delete
  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Delete "${title}"? This action cannot be undone.`)) {
      try {
        await deleteStudySet(id).unwrap()
        toast.success("Study set deleted successfully")
      } catch (error) {
        toast.error("Failed to delete study set")
      }
    }
  }

  // Handle navigate to detail
  const handleViewDetail = (id: string) => {
    navigate(`/dashboard/studysets/${id}`)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full">
        <Card className="h-full flex flex-col">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    const isUnauthorized = 'status' in error && error.status === 401;
    
    return (
      <div className="h-full">
        <Card className="h-full flex items-center justify-center">
          <CardContent className="text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-2">
              {isUnauthorized ? "Please login to continue" : "Failed to load study sets"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {isUnauthorized 
                ? "Your session has expired. Please login again." 
                : "Please check if the backend server is running."}
            </p>
            {isUnauthorized ? (
              <Button onClick={() => navigate('/auth/login')}>
                Go to Login
              </Button>
            ) : (
              <Button onClick={() => window.location.reload()}>Refresh</Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full">
      <Card className="h-full flex flex-col">
        <CardHeader className="border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>My Study Sets</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {filteredStudySets.length} study set{filteredStudySets.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Study Set
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search study sets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto p-6">
          {filteredStudySets.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                {searchQuery ? (
                  <>
                    <p>No study sets found</p>
                    <p className="text-sm mt-2">Try adjusting your search</p>
                  </>
                ) : (
                  <>
                    <p>No study sets yet</p>
                    <p className="text-sm mt-2">Create your first study set to get started</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => setCreateDialogOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Study Set
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {viewMode === "grid" ? (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {filteredStudySets.map((studySet, index) => (
                    <motion.div
                      key={studySet.studyset_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className="cursor-pointer hover:shadow-md transition-all group"
                        onClick={() => handleViewDetail(studySet.studyset_id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Layers className="w-5 h-5 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold truncate">{studySet.title}</h3>
                                <Badge variant="outline" className="mt-1">
                                  {studySet.content_type}
                                </Badge>
                              </div>
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => handleViewDetail(studySet.studyset_id)}
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(studySet.studyset_id, studySet.title)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {studySet.description && (
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {studySet.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(studySet.created_at).toLocaleDateString()}
                            </span>
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
                  {filteredStudySets.map((studySet, index) => (
                    <motion.div
                      key={studySet.studyset_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className="cursor-pointer hover:shadow-sm transition-shadow"
                        onClick={() => handleViewDetail(studySet.studyset_id)}
                      >
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Layers className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold truncate">{studySet.title}</h3>
                              <Badge variant="outline" className="shrink-0">
                                {studySet.content_type}
                              </Badge>
                            </div>
                            {studySet.description && (
                              <p className="text-sm text-muted-foreground truncate">
                                {studySet.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-4 shrink-0 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(studySet.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => handleViewDetail(studySet.studyset_id)}
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(studySet.studyset_id, studySet.title)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <CreateStudySetDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}

