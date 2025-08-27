"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  User,
  Clock,
  DollarSign,
  TrendingUp,
  Search,
  MoreVertical,
  UserPlus,
  Activity,
  Sparkles,
} from "lucide-react";

interface ModelChattersTabProps {
  modelName: string;
}

export default function ModelChattersTab({ modelName }: ModelChattersTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [modelData, setModelData] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModelData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/google/cmsheets?includeChatters=true&clientName=${encodeURIComponent(modelName)}`
        );
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("Authentication required");
          } else {
            throw new Error(`Error: ${res.status}`);
          }
        }
        const data = await res.json();
        const sortedData = [...data].sort((a, b) =>
          a.clientName.localeCompare(b.clientName)
        );
        setModelData(sortedData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch client data"
        );
      } finally {
        setLoading(false);
      }
    };

    if (modelName) {
      fetchModelData();
    }
  }, [modelName]);

  // Parse chatters from API data
  const chatters: Chatter[] =
    modelData.length > 0 && modelData[0].chatters
      ? modelData[0].chatters.split(",").map((name, index) => ({
          id: `chatter-${index}`,
          name: name.trim(),
          status:
            Math.random() > 0.6
              ? "online"
              : Math.random() > 0.3
                ? "busy"
                : ("offline" as const),
          assignedDate: new Date(
            Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split("T")[0],
          totalChats: Math.floor(Math.random() * 200) + 50,
          activeChats: Math.floor(Math.random() * 15),
          revenue: Math.floor(Math.random() * 10000) + 5000,
          avgResponseTime: `${(Math.random() * 3 + 1).toFixed(1)} mins`,
          lastActive:
            Math.random() > 0.5
              ? `${Math.floor(Math.random() * 60)} mins ago`
              : `${Math.floor(Math.random() * 24)} hours ago`,
        }))
      : [];

  const filteredChatters = chatters.filter((chatter) =>
    chatter.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chattingManagers =
    modelData.length > 0 ? modelData[0].chattingManagers : "";

  const staticStats = {
    totalChats: 2847,
    activeChats: 28,
    avgResponse: "1.8 mins",
    totalRevenue: 127500,
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "online":
        return { color: "bg-green-500", glow: "shadow-green-500/50", text: "text-green-400", bg: "bg-green-500/20" };
      case "busy":
        return { color: "bg-yellow-500", glow: "shadow-yellow-500/50", text: "text-yellow-400", bg: "bg-yellow-500/20" };
      case "offline":
        return { color: "bg-gray-500", glow: "shadow-gray-500/50", text: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-700/50" };
      default:
        return { color: "bg-gray-500", glow: "shadow-gray-500/50", text: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-700/50" };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
          <Sparkles className="w-6 h-6 text-pink-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-pink-600/10 rounded-2xl blur-xl" />
        <div className="relative bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-2xl p-8 text-center">
          <MessageSquare className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">Error loading chatters: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-xl font-medium transition-all"
          >
            Retry
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-xl">
              <MessageSquare className="w-5 h-5 text-pink-500" />
            </div>
            Assigned Chatters
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {chatters.length} chatters managing this model
          </p>
          {chattingManagers && (
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 flex items-center gap-1">
              <User className="w-3 h-3" />
              Manager: {chattingManagers}
            </p>
          )}
        </motion.div>
        
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-pink-500/25 flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Assign New Chatter
        </motion.button>
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600/10 to-rose-600/10 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-all duration-300" />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-400 w-5 h-5 z-10" />
        <input
          type="text"
          placeholder="Search chatters..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="relative w-full pl-12 pr-4 py-3.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-pink-200 dark:border-gray-600 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        />
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          {
            icon: MessageSquare,
            label: "Total Chats",
            value: staticStats.totalChats.toLocaleString(),
            color: "pink",
            gradient: "from-pink-500 to-rose-500",
          },
          {
            icon: Activity,
            label: "Active Now",
            value: staticStats.activeChats,
            color: "green",
            gradient: "from-green-500 to-emerald-500",
          },
          {
            icon: Clock,
            label: "Avg Response",
            value: staticStats.avgResponse,
            color: "blue",
            gradient: "from-blue-500 to-cyan-500",
          },
          {
            icon: DollarSign,
            label: "Total Revenue",
            value: `${staticStats.totalRevenue.toLocaleString()}`,
            color: "yellow",
            gradient: "from-yellow-500 to-amber-500",
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="relative group"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-all duration-300`} />
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-pink-200 dark:border-gray-600 p-5 hover:border-pink-300 dark:hover:border-gray-500 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className={`p-3 bg-gradient-to-br ${stat.gradient} bg-opacity-20 rounded-xl`}>
                    <Icon className={`w-6 h-6 text-${stat.color}-400`} />
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Chatters List */}
      <AnimatePresence mode="popLayout">
        {filteredChatters.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600/10 to-rose-600/10 rounded-3xl blur-2xl" />
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-pink-200 dark:border-gray-600 p-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-pink-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {chatters.length === 0
                  ? "No chatters assigned to this model"
                  : "No chatters found"}
              </p>
              {chatters.length === 0 && (
                <button className="mt-6 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white rounded-xl font-medium transition-all shadow-lg shadow-pink-500/25 inline-flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Assign First Chatter
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredChatters.map((chatter, index) => {
              const statusConfig = getStatusConfig(chatter.status);
              
              return (
                <motion.div
                  key={chatter.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative"
                >
                  {/* Hover Glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600/5 to-rose-600/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  
                  {/* Card */}
                  <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-pink-200 dark:border-gray-600 p-6 hover:border-pink-300 dark:hover:border-gray-500 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="relative">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">
                              {chatter.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </span>
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${statusConfig.color} border-2 border-white dark:border-gray-800 ${statusConfig.glow} shadow-lg`} />
                        </div>
                        
                        {/* Info */}
                        <div>
                          <h4 className="text-gray-900 dark:text-gray-100 font-semibold text-lg flex items-center gap-3">
                            {chatter.name}
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig.bg} ${statusConfig.text} backdrop-blur-sm`}>
                              {chatter.status}
                            </span>
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Assigned {new Date(chatter.assignedDate).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span>Last active {chatter.lastActive}</span>
                          </p>
                        </div>
                      </div>
                      
                      <button className="p-2.5 hover:bg-pink-100 dark:hover:bg-gray-700 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                        <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                      {[
                        { label: "Total Chats", value: chatter.totalChats, icon: MessageSquare },
                        { label: "Active Chats", value: chatter.activeChats, icon: Activity },
                        { label: "Revenue", value: `${chatter.revenue.toLocaleString()}`, icon: DollarSign },
                        { label: "Avg Response", value: chatter.avgResponseTime, icon: Clock },
                      ].map((stat) => {
                        const Icon = stat.icon;
                        return (
                          <div key={stat.label} className="bg-pink-50 dark:bg-gray-700/50 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-xs mb-1">
                              <Icon className="w-3 h-3" />
                              {stat.label}
                            </div>
                            <p className="text-gray-900 dark:text-gray-100 font-semibold">{stat.value}</p>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Performance Chart */}
                    <div className="mt-6 pt-6 border-t border-pink-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Performance Score</span>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-green-400">+12%</span>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="w-full bg-pink-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(chatter.revenue / 15000) * 100}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                            className="h-full bg-gradient-to-r from-pink-500 to-rose-500 relative"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-rose-400 animate-pulse" />
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Load More */}
      {filteredChatters.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <button className="px-8 py-3 bg-white/80 dark:bg-gray-800/80 hover:bg-pink-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-xl font-medium transition-all border border-pink-200 dark:border-gray-600 hover:border-pink-300 dark:hover:border-gray-500">
            Load More Chatters
          </button>
        </motion.div>
      )}
    </div>
  );
}