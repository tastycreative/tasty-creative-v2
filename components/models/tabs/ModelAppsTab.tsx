"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Type,
  RefreshCw,
  Video,
  PenTool,
  Download,
  Database,
  Archive,
  ImageIcon,
  Palette,
  Gamepad2,
  Twitter,
  Users,
  Crown,
  Mic,
  Image,
  FileText,
} from "lucide-react";

// Import all the page components
import AIVoicePage from "@/components/AIVoicePage";
import AIText2ImagePage from "@/components/AIText2ImagePage";
import AIImage2ImagePage from "@/components/AIImage2ImagePage";
import AIVideoPage from "@/components/AIVideoPage";
import AIPromptPage from "@/components/AIPromptPage";
import AIInstagramScraperPage from "@/components/AIInstagramScraperPage";
import AIDatasetPage from "@/components/AIDatasetPage";
import AIVaultPage from "@/components/AIVaultPage";
import AIGalleryPage from "@/components/AIGalleryPage";
import AIStudioPage from "@/components/AIStudioPage";
import FTTPage from "@/components/FTTPage";
import GifMaker from "@/components/GifMaker";
import LiveFlyer from "@/components/LiveFlyer";
import VIPFlyer from "@/components/VIPFlyer";
import TwitterAdsPage from "@/components/TwitterAdsPage";

interface ModelAppsTabProps {
  modelName: string;
}

interface AppItem {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  category: "ai" | "generate";
  component: React.ComponentType<any>;
}

const ModelAppsTab: React.FC<ModelAppsTabProps> = ({ modelName }) => {
  const [activeApp, setActiveApp] = React.useState<string | null>(null);

  const apps: AppItem[] = [
    // Generate Apps
    {
      id: "ftt",
      name: "Fan to Fan",
      description: "Fan interaction and engagement tools",
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      category: "generate",
      component: FTTPage,
    },
    {
      id: "game",
      name: "Game Creator",
      description: "Interactive game generation",
      icon: Gamepad2,
      color: "from-green-500 to-emerald-500",
      category: "generate",
      component: GifMaker, // Using GifMaker as placeholder for game
    },
    {
      id: "gif",
      name: "GIF Maker",
      description: "Create animated GIFs from videos",
      icon: Image,
      color: "from-yellow-500 to-orange-500",
      category: "generate",
      component: GifMaker,
    },
    {
      id: "live",
      name: "Live Content",
      description: "Real-time content generation",
      icon: Mic,
      color: "from-red-500 to-pink-500",
      category: "generate",
      component: LiveFlyer,
    },
    {
      id: "twitter",
      name: "Twitter Ads",
      description: "Social media advertising tools",
      icon: Twitter,
      color: "from-blue-400 to-blue-600",
      category: "generate",
      component: TwitterAdsPage,
    },
    {
      id: "vip",
      name: "VIP Content",
      description: "Premium content creation",
      icon: Crown,
      color: "from-yellow-400 to-yellow-600",
      category: "generate",
      component: VIPFlyer,
    },
    // AI Apps
    {
      id: "voice",
      name: "AI Voice",
      description: "Generate realistic voice content",
      icon: Sparkles,
      color: "from-red-500 to-pink-500",
      category: "ai",
      component: AIVoicePage,
    },
    {
      id: "text2image",
      name: "Text-2-Image",
      description: "Create images from text descriptions",
      icon: Type,
      color: "from-violet-500 to-fuchsia-500",
      category: "ai",
      component: AIText2ImagePage,
    },
    {
      id: "image2image",
      name: "Image-2-Image",
      description: "Transform and enhance existing images",
      icon: RefreshCw,
      color: "from-cyan-500 to-blue-500",
      category: "ai",
      component: AIImage2ImagePage,
    },
    {
      id: "video",
      name: "AI Video",
      description: "Generate AI-powered video content",
      icon: Video,
      color: "from-blue-500 to-purple-500",
      category: "ai",
      component: AIVideoPage,
    },
    {
      id: "prompt",
      name: "Prompt Generator",
      description: "Create optimized AI prompts",
      icon: PenTool,
      color: "from-indigo-500 to-cyan-500",
      category: "ai",
      component: AIPromptPage,
    },
    {
      id: "instagram",
      name: "Instagram Scraper",
      description: "Extract content from Instagram",
      icon: Download,
      color: "from-pink-500 to-orange-500",
      category: "ai",
      component: AIInstagramScraperPage,
    },
    {
      id: "dataset",
      name: "Dataset Manager",
      description: "Manage AI training datasets",
      icon: Database,
      color: "from-orange-500 to-red-500",
      category: "ai",
      component: AIDatasetPage,
    },
    {
      id: "vault",
      name: "Content Vault",
      description: "Store and organize generated content",
      icon: Archive,
      color: "from-emerald-500 to-lime-500",
      category: "ai",
      component: AIVaultPage,
    },
    {
      id: "gallery",
      name: "AI Gallery",
      description: "Browse and manage AI creations",
      icon: ImageIcon,
      color: "from-teal-500 to-green-500",
      category: "ai",
      component: AIGalleryPage,
    },
    {
      id: "studio",
      name: "AI Studio",
      description: "Advanced AI content creation workspace",
      icon: Palette,
      color: "from-purple-600 to-blue-600",
      category: "ai",
      component: AIStudioPage,
    },
  ];

  const generateApps = apps.filter((app) => app.category === "generate");
  const aiApps = apps.filter((app) => app.category === "ai");

  if (activeApp) {
    const app = apps.find((a) => a.id === activeApp);
    if (app) {
      const Component = app.component;
      return (
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <app.icon className="w-6 h-6" />
              <h2 className="text-xl font-semibold">{app.name}</h2>
            </div>
            <button
              onClick={() => setActiveApp(null)}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Back to Apps
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <Component modelName={modelName} />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="p-6 space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Model Applications</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Explore all available tools and generators for {modelName}
        </p>
      </div>

      {/* Generate Apps Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Content Generation Tools
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {generateApps.map((app) => (
            <button
              key={app.id}
              onClick={() => setActiveApp(app.id)}
              className="p-6 rounded-xl bg-white/10 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700/30 hover:bg-white/20 dark:hover:bg-gray-700/50 transition-all duration-200 text-left group"
            >
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-r ${app.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}
              >
                <app.icon className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                {app.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {app.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* AI Apps Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
          AI Generation Tools
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aiApps.map((app) => (
            <button
              key={app.id}
              onClick={() => setActiveApp(app.id)}
              className="p-6 rounded-xl bg-white/10 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700/30 hover:bg-white/20 dark:hover:bg-gray-700/50 transition-all duration-200 text-left group"
            >
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-r ${app.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}
              >
                <app.icon className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                {app.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {app.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModelAppsTab;