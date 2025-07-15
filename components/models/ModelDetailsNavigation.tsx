"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { Info, Image, MessageSquare, Zap, Users } from "lucide-react";

export default function ModelDetailsNavigation() {
  const pathname = usePathname();
  const params = useParams();
  const modelName = params?.modelName as string;

  const tabs = [
    { id: "info", label: "Information", icon: Info, color: "purple" },
    { id: "assets", label: "Assets", icon: Image, color: "pink" },
    { id: "chatters", label: "Chatters", icon: MessageSquare, color: "blue" },
    { id: "apps", label: "Apps", icon: Zap, color: "green" },
    { id: "forum", label: "Forum", icon: Users, color: "orange" },
  ];

  const getIsActive = (tabId: string) => {
    if (!pathname) return false;
    
    // Handle direct model page (should default to info)
    if (tabId === "info" && pathname.endsWith(`/models/${modelName}`)) {
      return true;
    }
    
    // Check if the current path ends with the tab id (more specific matching)
    if (pathname.endsWith(`/${tabId}`)) {
      return true;
    }
    
    // For info tab, also check if we're on the info page
    if (tabId === "info" && pathname.endsWith(`/${modelName}/info`)) {
      return true;
    }
    
    return false;
  };

  const getHref = (tabId: string) => {
    if (tabId === "info") {
      return `/apps/models/${modelName}/info`;
    }
    return `/apps/models/${modelName}/${tabId}`;
  };

  return (
    <div className="flex border-b border-slate-700/30 bg-slate-800/30">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = getIsActive(tab.id);

        return (
          <Link
            key={tab.id}
            href={getHref(tab.id)}
            prefetch={true}
            className={`
              flex-1 sm:flex-initial px-6 py-4 flex items-center justify-center gap-2 
              font-medium transition-all relative group
              ${isActive ? "text-white" : "text-gray-400 hover:text-gray-200"}
            `}
          >
            <Icon
              className={`
              w-5 h-5 transition-all
              ${isActive ? `text-${tab.color}-400` : ""}
              group-hover:scale-110
            `}
            />
            <span className="hidden sm:inline">{tab.label}</span>

            {/* Active indicator */}
            {isActive && (
              <>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500" />
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-purple-500/10 to-transparent" />
              </>
            )}

            {/* Hover effect */}
            {!isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
