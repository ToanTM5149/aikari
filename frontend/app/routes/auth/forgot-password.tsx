import { useNavigate } from "react-router"
import { ForgotPasswordPage } from "~/components/pages/auth/forgot-password"

export function loader() {
  return null
}

export default function ForgotPasswordRoute() {
  const navigate = useNavigate()

  const handleBackToLogin = () => {
    navigate("/auth/login")
  }

  return (
    <ForgotPasswordPage onBackToLogin={handleBackToLogin} />
  )
}
