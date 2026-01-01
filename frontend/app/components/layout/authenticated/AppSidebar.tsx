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
  useSidebar,
} from "~/components/ui/sidebar";
import { Logo } from "~/components/ui/logo";
import { Home, GraduationCap, BookOpen, LogOut, Plus, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";

const menuItems = [
  {
    title: "Home",
    icon: Home,
    id: "home",
  },
  {
    title: "Study Sets",
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
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

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
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader>
        <div className="flex items-center justify-between p-4">
          <div className={`flex items-center ${isCollapsed ? "justify-center w-full" : ""}`}>
            <Logo size="sm" showText={!isCollapsed} />
          </div>
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleSidebar}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
        {isCollapsed && (
          <div className="flex justify-center pb-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleSidebar}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          isActive={currentView === item.id}
                          onClick={() => onNavigate(item.id)}
                          className="justify-center"
                        >
                          <item.icon className="w-5 h-5" />
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <SidebarMenuButton
                      isActive={currentView === item.id}
                      onClick={() => onNavigate(item.id)}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {/* User Profile Section */}
        <div className="px-3 py-2 mb-2">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onProfileClick}
                  className="w-full flex items-center justify-center rounded-lg bg-sidebar-accent p-2 hover:bg-sidebar-accent/80 transition-colors cursor-pointer"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div>
                  <p className="text-sm font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
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
          )}
        </div>

        {/* Logout Button */}
        <SidebarMenu>
          <SidebarMenuItem>
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarMenuButton
                    onClick={() => {
                      if (onLogout) {
                        toast.info("You've been logged out successfully.");
                        onLogout();
                      }
                    }}
                    className="justify-center"
                  >
                    <LogOut className="w-5 h-5" />
                  </SidebarMenuButton>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Logout
                </TooltipContent>
              </Tooltip>
            ) : (
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
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
