import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useNavigate } from "react-router"
import { useDebounce } from "~/hooks/useDebounce"
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
  Play,
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
import { useAppSelector } from "~/redux/store"
import { selectCurrentUser } from "~/redux/features/auth/slice"
import { CreateStudySetDialog } from "./create-studyset-dialog"
import { Skeleton } from "~/components/ui/skeleton"
import { DataPagination } from "~/components/common/data-pagination"
import { CategoryFilter } from "~/components/category-filter"
import { StudySetCard } from "~/components/shared/studyset-card"
import type { StudySet } from "~/redux/features/shared/types"

export function StudySetList() {
  const navigate = useNavigate()
  const user = useAppSelector(selectCurrentUser)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingStudySet, setEditingStudySet] = useState<StudySet | null>(null)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(9)

  // Debounce search query với 500ms delay
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Reset to page 1 when debounced search changes or category changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchQuery, selectedCategory])

  // API calls with pagination and search
  const { data, isLoading, isFetching, error } = useGetStudySetsQuery({
    skip: (currentPage - 1) * itemsPerPage,
    limit: itemsPerPage,
    q: debouncedSearchQuery || undefined,  // Send debounced search query to backend
    category_id: selectedCategory,
  })
  const [deleteStudySet] = useDeleteStudySetMutation()

  const studySets = data?.data || []
  const totalItems = data?.count || 0
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // No need for client-side filtering anymore - backend handles it
  const filteredStudySets = studySets

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
              <Button onClick={() => navigate('/login')}>
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
              <Button size="sm" onClick={() => {
                setDialogMode("create")
                setEditingStudySet(null)
                setCreateDialogOpen(true)
              }}>
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
          
          {/* Category Filter */}
          <div className="mt-3">
            <CategoryFilter
              value={selectedCategory}
              onChange={setSelectedCategory}
            />
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto p-6 relative">
          {/* Loading overlay khi đang fetch data mới (chuyển trang) */}
          {isFetching && !isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          )}
          
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
                      onClick={() => {
                        setDialogMode("create")
                        setEditingStudySet(null)
                        setCreateDialogOpen(true)
                      }}
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
                    <StudySetCard
                      key={studySet.studyset_id}
                      studySet={studySet}
                      variant="default"
                      showProgress={true}
                      animationDelay={index * 0.05}
                      currentUserId={user?.user_id}
                      showActions={true}
                      onEdit={(studySet) => {
                        setEditingStudySet(studySet)
                        setDialogMode("edit")
                        setCreateDialogOpen(true)
                      }}
                      onDelete={() => handleDelete(studySet.studyset_id, studySet.title)}
                    />
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
                    <StudySetCard
                      key={studySet.studyset_id}
                      studySet={studySet}
                      variant="compact"
                      animationDelay={index * 0.05}
                      currentUserId={user?.user_id}
                      showActions={true}
                      onEdit={(studySet) => {
                        setEditingStudySet(studySet)
                        setDialogMode("edit")
                        setCreateDialogOpen(true)
                      }}
                      onDelete={() => handleDelete(studySet.studyset_id, studySet.title)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Pagination */}
          {filteredStudySets.length > 0 && totalPages > 1 && (
            <div className="mt-6">
              <DataPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <CreateStudySetDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        studySet={editingStudySet}
        mode={dialogMode}
      />
    </div>
  )
}

