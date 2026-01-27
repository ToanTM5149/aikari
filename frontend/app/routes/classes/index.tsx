import { useNavigate } from "react-router"
import { ClassPage } from "~/components/pages/dashboard/class-page"
import { useAppSelector } from "~/redux/store"
import { selectCurrentUser } from "~/redux/features/auth/slice"

export default function ClassPageRoute() {
  const navigate = useNavigate()
  const user = useAppSelector(selectCurrentUser)

  const handleStudySetClick = () => {
    navigate("/common/flashcard")
  }

  const handleStatisticsClick = (className: string) => {
    navigate(`/classes/${encodeURIComponent(className)}/statistics`)
  }

  return (
    <ClassPage 
      onStudySetClick={handleStudySetClick}
      onStatisticsClick={handleStatisticsClick}
      userRole={user?.role as 'STUDENT' | 'TEACHER' | 'ADMIN' || 'STUDENT'}
    />
  )
}
