import { useNavigate } from "react-router"
import { LoginPage } from "~/components/pages/auth/login"

export function loader() {
  return null
}

export default function LoginRoute() {
  const navigate = useNavigate()

  const handleLogin = (data?: any) => {
    const userRole = data?.userType?.toUpperCase()
    if (userRole === 'ADMIN') {
      navigate("/statistics")
    } else {
      navigate("/dashboard")
    }
  }

  const handleSwitchToSignup = () => {
    navigate("/signup")
  }

  const handleSwitchToForgotPassword = () => {
    navigate("/forgot-password")
  }

  return (
    <LoginPage
      onLogin={handleLogin}
      onSwitchToSignup={handleSwitchToSignup}
      onSwitchToForgotPassword={handleSwitchToForgotPassword}
    />
  )
}