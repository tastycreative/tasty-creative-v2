"use client";

import {
  AppWindow,
  Calendar1,
  House,
  LayoutDashboard,
  Settings,
  UserLock,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import clsx from "clsx";
import { Session } from "next-auth";
import { ThemeToggle } from "./admin/ThemeToggle";

interface SideMenuProps {
  collapsed?: boolean;
  onItemClick?: () => void;
  session: Session | null;
}

const SideMenu = ({ collapsed, onItemClick, session }: SideMenuProps) => {
  const pathname = usePathname();
  const [clickedPath, setClickedPath] = useState<string | null>(null);

  useEffect(() => {
    setClickedPath(null);
  }, [pathname]);

  const isActive = (path: string) => pathname === path || clickedPath === path;

  const linkClass = (path: string) =>
    clsx(
      "flex items-center rounded-xl transition-all duration-200 group relative",
      collapsed ? "p-3 justify-center" : "gap-3 p-3",
      "text-slate-700 dark:text-gray-300 hover:text-pink-700 dark:hover:text-pink-400",
      "hover:bg-pink-50 dark:hover:bg-pink-900/30",
      isActive(path) &&
        "bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 shadow-sm",
        session?.user?.role != "ADMIN" && path === "/admin/users" && "hidden"
    );

  const iconClass = (path: string) =>
    clsx(
      "w-5 h-5 flex-shrink-0 transition-colors",
      "text-slate-500 dark:text-gray-400 group-hover:text-pink-600 dark:group-hover:text-pink-400",
      isActive(path) && "text-pink-700 dark:text-pink-300"
    );

  const handleClick = (path: string) => () => {
    setClickedPath(path);
    // Call the onItemClick callback for mobile menu closing
    onItemClick?.();
  };

  const menuItems = [
    { href: "/", icon: House, label: "Home" },
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/apps", icon: AppWindow, label: "Apps" },
    { href: "/calendar", icon: Calendar1, label: "Calendar" },
    { href: "/admin/dashboard", icon: UserLock, label: "Admin" },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between">
      <nav
        className={clsx(
          "space-y-1 lg:space-y-2",
          collapsed && "flex flex-col items-center"
        )}
      >
        {menuItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            onClick={handleClick(href)}
            className={linkClass(href)}
            title={collapsed ? label : undefined}
          >
            <Icon className={iconClass(href)} />
            {!collapsed && (
              <span className="font-medium transition-opacity duration-200">
                {label}
              </span>
            )}
            
            {/* Active indicator for collapsed state */}
            {collapsed && isActive(href) && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-pink-600 rounded-r-full" />
            )}
            
            {/* Tooltip for collapsed state */}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                {label}
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-700 rotate-45" />
              </div>
            )}
          </Link>
        ))}
      </nav>

      <div className={clsx(
        "mt-4 pt-4 space-y-2",
        "border-t border-slate-200/50 dark:border-slate-600/50"
      )}>
        {/* Settings and Theme Toggle Row */}
        <div className={clsx(
          "flex items-center",
          collapsed ? "flex-col space-y-2" : "gap-2"
        )}>
          <Link
            href="/settings"
            onClick={handleClick("/settings")}
            className={clsx(
              "flex items-center rounded-xl transition-all duration-200 group relative",
              collapsed ? "p-3 justify-center" : "gap-3 p-3",
              "hover:bg-pink-50 dark:hover:bg-pink-900/30",
              "text-slate-600 dark:text-gray-400 hover:text-pink-700 dark:hover:text-pink-400",
              isActive("/settings") &&
                "bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 shadow-sm",
              collapsed ? "w-full" : "flex-1"
            )}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings
              className={clsx(
                "w-5 h-5 flex-shrink-0 transition-colors",
                "text-slate-400 dark:text-gray-500 group-hover:text-pink-600 dark:group-hover:text-pink-400",
                isActive("/settings") && "text-pink-700 dark:text-pink-300"
              )}
            />
            {!collapsed && (
              <span className="font-medium transition-opacity duration-200">
                Settings
              </span>
            )}
            
            {/* Active indicator for collapsed state */}
            {collapsed && isActive("/settings") && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-pink-600 rounded-r-full" />
            )}
            
            {/* Tooltip for collapsed state */}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                Settings
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-700 rotate-45" />
              </div>
            )}
          </Link>
          
          {/* Theme Toggle */}
          <div className={clsx(
            "flex",
            collapsed ? "justify-center w-full" : "justify-end"
          )}>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideMenu;