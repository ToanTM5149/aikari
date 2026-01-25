import { Outlet, useNavigate, useLocation } from "react-router";
import { useEffect } from "react";
import { AppHeader } from "~/components/layout/authenticated/AppHeader";
import { AppSidebar } from "~/components/layout/authenticated/AppSidebar";
import { SidebarProvider, SidebarInset } from "~/components/ui/sidebar";
import { useAppSelector } from "~/redux/store";
import { selectIsAuthenticated, selectCurrentUser, logout } from "~/redux/features/auth/slice";
import { useLogoutMutation } from "~/redux/features/auth/api";

export default function AuthenticatedLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [logoutUser] = useLogoutMutation();
  
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!user?.role) return;
    
    const userRole = user.role.toUpperCase();
    const currentPath = location.pathname;
    
    // Define role-based access rules
    const adminOnlyRoutes = ['/user-management', '/token-management', '/dashboard/admin'];
    const studentTeacherOnlyRoutes = ['/dashboard', '/dashboard/studysets', '/dashboard/terms', '/dashboard/categories', '/dashboard/class', '/create', '/history'];
    
    // Admin trying to access student/teacher routes
    if (userRole === 'ADMIN' && studentTeacherOnlyRoutes.some(route => currentPath.startsWith(route))) {
      navigate('/dashboard/admin', { replace: true });
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
    if (path.startsWith("/dashboard/terms")) return "terms";
    if (path.startsWith("/dashboard/categories")) return "categories";
    if (path.startsWith("/dashboard/class")) return "class";
    if (path.startsWith("/dashboard/admin")) return "admin";
    if (path.startsWith("/create")) return "create";
    if (path.startsWith("/history")) return "history";
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
      case "terms":
        navigate("/dashboard/terms");
        break;
      case "categories":
        navigate("/dashboard/categories");
        break;
      case "class":
        navigate("/dashboard/class");
        break;
      case "admin":
        navigate("/dashboard/admin");
        break;
      case "create":
        navigate("/create");
        break;
      case "history":
        navigate("/history");
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
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
