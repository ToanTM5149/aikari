import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"
import { Logo } from "~/components/ui/logo"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"
import { ScrollArea } from "~/components/ui/scroll-area"
import { toast } from "sonner"
import { useRegisterMutation } from "~/redux/features/auth/api"
import { useAppSelector } from "~/redux/store"
import { selectAuthError } from "~/redux/features/auth/slice"

interface SignupPageProps {
  onSignup: (data?: { 
    username: string; 
    email: string; 
    fullName?: string;
    schoolName?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    sex?: string;
    dateOfBirth?: string;
    phone?: string;
    userType?: string;
  }) => void
  onSwitchToLogin: () => void
}

export function SignupPage({ onSignup, onSwitchToLogin }: SignupPageProps) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "",
    fullName: "",
    schoolName: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    sex: "",
    dateOfBirth: "",
    phone: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [step, setStep] = useState(1)
  
  const [register, { isLoading }] = useRegisterMutation()
  const authError = useAppSelector(selectAuthError)

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match!")
      return
    }

    if (!formData.userType) {
      toast.error("Please select your role!")
      return
    }
    
    try {
      // Prepare data for API - include optional step 2 fields if provided
      const registerData: any = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.userType === 'teacher' ? 'TEACHER' : 'STUDENT',
      }
      
      // Add optional fields if provided
      if (formData.fullName) registerData.full_name = formData.fullName
      if (formData.phone) registerData.phone_numbers = formData.phone
      if (formData.address) registerData.address = formData.address
      if (formData.city) registerData.city = formData.city
      if (formData.state) registerData.country = formData.state // Using state as country
      
      const result = await register(registerData).unwrap()
      
      toast.success("Account created successfully! Welcome aboard!")
      
      // Pass user data to parent
      onSignup({
        username: result.user.username,
        email: result.user.email,
        fullName: result.user.full_name,
        address: result.user.address || undefined,
        city: result.user.city || undefined,
        state: result.user.country || undefined,
        phone: result.user.phone_numbers || undefined,
        userType: result.user.role,
      })
    } catch (error: any) {
      const errorMessage = error?.data?.detail || authError || "Registration failed. Please try again."
      toast.error(errorMessage)
    }
  }

  const canProceedToStep2 = formData.username && formData.email && formData.password && 
    formData.confirmPassword && formData.userType && formData.password === formData.confirmPassword

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
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
            <CardTitle className="text-2xl">Create Your Account</CardTitle>
            <CardDescription>
              Join our learning community today
            </CardDescription>
            
            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-2 pt-4">
              <div className={`h-2 w-20 rounded-full transition-all ${
                step >= 1 ? 'bg-primary' : 'bg-muted'
              }`} />
              <div className={`h-2 w-20 rounded-full transition-all ${
                step >= 2 ? 'bg-primary' : 'bg-muted'
              }`} />
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Step {step} of 2
            </p>
          </CardHeader>
          
          <ScrollArea className="max-h-[500px]">
            <CardContent className="px-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {step === 1 ? (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="username">Username *</Label>
                        <Input
                          id="username"
                          type="text"
                          placeholder="Choose a username"
                          value={formData.username}
                          onChange={(e) => handleChange("username", e.target.value)}
                          required
                          className="bg-input-background"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={formData.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          required
                          className="bg-input-background"
                        />
                      </motion.div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="userType">I am a *</Label>
                      <Select 
                        value={formData.userType} 
                        onValueChange={(value) => handleChange("userType", value)} 
                        required
                      >
                        <SelectTrigger id="userType" className="bg-input-background">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="password">Password *</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={(e) => handleChange("password", e.target.value)}
                            required
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
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={(e) => handleChange("confirmPassword", e.target.value)}
                            required
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
                      </motion.div>
                    </div>

                    {formData.password && formData.confirmPassword && 
                     formData.password !== formData.confirmPassword && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-destructive"
                      >
                        Passwords don't match
                      </motion.p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="John Doe"
                          value={formData.fullName}
                          onChange={(e) => handleChange("fullName", e.target.value)}
                          className="bg-input-background"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="schoolName">School Name</Label>
                        <Input
                          id="schoolName"
                          type="text"
                          placeholder="Your school name"
                          value={formData.schoolName}
                          onChange={(e) => handleChange("schoolName", e.target.value)}
                          className="bg-input-background"
                        />
                      </motion.div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        type="text"
                        placeholder="Street address"
                        value={formData.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                        className="bg-input-background"
                      />
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          type="text"
                          placeholder="City"
                          value={formData.city}
                          onChange={(e) => handleChange("city", e.target.value)}
                          className="bg-input-background"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          type="text"
                          placeholder="State"
                          value={formData.state}
                          onChange={(e) => handleChange("state", e.target.value)}
                          className="bg-input-background"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="zipCode">Zip Code</Label>
                        <Input
                          id="zipCode"
                          type="text"
                          placeholder="Zip"
                          value={formData.zipCode}
                          onChange={(e) => handleChange("zipCode", e.target.value)}
                          className="bg-input-background"
                        />
                      </motion.div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="sex">Gender</Label>
                        <Select 
                          value={formData.sex} 
                          onValueChange={(value) => handleChange("sex", value)}
                        >
                          <SelectTrigger id="sex" className="bg-input-background">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                          className="bg-input-background"
                        />
                      </motion.div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(123) 456-7890"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        className="bg-input-background"
                      />
                    </motion.div>
                  </motion.div>
                )}
              </form>
            </CardContent>
          </ScrollArea>

          <CardFooter className="flex flex-col space-y-4 px-6 pb-6">
            <div className="flex gap-3 w-full">
              {step === 2 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              
              {step === 1 ? (
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!canProceedToStep2}
                  className="flex-1"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                    />
                  ) : (
                    "Create Account"
                  )}
                </Button>
              )}
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={onSwitchToLogin}
                className="text-primary hover:underline"
              >
                Sign in
              </button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
