import { useNavigate } from "react-router"
import { LoginPage } from "~/components/pages/auth/login"

export function loader() {
  return null
}

export default function LoginRoute() {
  const navigate = useNavigate()

  const handleLogin = (data?: any) => {
    console.log("Login data:", data)
    // Navigate to dashboard after successful login
    navigate("/dashboard")
  }

  const handleSwitchToSignup = () => {
    navigate("/auth/signup")
  }

  const handleSwitchToForgotPassword = () => {
    navigate("/auth/forgot-password")
  }

  return (
    <LoginPage
      onLogin={handleLogin}
      onSwitchToSignup={handleSwitchToSignup}
      onSwitchToForgotPassword={handleSwitchToForgotPassword}
    />
  )
}