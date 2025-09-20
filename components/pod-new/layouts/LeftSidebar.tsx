"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  PlayCircle,
  CalendarIcon,
  Upload,
  Users,
  Settings,
  Users2,
  Zap,
  Kanban,
} from "lucide-react";
import { ThemeToggle } from "@/components/admin/ThemeToggle";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: {
    text: string;
    variant?: "primary" | "secondary" | "success" | "warning" | "alert";
  } | null;
};

const navigation: { title: string; items: NavItem[] }[] = [
  {
    title: "Core",
    items: [
      {
        title: "Dashboard",
        href: "/apps/pod-new/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Board",
        href: "/apps/pod-new/board",
        icon: Kanban,
      },
      {
        title: "Workspace",
        href: "/apps/pod-new/workspace",
        icon: Briefcase,
      },
    ],
  },
  {
    title: "Content & Schedule",
    items: [
      {
        title: "Schedule Content",
        href: "/apps/pod-new/schedule",
        icon: Calendar,
      },
      {
        title: "Live Stream",
        href: "/apps/pod-new/live-stream",
        icon: PlayCircle,
        badge: { text: "Live", variant: "success" },
      },
      { title: "Calendar", href: "/apps/pod-new/calendar", icon: CalendarIcon },
    ],
  },
  {
    title: "Management",
    items: [
      {
        title: "My Models",
        href: "/apps/pod-new/my-models",
        icon: Users,
      },
      { title: "Team", href: "/apps/pod-new/team", icon: Users2 },
      {
        title: "OTP-PTR",
        href: "/apps/pod-new/otp-ptr",
        icon: Upload,
      },
    ],
  },
  {
    title: "Settings",
    items: [
      { title: "Settings", href: "/apps/pod-new/settings", icon: Settings },
    ],
  },
];

function Badge({
  text,
  variant = "primary",
}: {
  text: string;
  variant?: "primary" | "secondary" | "success" | "warning" | "alert";
}) {
  const variantClasses = {
    primary: "bg-blue-500/20 dark:bg-blue-500/30 text-blue-300 dark:text-blue-200 border-blue-500/30 dark:border-blue-400/40",
    secondary: "bg-gray-500/20 dark:bg-gray-500/30 text-gray-300 dark:text-gray-200 border-gray-500/30 dark:border-gray-400/40",
    success: "bg-green-500/20 dark:bg-green-500/30 text-green-300 dark:text-green-200 border-green-500/30 dark:border-green-400/40",
    warning: "bg-yellow-500/20 dark:bg-yellow-500/30 text-yellow-300 dark:text-yellow-200 border-yellow-500/30 dark:border-yellow-400/40",
    alert: "bg-red-500/20 dark:bg-red-500/30 text-red-300 dark:text-red-200 border-red-500/30 dark:border-red-400/40",
  } as const;
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] font-medium rounded-full border ${variantClasses[variant]}`}
    >
      {text}
    </span>
  );
}

export function LeftSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden xl:flex xl:flex-col sticky top-24 self-start rounded-2xl bg-white/90 dark:bg-slate-900/70 border border-slate-200/50 dark:border-white/10 shadow-sm w-[280px] overflow-hidden backdrop-blur-sm"
      role="navigation"
      aria-label="Primary navigation"
    >
      <div className="px-4 py-4 border-b border-slate-200/50 dark:border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm text-slate-800 dark:text-slate-200 font-semibold">
            Tasty Creative Pod
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400">POD Dashboard</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-6 min-h-0">
        {navigation.map((section) => (
          <div key={section.title} className="px-2">
            <div className="px-2 py-1">
              <h3 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {section.title}
              </h3>
            </div>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.title}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`group relative flex items-center gap-4 px-3.5 py-2.75 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${
                        isActive
                          ? "bg-gradient-to-r from-indigo-500/30 to-purple-500/20 dark:from-indigo-500/30 dark:to-purple-500/20 text-white dark:text-white ring-1 ring-inset ring-indigo-400/40 shadow-lg shadow-indigo-500/10"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-white/[0.08] hover:text-slate-800 dark:hover:text-white"
                      }`}
                    >
                      <item.icon
                        className={`w-5 h-5 shrink-0 transition-colors ${
                          isActive
                            ? "text-indigo-300 dark:text-indigo-300"
                            : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                        }`}
                      />
                      <span
                        className={`text-sm truncate ${isActive ? "font-medium" : ""}`}
                      >
                        {item.title}
                      </span>
                      {item.badge && (
                        <div className="ml-auto">
                          <Badge
                            text={item.badge.text}
                            variant={item.badge.variant}
                          />
                        </div>
                      )}
                      {isActive && (
                        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-400 dark:bg-indigo-400 rounded-full opacity-60" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {/* Add Theme Toggle to Settings section */}
            {section.title === "Settings" && (
              <div className="mt-3 px-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Theme
                  </span>
                  <ThemeToggle />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}

export default LeftSidebar;
