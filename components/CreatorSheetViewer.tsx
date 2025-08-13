"use client";

import React, { useState, useEffect, useCallback } from "react";

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
  const [massMessages, setMassMessages] = useState<CreatorDataItem[]>([]);
  const [wallPosts, setWallPosts] = useState<CreatorDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<string>("1A");
  const [currentSchedule, setCurrentSchedule] = useState<string>("Schedule #1A");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const fetchCreatorData = useCallback(async () => {
    if (!sheetUrl) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/pod/creator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sheetUrl: sheetUrl
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch creator data');
      }

      const data = await response.json();
      setMassMessages(data.massMessages || []);
      setWallPosts(data.wallPosts || []);
      
      // Extract schedule code from currentSchedule if provided
      if (data.currentSchedule) {
        setCurrentSchedule(data.currentSchedule);
        const scheduleMatch = data.currentSchedule.match(/#(\w+)/);
        if (scheduleMatch) {
          setSelectedSchedule(scheduleMatch[1]); // Extract "1A" from "Schedule #1A"
        }
      }
      
    } catch (err) {
      console.error('Error fetching creator data:', err);
      setError('Failed to load creator data from spreadsheet');
      // Fallback to empty arrays if API fails
      setMassMessages([]);
      setWallPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [sheetUrl]);

  const handleScheduleChange = async (newSchedule: string) => {
    setIsUpdating(true);
    setSelectedSchedule(newSchedule);
    setScheduleError(null); // Clear any previous schedule errors

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
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || '';
        
        // Check for permission-related errors
        const isPermissionError = response.status === 403 || 
          errorMessage.toLowerCase().includes('permission') ||
          errorMessage.includes('The caller does not have permission') ||
          errorMessage.toLowerCase().includes('access denied') ||
          errorMessage.toLowerCase().includes('forbidden');
        
        if (isPermissionError) {
          throw new Error("You don't have permission to edit this spreadsheet");
        } else if (response.status === 401) {
          throw new Error("Authentication required. Please sign in again");
        } else {
          throw new Error(errorMessage || "Failed to update schedule");
        }
      }

      const data = await response.json();
      setCurrentSchedule(data.currentSchedule || `Schedule #${newSchedule}`);

      // Refresh creator data after schedule change
      await fetchCreatorData();

      console.log("Schedule updated successfully:", data.message);
    } catch (err) {
      console.error("Error updating schedule:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update schedule in spreadsheet";
      setScheduleError(errorMessage);
      
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
    fetchCreatorData();
  }, [fetchCreatorData]);

  const handleOpenInNewTab = () => {
    if (sheetUrl && sheetUrl.startsWith("http")) {
      window.open(sheetUrl, "_blank");
    }
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

      {/* Error Display */}
      {scheduleError && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-500/30">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center space-x-3">
              <svg
                className="h-5 w-5 text-red-500 flex-shrink-0"
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
              <span className="text-red-700 dark:text-red-300 text-sm font-medium">
                {scheduleError}
              </span>
              <button
                onClick={() => setScheduleError(null)}
                className="ml-auto text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

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
                {isLoading ? (
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
                    <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
                  </div>
                ) : (
                  massMessages.map((item, index) => (
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
                {isLoading ? (
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
                    <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
                  </div>
                ) : (
                  wallPosts.map((item, index) => (
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
