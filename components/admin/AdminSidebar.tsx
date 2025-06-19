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
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
    title: "VN Sales Tracker",
    href: "/admin/vn-sales",
    icon: FileText,
    description: "Video note sales tracking",
    category: "main",
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
    }
  );
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const pathname = usePathname();

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
        className="fixed top-4 left-4 z-50 md:hidden backdrop-blur-xl bg-white/90 border border-gray-200 shadow-lg hover:bg-gray-50"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky z-50 top-0 h-screen transition-all duration-300 ease-in-out",
          "bg-white/95 backdrop-blur-md border-r border-gray-200",
          "shadow-[4px_0_24px_rgba(0,0,0,0.06)]",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen
            ? "left-0 translate-x-0" // Mobile open state
            : "-translate-x-full md:translate-x-0", // Mobile closed / desktop state
          className
        )}
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-24 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl" />
        </div>

        {/* Content wrapper */}
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="relative flex items-center justify-between p-4 border-b border-gray-200">
            {!isCollapsed && (
              <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
            )}
            {isCollapsed && (
              <img
                src="/logo-collapsed.png"
                alt="Logo"
                className="h-8 w-auto"
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex hover:bg-gray-100 transition-colors"
              onClick={() => handleCollapse(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
            </Button>
          </div>

          {/* Model Selector */}
          {!isCollapsed && (
            <div className="p-4 border-b border-gray-200">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Selected Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
              >
                <option value="all">All Models</option>
                <option value="model1">Model 1</option>
                <option value="model2">Model 2</option>
                <option value="model3">Model 3</option>
              </select>
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
                          ? "bg-black text-white border-black shadow-md"
                          : "text-gray-700 hover:bg-gray-50 hover:border-gray-300 border-transparent",
                        isCollapsed && "justify-center px-2"
                      )}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <Icon
                        size={20}
                        className={isActive ? "text-pink-400" : ""}
                      />
                      {!isCollapsed && (
                        <>
                          <div className="flex-1 text-left">
                            <div>{item.title}</div>
                            <div
                              className={cn(
                                "text-xs",
                                isActive ? "text-gray-400" : "text-gray-500"
                              )}
                            >
                              {item.description}
                            </div>
                          </div>
                          <ChevronDown
                            size={16}
                            className={cn(
                              "transition-transform duration-200",
                              isActive ? "text-pink-400" : "text-gray-400",
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
                                  ? "bg-pink-50 text-pink-600 font-medium"
                                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                              )}
                              onClick={() => setIsMobileOpen(false)}
                            >
                              <div
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  isSubActive ? "bg-pink-500" : "bg-gray-400"
                                )}
                              />
                              <div className="flex-1">
                                <div>{subItem.title}</div>
                                <div className="text-xs text-gray-500">
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
                      ? "bg-black text-white border-black shadow-md"
                      : "text-gray-700 hover:bg-gray-50 hover:border-gray-300 border-transparent",
                    isCollapsed && "justify-center px-2"
                  )}
                  onClick={() => setIsMobileOpen(false)}
                  title={isCollapsed ? item.title : undefined}
                >
                  <Icon size={20} className={isActive ? "text-pink-400" : ""} />
                  {!isCollapsed && (
                    <div className="flex-1">
                      <div>{item.title}</div>
                      <div
                        className={cn(
                          "text-xs",
                          isActive ? "text-gray-400" : "text-gray-500"
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
          <div className="p-4 border-t border-gray-200">
            <div
              className={cn(
                "text-xs text-gray-500",
                isCollapsed && "text-center"
              )}
            >
              {isCollapsed ? "v1.0" : "Creators Ink Admin v1.0"}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
