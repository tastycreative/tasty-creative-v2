"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Users,
  Settings,
  Shield,
  Menu,
  X,
  Home,
  Activity,
  Database,
  FileText,
  Bell,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  LogOut,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { handleLogout } from "@/app/actions/sign-out";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import { useTheme } from "next-themes";

interface AdminSidebarProps {
  className?: string;
}

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: Home,
    description: "Revenue tracking & metrics",
    category: "main",
  },
  {
    title: "Models",
    href: "/admin/models",
    icon: Users,
    description: "Model profile management",
    category: "main",
  },
  {
    title: "AI Finance",
    href: "/admin/ai-finance",
    icon: DollarSign,
    description: "ElevenLabs billing & costs",
    category: "main",
  },
  {
    title: "Analytics",
    href: "#",
    icon: BarChart3,
    description: "Performance analytics",
    category: "analytics",
    subItems: [
      {
        title: "Wall Stats",
        href: "/admin/analytics/wall-stats",
        description: "Wall performance metrics",
      },
      {
        title: "Campaign Stats",
        href: "/admin/analytics/campaign-stats",
        description: "Campaign analytics",
      },
    ],
  },
  {
    title: "Voice Note Tracker",
    href: "#",
    icon: FileText,
    description: "Voice note sales tracking",
    category: "main",
    subItems: [
      {
        title: "Sales Overview",
        href: "/admin/vn-sales/overview",
        description: "Sales summary and metrics",
      },
      {
        title: "Model's Elevenlabs Accounts",
        href: "/admin/vn-sales/accounts",
        description: "Account management",
      },
      {
        title: "Voice Gen Accounts",
        href: "/admin/vn-sales/voice-accounts",
        description: "Manage voice generation accounts",
      },
      {
        title: "Add New Voice Model",
        href: "/admin/vn-sales/add-model",
        description: "Create new voice models",
      },
    ],
  },
  {
    title: "User Management",
    href: "/admin/users",
    icon: Shield,
    description: "Manage user accounts",
    category: "system",
  },
  {
    title: "System Monitor",
    href: "/admin/system",
    icon: Activity,
    description: "System performance",
    category: "system",
  },
  {
    title: "Database",
    href: "/admin/database",
    icon: Database,
    description: "Database management",
    category: "system",
  },
  {
    title: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
    description: "System notifications",
    category: "system",
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    description: "Admin configuration",
    category: "system",
  },
];

