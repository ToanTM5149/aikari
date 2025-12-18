import { useNavigate } from "react-router"
import { ClassPage } from "~/components/pages/dashboard/class-page"

export default function ClassPageRoute() {
  const navigate = useNavigate()

  const handleStudySetClick = () => {
    navigate("/dashboard/flashcard")
  }

  const handleStatisticsClick = (className: string) => {
    navigate(`/dashboard/class/${encodeURIComponent(className)}/statistics`)
  }

  return (
    <ClassPage 
      onStudySetClick={handleStudySetClick}
      onStatisticsClick={handleStatisticsClick}
    />
  )
}
