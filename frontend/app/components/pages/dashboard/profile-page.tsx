import { useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Avatar, AvatarFallback } from "~/components/ui/avatar"
import { Separator } from "~/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import {
  User,
  Mail,
  MapPin,
  Phone,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Edit2,
  Save,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { useUpdateMeMutation, useUpdatePasswordMutation } from "~/redux/features/auth/api"
import { useGetCurrentUserQuery } from "~/redux/features/user/api"

// Move InfoRow outside component to prevent re-creation on every render
interface InfoRowProps {
  icon: any
  label: string
  value?: string
  fieldName?: string
  isEditMode?: boolean
  formData?: Record<string, string>
  onInputChange?: (fieldName: string, value: string) => void
}

const InfoRow = ({ icon: Icon, label, value, fieldName, isEditMode, formData, onInputChange }: InfoRowProps) => {
  if (isEditMode && fieldName && formData && onInputChange) {
    const isDateField = fieldName === "date_of_birth"
    const inputValue = formData[fieldName] || ""
    // For date input, format value as YYYY-MM-DD
    const displayValue = isDateField && inputValue 
      ? inputValue.includes('T') 
        ? inputValue.split('T')[0] 
        : inputValue.split(' ')[0]
      : inputValue
    
    return (
      <div className="flex items-start gap-4 py-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-1">
          <Label htmlFor={fieldName} className="text-sm text-muted-foreground">
            {label}
          </Label>
          <Input
            id={fieldName}
            type={isDateField ? "date" : "text"}
            value={displayValue}
            onChange={(e) => onInputChange(fieldName, e.target.value)}
            placeholder={isDateField ? "Select date" : `Enter ${label.toLowerCase()}`}
          />
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex items-start gap-4 py-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-foreground">{value || "Not provided"}</p>
      </div>
    </div>
  )
}

interface ProfilePageProps {
  userData: {
    name: string
    email: string
    username: string
    fullName?: string
    schoolName?: string
    address?: string
    city?: string
    state?: string
    zipCode?: string
    sex?: string
    dateOfBirth?: string
    phone?: string
    userType?: string
  }
}

export function ProfilePage({ userData }: ProfilePageProps) {
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  
  // Form data for editing profile
  const [formData, setFormData] = useState({
    full_name: userData.fullName || "",
    email: userData.email || "",
    phone_numbers: userData.phone || "",
    address: userData.address || "",
    city: userData.city || "",
    country: userData.state || "", // Using state as country for now
    zip_code: userData.zipCode || "",
    date_of_birth: userData.dateOfBirth || "",
    gender: userData.sex || "",
    school_name: userData.schoolName || "",
  })
  
  // RTK Query mutations
  const [updateMe, { isLoading: isUpdating }] = useUpdateMeMutation()
  const [updatePassword, { isLoading: isUpdatingPassword }] = useUpdatePasswordMutation()
  const { refetch: refetchUser } = useGetCurrentUserQuery()
  
  // Sync formData with userData when userData changes (after successful update)
  // Only sync when NOT in edit mode to avoid resetting user input
  useEffect(() => {
    if (!isEditMode) {
      setFormData({
        full_name: userData.fullName || "",
        email: userData.email || "",
        phone_numbers: userData.phone || "",
        address: userData.address || "",
        city: userData.city || "",
        country: userData.state || "",
        zip_code: userData.zipCode || "",
        date_of_birth: userData.dateOfBirth || "",
        gender: userData.sex || "",
        school_name: userData.schoolName || "",
      })
    }
  }, [userData.fullName, userData.email, userData.phone, userData.address, userData.city, userData.state, userData.zipCode, userData.dateOfBirth, userData.sex, userData.schoolName, isEditMode])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match!")
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters!")
      return
    }

    try {
      await updatePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      }).unwrap()
      
      toast.success("Password updated successfully!")
      setIsResetPasswordOpen(false)
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to update password")
    }
  }
  
  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit - reset form data
      setFormData({
        full_name: userData.fullName || "",
        email: userData.email || "",
        phone_numbers: userData.phone || "",
        address: userData.address || "",
        city: userData.city || "",
        country: userData.state || "",
        zip_code: userData.zipCode || "",
        date_of_birth: userData.dateOfBirth || "",
        gender: userData.sex || "",
        school_name: userData.schoolName || "",
      })
    }
    setIsEditMode(!isEditMode)
  }
  
  const handleSaveProfile = async () => {
    try {
      // Prepare update data with direct fields
      const updateData: any = {}
      if (formData.full_name) updateData.full_name = formData.full_name
      if (formData.email) updateData.email = formData.email
      if (formData.phone_numbers) updateData.phone_numbers = formData.phone_numbers
      if (formData.address) updateData.address = formData.address
      if (formData.city) updateData.city = formData.city
      if (formData.country) updateData.country = formData.country
      
      // Store additional fields in preferences JSONB
      const preferences: any = {}
      if (formData.zip_code) preferences.zip_code = formData.zip_code
      if (formData.date_of_birth) preferences.date_of_birth = formData.date_of_birth
      if (formData.gender) preferences.gender = formData.gender
      if (formData.school_name) preferences.school_name = formData.school_name
      
      // Only add preferences if there are any
      if (Object.keys(preferences).length > 0) {
        updateData.preferences = preferences
      }
      
      await updateMe(updateData).unwrap()
      
      toast.success("Profile updated successfully!")
      setIsEditMode(false)
      
      // Refresh user data by refetching
      await refetchUser()
      
      // The useEffect will sync formData when userData updates
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to update profile")
    }
  }

  // Memoize handleInputChange to prevent unnecessary re-renders
  const handleInputChange = useCallback((fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
  }, [])

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader className="text-center pb-4">
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                >
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {getInitials(userData.name)}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
                <div>
                  <CardTitle className="text-2xl">{userData.fullName || userData.name}</CardTitle>
                  <CardDescription className="mt-1">@{userData.username}</CardDescription>
                  {userData.userType && (
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                        {userData.userType.charAt(0).toUpperCase() + userData.userType.slice(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Your personal details and contact information</CardDescription>
              </div>
              <div className="flex gap-2">
                {isEditMode ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditToggle}
                      disabled={isUpdating}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2"
                        />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditToggle}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow 
                icon={User} 
                label="Full Name" 
                value={userData.fullName || userData.name}
                fieldName="full_name"
                isEditMode={isEditMode}
                formData={formData}
                onInputChange={handleInputChange}
              />
              <Separator />
              <InfoRow 
                icon={Mail} 
                label="Email Address" 
                value={userData.email}
                fieldName="email"
                isEditMode={isEditMode}
                formData={formData}
                onInputChange={handleInputChange}
              />
              <Separator />
              <InfoRow 
                icon={Phone} 
                label="Phone Number" 
                value={userData.phone}
                fieldName="phone_numbers"
                isEditMode={isEditMode}
                formData={formData}
                onInputChange={handleInputChange}
              />
              <Separator />
              <InfoRow 
                icon={Calendar} 
                label="Date of Birth" 
                value={userData.dateOfBirth 
                  ? (() => {
                      try {
                        const date = new Date(userData.dateOfBirth);
                        return isNaN(date.getTime()) ? userData.dateOfBirth : date.toLocaleDateString();
                      } catch {
                        return userData.dateOfBirth;
                      }
                    })()
                  : undefined}
                fieldName="date_of_birth"
                isEditMode={isEditMode}
                formData={formData}
                onInputChange={handleInputChange}
              />
              <Separator />
              <InfoRow 
                icon={User} 
                label="Gender" 
                value={userData.sex ? userData.sex.charAt(0).toUpperCase() + userData.sex.slice(1).replace(/-/g, ' ') : undefined}
                fieldName="gender"
                isEditMode={isEditMode}
                formData={formData}
                onInputChange={handleInputChange}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Address Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Address & Location</CardTitle>
              <CardDescription>Your residential and school information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow 
                icon={MapPin} 
                label="Street Address" 
                value={userData.address}
                fieldName="address"
                isEditMode={isEditMode}
                formData={formData}
                onInputChange={handleInputChange}
              />
              <Separator />
              <InfoRow 
                icon={MapPin} 
                label="City" 
                value={userData.city}
                fieldName="city"
                isEditMode={isEditMode}
                formData={formData}
                onInputChange={handleInputChange}
              />
              <Separator />
              <InfoRow 
                icon={MapPin} 
                label="State/Country" 
                value={userData.state}
                fieldName="country"
                isEditMode={isEditMode}
                formData={formData}
                onInputChange={handleInputChange}
              />
              <Separator />
              <InfoRow 
                icon={MapPin} 
                label="Zip Code" 
                value={userData.zipCode}
                fieldName="zip_code"
                isEditMode={isEditMode}
                formData={formData}
                onInputChange={handleInputChange}
              />
              <Separator />
              <InfoRow 
                icon={User} 
                label="School Name" 
                value={userData.schoolName}
                fieldName="school_name"
                isEditMode={isEditMode}
                formData={formData}
                onInputChange={handleInputChange}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setIsResetPasswordOpen(true)}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Lock className="w-4 h-4 mr-2" />
                Reset Password
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    placeholder="Enter new password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {passwordData.newPassword && passwordData.confirmPassword && 
               passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="text-sm text-destructive">
                  Passwords don't match
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsResetPasswordOpen(false)}
                disabled={isUpdatingPassword}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingPassword}>
                {isUpdatingPassword ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                  />
                ) : (
                  "Reset Password"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
