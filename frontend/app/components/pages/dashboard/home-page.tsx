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
import { useMemo } from "react"
import { useNavigate } from "react-router"
import { StudySetCard } from "~/components/shared/studyset-card"
import { useAppSelector } from "~/redux/store"
import { selectCurrentUser } from "~/redux/features/auth/slice"
import { formatLastStudiedFull } from "~/utils/date"

interface HomePageProps {
  onStudySetClick: () => void
}

export function HomePage({ onStudySetClick }: HomePageProps) {
  const navigate = useNavigate()
  const user = useAppSelector(selectCurrentUser)
  
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
