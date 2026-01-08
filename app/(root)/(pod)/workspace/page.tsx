"use client";

import React from "react";
import {
  Briefcase,
  FolderOpen,
  FileText,
  Image,
  Video,
  Clock,
  Star,
  Folder,
  MoreVertical,
  Plus,
  Grid3x3,
  List,
  Search,
} from "lucide-react";

// Mock data for workspace items
const mockWorkspaceItems = [
  {
    id: 1,
    name: "Summer Campaign Assets",
    type: "folder" as const,
    items: 24,
    lastModified: "2 hours ago",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: 2,
    name: "Model Photoshoot - Miami",
    type: "folder" as const,
    items: 156,
    lastModified: "1 day ago",
    color: "from-purple-500 to-indigo-500",
  },
  {
    id: 3,
    name: "Q4 Content Plan.pdf",
    type: "document" as const,
    size: "2.4 MB",
    lastModified: "3 days ago",
    starred: true,
  },
  {
    id: 4,
    name: "Final Promo Video.mp4",
    type: "video" as const,
    size: "145 MB",
    lastModified: "1 week ago",
    thumbnail: true,
  },
  {
    id: 5,
    name: "Brand Guidelines 2025",
    type: "folder" as const,
    items: 8,
    lastModified: "2 weeks ago",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: 6,
    name: "Product Shoot - Final.jpg",
    type: "image" as const,
    size: "8.2 MB",
    lastModified: "3 days ago",
    starred: true,
    thumbnail: true,
  },
  {
    id: 7,
    name: "Team Meeting Notes.docx",
    type: "document" as const,
    size: "124 KB",
    lastModified: "5 days ago",
  },
  {
    id: 8,
    name: "Social Media Assets",
    type: "folder" as const,
    items: 89,
    lastModified: "1 week ago",
    color: "from-emerald-500 to-teal-500",
  },
];

const recentActivity = [
  { user: "Sarah M.", action: "uploaded", item: "Final_Edit_v3.mp4", time: "5 min ago" },
  { user: "John D.", action: "created", item: "New Project Folder", time: "1 hour ago" },
  { user: "Emma R.", action: "commented on", item: "Brand Guidelines", time: "2 hours ago" },
  { user: "Mike K.", action: "shared", item: "Campaign Assets", time: "4 hours ago" },
];

export default function WorkspacePage() {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = React.useState("");

  return (
    <div className="min-h-screen bg-pink-50/30 dark:bg-gray-950">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 border-b border-gray-200/50 dark:border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))] opacity-30"></div>

        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 dark:bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

        <div className="relative px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                <Briefcase className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-white dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Workspace
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Your files, projects, and team collaboration hub
                </p>
              </div>
            </div>

            <button className="px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              New Item
            </button>
          </div>

          {/* Search and View Controls */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search workspace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 dark:focus:ring-pink-400/50 transition-all"
              />
            </div>

            <div className="flex bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-white/10 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Workspace Area */}
          <div className="xl:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total Files", value: "1,234", icon: FileText, color: "from-pink-500 to-rose-500" },
                { label: "Folders", value: "48", icon: Folder, color: "from-purple-500 to-indigo-500" },
                { label: "Storage Used", value: "45.2 GB", icon: FolderOpen, color: "from-blue-500 to-cyan-500" },
                { label: "Shared Items", value: "89", icon: Star, color: "from-emerald-500 to-teal-500" },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="relative bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl p-5 border border-gray-200/50 dark:border-white/10 overflow-hidden group hover:shadow-lg transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))] opacity-20"></div>

                  <div className="relative">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Files Grid/List */}
            <div className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">All Items</h2>

              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockWorkspaceItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 border border-gray-200/50 dark:border-white/10 hover:shadow-lg hover:border-pink-300 dark:hover:border-pink-500/50 transition-all duration-300 cursor-pointer"
                    >
                      {item.starred && (
                        <Star className="absolute top-3 right-3 w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}

                      <div className="flex flex-col items-center text-center">
                        {item.type === "folder" ? (
                          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3`}>
                            <Folder className="w-8 h-8 text-white" />
                          </div>
                        ) : item.type === "image" ? (
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center mb-3">
                            <Image className="w-8 h-8 text-white" />
                          </div>
                        ) : item.type === "video" ? (
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-3">
                            <Video className="w-8 h-8 text-white" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-3">
                            <FileText className="w-8 h-8 text-white" />
                          </div>
                        )}

                        <div className="font-semibold text-sm text-gray-900 dark:text-white truncate w-full">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {item.type === "folder" ? `${item.items} items` : item.size}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.lastModified}
                        </div>
                      </div>

                      <button className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {mockWorkspaceItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-gray-200/50 dark:border-white/10 hover:shadow-md hover:border-pink-300 dark:hover:border-pink-500/50 transition-all cursor-pointer"
                    >
                      {item.type === "folder" ? (
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                          <Folder className="w-5 h-5 text-white" />
                        </div>
                      ) : item.type === "image" ? (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                          <Image className="w-5 h-5 text-white" />
                        </div>
                      ) : item.type === "video" ? (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                          <Video className="w-5 h-5 text-white" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {item.name}
                          </div>
                          {item.starred && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {item.type === "folder" ? `${item.items} items` : item.size} • {item.lastModified}
                        </div>
                      </div>

                      <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Recent Activity */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-pink-500" />
                Recent Activity
              </h2>

              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {activity.user.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-semibold">{activity.user}</span> {activity.action}{" "}
                        <span className="font-semibold">{activity.item}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Storage */}
            <div className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl p-6 border border-gray-200/50 dark:border-white/10">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Storage</h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Used</span>
                  <span className="font-semibold text-gray-900 dark:text-white">45.2 GB / 100 GB</span>
                </div>

                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-full" style={{ width: "45%" }}></div>
                </div>

                <button className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
                  Upgrade Storage
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
