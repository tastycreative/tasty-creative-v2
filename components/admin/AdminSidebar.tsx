
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
    description: "Overview and analytics",
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    description: "Charts and reports",
  },
  {
    title: "User Management",
    href: "/admin/users",
    icon: Users,
    description: "Manage user accounts",
  },
  {
    title: "System Monitor",
    href: "/admin/system",
    icon: Activity,
    description: "System performance",
  },
  {
    title: "Database",
    href: "/admin/database",
    icon: Database,
    description: "Database management",
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: FileText,
    description: "Generate reports",
  },
  {
    title: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
    description: "System notifications",
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    description: "Admin configuration",
  },
];

export function AdminSidebar({ className }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

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

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

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
