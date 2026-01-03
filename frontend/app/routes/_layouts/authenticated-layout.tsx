import { Outlet, useNavigate, useLocation } from "react-router";
import { useState, useEffect } from "react";
import { AppHeader } from "~/components/layout/authenticated/AppHeader";
import { AppSidebar } from "~/components/layout/authenticated/AppSidebar";
import { SidebarProvider, SidebarInset } from "~/components/ui/sidebar";
import { useAppSelector, useAppDispatch } from "~/redux/store";
import { selectIsAuthenticated, selectCurrentUser, logout } from "~/redux/features/auth/slice";
import { useLogoutMutation } from "~/redux/features/auth/api";
import { Chatbot } from "~/components/shared/chatbot";

export default function AuthenticatedLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [logoutUser] = useLogoutMutation();
  
  // Get auth state from Redux
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);

  // Chatbot state
  const [isChatbotCollapsed, setIsChatbotCollapsed] = useState(false);
  const [chatbotWidth, setChatbotWidth] = useState(320); // Default 320px

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("chatbot-collapsed");
    const savedWidth = localStorage.getItem("chatbot-width");
    
    if (savedCollapsed) {
      setIsChatbotCollapsed(savedCollapsed === "true");
    }
    if (savedWidth) {
      setChatbotWidth(parseInt(savedWidth, 10));
    }
  }, []);

  // Save preferences to localStorage
  const handleToggleChatbot = () => {
    const newState = !isChatbotCollapsed;
    setIsChatbotCollapsed(newState);
    localStorage.setItem("chatbot-collapsed", String(newState));
  };

  const handleChatbotWidthChange = (width: number) => {
    setChatbotWidth(width);
    localStorage.setItem("chatbot-width", String(width));
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Role-based route protection
  useEffect(() => {
    if (!user?.role) return;
    
    const userRole = user.role.toUpperCase();
    const currentPath = location.pathname;
    
    // Define role-based access rules
    const adminOnlyRoutes = ['/statistics', '/user-management', '/token-management'];
    const studentTeacherOnlyRoutes = ['/dashboard', '/dashboard/studysets', '/dashboard/class', '/create', '/history'];
    
    // Admin trying to access student/teacher routes
    if (userRole === 'ADMIN' && studentTeacherOnlyRoutes.some(route => currentPath.startsWith(route))) {
      navigate('/statistics', { replace: true });
      return;
    }
    
    // Student/Teacher trying to access admin routes
    if ((userRole === 'STUDENT' || userRole === 'TEACHER') && adminOnlyRoutes.some(route => currentPath.startsWith(route))) {
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [user, location.pathname, navigate]);

  // Get current view from pathname
  const getCurrentView = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "home";
    if (path.startsWith("/dashboard/studysets")) return "studysets";
    if (path.startsWith("/dashboard/class")) return "class";
    if (path.startsWith("/create")) return "create";
    if (path.startsWith("/history")) return "history";
    if (path.startsWith("/statistics")) return "statistics";
    if (path.startsWith("/user-management")) return "user-management";
    if (path.startsWith("/token-management")) return "token-management";
    return "home";
  };

  const handleNavigate = (view: string) => {
    switch (view) {
      case "home":
        navigate("/dashboard");
        break;
      case "studysets":
        navigate("/dashboard/studysets");
        break;
      case "class":
        navigate("/dashboard/class");
        break;
      case "create":
        navigate("/create");
        break;
      case "history":
        navigate("/history");
        break;
      case "statistics":
        navigate("/statistics");
        break;
      case "user-management":
        navigate("/user-management");
        break;
      case "token-management":
        navigate("/token-management");
        break;
      default:
        navigate("/dashboard");
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout API to clear HTTP-only cookie on server
      await logoutUser().unwrap();
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      // Always clear Redux state and navigate to login
      // The logout action is already dispatched by the API
      navigate("/login");
    }
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  // Don't render content if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Ensure role is uppercase and valid
  const userRole = (user?.role?.toUpperCase() as 'STUDENT' | 'TEACHER' | 'ADMIN') || 'STUDENT';

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        {/* Left Sidebar */}
        <AppSidebar
          currentView={getCurrentView()}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          userName={user?.full_name || user?.username || "User"}
          userEmail={user?.email || "user@example.com"}
          onProfileClick={handleProfileClick}
          userRole={userRole}
        />
        
        {/* Main Content with Header */}
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <AppHeader />
          <div className="flex flex-1 overflow-hidden">
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
              <Outlet />
            </main>
            
            {/* Right Chatbot Sidebar - Below Header */}
            <div 
              className="flex-shrink-0 overflow-hidden border-l"
              style={{ 
                width: isChatbotCollapsed ? '48px' : `${chatbotWidth}px`,
                transition: isChatbotCollapsed ? 'width 0.2s ease' : 'none'
              }}
            >
              <Chatbot 
                isCollapsed={isChatbotCollapsed}
                onToggleCollapse={handleToggleChatbot}
                width={chatbotWidth}
                onWidthChange={handleChatbotWidthChange}
              />
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
