
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
  DollarSign,
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    analytics: true,
  });
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const pathname = usePathname();

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }));
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className={cn("flex items-center space-x-2", isCollapsed && "justify-center")}>
            <Shield className="h-8 w-8 text-blue-600" />
            {!isCollapsed && (
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Admin Panel
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>

        {/* Model Selector */}
        {!isCollapsed && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Selected Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            const isActive = pathname === item.href || (item.subItems && item.subItems.some(sub => pathname === sub.href));
            const Icon = item.icon;

            if (item.subItems) {
              const isExpanded = expandedGroups[item.title.toLowerCase()];
              
              return (
                <div key={item.title} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(item.title.toLowerCase())}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                      isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <Icon size={20} />
                    {!isCollapsed && (
                      <>
                        <div className="flex-1 text-left">
                          <div>{item.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {item.description}
                          </div>
                        </div>
                        <ChevronDown 
                          size={16} 
                          className={cn(
                            "transition-transform duration-200",
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
                              "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors",
                              isSubActive
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300"
                                : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50"
                            )}
                            onClick={() => setIsMobileOpen(false)}
                          >
                            <div className="w-2 h-2 rounded-full bg-current opacity-50" />
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
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                  isCollapsed && "justify-center px-2"
                )}
                onClick={() => setIsMobileOpen(false)}
                title={isCollapsed ? item.title : undefined}
              >
                <Icon size={20} />
                {!isCollapsed && (
                  <div className="flex-1">
                    <div>{item.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className={cn("text-xs text-gray-500 dark:text-gray-400", isCollapsed && "text-center")}>
            {isCollapsed ? "v1.0" : "Admin Panel v1.0"}
          </div>
        </div>
      </aside>
    </>
  );
}
