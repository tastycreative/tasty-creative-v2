"use client";
import React from "react";

export default function DatabaseErrorFallback() {
  const handleHealthCheck = async () => {
    try {
      const response = await fetch("/api/admin/health");
      const data = await response.json();
      if (data.status === "healthy") {
        alert("Database connection is healthy. Try refreshing the page.");
        window.location.reload();
      } else {
        alert(`Database Status: ${data.database}\nError: ${data.error}`);
      }
    } catch {
      alert("Unable to check system health. Please try again later.");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md mx-auto text-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-pink-200 dark:border-pink-500/30 shadow-lg">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Dashboard Temporarily Unavailable
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          We&apos;re experiencing connectivity issues with our database. Please
          try refreshing the page in a few moments.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-300"
          >
            <svg
              className="mr-2 h-4 w-4"
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
            Refresh Page
          </button>
          <button
            onClick={handleHealthCheck}
            className="inline-flex items-center px-4 py-2 border border-pink-200 dark:border-pink-500/30 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Check Status
          </button>
        </div>
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          If the issue persists, please contact support.
        </div>
      </div>
    </div>
  );
}
