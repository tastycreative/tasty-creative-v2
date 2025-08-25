"use client";

import React, { useEffect, useCallback } from "react";
import { useCreatorData, useSchedulerData } from "@/lib/stores/sheetStore";

interface CreatorDataItem {
  text: string;
  checker: string;
}

interface CreatorSheetViewerProps {
  sheetName: string;
  sheetUrl: string;
  onBack: () => void;
}

const CreatorSheetViewer: React.FC<CreatorSheetViewerProps> = ({
  sheetName,
  sheetUrl,
  onBack,
}) => {
  // Use the Zustand store for state management
  const { 
    creatorData, 
    loading: isLoading, 
    error, 
    fetchCreatorData: fetchCreatorDataFromStore 
  } = useCreatorData();
  
  // For schedule management, we can still use the scheduler hooks
  const { 
    selectedSchedule,
    isUpdating,
    updateSchedule,
    setSelectedSchedule,
    clearCache: clearSchedulerCache
  } = useSchedulerData();

  const fetchCreatorDataWrapper = useCallback(async (forceRefresh = false) => {
    if (!sheetUrl) return;

    try {
      await fetchCreatorDataFromStore(sheetUrl, forceRefresh);
      
      // Extract schedule code from currentSchedule if provided
      if (creatorData?.currentSchedule) {
        const scheduleMatch = creatorData.currentSchedule.match(/#(\w+)/);
        if (scheduleMatch) {
          setSelectedSchedule(scheduleMatch[1]); // Extract "1A" from "Schedule #1A"
        }
      }
    } catch (err) {
      console.error('Error fetching creator data:', err);
    }
  }, [sheetUrl, fetchCreatorDataFromStore, creatorData?.currentSchedule, setSelectedSchedule]);

  const handleScheduleChange = async (newSchedule: string) => {
    setSelectedSchedule(newSchedule);

    try {
      await updateSchedule(sheetUrl, newSchedule);
      console.log("Schedule updated successfully");
      
      // Refresh creator data after schedule change
      setTimeout(() => fetchCreatorDataWrapper(true), 1000);
    } catch (err) {
      console.error("Error updating schedule:", err);
      // The store will handle reverting the state on error
    }
  };

  useEffect(() => {
    fetchCreatorDataWrapper();
  }, [fetchCreatorDataWrapper]);

  const handleOpenInNewTab = () => {
    if (sheetUrl && sheetUrl.startsWith("http")) {
      window.open(sheetUrl, "_blank");
    }
  };

  const handleRefresh = () => {
    // Clear both creator and scheduler cache since this component uses both
    clearSchedulerCache(`scheduler-data-${sheetUrl}`);
    fetchCreatorDataWrapper(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {sheetName}
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                title="Refresh data"
              >
                <svg
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Refresh</span>
              </button>
              <button
                onClick={handleOpenInNewTab}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                <span>Open in New Tab</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Selector */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Schedule ➡️
            </label>
            <div className="flex items-center space-x-3">
              <select
                value={selectedSchedule}
                onChange={(e) => handleScheduleChange(e.target.value)}
                disabled={isUpdating}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
              <option value="1A">Schedule #1A</option>
                <option value="1B">Schedule #1B</option>
                <option value="1C">Schedule #1C</option>
                <option value="1D">Schedule #1D</option>
                <option value="1E">Schedule #1E</option>
                <option value="1F">Schedule #1F</option>
                <option value="1G">Schedule #1G</option>
              </select>
              {isUpdating && (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Updating...
                  </span>
                </div>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Current: {creatorData?.currentSchedule || 'Schedule #1A'}
              </span>
            </div>
          </div>
        </div>
      </div>


      {/* Content */}
      <div className="max-w-7xl mx-auto">
    

        {/* Schedule Checker */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Schedule Checker
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mass Messages Section */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <span className="h-2 w-2 bg-blue-500 rounded-full mr-2"></span>
                Mass Messages
              </h4>
              <div className="space-y-3">
                {isLoading || !creatorData ? (
                  // Loading skeleton for Mass Messages
                  Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={`mass-loading-${index}`}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-2 w-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
                      </div>
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    </div>
                  ))
                ) : error ? (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
                    <span className="text-red-700 dark:text-red-300 text-sm">{error?.message}</span>
                  </div>
                ) : (
                  (creatorData?.massMessages || []).map((item, index) => (
                    <div
                      key={`mass-${index}`}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            item.checker === "Yes" || item.checker === "1"
                              ? "bg-green-500"
                              : item.checker === "No" || item.checker === "0"
                                ? "bg-red-500"
                                : item.checker
                                  ? "bg-yellow-500"
                                  : "bg-gray-400"
                          }`}
                        ></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {item.text}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.checker === "Yes" || item.checker === "1"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : item.checker === "No" || item.checker === "0"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : item.checker
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                      }`}>
                        {item.checker || "N/A"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Wall Posts Section */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <span className="h-2 w-2 bg-purple-500 rounded-full mr-2"></span>
                Wall Posts
              </h4>
              <div className="space-y-3">
                {isLoading || !creatorData ? (
                  // Loading skeleton for Wall Posts
                  Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={`wall-loading-${index}`}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-2 w-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
                      </div>
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    </div>
                  ))
                ) : error ? (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg p-4">
                    <span className="text-red-700 dark:text-red-300 text-sm">{error?.message}</span>
                  </div>
                ) : (
                  (creatorData?.wallPosts || []).map((item, index) => (
                    <div
                      key={`wall-${index}`}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            item.checker === "Yes" || item.checker === "1"
                              ? "bg-green-500"
                              : item.checker === "No" || item.checker === "0"
                                ? "bg-red-500"
                                : item.checker
                                  ? "bg-yellow-500"
                                  : "bg-gray-400"
                          }`}
                        ></div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {item.text}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.checker === "Yes" || item.checker === "1"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : item.checker === "No" || item.checker === "0"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : item.checker
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                      }`}>
                        {item.checker || "N/A"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorSheetViewer;
