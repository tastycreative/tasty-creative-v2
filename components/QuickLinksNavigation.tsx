"use client";
import React, { useState } from "react";
import { Plus } from "lucide-react";
import { appPages } from "@/lib/lib";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

const QuicklinksNavigation = () => {
  const pathName = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  if (session?.user?.role === "GUEST" ) {
    return null;
  }
  if(!session) {
    return null
  }
  if (pathName === "/sign-in" || pathName === "/sign-up" || pathName === "/apps/generate/gif3") {
    return null;
  }

  return (
    <div className="fixed bottom-8 right-8 z-999 opacity-20 hover:opacity-100 transition-opacity duration-500 ease-in-out">
      {/* Main Container */}
      <div
        className="relative"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {/* Quicklinks Menu */}
        <div
          className={`absolute bottom-20 right-0 grid grid-cols-3 gap-2 p-4 bg-gradient-to-br from-gray-50 via-white to-pink-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-pink-900/20 backdrop-blur-2xl rounded-2xl shadow-2xl border border-pink-200/50 dark:border-pink-700/30 transition-all duration-500 transform origin-bottom-right ${
            isOpen
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-90 translate-y-4 pointer-events-none"
          }`}
          style={{ minWidth: "360px", maxHeight: "70vh", overflowY: "auto" }}
        >
          {/* Menu Header */}
          <div className="col-span-3 mb-2 pb-2 border-b border-pink-200/70 dark:border-pink-700/50">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
              Quick Links
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Access your apps quickly
            </p>
          </div>

          {/* App Links */}
          {appPages.map((app, index) => {
            const Icon = app.icon;
            const isHovered = hoveredItem === app.id;

            return (
              <button
                key={app.id}
                className={`group relative overflow-hidden rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                  isOpen ? "animate-fadeInUp" : ""
                }`}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
                onMouseEnter={() => setHoveredItem(app.id)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => handleNavigation(app.path)}
              >
                {/* Gradient Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${app.color} transition-opacity duration-300 ${
                    isHovered ? "opacity-100" : "opacity-90"
                  }`}
                />

                {/* Glow Effect */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${app.color} blur-2xl transition-opacity duration-500 ${
                    isHovered ? "opacity-50" : "opacity-0"
                  }`}
                />

                {/* Glass Overlay */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />

                {/* Content */}
                <div className="relative z-10 p-3 text-white">
                  <Icon
                    className={`w-6 h-6 mb-1 transition-transform duration-300 ${
                      isHovered ? "scale-110" : ""
                    }`}
                  />
                  <div className="font-semibold text-xs leading-tight">{app.name}</div>
                  <div
                    className={`text-xs mt-1 text-white/80 transition-all duration-300 leading-tight ${
                      isHovered
                        ? "opacity-100 max-h-20"
                        : "opacity-0 max-h-0 overflow-hidden"
                    }`}
                  >
                    {app.description}
                  </div>
                </div>

                {/* Hover Animation */}
                <div
                  className={`absolute inset-0 bg-white/20 transition-transform duration-300 ${
                    isHovered ? "translate-y-0" : "translate-y-full"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Trigger Button */}
        <button
          className={`relative z-20 w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-2xl transition-all duration-500 transform group ${
            isOpen ? "rotate-45 scale-110" : "hover:scale-110"
          }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {/* Pulse Ring */}
          {/* <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" /> */}

          {/* Rotating Ring */}
          <div
            className={`absolute inset-0 rounded-full border-2 border-white/30 transition-all duration-700 ${
              isOpen ? "scale-125 opacity-0" : "scale-100 opacity-100"
            }`}
          />

          {/* Inner Glow */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-transparent" />

          {/* Icon */}
          <Plus
            className={`w-8 h-8 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
              isOpen ? "rotate-45 scale-125" : "group-hover:scale-110"
            }`}
          />

          {/* Tooltip */}
          <div
            className={`absolute -top-14 left-1/2 -translate-x-1/2 px-4 py-2 bg-gradient-to-r from-gray-50 to-pink-50 text-gray-800 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-300 border border-pink-200/50 shadow-lg ${
              isOpen
                ? "opacity-0 scale-95 -translate-y-2"
                : "opacity-0 group-hover:opacity-100 scale-100 translate-y-0"
            }`}
          >
            Quick Links
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gradient-to-r from-gray-50 to-pink-50 rotate-45 border-b border-r border-pink-200/50" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default QuicklinksNavigation;
