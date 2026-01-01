import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "~/components/ui/sidebar";
import { Logo } from "~/components/ui/logo";
import { Home, GraduationCap, BookOpen, LogOut, Plus, Layers } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";

const menuItems = [
  {
    title: "Home",
    icon: Home,
    id: "home",
  },
  {
    title: "My Study Sets",
    icon: Layers,
    id: "studysets",
  },
  {
    title: "Classes",
    icon: GraduationCap,
    id: "class",
  },
  {
    title: "Create Flashcards",
    icon: Plus,
    id: "create",
  },
  {
    title: "Flashcard Set",
    icon: BookOpen,
    id: "flashcard",
  },
];

interface AppSidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout?: () => void;
  userName?: string;
  userEmail?: string;
  onProfileClick?: () => void;
}

export function AppSidebar({
  currentView,
  onNavigate,
  onLogout,
  userName = "John Doe",
  userEmail = "john.doe@example.com",
  onProfileClick,
}: AppSidebarProps) {
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar collapsible="none" className="border-r border-border">
      <SidebarHeader>
        <div className="flex items-center justify-center p-4">
          <Logo size="sm" showText={true} />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={currentView === item.id}
                    onClick={() => onNavigate(item.id)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {/* User Profile Section */}
        <div className="px-3 py-2 mb-2">
          <button
            onClick={onProfileClick}
            className="w-full flex items-center gap-3 rounded-lg bg-sidebar-accent p-3 hover:bg-sidebar-accent/80 transition-colors cursor-pointer"
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden text-left">
              <p className="truncate text-sm text-sidebar-foreground">
                {userName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {userEmail}
              </p>
            </div>
          </button>
        </div>

        {/* Logout Button */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                if (onLogout) {
                  toast.info("You've been logged out successfully.");
                  onLogout();
                }
              }}
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
