"use client";

import React, { useState, useEffect, useCallback } from "react";

interface ScheduleDataItem {
  type: string;
  status: string;
}

interface ScheduleCheckerItem {
  text: string;
  checker: string;
}

interface ScheduleCheckerData {
  massMessages: ScheduleCheckerItem[];
  wallPosts: ScheduleCheckerItem[];
}

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
  const [scheduleData, setScheduleData] = useState<ScheduleDataItem[]>([]);
  const [scheduleCheckerData, setScheduleCheckerData] =
    useState<ScheduleCheckerData>({
      massMessages: [],
      wallPosts: [],
    });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<string>("1A");
  const [currentSchedule, setCurrentSchedule] =
    useState<string>("Schedule #1A");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const handleOpenInNewTab = () => {
    if (sheetUrl && sheetUrl.startsWith("http")) {
      window.open(sheetUrl, "_blank");
    }
  };

  const fetchScheduleData = useCallback(async () => {
    if (!sheetUrl) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/pod/scheduler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheetUrl: sheetUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch schedule data");
      }

      const data = await response.json();
      setScheduleData(data.schedulerData || []);
      setScheduleCheckerData(
        data.scheduleCheckerData || { massMessages: [], wallPosts: [] }
      );

      // Extract schedule code from currentSchedule (e.g., "Schedulle #1A" -> "1A")
      if (data.currentSchedule) {
        setCurrentSchedule(data.currentSchedule);
        const scheduleMatch = data.currentSchedule.match(/#(\w+)/);
        if (scheduleMatch) {
          setSelectedSchedule(scheduleMatch[1]); // Extract "1A" from "Schedulle #1A"
        }
      }
    } catch (err) {
      console.error("Error fetching schedule data:", err);
      setError("Failed to load schedule data from spreadsheet");
      // Fallback to static data if API fails
      setScheduleData([
        { type: "MM Status", status: "0/0" },
        { type: "Renew On MM", status: "0/0" },
        { type: "Wall Posts Status", status: "0/0" },
        { type: "Renew On Post", status: "0/0" },
        { type: "Story Posts Status", status: "0/0" },
        { type: "VIP Sub MM Status", status: "0/0" },
        { type: "New Sub Campaign Status", status: "0/0" },
        { type: "Expired Sub Campaign Status", status: "0/0" },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [sheetUrl]);

  const handleScheduleChange = async (newSchedule: string) => {
    setIsUpdating(true);
    setSelectedSchedule(newSchedule);

    try {
      const response = await fetch("/api/pod/scheduler/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sheetUrl: sheetUrl,
          scheduleValue: newSchedule,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update schedule");
      }

      const data = await response.json();

      // Update all data with the fresh values from the spreadsheet
      setScheduleData(data.schedulerData || []);
      setScheduleCheckerData(
        data.scheduleCheckerData || { massMessages: [], wallPosts: [] }
      );
      setCurrentSchedule(data.currentSchedule || `Schedule #${newSchedule}`);

      console.log("Schedule updated successfully:", data.message);
    } catch (err) {
      console.error("Error updating schedule:", err);
      setError("Failed to update schedule in spreadsheet");
      // Revert to previous selection on error
      const scheduleMatch = currentSchedule.match(/#(\w+)/);
      if (scheduleMatch) {
        setSelectedSchedule(scheduleMatch[1]);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

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
                Current: {currentSchedule}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {/* Broad Schedule Overview */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Broad Schedule Overview
          </h3>

          {isLoading ? (
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
                <span className="text-red-700 dark:text-red-300">{error}</span>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {scheduleData.map((item, index) => {
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
                {isLoading
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
                  : scheduleCheckerData.massMessages.map((item, index) => (
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
                {isLoading
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
                  : scheduleCheckerData.wallPosts.map((item, index) => (
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
