"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Crown, 
  Gamepad2, 
  Zap, 
  Twitter, 
  Film,
} from "lucide-react";

type TabType = "live" | "vip" | "game" | "ftt" | "twitter" | "gif";

interface Tab {
  id: TabType;
  label: string;
  icon: React.ElementType;
  color: string;
}

export default function GeneratePage() {
  const [activeTab, setActiveTab] = useState<TabType>("live");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure smooth transition
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const tabs: Tab[] = [
    { id: "live", label: "Live", icon: Sparkles, color: "from-red-500 to-pink-500" },
    { id: "vip", label: "VIP", icon: Crown, color: "from-yellow-500 to-amber-500" },
    { id: "game", label: "Game", icon: Gamepad2, color: "from-purple-500 to-indigo-500" },
    { id: "ftt", label: "FTT", icon: Zap, color: "from-blue-500 to-cyan-500" },
    { id: "twitter", label: "Twitter Ads", icon: Twitter, color: "from-sky-500 to-blue-500" },
    { id: "gif", label: "GIF Maker", icon: Film, color: "from-green-500 to-emerald-500" },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <motion.div 
      className="w-full h-full flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: isReady ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: isReady ? 1 : 0, y: isReady ? 0 : -20 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
          Generate Content
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Create stunning visuals for your campaigns
        </p>
      </motion.div>

      {/* Tabs Navigation */}
      <motion.div 
        className="relative mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: isReady ? 1 : 0, y: isReady ? 0 : -10 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* Tabs Container */}
        <div className="flex gap-2 p-1 rounded-2xl bg-white/10 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700/30">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isActive 
                    ? "text-white" 
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Active Tab Background */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.color}`}
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30
                    }}
                  />
                )}

                {/* Tab Content */}
                <div className="relative z-10 flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm lg:text-base">{tab.label}</span>
                </div>

                {/* Hover Glow Effect */}
                {isActive && (
                  <motion.div
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tab.color} blur-xl opacity-50`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div 
        className="flex-1 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: isReady ? 1 : 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ 
              duration: 0.2,
              ease: "easeOut"
            }}
            className="h-full"
          >
            {/* Content Container */}
            <div className="h-full rounded-2xl bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm border border-white/10 dark:border-gray-700/20 p-6">
              {/* Dynamic Content Based on Active Tab */}
              {activeTab === "live" && <LiveContent />}
              {activeTab === "vip" && <VIPContent />}
              {activeTab === "game" && <GameContent />}
              {activeTab === "ftt" && <FTTContent />}
              {activeTab === "twitter" && <TwitterContent />}
              {activeTab === "gif" && <GIFContent />}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// Content Components for each tab
function LiveContent() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-center"
      >
        <div className="mb-6 p-6 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-sm">
          <Sparkles className="w-16 h-16 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          Live Stream Graphics
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
          Create eye-catching graphics for your live streams with animated overlays and alerts
        </p>
        <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200">
          Start Creating
        </button>
      </motion.div>
    </div>
  );
}

function VIPContent() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-center"
      >
        <div className="mb-6 p-6 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm">
          <Crown className="w-16 h-16 text-yellow-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          VIP Exclusive Content
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
          Design premium content for your VIP members with exclusive templates and effects
        </p>
        <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200">
          Create VIP Content
        </button>
      </motion.div>
    </div>
  );
}

function GameContent() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-center"
      >
        <div className="mb-6 p-6 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 backdrop-blur-sm">
          <Gamepad2 className="w-16 h-16 text-purple-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          Gaming Graphics
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
          Create gaming-themed graphics and overlays for your streams and videos
        </p>
        <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200">
          Design Game Graphics
        </button>
      </motion.div>
    </div>
  );
}

function FTTContent() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-center"
      >
        <div className="mb-6 p-6 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm">
          <Zap className="w-16 h-16 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          FTT Templates
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
          Fast-track your content creation with pre-made templates and quick edits
        </p>
        <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200">
          Browse Templates
        </button>
      </motion.div>
    </div>
  );
}

function TwitterContent() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-center"
      >
        <div className="mb-6 p-6 rounded-full bg-gradient-to-r from-sky-500/20 to-blue-500/20 backdrop-blur-sm">
          <Twitter className="w-16 h-16 text-sky-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          Twitter Ad Creator
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
          Design compelling Twitter ads that convert with optimized dimensions and formats
        </p>
        <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200">
          Create Twitter Ads
        </button>
      </motion.div>
    </div>
  );
}

function GIFContent() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="text-center"
      >
        <div className="mb-6 p-6 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm">
          <Film className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          GIF Maker
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
          Create engaging GIFs from videos or images with custom effects and text overlays
        </p>
        <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200">
          Make a GIF
        </button>
      </motion.div>
    </div>
  );
}