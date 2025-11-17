import { useNavigate } from "react-router"
import { SignupPage } from "~/components/page/auth/SignupPage"

export function loader() {
  return null
}

export default function SignupRoute() {
  const navigate = useNavigate()

  const handleSignup = (data?: any) => {
    console.log("Signup data:", data)
    // Navigate to home or dashboard after signup
    navigate("/")
  }

  const handleSwitchToLogin = () => {
    navigate("/login")
  }

  return (
    <SignupPage
      onSignup={handleSignup}
      onSwitchToLogin={handleSwitchToLogin}
    />
  )
}
