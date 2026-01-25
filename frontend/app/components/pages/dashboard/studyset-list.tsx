import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useNavigate } from "react-router"
import { useDebounce } from "~/hooks/useDebounce"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Input } from "~/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs"
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
  UserPlus,
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
import {
  useGetMyEnrolledStudysetsQuery,
} from "~/redux/features/enrollment"
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
  const [activeTab, setActiveTab] = useState<"created" | "enrolled">("created")

  // Debounce search query với 500ms delay
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Reset to page 1 when debounced search changes, category changes, or tab changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchQuery, selectedCategory, activeTab])

  // API calls - fetch created studysets
  const { 
    data: createdData, 
    isLoading: isLoadingCreated, 
    isFetching: isFetchingCreated, 
    error: createdError 
  } = useGetStudySetsQuery(
    {
      skip: activeTab === "enrolled" ? 0 : (currentPage - 1) * itemsPerPage,
      limit: activeTab === "enrolled" ? 1000 : itemsPerPage,
      q: debouncedSearchQuery || undefined,
      category_id: selectedCategory,
    },
    { skip: activeTab === "enrolled" } // Skip if on enrolled tab
  )

  // API calls - fetch enrolled studysets
  const { 
    data: enrolledData, 
    isLoading: isLoadingEnrolled, 
    isFetching: isFetchingEnrolled, 
    error: enrolledError 
  } = useGetMyEnrolledStudysetsQuery(
    {
      skip: activeTab === "created" ? 0 : (currentPage - 1) * itemsPerPage,
      limit: activeTab === "created" ? 1000 : itemsPerPage,
      q: activeTab === "enrolled" ? (debouncedSearchQuery || undefined) : undefined,
      category_id: activeTab === "enrolled" ? selectedCategory : undefined,
      sort_by: "last_studied_at",
      sort_order: "desc",
    },
    { skip: activeTab === "created" } // Skip if on created tab
  )

  const [deleteStudySet] = useDeleteStudySetMutation()

  // Transform enrolled studysets to match StudySet format
  const enrolledStudySets = useMemo(() => {
    if (!enrolledData?.data) return []
    return enrolledData.data.map((enrolled) => ({
      studyset_id: enrolled.studyset_id,
      title: enrolled.title,
      description: enrolled.description,
      content_type: enrolled.content_type as any,
      category_id: enrolled.category_id,
      owner_id: enrolled.owner_id,
      created_at: enrolled.created_at,
      updated_at: enrolled.updated_at,
      term_count: enrolled.term_count || 0, // Use term_count from API
      last_activity_at: enrolled.last_studied_at,
      progress: 0, // Will be fetched separately if needed
      // Add enrollment metadata
      enrolled_at: enrolled.enrolled_at,
      last_studied_at: enrolled.last_studied_at,
      is_enrolled: true,
    }))
  }, [enrolledData])

  const createdStudySets = createdData?.data || []

  // Filter and paginate based on active tab
  const { studySets, totalItems, totalPages } = useMemo(() => {
    let allSets: any[] = []
    let total = 0

    if (activeTab === "created") {
      // Show created studysets
      allSets = createdStudySets
      total = createdData?.count || 0
    } else {
      // Show enrolled studysets (include all, even owned ones)
      // This shows all studysets the user has enrolled in, regardless of ownership
      // Search and filtering are now handled server-side via API
      allSets = enrolledStudySets
      total = enrolledData?.count || 0
    }

    const pages = Math.ceil(total / itemsPerPage)

    return {
      studySets: allSets,
      totalItems: total,
      totalPages: pages,
    }
  }, [
    activeTab,
    createdStudySets,
    enrolledStudySets,
    createdData?.count,
    debouncedSearchQuery,
    selectedCategory,
    currentPage,
    itemsPerPage,
  ])

  const isLoading = activeTab === "created" ? isLoadingCreated : isLoadingEnrolled
  const isFetching = activeTab === "created" ? isFetchingCreated : isFetchingEnrolled
  const error = activeTab === "created" ? createdError : enrolledError

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
                  {studySets.length} study set{studySets.length !== 1 ? 's' : ''}
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
          
          {/* Tabs to filter by type */}
          <div className="mt-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList>
                <TabsTrigger value="created">
                  <BookOpen className="w-4 h-4 mr-2" />
                  My Created
                </TabsTrigger>
                <TabsTrigger value="enrolled">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Enrolled
                </TabsTrigger>
              </TabsList>
            </Tabs>
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
          
          {studySets.length === 0 ? (
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
                  {studySets.map((studySet, index) => (
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
                  {studySets.map((studySet, index) => (
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
          {studySets.length > 0 && totalPages > 1 && (
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

