"use client";

import React, { useEffect, useCallback } from "react";
import { 
  useSchedulerData, 
  ScheduleDataItem, 
  ScheduleCheckerItem, 
  ScheduleCheckerData, 
  FullScheduleSetupItem 
} from "@/lib/stores/sheetStore";


interface SchedulerSheetViewerProps {
  sheetName: string;
  sheetUrl: string;
  onBack: () => void;
}

const SchedulerSheetViewer: React.FC<SchedulerSheetViewerProps> = ({
  sheetName,
  sheetUrl,
  onBack,
}) => {
  // Use the Zustand store for state management
  const { 
    schedulerData, 
    loading: isLoading, 
    error, 
    selectedSchedule,
    isUpdating,
    fetchSchedulerData, 
    updateSchedule,
    setSelectedSchedule,
    clearCache
  } = useSchedulerData();

  const handleOpenInNewTab = () => {
    if (sheetUrl && sheetUrl.startsWith("http")) {
      window.open(sheetUrl, "_blank");
    }
  };

  const handleRefresh = () => {
    clearCache(`scheduler-data-${sheetUrl}`);
    fetchScheduleData(true);
  };

  const fetchScheduleData = useCallback(async (forceRefresh = false) => {
    if (!sheetUrl) return;

    try {
      await fetchSchedulerData(sheetUrl, forceRefresh);
      
      // Extract schedule code from currentSchedule if needed
      if (schedulerData?.currentSchedule) {
        const scheduleMatch = schedulerData.currentSchedule.match(/#(\w+)/);
        if (scheduleMatch) {
          setSelectedSchedule(scheduleMatch[1]); // Extract "1A" from "Schedule #1A"
        }
      }
    } catch (err) {
      console.error("Error fetching schedule data:", err);
    }
  }, [sheetUrl, fetchSchedulerData, schedulerData?.currentSchedule, setSelectedSchedule]);

  const handleScheduleChange = async (newSchedule: string) => {
    setSelectedSchedule(newSchedule);

    try {
      await updateSchedule(sheetUrl, newSchedule);
      console.log("Schedule updated successfully");
    } catch (err) {
      console.error("Error updating schedule:", err);
      // The store will handle reverting the state on error
    }
  };

  useEffect(() => {
    // Clear previous sheet data when URL changes to prevent showing stale data
    if (sheetUrl) {
      // Clear the scheduler data state immediately when switching sheets
      // This prevents showing cached data from the previous sheet
      fetchScheduleData();
    }
  }, [sheetUrl, fetchScheduleData]);

  const getColorForIndex = (index: number) => {
    const colors = [
      "emerald",
      "blue",
      "purple",
      "pink",
      "indigo",
      "cyan",
      "teal",
      "orange",
    ];
    return colors[index % colors.length];
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
                Current: {schedulerData?.currentSchedule || 'Schedule #1A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {/* View Full Schedule Setup */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            View Full Schedule Setup
          </h3>

          {isLoading || !schedulerData ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={`schedule-setup-skeleton-${index}`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 animate-pulse"
                >
                  <div className="grid grid-cols-6 gap-4">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (schedulerData?.fullScheduleSetup || []).length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
              <div className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                No schedule setup data available
              </div>
              <div className="text-gray-400 dark:text-gray-500 text-sm">
                Schedule setup is fetching today's data
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header Row */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 font-semibold text-gray-900 dark:text-gray-100">
                <div className="grid grid-cols-6 gap-4 text-sm">
                  <div>MM Time (PST):</div>
                  <div>Mass Message Type:</div>
                  <div>Post(PST):</div>
                  <div>Wall Post Type:</div>
                  <div>Story Time (PST):</div>
                  <div>Story Post Time:</div>
                </div>
              </div>
              
              {/* Data Rows */}
              {(schedulerData?.fullScheduleSetup || []).map((item, index) => (
                <div
                  key={`schedule-setup-${index}`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="grid grid-cols-6 gap-4 text-sm text-gray-700 dark:text-gray-300">
                    <div className="font-medium">{item.mmTime || '""'}</div>
                    <div className="font-medium">{item.massMessageType || '""'}</div>
                    <div className="font-medium">{item.postTime || '""'}</div>
                    <div className="font-medium">{item.wallPostType || '""'}</div>
                    <div className="font-medium">{item.storyTime || '""'}</div>
                    <div className="font-medium">{item.storyPostTime || '""'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Broad Schedule Overview */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Broad Schedule Overview
          </h3>

          {isLoading || !schedulerData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                    <div className="ml-4">
                      <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <svg
                  className="h-5 w-5 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-red-700 dark:text-red-300">{error?.message}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(schedulerData?.schedulerData || []).map((item, index) => {
                const color = getColorForIndex(index);
                return (
                  <div
                    key={index}
                    className={`bg-${color}-50 dark:bg-${color}-900/20 p-4 rounded-lg border border-${color}-200 dark:border-${color}-500/30`}
                  >
                    <div
                      className={`text-sm font-medium text-${color}-700 dark:text-${color}-300 mb-1`}
                    >
                      {item.type}:
                    </div>
                    <div
                      className={`text-2xl font-bold text-${color}-900 dark:text-${color}-100`}
                    >
                      {item.status}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
                {isLoading || !schedulerData
                  ? // Loading skeleton for Mass Messages
                    Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={`mass-loading-${index}`}
                        className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-500/30 animate-pulse"
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-3 flex-1">
                            <div className="h-4 bg-blue-300 dark:bg-blue-600 rounded w-3/4"></div>
                            <div className="h-6 bg-blue-300 dark:bg-blue-600 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))
                  : (schedulerData?.scheduleCheckerData?.massMessages || []).map((item, index) => (
                      <div
                        key={`mass-${index}`}
                        className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-500/30"
                      >
                        <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                          {item.text}:
                        </div>
                        <div
                          className={`text-2xl font-bold ${
                            item.checker === "Yes"
                              ? "text-green-900 dark:text-green-100"
                              : item.checker === "No"
                                ? "text-red-900 dark:text-red-100"
                                : "text-yellow-900 dark:text-yellow-100"
                          }`}
                        >
                          {item.checker || "Pending"}
                        </div>
                      </div>
                    ))}
              </div>
            </div>

            {/* Wall Posts Section */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <span className="h-2 w-2 bg-purple-500 rounded-full mr-2"></span>
                Wall Posts
              </h4>
              <div className="space-y-3">
                {isLoading || !schedulerData
                  ? // Loading skeleton for Wall Posts
                    Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={`wall-loading-${index}`}
                        className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-500/30 animate-pulse"
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-3 flex-1">
                            <div className="h-4 bg-purple-300 dark:bg-purple-600 rounded w-3/4"></div>
                            <div className="h-6 bg-purple-300 dark:bg-purple-600 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))
                  : (schedulerData?.scheduleCheckerData?.wallPosts || []).map((item, index) => (
                      <div
                        key={`wall-${index}`}
                        className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-500/30"
                      >
                        <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                          {item.text}:
                        </div>
                        <div
                          className={`text-2xl font-bold ${
                            item.checker === "Yes"
                              ? "text-green-900 dark:text-green-100"
                              : item.checker === "No"
                                ? "text-red-900 dark:text-red-100"
                                : "text-yellow-900 dark:text-yellow-100"
                          }`}
                        >
                          {item.checker || "Pending"}
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulerSheetViewer;
