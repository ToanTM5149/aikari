import { useNavigate, useParams } from "react-router"
import { ClassStatistics } from "~/components/pages/dashboard/class-statistics"

export default function ClassStatisticsRoute() {
  const navigate = useNavigate()
  const params = useParams()
  
  const handleBack = () => {
    navigate("/dashboard/class")
  }

  // Decode className if it was encoded
  const className = params.className ? decodeURIComponent(params.className) : undefined

  return (
    <ClassStatistics 
      className={className}
      onBack={handleBack}
    />
  )
}
