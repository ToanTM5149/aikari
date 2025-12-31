import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { SidebarProvider, SidebarInset } from "./components/ui/sidebar"
import { AppSidebar } from "./components/app-sidebar"
import { AppHeader } from "./components/app-header"
import { FlashcardContent } from "./components/flashcard-content"
import { Chatbot } from "./components/chatbot"
import { GenerateContent } from "./components/generate-content"
import { HomePage } from "./components/home-page"
import { CreateFlashcard } from "./components/create-flashcard"
import { FolderPage } from "./components/folder-page"
import { ClassPage } from "./components/class-page"
import { ClassStatistics } from "./components/class-statistics"
import { ProfilePage } from "./components/profile-page"
import { LoginPage } from "./components/login-page"
import { SignupPage } from "./components/signup-page"
import { Toaster } from "./components/ui/sonner"

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authView, setAuthView] = useState<"login" | "signup">("login")
  const [currentView, setCurrentView] = useState("home")
  const [isStudying, setIsStudying] = useState(false)
  const [selectedClassName, setSelectedClassName] = useState<string>("")
  const [userData, setUserData] = useState<{
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
  }>({
    name: "",
    email: "",
    username: "",
  })

  const handleNavigate = (view: string) => {
    setCurrentView(view)
    setIsStudying(false) // Reset studying mode when navigating
  }

  const handleStudySetClick = () => {
    setCurrentView("flashcard")
    setIsStudying(true)
  }

  const handleLogin = (data?: { username: string; email?: string; name?: string; userType?: string }) => {
    if (data) {
      setUserData({
        name: data.name || data.username,
        email: data.email || `${data.username}@example.com`,
        username: data.username,
        userType: data.userType,
      })
    }
    setIsAuthenticated(true)
  }

  const handleSignup = (data?: { 
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
  }) => {
    if (data) {
      setUserData({
        name: data.fullName || data.username,
        email: data.email,
        username: data.username,
        fullName: data.fullName,
        schoolName: data.schoolName,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        sex: data.sex,
        dateOfBirth: data.dateOfBirth,
        phone: data.phone,
        userType: data.userType,
      })
    }
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentView("home")
    setUserData({ name: "", email: "", username: "" })
  }

  // Show authentication screens if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <AnimatePresence mode="wait">
          {authView === "login" ? (
            <LoginPage
              key="login"
              onLogin={handleLogin}
              onSwitchToSignup={() => setAuthView("signup")}
            />
          ) : (
            <SignupPage
              key="signup"
              onSignup={handleSignup}
              onSwitchToLogin={() => setAuthView("login")}
            />
          )}
        </AnimatePresence>
        <Toaster />
      </>
    )
  }

  const renderMainContent = () => {
    switch (currentView) {
      case "home":
        return (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="col-span-4 row-span-4 overflow-auto"
          >
            <HomePage onStudySetClick={handleStudySetClick} />
          </motion.div>
        )
      case "profile":
        return (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="col-span-4 row-span-4"
          >
            <ProfilePage userData={userData} />
          </motion.div>
        )
      case "create":
        return (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="col-span-4 row-span-4"
          >
            <CreateFlashcard />
          </motion.div>
        )
      case "class":
        return (
          <motion.div
            key="class"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="col-span-4 row-span-4"
          >
            <ClassPage 
              onStudySetClick={handleStudySetClick}
              onStatisticsClick={(className) => {
                setSelectedClassName(className)
                setCurrentView("statistics")
              }}
            />
          </motion.div>
        )
      case "statistics":
        return (
          <motion.div
            key="statistics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="col-span-4 row-span-4"
          >
            <ClassStatistics 
              className={selectedClassName}
              onBack={() => setCurrentView("class")}
            />
          </motion.div>
        )
      case "folder":
        return (
          <motion.div
            key="folder"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="col-span-4 row-span-4"
          >
            <FolderPage onStudySetClick={handleStudySetClick} />
          </motion.div>
        )
      case "flashcard":
        return (
          <>
            <motion.div
              key="flashcard-content"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="col-span-3 row-span-3"
            >
              <FlashcardContent isStudying={isStudying} />
            </motion.div>
            
            <motion.div
              key="chatbot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="col-span-1 row-span-3"
            >
              <Chatbot />
            </motion.div>
            
            <motion.div
              key="generate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="col-span-4 row-span-1"
            >
              <GenerateContent />
            </motion.div>
          </>
        )
      default:
        return (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="col-span-4 row-span-4 flex items-center justify-center"
          >
            <div className="text-center text-muted-foreground">
              <h3>Coming Soon</h3>
              <p>This feature is under development</p>
            </div>
          </motion.div>
        )
    }
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar 
          currentView={currentView} 
          onNavigate={handleNavigate} 
          onLogout={handleLogout}
          userName={userData.name || "Guest User"}
          userEmail={userData.email || "guest@example.com"}
          onProfileClick={() => handleNavigate("profile")}
        />
        <SidebarInset className="flex-1">
          <div className="flex flex-col h-full">
            <AppHeader />
            <main className="flex-1 p-6 grid grid-cols-4 grid-rows-4 gap-6">
              <AnimatePresence mode="wait">
                {renderMainContent()}
              </AnimatePresence>
            </main>
          </div>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}