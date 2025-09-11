"use client";

import React, { useState } from "react";
import { ChevronDown, Settings, LogOut } from "lucide-react";
import { handleLogout } from "@/app/actions/sign-out";
import { Session } from "next-auth";

const AccountMenu = ({
  session,
  collapsed,
}: {
  session: Session | null;
  collapsed?: boolean;
}) => {
  const { name, image } = session?.user || {};
  const [imgError, setImgError] = useState(false);

  const initials = (name || "Guest")
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (collapsed) {
    return (
      <div className="p-4 flex justify-center">
        <div className="relative">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
            {image && !imgError ? (
              <img
                src={`/api/image-proxy?url=${encodeURIComponent(image)}`}
                alt="profile-picture"
                className="w-full h-full object-cover border-2 border-pink-200 dark:border-pink-500/30"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-xs">{initials}</span>
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <input type="checkbox" id="menu-dropdown" className="peer hidden" />
      <label
        htmlFor="menu-dropdown"
        className="w-full flex select-none items-center gap-3 p-4 cursor-pointer bg-gradient-to-r from-gray-50 to-pink-50 dark:from-gray-800 dark:to-gray-800/80 hover:from-gray-100 hover:to-pink-100 dark:hover:from-gray-700 dark:hover:to-gray-700/80 transition-all duration-200 border border-pink-100 dark:border-pink-500/20"
      >
        <div className="relative flex-shrink-0">
          {image && !imgError ? (
            <img
              src={`/api/image-proxy?url=${encodeURIComponent(image)}`}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-pink-200 dark:border-pink-500/30"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <span className="h-5 w-5 text-white text-sm font-medium">{initials}</span>
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {name || "Guest"}
            </div>
            <span className="text-xs bg-gradient-to-r from-pink-500 to-rose-500 text-white px-2 py-1 rounded-full font-medium">
              {session?.user?.role || "USER"}
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {session?.user?.email || "guest@example.com"}
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 peer-checked:rotate-180 flex-shrink-0" />
      </label>

      <div className="absolute top-full left-0 right-0 mt-2 border border-pink-200 dark:border-pink-500/30 p-2 hidden peer-checked:flex flex-col gap-1 bg-white dark:bg-gray-800 backdrop-blur-xl shadow-lg z-20">
        <button className="text-left hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 font-medium transition-colors flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Account Settings
        </button>
        <div className="border-t border-pink-200 dark:border-pink-500/30 my-1"></div>
        <button
          className="text-left hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 text-sm text-red-600 dark:text-red-400 font-medium transition-colors flex items-center gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default AccountMenu;
