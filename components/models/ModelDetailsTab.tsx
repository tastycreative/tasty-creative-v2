"use client";
import { Info, Image, MessageSquare, Zap, Users } from "lucide-react";

interface ModelDetailsTabsProps {
  activeTab: "info" | "assets" | "chatters" | "apps" | "forum";
  setActiveTab: (
    tab: "info" | "assets" | "chatters" | "apps" | "forum"
  ) => void;
}

export default function ModelDetailsTabs({
  activeTab,
  setActiveTab,
}: ModelDetailsTabsProps) {
  const tabs = [
    { id: "info" as const, label: "Information", icon: Info, color: "purple" },
    { id: "assets" as const, label: "Assets", icon: Image, color: "pink" },
    {
      id: "chatters" as const,
      label: "Chatters",
      icon: MessageSquare,
      color: "blue",
    },
    { id: "apps" as const, label: "Apps", icon: Zap, color: "green" },
    { id: "forum" as const, label: "Forum", icon: Users, color: "orange" },
  ];

  return (
    <div className="flex border-b border-slate-700/30 bg-slate-800/30">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
          </button>
        );
      })}
    </div>
  );
}
