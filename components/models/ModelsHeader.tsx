"use client";
import { Search, Users, UserCheck, UserX, Sparkles } from "lucide-react";

interface ModelsHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: ModelStatus | "all";
  setStatusFilter: (filter: ModelStatus | "all") => void;
  totalModels: number;
  activeModels: number;
  isLoading?: boolean;
}

export default function ModelsHeader({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  totalModels,
  activeModels,
  isLoading,
}: ModelsHeaderProps) {
  return (
    <div className="space-y-6 mb-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 animate-in slide-in-from-top duration-500">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl backdrop-blur-sm border border-purple-500/20">
              <Users className="w-8 h-8 text-purple-400" />
            </div>
            Models Management
          </h1>
          <p className="text-gray-400 mt-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Manage your OnlyFans models and their content
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="animate-in slide-in-from-bottom duration-500 delay-100">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-50 group-hover:opacity-70" />
            <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 hover:border-purple-500/40 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    Total Models
                  </p>
                  <p className="text-3xl font-bold text-white mt-1 tabular-nums">
                    {isLoading ? (
                      <span className="inline-block w-16 h-8 bg-slate-700/50 rounded animate-pulse" />
                    ) : (
                      totalModels
                    )}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="animate-in slide-in-from-bottom duration-500 delay-200">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-50 group-hover:opacity-70" />
            <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6 hover:border-green-500/40 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    Active Models
                  </p>
                  <p className="text-3xl font-bold text-white mt-1 tabular-nums">
                    {isLoading ? (
                      <span className="inline-block w-16 h-8 bg-slate-700/50 rounded animate-pulse" />
                    ) : (
                      activeModels
                    )}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
                  <UserCheck className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="animate-in slide-in-from-bottom duration-500 delay-300">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-pink-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-50 group-hover:opacity-70" />
            <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-red-500/20 p-6 hover:border-red-500/40 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    Dropped Models
                  </p>
                  <p className="text-3xl font-bold text-white mt-1 tabular-nums">
                    {isLoading ? (
                      <span className="inline-block w-16 h-8 bg-slate-700/50 rounded animate-pulse" />
                    ) : (
                      totalModels - activeModels
                    )}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-xl">
                  <UserX className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 animate-in slide-in-from-bottom duration-500 delay-400">
        <div className="flex-1 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-2xl blur-xl group-focus-within:blur-2xl transition-all duration-300 opacity-0 group-focus-within:opacity-100" />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
          <input
            type="text"
            placeholder="Search models by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="relative w-full pl-12 pr-4 py-3.5 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all text-gray-200 placeholder-gray-500"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-6 py-3.5 rounded-2xl font-medium transition-all duration-300 ${
              statusFilter === "all"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25"
                : "bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 border border-slate-700/50"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-6 py-3.5 rounded-2xl font-medium transition-all duration-300 ${
              statusFilter === "active"
                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25"
                : "bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 border border-slate-700/50"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter("dropped")}
            className={`px-6 py-3.5 rounded-2xl font-medium transition-all duration-300 ${
              statusFilter === "dropped"
                ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25"
                : "bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 border border-slate-700/50"
            }`}
          >
            Dropped
          </button>
        </div>
      </div>
    </div>
  );
}