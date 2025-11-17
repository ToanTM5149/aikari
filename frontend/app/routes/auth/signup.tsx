import { useNavigate } from "react-router"
import { SignupPage } from "~/pages/auth/signup"

export function loader() {
  return null
}

export default function SignupRoute() {
  const navigate = useNavigate()

  const handleSignup = (data?: any) => {
    console.log("Signup data:", data)
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
