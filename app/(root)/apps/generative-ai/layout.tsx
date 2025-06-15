"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import {
  Sparkles,
  Video,
  GalleryThumbnails,
  PenTool,
  Database,
  Archive,
  Type,
  RefreshCw,
} from "lucide-react";

type TabType =
  | "voice"
  | "video"
  | "gallery"
  | "prompt"
  | "dataset"
  | "vault"
  | "text2image"
  | "image2image";

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

export default function GenerateAILayout({ children }: GenerateLayoutProps) {
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
      id: "voice",
      label: "AI Voice",
      icon: Sparkles,
      color: "from-red-500 to-pink-500",
      href: "/apps/generative-ai/voice",
    },
    {
      id: "text2image",
      label: "Text-2-Image",
      icon: Type,
      color: "from-violet-500 to-fuchsia-500",
      href: "/apps/generative-ai/text2image",
    },
    {
      id: "image2image",
      label: "Image-2-Image",
      icon: RefreshCw,
      color: "from-cyan-500 to-blue-500",
      href: "/apps/generative-ai/image2image",
    },
    {
      id: "video",
      label: "AI Video",
      icon: Video,
      color: "from-blue-500 to-purple-500",
      href: "/apps/generative-ai/video",
    },
    {
      id: "prompt",
      label: "Prompt Gen",
      icon: PenTool,
      color: "from-indigo-500 to-cyan-500",
      href: "/apps/generative-ai/prompt",
    },
    {
      id: "dataset",
      label: "Dataset",
      icon: Database,
      color: "from-orange-500 to-red-500",
      href: "/apps/generative-ai/dataset",
    },
    {
      id: "vault",
      label: "Vault",
      icon: Archive,
      color: "from-emerald-500 to-lime-500",
      href: "/apps/generative-ai/vault",
    },
    {
      id: "gallery",
      label: "Gallery",
      icon: GalleryThumbnails,
      color: "from-purple-500 to-pink-500",
      href: "/apps/generative-ai/gallery",
    },
  ];

  // Get active tab based on current pathname
  const getActiveTab = (): TabType => {
    // If we have an override (user clicked but page hasn't loaded), use that
    if (activeTabOverride) {
      return activeTabOverride;
    }

    const currentTab = tabs.find((tab) => pathname === tab.href);
    return currentTab?.id || "voice";
  };

  const activeTab = getActiveTab();

  const handleTabClick = (tab: Tab) => {
    // Immediately update the active tab state for instant visual feedback
    setActiveTabOverride(tab.id);
    router.push(tab.href);
  };

  return (
    <div className="w-full h-full flex flex-col min-h-screen">
      <title>Generative AI | Tasty Creative</title>

      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8 px-4 sm:px-6 lg:px-0">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white mb-1 sm:mb-2">
          Generate AI Content
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
          Create AI voices, images, videos, and more with our powerful
          generative AI tools.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="relative mb-4 sm:mb-6 lg:mb-8">
        {/* Mobile: Horizontal Scroll */}
        <div className="block sm:hidden">
          <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 p-1 rounded-2xl bg-white/10 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700/30 min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab)}
                    className={`relative flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? "text-white"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    }`}
                  >
                    {/* Active Tab Background */}
                    {isActive && (
                      <div
                        className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.color}`}
                      />
                    )}

                    {/* Tab Content */}
                    <div className="relative z-10 flex items-center gap-1.5">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-medium">{tab.label}</span>
                    </div>

                    {/* Hover Glow Effect */}
                    {isActive && (
                      <div
                        className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.color} blur-xl opacity-50`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tablet: Wrap Layout */}
        <div className="hidden sm:block lg:hidden px-4 sm:px-6">
          <div className="flex flex-wrap gap-2 p-1 rounded-2xl bg-white/10 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700/30">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`relative flex items-center gap-2 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                    isActive
                      ? "text-white"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  {/* Active Tab Background */}
                  {isActive && (
                    <div
                      className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.color}`}
                    />
                  )}

                  {/* Tab Content */}
                  <div className="relative z-10 flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{tab.label}</span>
                  </div>

                  {/* Hover Glow Effect */}
                  {isActive && (
                    <div
                      className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.color} blur-xl opacity-50`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop: Full Layout */}
        <div className="hidden lg:block">
          <div className="flex gap-2 p-1 rounded-2xl bg-white/10 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700/30">
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
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  {/* Active Tab Background */}
                  {isActive && (
                    <div
                      className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.color}`}
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
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 relative overflow-hidden px-4 sm:px-6 lg:px-0">
        {/* Content Container */}
        <div className="h-full rounded-xl sm:rounded-2xl bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm border border-white/10 dark:border-gray-700/20 p-3 sm:p-4 lg:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
