import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { motion } from "motion/react"
import { 
  BookOpen, 
  Folder, 
  GraduationCap, 
  Star, 
  Clock, 
  Users, 
  TrendingUp,
  Play,
  Eye,
  Bell,
  Zap,
} from "lucide-react"
import { useGetStudySetsQuery } from "~/redux/features/studyset/api"
import { useGetClassesQuery } from "~/redux/features/class/api"
import { useGetAllDueCardsQuery } from "~/redux/features/learning"
import { useMemo } from "react"
import { useNavigate } from "react-router"
import { StudySetCard } from "~/components/shared/studyset-card"
import { DueCardsBadge } from "~/components/shared/due-cards-badge"
import { useAppSelector } from "~/redux/store"
import { selectCurrentUser } from "~/redux/features/auth/slice"

interface HomePageProps {
  onStudySetClick: () => void
}

export function HomePage({ onStudySetClick }: HomePageProps) {
  const navigate = useNavigate()
  const user = useAppSelector(selectCurrentUser)
  
  // Fetch all studysets and classes
  const { data: studysetsData, isLoading: studysetsLoading } = useGetStudySetsQuery()
  const { data: classesData, isLoading: classesLoading } = useGetClassesQuery()
  const { data: dueCards } = useGetAllDueCardsQuery({ includeFuture: false })

  // Process data
  const recentStudySets = useMemo(() => {
    if (!studysetsData?.data) return []
    // Sort by last_activity_at descending and take top 3
    return [...studysetsData.data]
      .filter(set => set.last_activity_at)
      .sort((a, b) => {
        const dateA = new Date(a.last_activity_at || 0).getTime()
        const dateB = new Date(b.last_activity_at || 0).getTime()
        return dateB - dateA
      })
      .slice(0, 3)
  }, [studysetsData])

  const recommendedStudySets = useMemo(() => {
    if (!studysetsData?.data) return []
    // Get studysets without recent activity (not in recent list) and take 3
    const recentIds = new Set(recentStudySets.map(s => s.studyset_id))
    return studysetsData.data
      .filter(set => !recentIds.has(set.studyset_id))
      .slice(0, 3)
  }, [studysetsData, recentStudySets])

  const recommendedClasses = useMemo(() => {
    if (!classesData?.data) return []
    // Take first 3 classes
    return classesData.data.slice(0, 3)
  }, [classesData])

  // Helper to format date
  const formatLastStudied = (dateString?: string | null) => {
    if (!dateString) return "Not started"
    // Parse datetime string as UTC if no timezone indicator
    // Backend returns naive datetime (UTC) without timezone info
    // Check if string has timezone indicator (Z, +HH:MM, or -HH:MM after position 10)
    const hasTimezone = dateString.includes('Z') || 
      (dateString.includes('+') && dateString.length > 19) ||
      (dateString.lastIndexOf('-') > 10) // Timezone offset like -05:00
    const date = hasTimezone
      ? new Date(dateString)
      : new Date(dateString + 'Z') // Append 'Z' to treat as UTC
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMinutes < 1) return "Just now"
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays === 1) return "1 day ago"
    return `${diffDays} days ago`
  }

  const isLoading = studysetsLoading || classesLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your study materials...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      {/* Welcome & Due Cards Alert */}
      <div>
        {/* Due Cards Alert */}
        {dueCards && dueCards.total_due > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-primary bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {dueCards.total_due} Card{dueCards.total_due !== 1 ? 's' : ''} Ready for Review!
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Keep your streak going • {dueCards.studysets_affected.length} study set{dueCards.studysets_affected.length !== 1 ? 's' : ''} affected
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => navigate("/dashboard/quick-review")} size="lg">
                    <Zap className="w-4 h-4 mr-2" />
                    Start Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Recent Study Sets */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Study Sets
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/studysets")}>View All</Button>
        </div>
        {recentStudySets.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No recent study sets. Start studying to see them here!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentStudySets.map((set, index) => (
              <StudySetCard
                key={set.studyset_id}
                studySet={set}
                variant="recent"
                showProgress={true}
                animationDelay={index * 0.1}
                currentUserId={user?.user_id}
                showActions={false}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recommended Study Sets */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recommended for You
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/studysets")}>Explore More</Button>
        </div>
        {recommendedStudySets.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No recommendations yet. Create more study sets to see suggestions!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedStudySets.map((set, index) => (
              <StudySetCard
                key={set.studyset_id}
                studySet={set}
                variant="default"
                animationDelay={0.4 + index * 0.1}
                currentUserId={user?.user_id}
                showActions={false}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recommended Classes */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Your Classes
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/class")}>Manage</Button>
        </div>
        {recommendedClasses.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">You haven't joined any classes yet. Join or create a class to get started!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {recommendedClasses.map((classItem, index) => (
              <motion.div
                key={classItem.class_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => navigate(`/dashboard/class/${classItem.class_id}`)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{classItem.class_name}</h3>
                      {classItem.description && (
                        <p className="text-sm text-muted-foreground">{classItem.description}</p>
                      )}
                    </div>
                    <Badge variant="default">class</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
