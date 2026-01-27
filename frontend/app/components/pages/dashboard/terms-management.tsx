import { useState, useEffect, useMemo } from "react"
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
  Plus,
  Edit,
  Trash2,
  Layers,
  Filter,
  X,
  Eye,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { toast } from "sonner"
import { 
  useGetAllTermsQuery,
  useGetStudySetsQuery,
  useCreateTermMutation,
  useUpdateTermMutation,
  useDeleteTermMutation,
} from "~/redux/features/studyset"
import { useAppSelector } from "~/redux/store"
import { selectCurrentUser } from "~/redux/features/auth/slice"
import { Skeleton } from "~/components/ui/skeleton"
import { DataPagination } from "~/components/common/data-pagination"
import { TermEditDialog } from "~/components/shared/term-edit-dialog"
import type { Term, TermCreate, TermUpdate, StudySet } from "~/redux/features/shared/types"

export function TermsManagement() {
  const navigate = useNavigate()
  const user = useAppSelector(selectCurrentUser)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudysetId, setSelectedStudysetId] = useState<string | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  
  // Track previous query params to detect when we're fetching new data
  const [prevQueryKey, setPrevQueryKey] = useState<string>("")
  
  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedStudysetForCreate, setSelectedStudysetForCreate] = useState<string>("")

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchQuery, selectedStudysetId])

  // Get user's studysets for filter dropdown
  const { data: studysetsData } = useGetStudySetsQuery({ limit: 1000 })

  // Get all terms
  const { 
    data: termsData, 
    isLoading, 
    isFetching, 
    error,
    refetch 
  } = useGetAllTermsQuery(
    {
      skip: (currentPage - 1) * itemsPerPage,
      limit: itemsPerPage,
      studysetId: selectedStudysetId,
      q: debouncedSearchQuery || undefined,
    }
  )

  // Mutations
  const [createTerm, { isLoading: creating }] = useCreateTermMutation()
  const [updateTerm, { isLoading: updating }] = useUpdateTermMutation()
  const [deleteTerm, { isLoading: deleting }] = useDeleteTermMutation()

  // Create query key to detect when params change
  const currentQueryKey = `${currentPage}-${selectedStudysetId}-${debouncedSearchQuery}`
  const isFetchingNewData = isFetching && currentQueryKey !== prevQueryKey
  
  // Update prevQueryKey when data is loaded
  useEffect(() => {
    if (!isFetching && termsData) {
      setPrevQueryKey(currentQueryKey)
    }
  }, [isFetching, termsData, currentQueryKey])
  
  const terms = termsData?.data || []
  const totalCount = termsData?.count || 0
  const totalPages = Math.ceil(totalCount / itemsPerPage)
  
  // Show loading skeleton when fetching new data (different page/filter)
  const shouldShowLoading = isFetchingNewData || (isLoading && terms.length === 0)

  // Get studyset name by ID
  const getStudysetName = (studysetId: string) => {
    const studyset = studysetsData?.data?.find(s => s.studyset_id === studysetId)
    return studyset?.title || "Unknown"
  }

  // Handle create term
  const handleCreateTerm = async (data: { studysetId: string; data: TermCreate }) => {
    return createTerm(data).unwrap()
  }

  // Handle update term
  const handleUpdateTerm = async (data: { studysetId: string; termId: string; data: TermUpdate }) => {
    return updateTerm(data).unwrap()
  }

  // Handle delete
  const handleDelete = async () => {
    if (!selectedTerm) return

    try {
      await deleteTerm({
        studysetId: selectedTerm.studyset_id,
        termId: selectedTerm.term_id,
      }).unwrap()
      toast.success("Term deleted successfully")
      setDeleteDialogOpen(false)
      setSelectedTerm(null)
      refetch()
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to delete term")
    }
  }

  // Open detail page
  const openDetailPage = (term: Term) => {
    navigate(`/terms/${term.term_id}`)
  }

  // Open edit page
  const openEditDialog = (term: Term) => {
    navigate(`/terms/${term.term_id}/edit`)
  }

  // Check if user is owner of studyset
  const isOwnerOfStudyset = (studysetId: string | null | undefined) => {
    if (!studysetId || !user?.user_id || !studysetsData?.data) return false
    const studyset = studysetsData.data.find(ss => ss.studyset_id === studysetId)
    return studyset?.owner_id === user.user_id
  }

  // Open create dialog
  const openCreateDialog = () => {
    if (!studysetsData?.data || studysetsData.data.length === 0) {
      toast.error("Please create a study set first")
      return
    }
    // If only one studyset, use it directly
    if (studysetsData.data.length === 1) {
      setSelectedStudysetForCreate(studysetsData.data[0].studyset_id)
      setCreateDialogOpen(true)
    } else {
      // Show studyset selector first
      setSelectedStudysetForCreate("")
      setCreateDialogOpen(true)
    }
  }

  // Open delete dialog
  const openDeleteDialog = (term: Term) => {
    setSelectedTerm(term)
    setDeleteDialogOpen(true)
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full p-6">
        <Card className="h-full">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="h-full p-6">
        <Card className="h-full flex items-center justify-center">
          <CardContent className="text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-2">Failed to load terms</p>
            <Button onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full p-6">
      <Card className="h-full flex flex-col">
        <CardHeader className="border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-2xl font-bold">Terms Management</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage all your terms across study sets
              </p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create Term
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedStudysetId || "all"}
              onValueChange={(value) => setSelectedStudysetId(value === "all" ? undefined : value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by study set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Study Sets</SelectItem>
                {studysetsData?.data?.map((ss) => (
                  <SelectItem key={ss.studyset_id} value={ss.studyset_id}>
                    {ss.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStudysetId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedStudysetId(undefined)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto p-6 relative">
          {/* Show loading skeleton when fetching new data */}
          {shouldShowLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="h-6 bg-muted animate-pulse rounded w-1/3"></div>
                    <div className="h-4 bg-muted animate-pulse rounded w-full"></div>
                    <div className="h-4 bg-muted animate-pulse rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : terms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium mb-2">No terms found</p>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || selectedStudysetId
                  ? "Try adjusting your filters"
                  : "Create your first term to get started"}
              </p>
              {!searchQuery && !selectedStudysetId && (
                <Button onClick={openCreateDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Term
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4" key={`terms-list-${currentPage}-${selectedStudysetId}-${debouncedSearchQuery}`}>
                {terms.map((term) => (
                    <motion.div
                      key={term.term_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{term.term_text}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {getStudysetName(term.studyset_id)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {term.definition}
                          </p>
                          {term.example && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              Example: {term.example}
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetailPage(term)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Detail
                            </DropdownMenuItem>
                            {isOwnerOfStudyset(term.studyset_id) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openEditDialog(term)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(term)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <DataPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalCount}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Term Dialog */}
      {!selectedStudysetForCreate ? (
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Study Set</DialogTitle>
              <DialogDescription>
                Choose a study set to add the new term to
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Select
                value={selectedStudysetForCreate}
                onValueChange={(value) => {
                  setSelectedStudysetForCreate(value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a study set" />
                </SelectTrigger>
                <SelectContent>
                  {studysetsData?.data?.map((ss) => (
                    <SelectItem key={ss.studyset_id} value={ss.studyset_id}>
                      {ss.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <TermEditDialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open)
            if (!open) {
              setSelectedStudysetForCreate("")
            }
          }}
          mode="create"
          studysetId={selectedStudysetForCreate}
          onCreateTerm={handleCreateTerm}
          isCreating={creating}
          onSuccess={() => {
            refetch()
            setSelectedStudysetForCreate("")
            setCreateDialogOpen(false)
          }}
        />
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Term</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTerm?.term_text}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
