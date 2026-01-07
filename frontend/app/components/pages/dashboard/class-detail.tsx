import { useState } from "react"
import { useParams, useNavigate } from "react-router"
import { motion } from "motion/react"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import { Badge } from "~/components/ui/badge"
import { Skeleton } from "~/components/ui/skeleton"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import {
  ArrowLeft,
  Users,
  BookOpen,
  Settings,
  Globe,
  Lock,
  Edit2,
  Save,
  X,
  UserPlus,
  Crown,
  Shield,
  Trash2,
  MoreVertical,
  Loader2,
  AlertCircle,
  Check,
  Clock,
  Plus,
  FileText,
  RefreshCw,
  BarChart3,
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
  useGetClassByIdQuery,
  useGetClassMembersQuery,
  useGetPendingRequestsQuery,
  useGetInvitationsQuery,
  useGetClassStudySetsQuery,
  useRemoveStudySetFromClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useRemoveClassMemberMutation,
  useUpdateClassMemberMutation,
  useApproveMemberMutation,
  useRejectMemberMutation,
} from "~/redux/features/class"
import {
  useGetReattemptRequestsForClassQuery,
  useUpdateReattemptRequestMutation,
  ReattemptStatus,
} from "~/redux/features/test"
import { useAppSelector } from "~/redux/store"
import { selectCurrentUser } from "~/redux/features/auth/slice"
import { ClassRole } from "~/redux/features/shared/types"
import { InviteMemberDialog } from "./invite-member-dialog"
import { AddStudySetDialog } from "./add-studyset-dialog"
import { DeleteClassDialog } from "./delete-class-dialog"
import { LeaveClassDialog } from "./leave-class-dialog"
import type { ReattemptRequest } from "~/redux/features/test"

