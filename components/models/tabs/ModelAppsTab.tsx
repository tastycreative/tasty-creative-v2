
"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Video,
  Type,
  RefreshCw,
  PenTool,
  Download,
  Database,
  Archive,
  ImageIcon,
  Palette,
  Camera,
  Zap,
  Crown,
  Users,
  Gift,
  Hash,
  Twitter,
  Play,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AppItem {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  href: string;
  category: "generate" | "ai";
}

export default function ModelAppsTab({ modelName }: { modelName: string }) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<"all" | "generate" | "ai">("all");

  const apps: AppItem[] = [
    // Generate Apps
    {
      id: "live",
      name: "Live Flyers",
      description: "Create engaging live stream promotional content",
      icon: Sparkles,
      color: "from-red-500 to-pink-500",
      href: `/apps/models/${encodeURIComponent(modelName)}/live`,
      category: "generate",
    },
    {
      id: "vip",
      name: "VIP Flyers",
      description: "Design premium VIP promotional materials",
      icon: Crown,
      color: "from-yellow-500 to-amber-500",
      href: `/apps/models/${encodeURIComponent(modelName)}/vip`,
      category: "generate",
    },
    {
      id: "ftt",
      name: "FTT Content",
      description: "Generate first-time tipper content",
      icon: Zap,
      color: "from-blue-500 to-cyan-500",
      href: `/apps/models/${encodeURIComponent(modelName)}/ftt`,
      category: "generate",
    },
    {
      id: "game",
      name: "Game Content",
      description: "Create interactive gaming content",
      icon: Play,
      color: "from-green-500 to-emerald-500",
      href: `/apps/models/${encodeURIComponent(modelName)}/game`,
      category: "generate",
    },
    {
      id: "gif",
      name: "GIF Maker",
      description: "Create animated GIFs and short clips",
      icon: Camera,
      color: "from-purple-500 to-indigo-500",
      href: `/apps/models/${encodeURIComponent(modelName)}/gif`,
      category: "generate",
    },
    {
      id: "twitter",
      name: "Twitter Ads",
      description: "Generate Twitter advertising content",
      icon: Twitter,
      color: "from-blue-400 to-blue-600",
      href: `/apps/models/${encodeURIComponent(modelName)}/twitter`,
      category: "generate",
    },
    // AI Apps
    {
      id: "voice",
      name: "AI Voice",
      description: "Generate realistic voice content",
      icon: Sparkles,
      color: "from-red-500 to-pink-500",
      href: `/apps/models/${encodeURIComponent(modelName)}/voice`,
      category: "ai",
    },
    {
      id: "text2image",
      name: "Text-2-Image",
      description: "Create images from text descriptions",
      icon: Type,
      color: "from-violet-500 to-fuchsia-500",
      href: `/apps/models/${encodeURIComponent(modelName)}/text2image`,
      category: "ai",
    },
    {
      id: "image2image",
      name: "Image-2-Image",
      description: "Transform and enhance existing images",
      icon: RefreshCw,
      color: "from-cyan-500 to-blue-500",
      href: `/apps/models/${encodeURIComponent(modelName)}/image2image`,
      category: "ai",
    },
    {
      id: "video",
      name: "AI Video",
      description: "Generate AI-powered video content",
      icon: Video,
      color: "from-blue-500 to-purple-500",
      href: `/apps/models/${encodeURIComponent(modelName)}/video`,
      category: "ai",
    },
    {
      id: "prompt",
      name: "Prompt Generator",
      description: "Create optimized AI prompts",
      icon: PenTool,
      color: "from-indigo-500 to-cyan-500",
      href: `/apps/models/${encodeURIComponent(modelName)}/prompt`,
      category: "ai",
    },
    {
      id: "instagram",
      name: "Instagram Scraper",
      description: "Extract content from Instagram",
      icon: Download,
      color: "from-pink-500 to-orange-500",
      href: `/apps/models/${encodeURIComponent(modelName)}/instagram`,
      category: "ai",
    },
    {
      id: "dataset",
      name: "Dataset Manager",
      description: "Manage AI training datasets",
      icon: Database,
      color: "from-orange-500 to-red-500",
      href: `/apps/models/${encodeURIComponent(modelName)}/dataset`,
      category: "ai",
    },
    {
      id: "vault",
      name: "Content Vault",
      description: "Store and organize generated content",
      icon: Archive,
      color: "from-emerald-500 to-lime-500",
      href: `/apps/models/${encodeURIComponent(modelName)}/vault`,
      category: "ai",
    },
    {
      id: "gallery",
      name: "AI Gallery",
      description: "Browse and manage AI creations",
      icon: ImageIcon,
      color: "from-teal-500 to-green-500",
      href: `/apps/models/${encodeURIComponent(modelName)}/gallery`,
      category: "ai",
    },
    {
      id: "studio",
      name: "AI Studio",
      description: "Advanced AI content creation workspace",
      icon: Palette,
      color: "from-purple-600 to-blue-600",
      href: `/apps/models/${encodeURIComponent(modelName)}/studio`,
      category: "ai",
    },
  ];

  const filteredApps = selectedCategory === "all" 
    ? apps 
    : apps.filter(app => app.category === selectedCategory);

  const handleAppClick = (app: AppItem) => {
    router.push(app.href);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">Model Apps</h3>
          <p className="text-gray-400 text-sm mt-1">
            Access all available apps and tools for {modelName}
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-lg p-1">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === "all"
                ? "bg-purple-500/20 text-purple-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            All Apps
          </button>
          <button
            onClick={() => setSelectedCategory("generate")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === "generate"
                ? "bg-purple-500/20 text-purple-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Generate
          </button>
          <button
            onClick={() => setSelectedCategory("ai")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === "ai"
                ? "bg-purple-500/20 text-purple-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            AI Tools
          </button>
        </div>
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredApps.map((app, index) => {
          const Icon = app.icon;
          return (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleAppClick(app)}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:bg-white/10 hover:border-purple-500/50 transition-all cursor-pointer group"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Icon */}
                <div className={`p-4 rounded-xl bg-gradient-to-r ${app.color} bg-opacity-20 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <div>
                  <h4 className="text-white font-semibold mb-2">{app.name}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {app.description}
                  </p>
                </div>

                {/* Category Badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      app.category === "generate"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {app.category === "generate" ? "Generate" : "AI"}
                  </span>
                  <Star className="w-3 h-3 text-gray-500" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredApps.length === 0 && (
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-12 text-center">
          <Zap className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No apps found for the selected category</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Apps</p>
              <p className="text-xl font-bold text-white">{apps.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Generate</p>
              <p className="text-xl font-bold text-white">
                {apps.filter(app => app.category === "generate").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">AI Tools</p>
              <p className="text-xl font-bold text-white">
                {apps.filter(app => app.category === "ai").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Featured</p>
              <p className="text-xl font-bold text-white">8</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
