"use client";

import {
  AppWindow,
  Calendar1,
  House,
  LayoutDashboard,
  UserLock,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import clsx from "clsx";
import { Session } from "next-auth";

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
      "flex items-center transition-all duration-200 group relative -mx-4 px-4 py-2",
      collapsed ? "justify-center" : "gap-3",
      "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800",
      isActive(path) &&
        "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
    );

  const iconClass = (path: string) =>
    clsx(
      "w-5 h-5 flex-shrink-0 transition-colors",
      isActive(path) 
        ? "text-white"
        : "text-gray-600 dark:text-gray-300"
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
    ...(session?.user?.role === "ADMIN" ? [{ href: "/admin/dashboard", icon: UserLock, label: "Admin" }] : []),
  ];

  return (
    <div className="flex-1 flex flex-col">
      <nav className="p-4 space-y-2 overflow-y-auto">
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
            
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                {label}
              </div>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default SideMenu;