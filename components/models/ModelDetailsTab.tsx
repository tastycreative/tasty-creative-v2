// components/models/ModelDetailsTabs.tsx
"use client";

import { Info, Image, MessageSquare, Zap } from "lucide-react";

export default function ModelDetailsTabs({
  activeTab,
  setActiveTab,
}: ModelDetailsTabsProps) {
  const tabs = [
    { id: "info" as const, label: "Information", icon: Info },
    { id: "assets" as const, label: "Assets", icon: Image },
    { id: "chatters" as const, label: "Chatters", icon: MessageSquare },
    { id: "apps" as const, label: "Apps", icon: Zap },
  ];

  return (
    <div className="flex border-b border-white/10">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 sm:flex-//initial px-6 py-4 flex items-center justify-center gap-2 font-medium transition-all relative ${
              activeTab === tab.id
                ? "text-purple-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="hidden sm:inline">{tab.label}</span>
            {activeTab === tab.id && (
              <div
                // layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
