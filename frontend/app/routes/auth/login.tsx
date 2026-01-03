import { useNavigate } from "react-router"
import { LoginPage } from "~/components/pages/auth/login"

export function loader() {
  return null
}

export default function LoginRoute() {
  const navigate = useNavigate()

  const handleLogin = (data?: any) => {
    console.log("Login data:", data)
    
    // Role-based redirect after login
    const userRole = data?.userType?.toUpperCase()
    if (userRole === 'ADMIN') {
      // Admin chỉ có 3 sections: Statistics, User Management, Token Management
      navigate("/statistics")
    } else {
      // Student/Teacher redirect đến dashboard/home
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