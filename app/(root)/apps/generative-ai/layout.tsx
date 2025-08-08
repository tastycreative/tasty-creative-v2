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
  Download,
  ChevronDown,
  Menu,
  X,
  ImageIcon,
  PaintBucket,
} from "lucide-react";

type TabType =
  | "voice"
  | "video"
  | "gallery"
  | "prompt"
  | "dataset"
  | "vault"
  | "text2image"
  | "image2image"
  | "img2img"
  | "inpainting"
  | "instagram";

interface Tab {
  id: TabType;
  label: string;
  icon: React.ElementType;
  color: string;
  href: string;
  group: "generation" | "tools";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const tabs: Tab[] = [
    // Core AI Generation Tools
    {
      id: "voice",
      label: "AI Voice",
      icon: Sparkles,
      color: "from-pink-500 to-rose-500",
      href: "/apps/generative-ai/voice",
      group: "generation",
    },
    {
      id: "text2image",
      label: "Text-2-Image",
      icon: Type,
      color: "from-pink-600 to-rose-600",
      href: "/apps/generative-ai/text2image",
      group: "generation",
    },
    {
      id: "img2img",
      label: "Image-2-Image",
      icon: ImageIcon,
      color: "from-rose-500 to-pink-500",
      href: "/apps/generative-ai/img2img",
      group: "generation",
    },
    {
      id: "inpainting",
      label: "Inpainting",
      icon: PaintBucket,
      color: "from-amber-500 to-orange-500",
      href: "/apps/generative-ai/inpainting",
      group: "generation",
    },
    {
      id: "image2image",
      label: "Image-2-Image Masking",
      icon: RefreshCw,
      color: "from-pink-500 to-rose-500",
      href: "/apps/generative-ai/image2image",
      group: "generation",
    },
    {
      id: "video",
      label: "AI Video",
      icon: Video,
      color: "from-rose-600 to-pink-600",
      href: "/apps/generative-ai/video",
      group: "generation",
    },
    // Tools & Management
    {
      id: "prompt",
      label: "Prompt Gen",
      icon: PenTool,
      color: "from-pink-600 to-rose-600",
      href: "/apps/generative-ai/prompt",
      group: "tools",
    },
    {
      id: "instagram",
      label: "Instagram Scraper",
      icon: Download,
      color: "from-rose-500 to-pink-500",
      href: "/apps/generative-ai/instagram",
      group: "tools",
    },
    {
      id: "dataset",
      label: "Dataset",
      icon: Database,
      color: "from-pink-500 to-rose-500",
      href: "/apps/generative-ai/dataset",
      group: "tools",
    },
    {
      id: "vault",
      label: "Vault",
      icon: Archive,
      color: "from-rose-600 to-pink-600",
      href: "/apps/generative-ai/vault",
      group: "tools",
    },
    {
      id: "gallery",
      label: "Gallery",
      icon: GalleryThumbnails,
      color: "from-pink-600 to-rose-600",
      href: "/apps/generative-ai/gallery",
      group: "tools",
    },
  ];

  // Group tabs
  const generationTabs = tabs.filter((tab) => tab.group === "generation");
  const toolsTabs = tabs.filter((tab) => tab.group === "tools");

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
  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  const handleTabClick = (tab: Tab) => {
    // Immediately update the active tab state for instant visual feedback
    setActiveTabOverride(tab.id);
    router.push(tab.href);
  };

  const TabButton = ({
    tab,
    size = "default",
  }: {
    tab: Tab;
    size?: "default" | "small" | "large";
  }) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;

    const sizeClasses = {
      small: "px-3 py-2 gap-2 text-sm",
      default: "px-4 py-3 gap-2.5 text-sm",
      large: "px-5 py-3.5 gap-3 text-base",
    };

