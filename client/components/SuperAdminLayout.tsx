import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings,
  Users,
  Package,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Database,
  GitBranch,
  Layers3,
  Building2,
  Shield,
  Network,
  FileText,
  BarChart3,
  Workflow,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";

interface SuperAdminLayoutProps {
  children: ReactNode;
}

const navigation = [
  {
    name: "System Overview",
    href: "/super-admin",
    icon: LayoutDashboard,
    description: "System Health & Metrics",
    category: "overview",
  },
  {
    name: "Organization Tree",
    href: "/super-admin/organizations",
    icon: Building2,
    description: "Multi-tenant Management",
    category: "organizations",
  },
  {
    name: "Category Builder",
    href: "/super-admin/categories",
    icon: Layers3,
    description: "Data Classification System",
    category: "configuration",
  },
  {
    name: "Branch Configuration",
    href: "/super-admin/branches",
    icon: GitBranch,
    description: "Data Flow & Routing",
    category: "configuration",
  },
  {
    name: "Data Migration",
    href: "/super-admin/migration",
    icon: Database,
    description: "Transfer & Sync Systems",
    category: "data",
  },
  {
    name: "Workflow Builder",
    href: "/super-admin/workflows",
    icon: Workflow,
    description: "Process Automation",
    category: "automation",
  },
  {
    name: "Global Analytics",
    href: "/super-admin/analytics",
    icon: BarChart3,
    description: "Cross-System Reports",
    category: "insights",
  },
  {
    name: "Network Config",
    href: "/super-admin/network",
    icon: Network,
    description: "API & Integrations",
    category: "technical",
  },
  {
    name: "Security Center",
    href: "/super-admin/security",
    icon: Shield,
    description: "Access & Permissions",
    category: "security",
  },
  {
    name: "Global Settings",
    href: "/super-admin/settings",
    icon: Settings,
    description: "System Configuration",
    category: "settings",
  },
];

const categoryColors = {
  overview: "bg-blue-500",
  organizations: "bg-purple-500",
  configuration: "bg-green-500",
  data: "bg-orange-500",
  automation: "bg-cyan-500",
  insights: "bg-pink-500",
  technical: "bg-indigo-500",
  security: "bg-red-500",
  settings: "bg-gray-500",
};

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();

  useEffect(() => {
    const checkScreenSize = () => {
      if (typeof window !== "undefined") {
        setIsDesktop(window.innerWidth >= 1024);
      }
    };

    checkScreenSize();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", checkScreenSize);
      return () => window.removeEventListener("resize", checkScreenSize);
    }
  }, []);

  const handleLogout = () => {
    logout();
    addToast({
      type: "success",
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  const closeSidebar = () => setSidebarOpen(false);

  // Group navigation by category
  const groupedNavigation = navigation.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof navigation>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 bg-slate-900 border-r border-slate-700 transition-transform duration-300 ease-in-out",
          isDesktop
            ? "translate-x-0"
            : sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700 bg-slate-800">
            <Link
              to="/super-admin"
              className="flex items-center space-x-3"
              onClick={closeSidebar}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">
                  SuperAdmin
                </span>
                <div className="text-xs text-slate-400">System Control</div>
              </div>
            </Link>
            {!isDesktop && (
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:bg-slate-700"
                onClick={closeSidebar}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Super Admin Badge */}
          <div className="px-6 py-3 border-b border-slate-700">
            <Badge
              variant="outline"
              className="w-full justify-center border-blue-500 text-blue-400 bg-blue-500/10"
            >
              <Globe className="h-3 w-3 mr-1" />
              Global System Access
            </Badge>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
            {Object.entries(groupedNavigation).map(([category, items]) => (
              <div key={category} className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
                  {category}
                </h3>
                <div className="space-y-1">
                  {items.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={closeSidebar}
                        className={cn(
                          "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white",
                        )}
                      >
                        <div
                          className={cn(
                            "mr-3 p-2 rounded-lg transition-colors",
                            isActive
                              ? "bg-white/20"
                              : categoryColors[
                                  item.category as keyof typeof categoryColors
                                ],
                          )}
                        >
                          <item.icon
                            className={cn(
                              "h-4 w-4 transition-colors",
                              isActive ? "text-white" : "text-white",
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{item.name}</div>
                          <div className="text-xs opacity-75 truncate">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User section */}
          <div className="p-6 border-t border-slate-700 bg-slate-800">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-12 w-12 ring-2 ring-blue-500">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {user?.name}
                </div>
                <div className="text-xs text-blue-400 capitalize">
                  {user?.role?.replace("_", " ")}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-red-400"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Exit
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-800 border-slate-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">
                      Confirm Logout
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-400">
                      Are you sure you want to exit super admin mode? This will
                      log you out completely.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-slate-600 text-slate-300">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleLogout}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Exit System
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className={cn("transition-all duration-300", isDesktop && "ml-80")}>
        {/* Mobile Header */}
        {!isDesktop && (
          <div className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="text-foreground"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-foreground">SuperAdmin</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="text-foreground"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}

        <main className="p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
