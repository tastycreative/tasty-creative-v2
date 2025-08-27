
"use client";

import React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
  ArrowLeft,
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
import { VideoEditor } from "@/components/video-editor/VideoEditor";

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
  component: React.ComponentType<Record<string, unknown>>;
}

const ModelAppsTab: React.FC<ModelAppsTabProps> = ({ modelName }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const activeApp = searchParams?.get('tab') || null;

  const setActiveApp = (appId: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    
    if (appId) {
      params.set('tab', appId);
    } else {
      // Only remove the 'tab' parameter, keep all other parameters
      params.delete('tab');
    }
    
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname || '';
    router.replace(newUrl);
  };

  const apps: AppItem[] = [
    // Generate Apps
    {
      id: "ftt",
      name: "First to Tip",
      description: "First to Tip flyer generator",
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
      component: VideoEditor,
    },
    {
      id: "live",
      name: "Live Flyer",
      description: "Live Flyer content generation",
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
      name: "VIP Flyer",
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
      color: "from-pink-500 to-rose-500",
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
      color: "from-pink-500 to-rose-500",
      category: "ai",
      component: AIDatasetPage,
    },
    {
      id: "vault",
      name: "Content Vault",
      description: "Store and organize generated content",
      icon: Archive,
      color: "from-pink-500 to-rose-500",
      category: "ai",
      component: AIVaultPage,
    },
    {
      id: "gallery",
      name: "AI Gallery",
      description: "Browse and manage AI creations",
      icon: ImageIcon,
      color: "from-pink-500 to-rose-500",
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
        <div className="h-full flex flex-col bg-white/90 dark:bg-gray-900/90">
          <div className="flex items-center justify-between p-6 border-b border-pink-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${app.color} flex items-center justify-center`}>
                <app.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{app.name}</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{app.description}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveApp(null)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-white/90 dark:bg-gray-700/90 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-pink-50 dark:hover:bg-gray-600 transition-colors border border-pink-200 dark:border-gray-600"
            >
              <ArrowLeft className="w-4 h-4" />
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
    <div className="w-full max-w-7xl mx-auto p-4 lg:p-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-3">
          Model Applications
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          Explore all available tools and generators for <span className="text-pink-600 dark:text-pink-400 font-medium">{modelName}</span>
        </p>
      </div>

      {/* Generate Apps Section */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
            <PenTool className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Content Generation Tools</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-pink-200 dark:from-pink-400/50 to-transparent" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generateApps.map((app) => (
            <button
              key={app.id}
              onClick={() => setActiveApp(app.id)}
              className="group relative p-6 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-pink-200 dark:border-gray-600 hover:border-pink-300 dark:hover:border-gray-500 transition-all duration-300 text-left overflow-hidden"
            >
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-50/60 to-rose-50/60 dark:from-gray-700/30 dark:to-gray-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${app.color} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  <app.icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                  {app.name}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                  {app.description}
                </p>
              </div>
              
              {/* Hover Effect */}
              <div className="absolute inset-0 border border-transparent group-hover:border-pink-300/30 dark:group-hover:border-gray-500/50 rounded-xl transition-all duration-300" />
            </button>
          ))}
        </div>
      </div>

      {/* AI Apps Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Generation Tools</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-pink-200 dark:from-pink-400/50 to-transparent" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aiApps.map((app) => (
            <button
              key={app.id}
              onClick={() => setActiveApp(app.id)}
              className="group relative p-6 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-pink-200 dark:border-gray-600 hover:border-pink-300 dark:hover:border-gray-500 transition-all duration-300 text-left overflow-hidden"
            >
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-50/60 to-rose-50/60 dark:from-gray-700/30 dark:to-gray-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Content */}
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${app.color} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  <app.icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                  {app.name}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                  {app.description}
                </p>
              </div>
              
              {/* Hover Effect */}
              <div className="absolute inset-0 border border-transparent group-hover:border-pink-300/30 dark:group-hover:border-gray-500/50 rounded-xl transition-all duration-300" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModelAppsTab;
