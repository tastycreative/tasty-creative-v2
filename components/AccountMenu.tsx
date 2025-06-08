"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { handleLogout } from "@/app/actions/sign-out";
import { Session } from "next-auth";

const AccountMenu = ({ session, collapsed }: { session: Session | null; collapsed?: boolean }) => {
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
      <div className="mb-6 flex justify-center">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 flex items-center justify-center text-white text-sm font-semibold shadow-md">
            {image && !imgError ? (
              <img
                src={image}
                alt="profile-picture"
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-xs">{initials}</span>
            )}
          </div>
          <div className="rounded-full bg-emerald-400 dark:bg-emerald-500 w-3 h-3 absolute -bottom-0.5 -right-0.5 border-2 border-white dark:border-slate-900 shadow-sm"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mb-6">
      <input type="checkbox" id="menu-dropdown" className="peer hidden" />
      <label
        htmlFor="menu-dropdown"
        className="w-full flex select-none items-center gap-3 p-3 lg:p-4 rounded-xl cursor-pointer bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/50 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-slate-700 dark:hover:to-slate-700/50 transition-all duration-200 border border-blue-100/50 dark:border-slate-700/50 shadow-sm"
      >
        <div className="flex gap-3 items-center flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 flex items-center justify-center text-white text-sm font-semibold shadow-md">
              {image && !imgError ? (
                <img
                  src={image}
                  alt="profile-picture"
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="text-xs lg:text-sm">{initials}</span>
              )}
            </div>
            <div className="rounded-full bg-emerald-400 dark:bg-emerald-500 w-3 h-3 absolute -bottom-0.5 -right-0.5 border-2 border-white dark:border-slate-900 shadow-sm"></div>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{name || "Guest"}</h1>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Online</p>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 peer-checked:rotate-180 flex-shrink-0" />
      </label>

      <div className="absolute top-full left-0 right-0 mt-2 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-2 hidden peer-checked:flex flex-col gap-1 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl shadow-lg z-20">
        <button className="text-left hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 font-medium transition-colors">
          Account Settings
        </button>
        <button
          className="text-left hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 font-medium transition-colors"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default AccountMenu;