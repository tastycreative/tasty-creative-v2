"use client";

import React from "react";

interface AnalystSheetViewerProps {
  sheetName: string;
  sheetUrl: string;
  onBack: () => void;
}

const AnalystSheetViewer: React.FC<AnalystSheetViewerProps> = ({
  sheetName,
  sheetUrl,
  onBack,
}) => {
  const handleOpenInNewTab = () => {
    if (sheetUrl && sheetUrl.startsWith("http")) {
      window.open(sheetUrl, "_blank");
    }
  };

  // Static creator notes data
  const creatorNotesData = [
    {
      clientRequests: "no request",
      scheduleStyle: "no request",
      contentStyle: "",
      contentDescription: "",
      lowestPricing: "",
      notes: "",
      emojiGuide: "",
      generalSlang: "",
    },
  ];

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

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {/* Creator Notes */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Creator Notes
          </h3>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-1 lg:grid-cols-8 gap-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                <div>Client Requests:</div>
                <div>Schedule Style:</div>
                <div>Content Style / Category:</div>
                <div>Content Description:</div>
                <div>Lowest Pricing:</div>
                <div>Notes:</div>
                <div>Emoji Guide:</div>
                <div>General Slang/Words:</div>
              </div>
            </div>

            {/* Table Content */}
            <div className="p-6">
              {creatorNotesData.map((note, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 lg:grid-cols-8 gap-4 text-sm"
                >
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border">
                    <span className="text-gray-600 dark:text-gray-400 lg:hidden font-medium">
                      Client Requests:{" "}
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {note.clientRequests}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border">
                    <span className="text-gray-600 dark:text-gray-400 lg:hidden font-medium">
                      Schedule Style:{" "}
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {note.scheduleStyle}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border">
                    <span className="text-gray-600 dark:text-gray-400 lg:hidden font-medium">
                      Content Style:{" "}
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {note.contentStyle || "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border">
                    <span className="text-gray-600 dark:text-gray-400 lg:hidden font-medium">
                      Content Description:{" "}
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {note.contentDescription || "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border">
                    <span className="text-gray-600 dark:text-gray-400 lg:hidden font-medium">
                      Lowest Pricing:{" "}
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {note.lowestPricing || "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border">
                    <span className="text-gray-600 dark:text-gray-400 lg:hidden font-medium">
                      Notes:{" "}
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {note.notes || "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border">
                    <span className="text-gray-600 dark:text-gray-400 lg:hidden font-medium">
                      Emoji Guide:{" "}
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {note.emojiGuide || "-"}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border">
                    <span className="text-gray-600 dark:text-gray-400 lg:hidden font-medium">
                      General Slang:{" "}
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {note.generalSlang || "-"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-500/30">
              <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Analysis Summary
              </h4>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                Currently showing default creator notes structure. This section
                displays client requirements, content preferences, and style
                guidelines for content creation.
              </p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
              <h4 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-3 flex items-center">
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Data Status
              </h4>
              <p className="text-emerald-700 dark:text-emerald-300 text-sm">
                No specific client requests or style preferences have been set.
                Update the spreadsheet to populate these fields with relevant
                information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalystSheetViewer;
