import { useNavigate } from "react-router"
import { HomePage } from "~/components/pages/dashboard/home-page"

export default function HomePageRoute() {
  const navigate = useNavigate()

  const handleStudySetClick = () => {
    navigate("/flashcard")
  }

  return <HomePage onStudySetClick={handleStudySetClick} />
}
