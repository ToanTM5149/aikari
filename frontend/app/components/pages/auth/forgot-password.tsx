import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Logo } from "~/components/ui/logo"
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { useForgotPasswordMutation } from "~/redux/features/auth/api"
import { useAppSelector } from "~/redux/store"
import { selectAuthError } from "~/redux/features/auth/slice"

interface ForgotPasswordPageProps {
  onBackToLogin: () => void
}

export function ForgotPasswordPage({ onBackToLogin }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState("")
  const [emailSent, setEmailSent] = useState(false)
  
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation()
  const authError = useAppSelector(selectAuthError)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await forgotPassword({ email }).unwrap()
      
      toast.success("Email sent! Please check your inbox.");
      setEmailSent(true)
    } catch (error: any) {
      const errorMessage = error?.data?.detail || authError || "Failed to send email. Please try again."
      toast.error(errorMessage)
    }
  }

  if (emailSent) {
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
              <CardTitle className="text-2xl">Email Sent!</CardTitle>
              <CardDescription>
                We have sent a password reset link to <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground text-center space-y-2">
                <p>Please check your inbox and follow the instructions in the email.</p>
                <p>The link will expire after 48 hours.</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                variant="outline"
                onClick={onBackToLogin}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Didn't receive the email?{" "}
                <button
                  onClick={() => setEmailSent(false)}
                  className="text-primary hover:underline"
                >
                  Resend
                </button>
              </div>
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
            <CardTitle className="text-2xl">Forgot Password?</CardTitle>
            <CardDescription>
              Enter your email and we will send you a password reset link
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
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-input-background pl-10"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                    />
                  ) : (
                    "Send Password Reset Email"
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              variant="ghost"
              onClick={onBackToLogin}
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

