"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  PlayCircle,
  CalendarIcon,
  Shield,
  Users,
  Settings,
  Users2,
  ChevronRight,
  Bell,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Enhanced navigation structure with grouping
const navigationSections = [
  {
    title: "Core",
    items: [
      {
        title: "Dashboard",
        url: "/apps/pod-new/dashboard",
        icon: LayoutDashboard,
        badge: null,
        description: "Overview and metrics"
      },
      {
        title: "Workspace",
        url: "/apps/pod-new/workspace",
        icon: Briefcase,
        badge: { text: "3", variant: "primary" },
        description: "Active projects and tasks"
      },
    ]
  },
  {
    title: "Content & Schedule",
    items: [
      {
        title: "Schedule Content",
        url: "/apps/pod-new/schedule",
        icon: Calendar,
        badge: { text: "12", variant: "warning" },
        description: "Plan and schedule posts"
      },
      {
        title: "Live Stream",
        url: "/apps/pod-new/live-stream",
        icon: PlayCircle,
        badge: { text: "Live", variant: "success" },
        description: "Manage live sessions"
      },
      {
        title: "Calendar",
        url: "/apps/pod-new/calendar",
        icon: CalendarIcon,
        badge: null,
        description: "View schedule overview"
      },
    ]
  },
  {
    title: "Management",
    items: [
      {
        title: "My Models",
        url: "/apps/pod-new/my-models",
        icon: Users,
        badge: { text: "4", variant: "secondary" },
        description: "Manage model profiles"
      },
      {
        title: "Team",
        url: "/apps/pod-new/team",
        icon: Users2,
        badge: null,
        description: "Team members and roles"
      },
      {
        title: "OTP",
        url: "/apps/pod-new/otp",
        icon: Shield,
        badge: { text: "!", variant: "alert" },
        description: "Security and authentication"
      },
    ]
  },
  {
    title: "Settings",
    items: [
      {
        title: "Settings",
        url: "/apps/pod-new/settings",
        icon: Settings,
        badge: null,
        description: "App preferences and config"
      },
    ]
  },
]

// Badge component
const Badge = ({ text, variant }: { text: string; variant: 'primary' | 'secondary' | 'success' | 'warning' | 'alert' }) => {
  const variantClasses = {
    primary: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    secondary: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    success: "bg-green-500/20 text-green-300 border-green-500/30",
    warning: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    alert: "bg-red-500/20 text-red-300 border-red-500/30",
  }

  return (
    <span className={cn(
      "inline-flex items-center justify-center min-w-[18px] h-[18px] text-xs font-medium rounded-full border",
      "px-1.5 shrink-0 transition-colors",
      variantClasses[variant]
    )}>
      {text}
    </span>
  )
}

// Navigation item component
const NavItem = ({ item, isActive }: { item: any; isActive: boolean }) => {
  return (
    <Link
      href={item.url}
      className={cn(
        // Base styles
        "group relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
        
        // State-based styles
        isActive
          ? "bg-gradient-to-r from-indigo-500/30 to-purple-500/20 text-white ring-1 ring-inset ring-indigo-400/40 shadow-lg shadow-indigo-500/10 mx-1"
          : "text-slate-300 hover:bg-white/[0.08] hover:text-white active:bg-white/[0.12] mx-1",
        
        // Hover enhancements
        "hover:shadow-sm hover:scale-[1.01] active:scale-[0.99]"
      )}
    >
      {/* Icon */}
      <item.icon 
        className={cn(
          "w-5 h-5 shrink-0 transition-colors",
          isActive ? "text-indigo-300" : "text-slate-400 group-hover:text-slate-200"
        )} 
      />
      
      {/* Label and description */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          "text-sm font-medium transition-colors truncate",
          isActive ? "text-white" : "group-hover:text-white"
        )}>
          {item.title}
        </div>
        {item.description && (
          <div className="text-xs text-slate-500 truncate group-hover:text-slate-400 transition-colors">
            {item.description}
          </div>
        )}
      </div>

      {/* Badge */}
      {item.badge && (
        <Badge text={item.badge.text} variant={item.badge.variant} />
      )}

      {/* Active indicator */}
      {isActive && (
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-400 rounded-full opacity-60" />
      )}
    </Link>
  )
}

// Section component
const NavSection = ({ section, pathname }: { section: any; pathname: string }) => {
  return (
    <div className="space-y-2">
      {/* Section header */}
      <div className="px-4 py-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {section.title}
        </h3>
      </div>
      
      {/* Section items */}
      <div className="space-y-1">
        {section.items.map((item) => {
          const isActive = pathname === item.url
          return (
            <NavItem
              key={item.title}
              item={item}
              isActive={isActive}
            />
          )
        })}
      </div>
    </div>
  )
}

export function PodSidebarEnhanced() {
  const pathname = usePathname()

  return (
    <nav 
      className="flex flex-col h-full"
      role="navigation"
      aria-label="Primary navigation"
    >
      {/* Header section */}
      <div className="px-4 py-5 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3 text-slate-200">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-sm">Tasty Creative</div>
            <div className="text-xs text-slate-400">POD Dashboard</div>
          </div>
        </div>
      </div>

      {/* Navigation sections - scrollable */}
      <div className="flex-1 overflow-y-auto py-5 space-y-8 min-h-0">
        {navigationSections.map((section) => (
          <NavSection
            key={section.title}
            section={section}
            pathname={pathname}
          />
        ))}
      </div>

      {/* Footer section */}
      <div className="px-4 py-4 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10">
          <Bell className="w-4 h-4 text-slate-400" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-300">Updates</div>
            <div className="text-xs text-slate-500">All systems operational</div>
          </div>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        </div>
      </div>
    </nav>
  )
}