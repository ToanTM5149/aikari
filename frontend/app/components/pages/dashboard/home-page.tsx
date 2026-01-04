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
  Eye
} from "lucide-react"
import { useGetStudySetsQuery } from "~/redux/features/studyset/api"
import { useGetClassesQuery } from "~/redux/features/class/api"
import { useMemo } from "react"
import { useNavigate } from "react-router"

interface HomePageProps {
  onStudySetClick: () => void
}

export function HomePage({ onStudySetClick }: HomePageProps) {
  const navigate = useNavigate()
  
  // Fetch all studysets and classes
  const { data: studysetsData, isLoading: studysetsLoading } = useGetStudySetsQuery()
  const { data: classesData, isLoading: classesLoading } = useGetClassesQuery()

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
              <motion.div
                key={set.studyset_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onStudySetClick}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{set.title}</CardTitle>
                      <Badge variant="secondary">{set.content_type}</Badge>
                    </div>
                    {set.description && (
                      <p className="text-sm text-muted-foreground">{set.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {set.term_count || 0} cards
                        </span>
                        <span className="text-muted-foreground">{formatLastStudied(set.last_activity_at)}</span>
                      </div>
                      {set.progress !== undefined && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span>{set.progress}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <motion.div 
                              className="bg-primary rounded-full h-2"
                              initial={{ width: 0 }}
                              animate={{ width: `${set.progress}%` }}
                              transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                            />
                          </div>
                        </div>
                      )}
                      <Button 
                        className="w-full" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/dashboard/studysets/${set.studyset_id}/study`)
                        }}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {set.last_activity_at ? 'Continue Studying' : 'Start Learning'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
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
              <motion.div
                key={set.studyset_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onStudySetClick}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{set.title}</CardTitle>
                    {set.description && (
                      <p className="text-sm text-muted-foreground">{set.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {set.term_count || 0} cards
                        </span>
                        <Badge variant="secondary">{set.content_type}</Badge>
                      </div>
                      <Button 
                        className="w-full" 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/dashboard/studysets/${set.studyset_id}/study`)
                        }}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Studying
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
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
