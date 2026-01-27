import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useNavigate } from "react-router"
import { useDebounce } from "~/hooks/useDebounce"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Input } from "~/components/ui/input"
import { Skeleton } from "~/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import {
  GraduationCap,
  Search,
  MoreVertical,
  Grid,
  List,
  Trash2,
  Edit,
  Settings,
  UserPlus,
  Plus,
  LogOut,
  Globe,
  Lock,
  Users,
  BookOpen,
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
  useGetClassesQuery,
  useGetPublicClassesQuery,
  useDeleteClassMutation,
  useLeaveClassMutation,
  useJoinClassMutation,
} from "~/redux/features/class"
import { useAppSelector } from "~/redux/store"
import { selectCurrentUser } from "~/redux/features/auth/slice"
import { CreateClassDialog } from "./create-class-dialog"
import { InviteMemberDialog } from "./invite-member-dialog"
import { DeleteClassDialog } from "./delete-class-dialog"
import { LeaveClassDialog } from "./leave-class-dialog"
import { DataPagination } from "~/components/common/data-pagination"

interface ClassPageProps {
  onStudySetClick?: () => void
  onStatisticsClick?: (className: string) => void
}

export function ClassPage({ onStudySetClick, onStatisticsClick }: ClassPageProps) {
  const navigate = useNavigate()
  const user = useAppSelector(selectCurrentUser)
  const userRole = user?.role?.toUpperCase() || 'STUDENT'
  
  // Only TEACHER and ADMIN can create classes
  const canCreateClass = userRole === 'TEACHER' || userRole === 'ADMIN'
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [myClassesSearch, setMyClassesSearch] = useState("")
  const [publicClassesSearch, setPublicClassesSearch] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<{
    id: string
    name: string
    isPublic?: boolean
  } | null>(null)
  
  // Pagination state for My Classes
  const [myClassesPage, setMyClassesPage] = useState(1)
  const [myClassesPerPage, setMyClassesPerPage] = useState(4)
  
  // Pagination state for Public Classes
  const [publicClassesPage, setPublicClassesPage] = useState(1)
  const [publicClassesPerPage, setPublicClassesPerPage] = useState(4)

  // Debounce search queries với 500ms delay
  const debouncedMyClassesSearch = useDebounce(myClassesSearch, 500)
  const debouncedPublicClassesSearch = useDebounce(publicClassesSearch, 500)

  // Reset to page 1 when debounced search changes
  useEffect(() => {
    setMyClassesPage(1)
  }, [debouncedMyClassesSearch])

  useEffect(() => {
    setPublicClassesPage(1)
  }, [debouncedPublicClassesSearch])

  // API calls with pagination and search
  const { data: myClassesData, isLoading: isLoadingMy, error: errorMy } = useGetClassesQuery({
    skip: (myClassesPage - 1) * myClassesPerPage,
    limit: myClassesPerPage,
    q: debouncedMyClassesSearch || undefined,  // Send debounced search query to backend
  })
  const { data: publicClassesData, isLoading: isLoadingPublic, error: errorPublic } = useGetPublicClassesQuery({
    skip: (publicClassesPage - 1) * publicClassesPerPage,
    limit: publicClassesPerPage,
    q: debouncedPublicClassesSearch || undefined,  // Send debounced search query to backend
  })
  const [deleteClass, { isLoading: isDeleting }] = useDeleteClassMutation()
  const [leaveClass, { isLoading: isLeaving }] = useLeaveClassMutation()
  const [joinClass, { isLoading: isJoining }] = useJoinClassMutation()

  const myClasses = myClassesData?.data || []
  const myClassesTotal = myClassesData?.count || 0
  const myClassesTotalPages = Math.ceil(myClassesTotal / myClassesPerPage)
  
  const publicClasses = publicClassesData?.data || []
  const publicClassesTotal = publicClassesData?.count || 0
  const publicClassesTotalPages = Math.ceil(publicClassesTotal / publicClassesPerPage)

  // No need for client-side filtering anymore - backend handles it
  const filteredMyClasses = myClasses
  const filteredPublicClasses = publicClasses

  // Check if user is already member of a class
  const isAlreadyMember = (classId: string) => {
    return myClasses.some(c => c.class_id === classId)
  }

  const handleDeleteClass = async (classId: string, className: string) => {
    setSelectedClass({ id: classId, name: className })
    setDeleteDialogOpen(true)
  }

  const confirmDeleteClass = async () => {
    if (!selectedClass) return
    
    try {
      await deleteClass(selectedClass.id).unwrap()
      toast.success("Class deleted successfully")
      setDeleteDialogOpen(false)
      setSelectedClass(null)
    } catch (error) {
      toast.error("Failed to delete class")
    }
  }

  const handleLeaveClass = async (classId: string, className: string, isPublic: boolean) => {
    setSelectedClass({ id: classId, name: className, isPublic })
    setLeaveDialogOpen(true)
  }

  const confirmLeaveClass = async () => {
    if (!selectedClass) return
    
    try {
      await leaveClass(selectedClass.id).unwrap()
      toast.success("You have left the class")
      setLeaveDialogOpen(false)
      setSelectedClass(null)
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to leave class")
    }
  }

  const handleJoinClass = async (classId: string, className: string) => {
    try {
      await joinClass(classId).unwrap()
      toast.success(`Successfully joined "${className}"!`)
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to join class")
    }
  }

  const handleInviteMember = (classId: string, className: string) => {
    setSelectedClass({ id: classId, name: className })
    setInviteDialogOpen(true)
  }

  const renderClassCard = (cls: any, isMyClass: boolean) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="cursor-pointer hover:shadow-lg transition-all group overflow-hidden"
        onClick={() => navigate(`/classes/${cls.class_id}`)}
      >
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-14 h-14 rounded-lg bg-blue-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-lg truncate">{cls.class_name}</h3>
                {cls.class_code && (
                  <p className="text-sm text-muted-foreground">{cls.class_code}</p>
                )}
              </div>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              {isMyClass ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canCreateClass && (
                      <>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleInviteMember(cls.class_id, cls.class_name)}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Invite Members
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleLeaveClass(cls.class_id, cls.class_name, cls.is_public)}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Leave Class
                    </DropdownMenuItem>
                    {canCreateClass && (
                      <DropdownMenuItem
                        onClick={() => handleDeleteClass(cls.class_id, cls.class_name)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleJoinClass(cls.class_id, cls.class_name)
                  }}
                  disabled={isJoining || isAlreadyMember(cls.class_id)}
                >
                  {isAlreadyMember(cls.class_id) ? "Joined" : "Join"}
                </Button>
              )}
            </div>
          </div>

          {/* Description */}
          {cls.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {cls.description}
            </p>
          )}

          {/* Class Stats */}
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" />
              {cls.member_count ?? 0} {cls.member_count === 1 ? 'member' : 'members'}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <BookOpen className="w-4 h-4" />
              {cls.studyset_count ?? 0} {cls.studyset_count === 1 ? 'set' : 'sets'}
            </span>
            {cls.is_public ? (
              <Badge variant="secondary" className="text-xs">
                <Globe className="w-3 h-3 mr-1" />
                Public
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                <Lock className="w-3 h-3 mr-1" />
                Private
              </Badge>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t text-sm">
            <span className="text-muted-foreground">Dr. {cls.created_by}</span>
            <span className="text-muted-foreground">Active today</span>
          </div>

          {/* View Class Link */}
          <Button 
            variant="ghost" 
            className="w-full justify-between hover:bg-muted/50"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/classes/${cls.class_id}`)
            }}
          >
            View class
            <span className="text-xl">›</span>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )

  const renderEmptyState = (isMyClass: boolean, searchQuery: string) => (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      <div className="text-center">
        <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
        {searchQuery ? (
          <>
            <p>No classes found</p>
            <p className="text-sm mt-2">Try adjusting your search</p>
          </>
        ) : isMyClass ? (
          <>
            <p>No classes yet</p>
            <p className="text-sm mt-2">
              {canCreateClass 
                ? "Create a class or join an existing one"
                : "Join a public class to get started"}
            </p>
            {canCreateClass && (
              <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Class
              </Button>
            )}
          </>
        ) : (
          <>
            <p>No public classes available</p>
            <p className="text-sm mt-2">Check back later or create your own class</p>
          </>
                              )}
                            </div>
                </div>
    )

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
                <CardTitle>Classes</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage and browse classes
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
              {canCreateClass && (
                <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                  Create Class
              </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <Tabs defaultValue="my-classes" className="h-full flex flex-col">
            <TabsList className="mx-6 mt-6 grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="my-classes">
                My Classes ({myClassesTotal})
              </TabsTrigger>
              <TabsTrigger value="public-classes">
                Public Classes ({publicClassesTotal})
              </TabsTrigger>
            </TabsList>

            {/* My Classes Tab */}
            <TabsContent value="my-classes" className="flex-1 overflow-hidden flex flex-col m-0 p-6">
              <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
                  placeholder="Search my classes..."
                  value={myClassesSearch}
                  onChange={(e) => setMyClassesSearch(e.target.value)}
              className="pl-10"
            />
          </div>

              <div className="flex-1 overflow-auto">
                {isLoadingMy ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-48 w-full" />
                    ))}
                  </div>
                ) : errorMy ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-destructive">Failed to load classes</p>
                  </div>
                ) : filteredMyClasses.length === 0 ? (
                  renderEmptyState(true, myClassesSearch)
                ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                    className={viewMode === "grid" 
                      ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                      : "space-y-2"
                    }
                  >
                    {filteredMyClasses.map((cls, index) => (
                  <motion.div
                        key={cls.class_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                        {renderClassCard(cls, true)}
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
              
              {/* My Classes Pagination */}
              {filteredMyClasses.length > 0 && myClassesTotalPages > 1 && (
                <div className="mt-4">
                  <DataPagination
                    currentPage={myClassesPage}
                    totalPages={myClassesTotalPages}
                    totalItems={myClassesTotal}
                    itemsPerPage={myClassesPerPage}
                    onPageChange={(page) => {
                      setMyClassesPage(page)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  />
                </div>
              )}
            </TabsContent>

            {/* Public Classes Tab */}
            <TabsContent value="public-classes" className="flex-1 overflow-hidden flex flex-col m-0 p-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search public classes..."
                  value={publicClassesSearch}
                  onChange={(e) => setPublicClassesSearch(e.target.value)}
                  className="pl-10"
                />
                        </div>

              <div className="flex-1 overflow-auto">
                {isLoadingPublic ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-48 w-full" />
                    ))}
                          </div>
                ) : errorPublic ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-destructive">Failed to load public classes</p>
                            </div>
                ) : filteredPublicClasses.length === 0 ? (
                  renderEmptyState(false, publicClassesSearch)
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                    className={viewMode === "grid" 
                      ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                      : "space-y-2"
                    }
                  >
                    {filteredPublicClasses.map((cls, index) => (
                      <motion.div
                        key={cls.class_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {renderClassCard(cls, false)}
                  </motion.div>
                ))}
              </motion.div>
            )}
              </div>
              
              {/* Public Classes Pagination */}
              {filteredPublicClasses.length > 0 && publicClassesTotalPages > 1 && (
                <div className="mt-4">
                  <DataPagination
                    currentPage={publicClassesPage}
                    totalPages={publicClassesTotalPages}
                    totalItems={publicClassesTotal}
                    itemsPerPage={publicClassesPerPage}
                    onPageChange={(page) => {
                      setPublicClassesPage(page)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateClassDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      {selectedClass && (
        <InviteMemberDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          classId={selectedClass.id}
          className={selectedClass.name}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      {selectedClass && (
        <DeleteClassDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          className={selectedClass.name}
          onConfirm={confirmDeleteClass}
          isDeleting={isDeleting}
        />
      )}
      
      {/* Leave Confirmation Dialog */}
      {selectedClass && (
        <LeaveClassDialog
          open={leaveDialogOpen}
          onOpenChange={setLeaveDialogOpen}
          className={selectedClass.name}
          isPublic={selectedClass.isPublic || false}
          onConfirm={confirmLeaveClass}
          isLeaving={isLeaving}
        />
      )}
    </div>
  )
}
