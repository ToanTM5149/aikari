import { useNavigate } from "react-router"
import { LoginPage } from "~/components/page/auth/LoginPage"

export function loader() {
  return null
}

export default function LoginRoute() {
  const navigate = useNavigate()

  const handleLogin = (data?: any) => {
    console.log("Login data:", data)
    // Navigate to home or dashboard after login
    navigate("/")
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