    return (
      <button
        onClick={() => handleTabClick(tab)}
        className={`relative flex items-center ${sizeClasses[size]} rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
          isActive
            ? "text-white"
            : "text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200"
        }`}
      >
        {/* Active Tab Background */}
        {isActive && (
          <div
            className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.color}`}
          />
        )}

        {/* Tab Content */}
        <div
          className={`relative z-10 flex items-center ${sizeClasses[size].includes("gap-2.5") ? "gap-2.5" : sizeClasses[size].includes("gap-3") ? "gap-3" : "gap-2"}`}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{tab.label}</span>
        </div>

        {/* Hover Glow Effect */}
        {isActive && (
          <div
            className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.color} blur-xl opacity-50`}
          />
        )}
      </button>
    );
  };

  return (
    <div className="w-full h-full flex flex-col min-h-screen">
      <title>Generative AI | Tasty Creative</title>

      {/* Header */}
      <div className="mb-6 sm:mb-8 lg:mb-10 px-4 sm:px-6 lg:px-0">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-700 dark:text-gray-100 mb-2 sm:mb-3">
          Generate AI Content
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
          Create AI voices, images, videos, and more with our powerful
          generative AI tools.
        </p>
      </div>

      {/* Navigation */}
      <div className="relative mb-6 sm:mb-8 lg:mb-10">
        {/* Mobile: Collapsible Menu */}
        <div className="block sm:hidden px-4">
          {/* Active Tab Display + Menu Toggle */}
          <div className="mb-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-pink-200 dark:border-pink-500/20"
            >
              <div className="flex items-center gap-3">
                {activeTabData && <activeTabData.icon className="w-5 h-5" />}
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {activeTabData?.label || "Select Tool"}
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-600 dark:text-gray-300 transition-transform duration-200 ${
                  isMobileMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-4 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-pink-200 dark:border-pink-500/20"
            >
              {/* Generation Tools */}
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-3">
                  AI Generation
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {generationTabs.map((tab) => (
                    <TabButton key={tab.id} tab={tab} size="small" />
                  ))}
                </div>
              </div>

              {/* Tools */}
              <div>
                <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-3">
                  Tools & Management
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {toolsTabs.map((tab) => (
                    <TabButton key={tab.id} tab={tab} size="small" />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Tablet & Desktop: Two-Row Layout */}
        <div className="hidden sm:block xl:hidden px-4 sm:px-6 lg:px-0">
          <div className="space-y-4">
            {/* Generation Tools Row */}
            <div>
              <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-3 px-1">
                AI Generation
              </h3>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 p-2 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-pink-200 dark:border-pink-500/20 min-w-max">
                  {generationTabs.map((tab) => (
                    <TabButton key={tab.id} tab={tab} size="default" />
                  ))}
                </div>
              </div>
            </div>

            {/* Tools Row */}
            <div>
              <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-3 px-1">
                Tools & Management
              </h3>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 p-2 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-pink-200 dark:border-pink-500/20 min-w-max">
                  {toolsTabs.map((tab) => (
                    <TabButton key={tab.id} tab={tab} size="default" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Large: Enhanced Layout */}
        <div className="hidden xl:block">
          <div className="space-y-5">
            {/* Generation Tools Row */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-4 px-1">
                AI Generation
              </h3>
              <div className="flex gap-4">
                <div className="flex gap-4 p-2 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-pink-200 dark:border-pink-500/20">
                  {generationTabs.map((tab) => (
                    <TabButton key={tab.id} tab={tab} size="large" />
                  ))}
                </div>
              </div>
            </div>

            {/* Tools Row */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-4 px-1">
                Tools & Management
              </h3>
              <div className="flex gap-4">
                <div className="flex gap-4 p-2 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-pink-200 dark:border-pink-500/20">
                  {toolsTabs.map((tab) => (
                    <TabButton key={tab.id} tab={tab} size="large" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 relative overflow-hidden px-4 sm:px-6 lg:px-0">
        {/* Content Container */}
        <div className="h-full rounded-xl sm:rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-pink-200 dark:border-pink-500/20 p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
