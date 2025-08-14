"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sparkles, Crown, Gamepad2, Zap, Twitter, Film } from "lucide-react";

type TabType =
  | "live"
  | "vip"
  | "game"
  | "ftt"
  | "twitter"
  | "gif"
  | "gif2"
  | "gif3";

interface Tab {
  id: TabType;
  label: string;
  icon: React.ElementType;
  color: string;
  href: string;
}

interface GenerateLayoutProps {
  children: React.ReactNode;
}

export default function GenerateLayout({ children }: GenerateLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const [activeTabOverride, setActiveTabOverride] = useState<TabType | null>(
    null
  );

  useEffect(() => {
    // Small delay to ensure smooth transition
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Reset override when pathname actually changes
  useEffect(() => {
    setActiveTabOverride(null);
  }, [pathname]);

  const tabs: Tab[] = [
    {
      id: "live",
      label: "Live",
      icon: Sparkles,
      color: "from-red-500 to-pink-500",
      href: "/apps/generate/live",
    },
    {
      id: "vip",
      label: "VIP",
      icon: Crown,
      color: "from-yellow-500 to-amber-500",
      href: "/apps/generate/vip",
    },
    {
      id: "game",
      label: "Game",
      icon: Gamepad2,
      color: "from-purple-500 to-indigo-500",
      href: "/apps/generate/game",
    },
    {
      id: "ftt",
      label: "FTT",
      icon: Zap,
      color: "from-blue-500 to-cyan-500",
      href: "/apps/generate/ftt",
    },
    {
      id: "twitter",
      label: "Twitter Ads",
      icon: Twitter,
      color: "from-sky-500 to-blue-500",
      href: "/apps/generate/twitter",
    },
    {
      id: "gif",
      label: "GIF Maker",
      icon: Film,
      color: "from-green-500 to-emerald-500",
      href: "/apps/generate/gif",
    },
    {
      id: "gif2",
      label: "GIF Maker2",
      icon: Film,
      color: "from-green-500 to-emerald-500",
      href: "/apps/generate/gif2",
    },
    {
      id: "gif3",
      label: "GIF Maker 3",
      icon: Film,
      color: "from-emerald-500 to-teal-500",
      href: "/apps/generate/gif3",
    },
  ];

  // Get active tab based on current pathname
  const getActiveTab = (): TabType => {
    // If we have an override (user clicked but page hasn't loaded), use that
    if (activeTabOverride) {
      return activeTabOverride;
    }

    const currentTab = tabs.find((tab) => pathname === tab.href);
    return currentTab?.id || "live";
  };

  const activeTab = getActiveTab();

  const handleTabClick = (tab: Tab) => {
    // Immediately update the active tab state for instant visual feedback
    setActiveTabOverride(tab.id);
    router.push(tab.href);
  };

  return (
    <div
      className="w-full h-full flex flex-col"
      //initial={{ opacity: 0 }}
      //animate={{ opacity: isReady ? 1 : 0 }}
      //transition={{ duration: 0.3 }}
    >
      <title>Generate | Tasty Creative</title>
      {/* Header */}
      <div
        className="mb-8"
        //initial={{ opacity: 0, y: -20 }}
        //animate={{ opacity: isReady ? 1 : 0, y: isReady ? 0 : -20 }}
        //transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 bg-clip-text text-transparent mb-2">
          Generate Content
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Create stunning visuals for your campaigns
        </p>
      </div>

      {/* Tabs Navigation */}
      <div
        className="relative mb-8"
        //initial={{ opacity: 0, y: -10 }}
        //animate={{ opacity: isReady ? 1 : 0, y: isReady ? 0 : -10 }}
        //transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* Tabs Container */}
        <div className="flex gap-2 p-1 rounded-2xl bg-white/20 dark:bg-gray-800/20 backdrop-blur-md border border-pink-200/30 dark:border-pink-500/30">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`relative flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isActive
                    ? "text-white"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                }`}
                // //whileHover={{ scale: 1.05 }}
                // //whileTap={{ scale: 0.95 }}
              >
                {/* Active Tab Background */}
                {isActive && (
                  <div
                    // layoutId="activeTab"
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.color}`}
                    //initial={false}
                    //transition={{
                    //   type: "spring",
                    //   stiffness: 300,
                    //   damping: 30,
                    // }}
                  />
                )}

                {/* Tab Content */}
                <div className="relative z-10 flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm lg:text-base">{tab.label}</span>
                </div>

                {/* Hover Glow Effect */}
                {isActive && (
                  <div
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.color} blur-xl opacity-50`}
                    //initial={{ opacity: 0 }}
                    //animate={{ opacity: 0.5 }}
                    //exit={{ opacity: 0 }}
                    //transition={{ duration: 0.3 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div
        className="flex-1 relative overflow-hidden"
        //initial={{ opacity: 0 }}
        //animate={{ opacity: isReady ? 1 : 0 }}
        //transition={{ duration: 0.4, delay: 0.3 }}
      >
        {/* Content Container */}
        <div className="h-full rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-pink-200/50 dark:border-pink-500/30 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
