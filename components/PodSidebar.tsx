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
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Navigation items based on the design
const navigationItems = [
  {
    title: "Dashboard",
    url: "/apps/pod-new/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Workspace",
    url: "/apps/pod-new/workspace",
    icon: Briefcase,
  },
  {
    title: "Schedule Content",
    url: "/apps/pod-new/schedule",
    icon: Calendar,
  },
  {
    title: "Live Stream",
    url: "/apps/pod-new/live-stream",
    icon: PlayCircle,
  },
  {
    title: "Calendar",
    url: "/apps/pod-new/calendar",
    icon: CalendarIcon,
  },
  {
    title: "OTP",
    url: "/apps/pod-new/otp",
    icon: Shield,
  },
  {
    title: "My Models",
    url: "/apps/pod-new/my-models",
    icon: Users,
  },
  {
    title: "Settings",
    url: "/apps/pod-new/settings",
    icon: Settings,
  },
  {
    title: "Team",
    url: "/apps/pod-new/team",
    icon: Users2,
  },
]

export function PodSidebar() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {navigationItems.map((item) => {
        const isActive = pathname === item.url
        return (
          <Link
            key={item.title}
            href={item.url}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors w-full
              ${isActive 
                ? "bg-indigo-500/30 text-white ring-1 ring-inset ring-indigo-400/40" 
                : "text-slate-300 hover:bg-white/5"
              }
            `}
          >
            <item.icon 
              className="w-5 h-5 shrink-0" 
            />
            <span className={`truncate ${isActive ? "font-medium" : ""}`}>
              {item.title}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}