export function AdminSidebar({ className }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      analytics: true,
      "voice note tracker": true,
    }
  );
  const [imgError, setImgError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme } = useTheme();

  // Prevent hydration mismatch by only rendering theme-dependent content after mounting
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
  };

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 border border-pink-200 dark:border-pink-500/30 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky z-50 top-0 h-screen transition-all duration-300 ease-in-out",
          "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-r border-pink-200 dark:border-pink-500/30",
          "shadow-[4px_0_24px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen
            ? "left-0 translate-x-0" // Mobile open state
            : "-translate-x-full md:translate-x-0", // Mobile closed / desktop state
          className
        )}
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-500/10 dark:bg-pink-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-24 w-64 h-64 bg-pink-500/5 dark:bg-pink-500/3 rounded-full blur-3xl" />
        </div>

        {/* Content wrapper */}
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="relative flex items-center justify-between p-4 border-b border-pink-200 dark:border-pink-500/30">
            {!isCollapsed && (
              <img
                src={
                  mounted && theme === "dark" ? "/logo-dark.png" : "/logo.png"
                }
                alt="Logo"
                className="h-8 w-auto"
              />
            )}
            {isCollapsed && (
              <img
                src={
                  mounted && theme === "dark"
                    ? "/logo-collapsed-dark.png"
                    : "/logo-collapsed.png"
                }
                alt="Logo"
                className="h-8 w-auto"
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
              onClick={() => handleCollapse(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
            </Button>
          </div>

          {/* User Credentials Section */}
          {!isCollapsed && session?.user && (
            <div className="p-4 border-b border-pink-200 dark:border-pink-500/30">
              <div className="relative">
                <input
                  type="checkbox"
                  id="user-dropdown"
                  className="peer hidden"
                />
                <label
                  htmlFor="user-dropdown"
                  className="w-full flex select-none items-center gap-3 p-3 rounded-lg cursor-pointer bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-800 dark:to-gray-800/80 hover:from-gray-100 hover:to-pink-100 dark:hover:from-gray-700 dark:hover:to-gray-700/80 transition-all duration-200 border border-pink-100 dark:border-pink-500/20 shadow-sm"
                >
                  <div className="relative flex-shrink-0">
                    {session.user.image && !imgError ? (
                      <img
                        src={`/api/image-proxy?url=${encodeURIComponent(session.user.image)}`}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover border-2 border-pink-200 dark:border-pink-500/30"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {session.user.name || "Admin User"}
                      </div>
                      <span className="text-xs bg-gradient-to-r from-pink-500 to-rose-500 text-white px-2 py-1 rounded-full font-medium">
                        {session.user.role}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {session.user.email}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 peer-checked:rotate-180 flex-shrink-0" />
                </label>

                <div className="absolute top-full left-0 right-0 mt-2 border border-pink-200 dark:border-pink-500/30 rounded-lg p-2 hidden peer-checked:flex flex-col gap-1 bg-white dark:bg-gray-800 backdrop-blur-xl shadow-lg z-20">
                  <button
                    className="text-left hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 font-medium transition-colors flex items-center gap-2"
                    onClick={() => (window.location.href = "/dashboard")}
                  >
                    <Home className="h-4 w-4" />
                    Dashboard
                  </button>
                  <button
                    className="text-left hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 font-medium transition-colors flex items-center gap-2"
                    // onClick={() => window.location.href = '/settings'}
                  >
                    <Settings className="h-4 w-4" />
                    Account Settings
                  </button>
                  <div className="border-t border-pink-200 dark:border-pink-500/30 my-1"></div>
                  <button
                    className="text-left hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 font-medium transition-colors flex items-center gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Collapsed User Avatar */}
          {isCollapsed && session?.user && (
            <div className="p-4 border-b border-pink-200 dark:border-pink-500/30 flex justify-center">
              <div className="relative">
                {session.user.image && !imgError ? (
                  <img
                    src={`/api/image-proxy?url=${encodeURIComponent(session.user.image)}`}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border-2 border-pink-200 dark:border-pink-500/30"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {adminNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.subItems &&
                  item.subItems.some((sub) => pathname === sub.href));
              const Icon = item.icon;

              if (item.subItems) {
                const isExpanded = expandedGroups[item.title.toLowerCase()];

                return (
                  <div key={item.title} className="space-y-1">
                    <button
                      onClick={() => toggleGroup(item.title.toLowerCase())}
                      className={cn(
                        "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border",
                        isActive
                          ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-500 shadow-md"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-pink-300 dark:hover:border-pink-500/30 border-transparent",
                        isCollapsed && "justify-center px-2"
                      )}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <Icon
                        size={20}
                        className={
                          isActive
                            ? "text-white"
                            : "text-gray-600 dark:text-gray-300"
                        }
                      />
                      {!isCollapsed && (
                        <>
                          <div className="flex-1 text-left">
                            <div>{item.title}</div>
                            <div
                              className={cn(
                                "text-xs",
                                isActive
                                  ? "text-pink-100"
                                  : "text-gray-500 dark:text-gray-400"
                              )}
                            >
                              {item.description}
                            </div>
                          </div>
                          <ChevronDown
                            size={16}
                            className={cn(
                              "transition-transform duration-200",
                              isActive
                                ? "text-pink-200"
                                : "text-gray-400 dark:text-gray-500",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </>
                      )}
                    </button>

                    {!isCollapsed && isExpanded && (
                      <div className="ml-6 space-y-1">
                        {item.subItems.map((subItem) => {
                          const isSubActive = pathname === subItem.href;

                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={cn(
                                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                                isSubActive
                                  ? "bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 font-medium"
                                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100"
                              )}
                              onClick={() => setIsMobileOpen(false)}
                            >
                              <div
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  isSubActive
                                    ? "bg-pink-500"
                                    : "bg-gray-400 dark:bg-gray-500"
                                )}
                              />
                              <div className="flex-1">
                                <div>{subItem.title}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {subItem.description}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border",
                    isActive
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-pink-500 shadow-md"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-pink-300 dark:hover:border-pink-500/30 border-transparent",
                    isCollapsed && "justify-center px-2"
                  )}
                  onClick={() => setIsMobileOpen(false)}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon
                    size={20}
                    className={
                      isActive
                        ? "text-white"
                        : "text-gray-600 dark:text-gray-300"
                    }
                  />
                  {!isCollapsed && (
                    <div className="flex-1">
                      <div>{item.title}</div>
                      <div
                        className={cn(
                          "text-xs",
                          isActive
                            ? "text-pink-100"
                            : "text-gray-500 dark:text-gray-400"
                        )}
                      >
                        {item.description}
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-pink-200 dark:border-pink-500/30">
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  "text-xs text-gray-500 dark:text-gray-400",
                  isCollapsed && "hidden"
                )}
              >
                Creators Ink Admin v1.0
              </div>
              {isCollapsed && (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center w-full mb-2">
                  v1.0
                </div>
              )}
              <div
                className={cn(
                  "flex-shrink-0",
                  isCollapsed && "w-full flex justify-center"
                )}
              >
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
