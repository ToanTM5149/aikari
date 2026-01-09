import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Logo } from "~/components/ui/logo"
import { Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useResetPasswordMutation } from "~/redux/features/auth/api"
import { useAppSelector } from "~/redux/store"
import { selectAuthError } from "~/redux/features/auth/slice"
import { useNavigate } from "react-router"

interface ResetPasswordPageProps {
  token?: string
}

export function ResetPasswordPage({ token: tokenProp }: ResetPasswordPageProps) {
  const [token, setToken] = useState(tokenProp || "")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordReset, setPasswordReset] = useState(false)
  
  const [resetPassword, { isLoading }] = useResetPasswordMutation()
  const authError = useAppSelector(selectAuthError)
  const navigate = useNavigate()

  // Lấy token từ URL query params nếu không có trong props
  useEffect(() => {
    if (!token) {
      const params = new URLSearchParams(window.location.search)
      const tokenFromUrl = params.get("token")
      if (tokenFromUrl) {
        setToken(tokenFromUrl)
      }
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      toast.error("Invalid token. Please check the link in your email.")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.")
      return
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.")
      return
    }
    
    try {
      await resetPassword({ token, new_password: password }).unwrap()
      
      toast.success("Password reset successful!")
      setPasswordReset(true)
      
      // Redirect to login sau 2 giây
      setTimeout(() => {
        navigate("/login")
      }, 2000)
    } catch (error: any) {
      const errorMessage = error?.data?.detail || authError || "Failed to reset password. Please try again."
      toast.error(errorMessage)
    }
  }

  if (passwordReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0">
            <CardHeader className="space-y-1 text-center pb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex justify-center mb-4"
              >
                <Logo size="lg" showText={false} />
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="flex justify-center mb-4"
              >
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </motion.div>
              <CardTitle className="text-2xl">Password Reset Successful!</CardTitle>
              <CardDescription>
                Your password has been updated. You can now log in.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground text-center">
                <p>Redirecting to login page...</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => navigate("/auth/login")}
                className="w-full"
              >
                Go to Login
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0">
            <CardHeader className="space-y-1 text-center pb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex justify-center mb-4"
              >
                <Logo size="lg" showText={false} />
              </motion.div>
              <CardTitle className="text-2xl">Invalid Token</CardTitle>
              <CardDescription>
                The password reset link is invalid or has expired
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground text-center space-y-2">
                <p>Please request a new password reset link.</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                onClick={() => navigate("/forgot-password")}
                className="w-full"
              >
                Request New Link
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/auth/login")}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-1 text-center pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-4"
            >
              <Logo size="lg" showText={false} />
            </motion.div>
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              Enter your new password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password (minimum 8 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="bg-input-background pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="bg-input-background pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-sm text-destructive">Passwords do not match</p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || password !== confirmPassword || password.length < 8}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                    />
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>
          <CardFooter>
            <Button
              variant="ghost"
              onClick={() => navigate("/auth/login")}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại đăng nhập
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