export function ClassDetail() {
  const { classId } = useParams<{ classId: string }>()
  const navigate = useNavigate()
  const user = useAppSelector(selectCurrentUser)

  // Queries
  const {
    data: classData,
    isLoading: loadingClass,
    error: classError,
  } = useGetClassByIdQuery(classId!, { skip: !classId })

  const {
    data: membersData,
    isLoading: loadingMembers,
    error: membersError,
  } = useGetClassMembersQuery(classId!, { skip: !classId })

  // Check permissions BEFORE using in queries
  const classInfo = classData
  const members = membersData?.data || []
  
  // Find current user's role in this class
  const currentUserMember = members.find(m => m.user_id === user?.user_id)
  const userClassRole = currentUserMember?.role
  
  // Only OWNER and CO_TEACHER can manage the class
  const isOwner = classInfo?.owner_user_id === user?.user_id
  const isCoTeacher = userClassRole === 'CO_TEACHER'
  const canManage = isOwner || isCoTeacher

  const {
    data: pendingData,
    isLoading: loadingPending,
  } = useGetPendingRequestsQuery(classId!, { skip: !classId || !canManage })

  const {
    data: invitationsData,
    isLoading: loadingInvitations,
  } = useGetInvitationsQuery(classId!, { skip: !classId || !canManage })

  const {
    data: studySetsData,
    isLoading: loadingStudySets,
  } = useGetClassStudySetsQuery(classId!, { skip: !classId })

  // Mutations
  const [updateClass, { isLoading: updating }] = useUpdateClassMutation()
  const [deleteClass] = useDeleteClassMutation()
  const [removeMember] = useRemoveClassMemberMutation()
  const [updateMemberRole] = useUpdateClassMemberMutation()
  const [approveMember] = useApproveMemberMutation()
  const [rejectMember] = useRejectMemberMutation()
  const [removeStudySet] = useRemoveStudySetFromClassMutation()
  
  // Reattempt requests queries
  const {
    data: reattemptRequestsData,
    isLoading: loadingReattemptRequests,
    refetch: refetchReattemptRequests,
  } = useGetReattemptRequestsForClassQuery(
    { classId: classId!, status: ReattemptStatus.PENDING },
    { skip: !classId || !canManage }
  )
  
  const [updateReattemptRequest] = useUpdateReattemptRequestMutation()

  // Local state
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [editedDescription, setEditedDescription] = useState("")
  const [editedIsPublic, setEditedIsPublic] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [addStudySetDialogOpen, setAddStudySetDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)

  const pendingRequests = pendingData?.data || []
  const invitations = invitationsData?.data || []
  const studySets = studySetsData?.data || []
  const reattemptRequests = reattemptRequestsData?.data || []

  const handleBack = () => {
    navigate("/dashboard/class")
  }

  const handleEditStart = () => {
    if (classInfo) {
      setEditedName(classInfo.class_name)
      setEditedDescription(classInfo.description || "")
      setEditedIsPublic(classInfo.is_public)
      setIsEditing(true)
    }
  }

  const handleEditCancel = () => {
    setIsEditing(false)
  }

  const handleEditSave = async () => {
    if (!classInfo || !editedName.trim()) {
      toast.error("Class name is required")
      return
    }

    try {
      await updateClass({
        id: classInfo.class_id,
        data: {
          class_name: editedName.trim(),
          description: editedDescription.trim() || undefined,
          is_public: editedIsPublic,
        },
      }).unwrap()
      
      toast.success("Class updated successfully")
      setIsEditing(false)
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to update class")
    }
  }

  const handleDeleteClass = () => {
    setDeleteDialogOpen(true)
  }

  const confirmDeleteClass = async () => {
    if (!classInfo) return

    try {
      await deleteClass(classInfo.class_id).unwrap()
      toast.success("Class deleted successfully")
      navigate("/dashboard/class")
    } catch (error) {
      toast.error("Failed to delete class")
    }
  }

  const handleLeaveClass = () => {
    setLeaveDialogOpen(true)
  }

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!classInfo) return

    if (confirm(`Remove ${userName} from this class?`)) {
      try {
        await removeMember({ 
          classId: classInfo.class_id, 
          memberId: userId 
        }).unwrap()
        toast.success("Member removed successfully")
      } catch (error: any) {
        toast.error(error?.data?.detail || "Failed to remove member")
      }
    }
  }

  const handleChangeRole = async (userId: string, newRole: string, userName: string) => {
    if (!classInfo) return

    try {
      await updateMemberRole({
        classId: classInfo.class_id,
        memberId: userId,
        data: { role: newRole as ClassRole },
      }).unwrap()
      toast.success(`${userName}'s role updated to ${newRole}`)
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to update role")
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role.toUpperCase()) {
      case "OWNER":
        return <Crown className="w-4 h-4 text-yellow-500" />
      case "CO_TEACHER":
        return <Shield className="w-4 h-4 text-blue-500" />
      default:
        return null
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toUpperCase()) {
      case "OWNER":
        return "default"
      case "CO_TEACHER":
        return "secondary"
      default:
        return "outline"
    }
  }

  const handleApproveMember = async (userId: string, userName: string) => {
    if (!classInfo) return

    try {
      await approveMember({
        classId: classInfo.class_id,
        userId,
      }).unwrap()
      toast.success(`${userName} approved successfully`)
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to approve member")
    }
  }

  const handleRejectMember = async (userId: string, userName: string) => {
    if (!classInfo) return

    if (confirm(`Reject ${userName}'s request?`)) {
      try {
        await rejectMember({
          classId: classInfo.class_id,
          userId,
        }).unwrap()
        toast.success("Request rejected")
      } catch (error: any) {
        toast.error(error?.data?.detail || "Failed to reject request")
      }
    }
  }

  if (loadingClass) {
    return (
      <div className="h-full p-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (classError || !classInfo) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 mx-auto flex items-center justify-center">
              <X className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Class Not Found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                This class doesn't exist or you don't have access to it.
              </p>
            </div>
            <Button onClick={handleBack}>Back to Classes</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Classes
          </Button>

          <div className="flex items-center gap-2">
            {/* Analytics Button - Visible to all members */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/dashboard/class/${classId}/analytics`)}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>

            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage
                    <MoreVertical className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEditStart}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Class
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setInviteDialogOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Members
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDeleteClass}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Class
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {!canManage && (
              <Button variant="outline" size="sm" onClick={handleLeaveClass}>
                Leave Class
              </Button>
            )}
          </div>
        </div>

        {/* Class Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Class Name</label>
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        placeholder="Enter class name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        placeholder="Enter class description"
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is-public"
                        checked={editedIsPublic}
                        onChange={(e) => setEditedIsPublic(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label htmlFor="is-public" className="text-sm">
                        Make this class public
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleEditSave} disabled={updating} size="sm">
                        {updating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleEditCancel}
                        variant="outline"
                        size="sm"
                        disabled={updating}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <CardTitle className="text-2xl">{classInfo.class_name}</CardTitle>
                    {classInfo.description && (
                      <p className="text-muted-foreground mt-2">
                        {classInfo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-4">
                      <Badge variant={classInfo.is_public ? "default" : "secondary"}>
                        {classInfo.is_public ? (
                          <>
                            <Globe className="w-3 h-3 mr-1" />
                            Public
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 mr-1" />
                            Private
                          </>
                        )}
                      </Badge>
                      {classInfo.class_code && (
                        <Badge variant="outline">
                          Code: {classInfo.class_code}
                        </Badge>
                      )}
                      <Badge variant="outline">
                        <Users className="w-3 h-3 mr-1" />
                        {members.length} {members.length === 1 ? "member" : "members"}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="studysets" className="w-full">
          <TabsList className={`grid w-full ${canManage ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="studysets">
              <BookOpen className="w-4 h-4 mr-2" />
              Study Sets
            </TabsTrigger>
            <TabsTrigger value="activity">
              Activity
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="w-4 h-4 mr-2" />
              Members ({members.length})
            </TabsTrigger>
            {canManage && (
              <TabsTrigger value="pending">
                <AlertCircle className="w-4 h-4 mr-2" />
                Pending ({pendingRequests.length + invitations.length + reattemptRequests.length})
              </TabsTrigger>
            )}
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Class Members</CardTitle>
                  {canManage && (
                    <Button size="sm" onClick={() => setInviteDialogOpen(true)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loadingMembers ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No members yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <motion.div
                        key={member.user_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {member.user?.username?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {member.user?.username || "Unknown"}
                              </p>
                              {getRoleIcon(member.role)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {member.user?.email || ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={getRoleBadgeVariant(member.role)}>
                            {member.role}
                          </Badge>

                          {canManage && member.user_id !== user?.user_id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {member.role !== "OWNER" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleChangeRole(
                                          member.user_id,
                                          "CO_TEACHER",
                                          member.user?.username || "User"
                                        )
                                      }
                                    >
                                      <Shield className="w-4 h-4 mr-2" />
                                      Make Co-Teacher
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleChangeRole(
                                          member.user_id,
                                          "MEMBER",
                                          member.user?.username || "User"
                                        )
                                      }
                                    >
                                      Make Member
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleRemoveMember(
                                      member.user_id,
                                      member.user?.username || "User"
                                    )
                                  }
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Tab - Owner/Co-Teacher only */}
          {canManage && (
            <TabsContent value="pending">
              <Tabs defaultValue="join-requests" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="join-requests">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Join Requests ({pendingRequests.length})
                  </TabsTrigger>
                  <TabsTrigger value="pending-invitations">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Pending Invitations ({invitations.length})
                  </TabsTrigger>
                  <TabsTrigger value="pending-reattempts">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Pending Reattempt Test ({reattemptRequests.length})
                  </TabsTrigger>
                </TabsList>

                {/* Join Requests Sub-tab */}
                <TabsContent value="join-requests">
                  <Card>
                    <CardHeader>
                      <CardTitle>Join Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingPending ? (
                        <div className="space-y-3">
                          {[1, 2].map((i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                          ))}
                        </div>
                      ) : pendingRequests.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No pending join requests</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {pendingRequests.map((request) => (
                            <motion.div
                              key={request.user_id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback>
                                    {request.user?.username?.[0]?.toUpperCase() || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{request.user?.username || "Unknown"}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {request.user?.email || ""}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Requested {new Date(request.joined_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-orange-600">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </Badge>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleApproveMember(
                                      request.user_id,
                                      request.user?.username || "User"
                                    )
                                  }
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleRejectMember(
                                      request.user_id,
                                      request.user?.username || "User"
                                    )
                                  }
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Pending Invitations Sub-tab */}
                <TabsContent value="pending-invitations">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pending Invitations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingInvitations ? (
                        <div className="space-y-3">
                          {[1, 2].map((i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                          ))}
                        </div>
                      ) : invitations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No pending invitations</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {invitations.map((invitation) => (
                            <motion.div
                              key={invitation.user_id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback>
                                    {invitation.user?.username?.[0]?.toUpperCase() || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{invitation.user?.username || "Unknown"}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {invitation.user?.email || ""}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Invited {new Date(invitation.joined_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-blue-600">
                                  <UserPlus className="w-3 h-3 mr-1" />
                                  Invited
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleRejectMember(
                                      invitation.user_id,
                                      invitation.user?.username || "User"
                                    )
                                  }
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Pending Reattempt Test Sub-tab */}
                <TabsContent value="pending-reattempts">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pending Reattempt Test Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingReattemptRequests ? (
                        <div className="space-y-3">
                          {[1, 2].map((i) => (
                            <Skeleton key={i} className="h-24 w-full" />
                          ))}
                        </div>
                      ) : reattemptRequests.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No pending reattempt requests</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {reattemptRequests.map((request) => {
                            const requestUser = members.find(m => m.user_id === request.user_id)
                            return (
                              <motion.div
                                key={request.request_id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <Avatar>
                                        <AvatarFallback>
                                          {requestUser?.user?.username?.[0]?.toUpperCase() || "?"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium">
                                          {requestUser?.user?.username || "Unknown User"}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          {requestUser?.user?.email || ""}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {request.test_title && (
                                      <div className="ml-12 space-y-1">
                                        <div className="flex items-center gap-2">
                                          <FileText className="w-4 h-4 text-muted-foreground" />
                                          <span className="font-medium">{request.test_title}</span>
                                        </div>
                                        {request.attempt_score !== undefined && (
                                          <div className="text-sm text-muted-foreground">
                                            Điểm: {request.attempt_correct_answers}/{request.attempt_total_questions} 
                                            ({Math.round(request.attempt_score)}%)
                                          </div>
                                        )}
                                        {request.attempt_completed_at && (
                                          <div className="text-xs text-muted-foreground">
                                            Hoàn thành: {new Date(request.attempt_completed_at).toLocaleString("vi-VN")}
                                          </div>
                                        )}
                                        <div className="text-xs text-muted-foreground">
                                          Yêu cầu: {new Date(request.requested_at).toLocaleString("vi-VN")}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-orange-600">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Pending
                                    </Badge>
                                    <Button
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          await updateReattemptRequest({
                                            requestId: request.request_id,
                                            data: { status: ReattemptStatus.APPROVED },
                                          }).unwrap()
                                          toast.success("Đã phê duyệt yêu cầu làm lại test")
                                          refetchReattemptRequests()
                                        } catch (error: any) {
                                          const errorMsg = error?.data?.detail || "Không thể phê duyệt yêu cầu"
                                          toast.error(errorMsg)
                                        }
                                      }}
                                    >
                                      <Check className="w-4 h-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        try {
                                          await updateReattemptRequest({
                                            requestId: request.request_id,
                                            data: { status: ReattemptStatus.REJECTED },
                                          }).unwrap()
                                          toast.success("Đã từ chối yêu cầu làm lại test")
                                          refetchReattemptRequests()
                                        } catch (error: any) {
                                          const errorMsg = error?.data?.detail || "Không thể từ chối yêu cầu"
                                          toast.error(errorMsg)
                                        }
                                      }}
                                    >
                                      <X className="w-4 h-4 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
          )}

          {/* Study Sets Tab */}
          <TabsContent value="studysets">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Shared Study Sets</CardTitle>
                  {canManage && (
                    <Button size="sm" onClick={() => setAddStudySetDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Study Set
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loadingStudySets ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : studySets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No study sets shared yet</p>
                    {canManage && (
                      <p className="text-sm mt-2">
                        Add study sets to share with your class members
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {studySets.map((studySet: any) => (
                      <motion.div
                        key={studySet.studyset_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Card 
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => navigate(`/dashboard/studysets/${studySet.studyset_id}?classId=${classId}`)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div 
                                className="flex items-center gap-3 flex-1 min-w-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                  <BookOpen className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium truncate">{studySet.title}</h4>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {studySet.category && (
                                      <Badge variant="outline" className="text-xs">
                                        {studySet.category}
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      {studySet.content_type}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              {canManage && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    if (confirm(`Remove "${studySet.title}" from this class?`)) {
                                      try {
                                        await removeStudySet({
                                          classId: classId!,
                                          studysetId: studySet.studyset_id,
                                        }).unwrap()
                                        toast.success("Study set removed from class")
                                      } catch (error) {
                                        toast.error("Failed to remove study set")
                                      }
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            
                            {studySet.description && (
                              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                                {studySet.description}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No recent activity
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        classId={classId!}
        className={classInfo.class_name}
      />

      <DeleteClassDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        className={classInfo.class_name}
        onConfirm={confirmDeleteClass}
      />

      <LeaveClassDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        className={classInfo.class_name}
        isPublic={classInfo.is_public}
        onConfirm={() => {
          // Leave class logic
          navigate("/dashboard/class")
        }}
      />

      {/* Add Study Set Dialog */}
      <AddStudySetDialog
        open={addStudySetDialogOpen}
        onOpenChange={setAddStudySetDialogOpen}
        classId={classId!}
      />
    </div>
  )
}

