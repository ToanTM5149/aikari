import { useNavigate } from "react-router"
import { LoginPage } from "~/pages/auth/login"

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
    navigate("/signup")
  }

  return (
    <LoginPage
      onLogin={handleLogin}
      onSwitchToSignup={handleSwitchToSignup}
    />
  )
}