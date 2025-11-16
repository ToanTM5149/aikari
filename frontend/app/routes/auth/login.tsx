import { useState } from "react"
import { useNavigate } from "react-router"
import { LoginPage } from "~/components/auth/LoginPage"
import { SignupPage } from "~/components/auth/SignupPage"

export function loader() {
  return null
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const navigate = useNavigate()

  const handleLogin = (data?: any) => {
    console.log("Login data:", data)
    // Navigate to home or dashboard after login
    navigate("/")
  }

  const handleSignup = (data?: any) => {
    console.log("Signup data:", data)
    // Navigate to home or dashboard after signup
    navigate("/")
  }

  return (
    <>
      {isLogin ? (
        <LoginPage
          onLogin={handleLogin}
          onSwitchToSignup={() => setIsLogin(false)}
        />
      ) : (
        <SignupPage
          onSignup={handleSignup}
          onSwitchToLogin={() => setIsLogin(true)}
        />
      )}
    </>
  )
}