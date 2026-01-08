"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, User, CheckCircle, Clock, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import CountUp from "react-countup";
import { useSearchParams, useRouter } from "next/navigation";

interface OnboardingModel {
  Model: string;
  Status: string;
  [key: string]: string; // For dynamic task fields
}

interface OnboardingApiResponse {
  models: OnboardingModel[];
  totalModels: number;
  lastUpdated: string;
  sheetId: string;
  tasks: string[];
}

export default function PodNewOnboardingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const modelParam = searchParams?.get("model");

  const [apiData, setApiData] = useState<OnboardingApiResponse | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedModelData, setSelectedModelData] = useState<OnboardingModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [modelDataLoading, setModelDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const ITEMS_PER_PAGE = viewMode === "grid" ? 15 : 10;

  // Fetch all models initially
  useEffect(() => {
    fetchOnboardingData();
  }, []);

  // Set selected model from URL param or first model
  useEffect(() => {
    if (apiData?.models && apiData.models.length > 0) {
      const targetModel = modelParam || apiData.models[0].Model;
      setSelectedModel(targetModel);
    }
  }, [apiData, modelParam]);

  // Fetch specific model data when selection changes
  useEffect(() => {
    if (!selectedModel || !apiData) return;

    const modelData = apiData.models.find(model => model.Model === selectedModel);
    setSelectedModelData(modelData || null);
  }, [selectedModel, apiData]);

  const fetchOnboardingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/pod-new/onboarding');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: Failed to fetch onboarding data`);
      }

      const data: OnboardingApiResponse = await response.json();
      setApiData(data);
    } catch (err) {
      console.error('Error fetching onboarding data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleModelSelect = (modelName: string) => {
    setSelectedModel(modelName);
    // Update URL without page reload
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('model', modelName);
    router.replace(newUrl.pathname + newUrl.search, { scroll: false });
  };

  // Filter and paginate models
  const filteredModels = useMemo(() => {
    if (!apiData) return [];
    return apiData.models.filter((model) =>
      model.Model.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [apiData, searchQuery]);

  const totalPages = Math.ceil(filteredModels.length / ITEMS_PER_PAGE);

  const paginatedModels = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredModels.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredModels, currentPage, ITEMS_PER_PAGE]);

  // Navigation functions
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Calculate progress for selected model
  const calculateProgress = () => {
    if (!selectedModelData || !apiData) return { completed: 0, total: 0, percentage: 0 };

    const completed = apiData.tasks.filter(task => selectedModelData[task] === "TRUE").length;
    const total = apiData.tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  };

  const progress = calculateProgress();

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          <span className="text-gray-600 dark:text-slate-400">Loading onboarding data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-red-500 mb-2">Failed to load onboarding data</div>
          <div className="text-sm text-gray-600 dark:text-slate-400">{error}</div>
          <button
            onClick={fetchOnboardingData}
            className="mt-4 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50/30 dark:bg-gray-950">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-purple-900/30 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          </div>

          <div className="relative px-8 py-6">
            <div className="flex items-start gap-4 mb-3">
              <div className="p-3 bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-400/20 dark:to-purple-400/20 rounded-xl border border-pink-200/50 dark:border-pink-500/30">
                <CheckCircle className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black tracking-tight">
                  <span className="bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                    Model Onboarding Tracker
                  </span>
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1 text-lg font-medium">
                  Track onboarding progress for all models in real-time
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Live Data
                  </span>
                  <span>•</span>
                  <span>Real-time Updates</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Model Selection Section */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-white/10 bg-gradient-to-br from-white via-emerald-50/20 to-blue-50/20 dark:from-slate-900/70 dark:via-emerald-900/20 dark:to-blue-900/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 dark:from-emerald-400/10 dark:to-blue-400/10"></div>
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-lg">
                  <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Select Model
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    {apiData?.totalModels || 0} models available
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                {/* Enhanced Search Input */}
                <div className="relative flex-grow sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search models..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-11 rounded-xl border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Enhanced View Toggle */}
                <div className="flex rounded-xl overflow-hidden border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "px-4 py-2 text-sm font-medium transition-all duration-200",
                      viewMode === "grid"
                        ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                    )}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "px-4 py-2 text-sm font-medium transition-all duration-200",
                      viewMode === "list"
                        ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                    )}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>

            {filteredModels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center mb-4">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">No models match your search</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                >
                  Clear search
                </button>
              </div>
            ) : (
          <>
              {/* Enhanced Grid View */}
              {viewMode === "grid" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {paginatedModels.map((model) => {
                    const modelCompleted = apiData!.tasks.filter(task => model[task] === "TRUE").length;
                    const modelTotal = apiData!.tasks.length;
                    const modelPercentage = modelTotal > 0 ? Math.round((modelCompleted / modelTotal) * 100) : 0;

                    return (
                      <div
                        key={model.Model}
                        onClick={() => handleModelSelect(model.Model)}
                        className={cn(
                          "cursor-pointer group relative overflow-hidden rounded-xl transition-all duration-300 shadow-sm hover:shadow-lg",
                          selectedModel === model.Model
                            ? "bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/30 dark:to-purple-900/30 border-2 border-pink-300 dark:border-pink-600 shadow-lg shadow-pink-500/25"
                            : "bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-700 border border-gray-200/60 dark:border-gray-700/60 hover:from-gray-50 hover:to-gray-100 dark:hover:from-slate-700 dark:hover:to-slate-600 hover:border-pink-200 dark:hover:border-pink-700"
                        )}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-purple-500/5 dark:from-pink-400/10 dark:to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative p-4">
                          <div className="flex flex-col items-center text-center space-y-3">
                            <div className={cn(
                              "h-12 w-12 rounded-xl flex items-center justify-center shadow-sm transition-all duration-300",
                              selectedModel === model.Model
                                ? "bg-gradient-to-br from-pink-500 to-purple-500 shadow-lg shadow-pink-500/25"
                                : "bg-gradient-to-br from-emerald-400 to-blue-500 group-hover:from-pink-500 group-hover:to-purple-500"
                            )}>
                              <span className="text-white font-bold text-sm">
                                {model.Model.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div className="w-full">
                              <div className="text-sm font-semibold truncate text-gray-900 dark:text-white mb-1" title={model.Model}>
                                {model.Model}
                              </div>
                              <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                                modelPercentage >= 75 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                                modelPercentage >= 50 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                modelPercentage >= 25 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              }`}>
                                {modelPercentage}% complete
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Enhanced List View */}
              {viewMode === "list" && (
                <div className="space-y-3">
                  {paginatedModels.map((model) => {
                    const modelCompleted = apiData!.tasks.filter(task => model[task] === "TRUE").length;
                    const modelTotal = apiData!.tasks.length;
                    const modelPercentage = modelTotal > 0 ? Math.round((modelCompleted / modelTotal) * 100) : 0;

                    return (
                      <div
                        key={model.Model}
                        onClick={() => handleModelSelect(model.Model)}
                        className={cn(
                          "cursor-pointer group relative overflow-hidden rounded-xl transition-all duration-300 shadow-sm hover:shadow-md",
                          selectedModel === model.Model
                            ? "bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/30 dark:to-purple-900/30 border-2 border-pink-300 dark:border-pink-600 shadow-lg shadow-pink-500/25"
                            : "bg-gradient-to-r from-white to-gray-50 dark:from-slate-800 dark:to-slate-700 border border-gray-200/60 dark:border-gray-700/60 hover:from-gray-50 hover:to-gray-100 dark:hover:from-slate-700 dark:hover:to-slate-600 hover:border-pink-200 dark:hover:border-pink-700"
                        )}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-purple-500/5 dark:from-pink-400/10 dark:to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={cn(
                                "h-12 w-12 rounded-xl flex items-center justify-center shadow-sm transition-all duration-300",
                                selectedModel === model.Model
                                  ? "bg-gradient-to-br from-pink-500 to-purple-500 shadow-lg shadow-pink-500/25"
                                  : "bg-gradient-to-br from-emerald-400 to-blue-500 group-hover:from-pink-500 group-hover:to-purple-500"
                              )}>
                                <span className="text-white font-bold text-sm">
                                  {model.Model.substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white">{model.Model}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {modelCompleted} of {modelTotal} tasks completed
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className={`text-lg font-bold ${
                                modelPercentage >= 75 ? 'text-emerald-600 dark:text-emerald-400' :
                                modelPercentage >= 50 ? 'text-amber-600 dark:text-amber-400' :
                                modelPercentage >= 25 ? 'text-orange-600 dark:text-orange-400' :
                                'text-red-600 dark:text-red-400'
                              }`}>
                                {modelPercentage}%
                              </div>
                              {selectedModel === model.Model && (
                                <div className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full text-xs font-semibold shadow-sm">
                                  Selected
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Enhanced Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200/60 dark:border-gray-700/60">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredModels.length)} of {filteredModels.length} models
                  </span>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl border border-gray-200/60 dark:border-gray-700/60 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 dark:hover:from-pink-900/20 dark:hover:to-purple-900/20 hover:border-pink-200 dark:hover:border-pink-700 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-3 py-1 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl border border-gray-200/60 dark:border-gray-700/60 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 dark:hover:from-pink-900/20 dark:hover:to-purple-900/20 hover:border-pink-200 dark:hover:border-pink-700 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
          </>
        )}
        </div>
      </div>

        {/* Enhanced Model Details Section */}
        {selectedModelData && (
          <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-white/10 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 dark:from-slate-900/70 dark:via-purple-900/20 dark:to-pink-900/20 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 dark:from-purple-400/10 dark:to-pink-400/10"></div>
            <div className="relative">
              {/* Enhanced Header */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 mb-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-400/20 dark:to-pink-400/20 rounded-xl border border-purple-200/50 dark:border-purple-500/30">
                    <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white mb-3">
                      {selectedModelData.Model}
                    </h2>
                    <div className="flex items-center flex-wrap gap-3">
                      <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/40 dark:to-purple-900/40 rounded-xl shadow-sm">
                        <CheckCircle className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                        <span className="text-sm font-bold text-pink-700 dark:text-pink-300">
                          <CountUp end={progress.percentage} />% Complete
                        </span>
                      </div>
                      {selectedModelData.Status && (
                        <div className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl shadow-sm">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Status: {selectedModelData.Status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Enhanced Progress Bar */}
                <div className="lg:w-96 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Overall Progress</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      <CountUp end={progress.completed} /> of {progress.total} tasks
                    </span>
                  </div>
                  <div className="relative h-4 bg-gray-200/80 dark:bg-gray-700/80 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600 rounded-full transition-all duration-1000 ease-out shadow-sm"
                      style={{ width: `${progress.percentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 animate-pulse rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Tasks Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {apiData!.tasks.map((task, index) => {
                  const isCompleted = selectedModelData[task] === "TRUE";
                  return (
                    <div
                      key={task}
                      className={cn(
                        "group relative overflow-hidden rounded-xl transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-sm",
                        isCompleted
                          ? "bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 dark:from-emerald-900/30 dark:via-green-900/30 dark:to-emerald-800/30 border border-emerald-300/60 dark:border-emerald-600/60 shadow-emerald-500/20"
                          : "bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-slate-800/80 dark:via-slate-700/80 dark:to-slate-600/80 border border-gray-300/60 dark:border-gray-600/60 hover:from-pink-50 hover:via-purple-50 hover:to-pink-100 dark:hover:from-pink-900/20 dark:hover:via-purple-900/20 dark:hover:to-pink-800/20 hover:border-pink-300/60 dark:hover:border-pink-600/60"
                      )}
                    >
                      <div className={cn(
                        "absolute inset-0 transition-opacity duration-300",
                        isCompleted
                          ? "bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-400/20 dark:to-green-400/20"
                          : "bg-gradient-to-br from-pink-500/5 to-purple-500/5 dark:from-pink-400/10 dark:to-purple-400/10 opacity-0 group-hover:opacity-100"
                      )} />
                      <div className="relative p-5">
                        <div className="flex items-start space-x-3">
                          <div className="pt-1">
                            <Checkbox
                              checked={isCompleted}
                              disabled
                              className={cn(
                                "w-5 h-5 transition-all duration-200 shadow-sm",
                                isCompleted
                                  ? "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 shadow-emerald-500/25"
                                  : "border-gray-400 dark:border-gray-500"
                              )}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <label className={cn(
                              "text-sm font-semibold leading-relaxed cursor-default block",
                              isCompleted
                                ? "text-emerald-700 dark:text-emerald-300"
                                : "text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white"
                            )}>
                              {task}
                            </label>
                          </div>
                          <div className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0 mt-2 shadow-sm transition-all duration-200",
                            isCompleted
                              ? "bg-emerald-500 shadow-emerald-500/50"
                              : "bg-gray-400 dark:bg-gray-500 group-hover:bg-pink-500 group-hover:shadow-pink-500/50"
                          )} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Empty State */}
        {!selectedModelData && !loading && (
          <div className="relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-white/10 bg-gradient-to-br from-white via-gray-50/30 to-blue-50/30 dark:from-slate-900/70 dark:via-gray-800/20 dark:to-blue-900/20 backdrop-blur-sm shadow-lg p-16 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-400/10 dark:to-purple-400/10"></div>
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Clock className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Select a Model
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Choose a model from the list above to view their detailed onboarding progress and task completion status
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}