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
    const adminOnlyRoutes = ['/admin', '/admin/users', '/admin/tokens'];
    const studentTeacherOnlyRoutes = ['/home', '/studysets', '/terms', '/categories', '/classes', '/create', '/history'];
    
    // Admin trying to access student/teacher routes
    if (userRole === 'ADMIN' && studentTeacherOnlyRoutes.some(route => currentPath.startsWith(route))) {
      navigate('/admin', { replace: true });
      return;
    }
    
    // Student/Teacher trying to access admin routes
    if ((userRole === 'STUDENT' || userRole === 'TEACHER') && adminOnlyRoutes.some(route => currentPath.startsWith(route))) {
      navigate('/home', { replace: true });
      return;
    }
  }, [user, location.pathname, navigate]);

  // Get current view from pathname
  const getCurrentView = () => {
    const path = location.pathname;
    if (path === "/home" || path === "/") return "home";
    if (path.startsWith("/studysets")) return "studysets";
    if (path.startsWith("/terms")) return "terms";
    if (path.startsWith("/categories")) return "categories";
    if (path.startsWith("/classes")) return "class";
    if (path.startsWith("/admin")) return "admin";
    if (path.startsWith("/create")) return "create";
    if (path.startsWith("/history")) return "history";
    if (path.startsWith("/admin/users")) return "user-management";
    if (path.startsWith("/admin/tokens")) return "token-management";
    return "home";
  };

  const handleNavigate = (view: string) => {
    switch (view) {
      case "home":
        navigate("/home");
        break;
      case "studysets":
        navigate("/studysets");
        break;
      case "terms":
        navigate("/terms");
        break;
      case "categories":
        navigate("/categories");
        break;
      case "class":
        navigate("/classes");
        break;
      case "admin":
        navigate("/admin");
        break;
      case "create":
        navigate("/create");
        break;
      case "history":
        navigate("/history");
        break;
      case "user-management":
        navigate("/admin/users");
        break;
      case "token-management":
        navigate("/admin/tokens");
        break;
      default:
        navigate("/home");
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
