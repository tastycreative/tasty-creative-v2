// components/models/tabs/ModelChattersTab.tsx
"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  User,
  Clock,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  MoreVertical,
} from "lucide-react";

interface Chatter {
  id: string;
  name: string;
  status: "online" | "offline" | "busy";
  assignedDate: string;
  totalChats: number;
  activeChats: number;
  revenue: number;
  avgResponseTime: string;
  lastActive: string;
}

interface ModelChattersTabProps {
  modelId: string;
}

export default function ModelChattersTab({ modelId }: ModelChattersTabProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - replace with API call
  const [chatters] = useState<Chatter[]>([
    {
      id: "1",
      name: "Sarah Johnson",
      status: "online",
      assignedDate: "2024-01-15",
      totalChats: 156,
      activeChats: 12,
      revenue: 8500,
      avgResponseTime: "1.2 mins",
      lastActive: "2 mins ago",
    },
    {
      id: "2",
      name: "Mike Chen",
      status: "busy",
      assignedDate: "2024-02-01",
      totalChats: 98,
      activeChats: 8,
      revenue: 6200,
      avgResponseTime: "2.5 mins",
      lastActive: "15 mins ago",
    },
    {
      id: "3",
      name: "Emily Davis",
      status: "offline",
      assignedDate: "2024-01-20",
      totalChats: 203,
      activeChats: 0,
      revenue: 12300,
      avgResponseTime: "1.8 mins",
      lastActive: "2 hours ago",
    },
  ]);

  const filteredChatters = chatters.filter((chatter) =>
    chatter.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "busy":
        return "bg-yellow-500";
      case "offline":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">
            Assigned Chatters
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            {chatters.length} chatters managing this model
          </p>
        </div>

        <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors">
          Assign New Chatter
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search chatters..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-gray-500"
        />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Chats</p>
              <p className="text-xl font-bold text-white">
                {chatters.reduce((sum, c) => sum + c.totalChats, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <User className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Active Now</p>
              <p className="text-xl font-bold text-white">
                {chatters.reduce((sum, c) => sum + c.activeChats, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Avg Response</p>
              <p className="text-xl font-bold text-white">1.8 mins</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-xl font-bold text-white">
                $
                {chatters
                  .reduce((sum, c) => sum + c.revenue, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chatters List */}
      <div className="space-y-4">
        {filteredChatters.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-12 text-center">
            <User className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No chatters found</p>
          </div>
        ) : (
          filteredChatters.map((chatter, index) => (
            <div
              key={chatter.id}
              //initial={{ opacity: 0, y: 20 }}
              //animate={{ opacity: 1, y: 0 }}
              //transition={{ delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-white font-bold">
                        {chatter.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${getStatusColor(chatter.status)} border-2 border-gray-900`}
                    />
                  </div>

                  {/* Info */}
                  <div>
                    <h4 className="text-white font-semibold flex items-center gap-2">
                      {chatter.name}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          chatter.status === "online"
                            ? "bg-green-500/20 text-green-400"
                            : chatter.status === "busy"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {chatter.status}
                      </span>
                    </h4>
                    <p className="text-gray-400 text-sm">
                      Assigned{" "}
                      {new Date(chatter.assignedDate).toLocaleDateString()} •
                      Last active {chatter.lastActive}
                    </p>
                  </div>
                </div>

                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-gray-400 text-sm">Total Chats</p>
                  <p className="text-white font-semibold">
                    {chatter.totalChats}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Active Chats</p>
                  <p className="text-white font-semibold">
                    {chatter.activeChats}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Revenue</p>
                  <p className="text-white font-semibold">
                    ${chatter.revenue.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Avg Response</p>
                  <p className="text-white font-semibold">
                    {chatter.avgResponseTime}
                  </p>
                </div>
              </div>

              {/* Performance Chart (Optional) */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Performance</span>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(chatter.revenue / 15000) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button (if needed) */}
      {filteredChatters.length > 0 && (
        <div className="text-center">
          <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg font-medium transition-all">
            Load More Chatters
          </button>
        </div>
      )}
    </div>
  );
}
