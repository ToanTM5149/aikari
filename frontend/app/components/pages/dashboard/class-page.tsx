import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useNavigate } from "react-router"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { Input } from "~/components/ui/input"
import { Skeleton } from "~/components/ui/skeleton"
import {
  GraduationCap,
  Users,
  BookOpen,
  Search,
  MoreVertical,
  Grid,
  List,
  Star,
  Trash2,
  Edit,
  Settings,
  UserPlus,
  Plus,
  Filter,
  LogOut,
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
  useDeleteClassMutation,
  useLeaveClassMutation,
} from "~/redux/features/class"
import { CreateClassDialog } from "./create-class-dialog"
import { JoinClassDialog } from "./join-class-dialog"
import { InviteMemberDialog } from "./invite-member-dialog"

interface ClassPageProps {
  onStudySetClick?: () => void
  onStatisticsClick?: (className: string) => void
}

export function ClassPage({ onStudySetClick, onStatisticsClick }: ClassPageProps) {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<{
    id: string
    name: string
  } | null>(null)

  // API calls
  const { data, isLoading, error } = useGetClassesQuery()
  const [deleteClass] = useDeleteClassMutation()
  const [leaveClass] = useLeaveClassMutation()

  const classes = data?.data || []

  // Filter classes based on search
  const filteredClasses = classes.filter(cls =>
    cls.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.class_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.created_by.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteClass = async (classId: string, className: string) => {
    if (confirm(`Delete "${className}"? This action cannot be undone.`)) {
      try {
        await deleteClass(classId).unwrap()
        toast.success("Class deleted successfully")
      } catch (error) {
        toast.error("Failed to delete class")
      }
    }
  }

  const handleLeaveClass = async (classId: string, className: string) => {
    if (confirm(`Leave "${className}"? You can rejoin later if it's public.`)) {
      try {
        await leaveClass(classId).unwrap()
        toast.success("You have left the class")
      } catch (error: any) {
        toast.error(error?.data?.detail || "Failed to leave class")
      }
    }
  }

  const handleInviteMember = (classId: string, className: string) => {
    setSelectedClass({ id: classId, name: className })
    setInviteDialogOpen(true)
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
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
    return (
      <div className="h-full">
        <Card className="h-full flex items-center justify-center">
          <CardContent className="text-center">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-2">Failed to load classes</p>
            <p className="text-sm text-muted-foreground mb-4">
              Please check if the backend server is running.
            </p>
            <Button onClick={() => window.location.reload()}>Refresh</Button>
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
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>My Classes</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {filteredClasses.length} class{filteredClasses.length !== 1 ? 'es' : ''}
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
              <Button size="sm" variant="outline" onClick={() => setJoinDialogOpen(true)}>
                <Search className="w-4 h-4 mr-2" />
                Join Class
              </Button>
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Class
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
          {filteredClasses.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                {searchQuery ? (
                  <>
                    <p>No classes found</p>
                    <p className="text-sm mt-2">Try adjusting your search</p>
                  </>
                ) : (
                  <>
                    <p>No classes yet</p>
                    <p className="text-sm mt-2">Create a class or join an existing one</p>
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Class
                      </Button>
                      <Button variant="outline" onClick={() => setJoinDialogOpen(true)}>
                        <Search className="w-4 h-4 mr-2" />
                        Join Class
                      </Button>
                    </div>
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
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {filteredClasses.map((cls, index) => (
                    <motion.div
                      key={cls.class_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className="cursor-pointer hover:shadow-md transition-all group"
                        onClick={() => navigate(`/dashboard/class/${cls.class_id}`)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <GraduationCap className="w-6 h-6 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold truncate">{cls.class_name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  {cls.class_code && (
                                    <Badge variant="outline">{cls.class_code}</Badge>
                                  )}
                                  {cls.is_public && (
                                    <Badge variant="secondary">Public</Badge>
                                  )}
                                </div>
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
                                  <DropdownMenuItem
                                    onClick={() => handleLeaveClass(cls.class_id, cls.class_name)}
                                  >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Leave Class
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteClass(cls.class_id, cls.class_name)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {cls.description && (
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {cls.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border">
                            <span>Instructor: {cls.created_by}</span>
                            <span>{new Date(cls.created_at).toLocaleDateString()}</span>
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
                      key={cls.class_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className="cursor-pointer hover:shadow-sm transition-shadow"
                        onClick={() => navigate(`/dashboard/class/${cls.class_id}`)}
                      >
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <GraduationCap className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold truncate">{cls.class_name}</h3>
                              {cls.class_code && (
                                <Badge variant="outline" className="shrink-0">
                                  {cls.class_code}
                                </Badge>
                              )}
                              {cls.is_public && (
                                <Badge variant="secondary" className="shrink-0">Public</Badge>
                              )}
                            </div>
                            {cls.description && (
                              <p className="text-sm text-muted-foreground truncate">
                                {cls.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-4 shrink-0 text-sm text-muted-foreground">
                            <span>{cls.created_by}</span>
                            <span>{new Date(cls.created_at).toLocaleDateString()}</span>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
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
                                <DropdownMenuItem
                                  onClick={() => handleLeaveClass(cls.class_id, cls.class_name)}
                                >
                                  <LogOut className="w-4 h-4 mr-2" />
                                  Leave Class
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClass(cls.class_id, cls.class_name)}
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

      {/* Dialogs */}
      <CreateClassDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <JoinClassDialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen} />
      {selectedClass && (
        <InviteMemberDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          classId={selectedClass.id}
          className={selectedClass.name}
        />
      )}
    </div>
  )
}
