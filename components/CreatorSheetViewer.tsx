"use client";

import React from "react";

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
                {[
                  { text: "Total Mass Messages Daily:", value: "0" },
                  { text: "Total PPV Mass Messages Daily:", value: "0", indent: 1 },
                  { text: "Total PPV Follow Ups Daily:", value: "0", indent: 1 },
                  { text: "Total Bumps Daily:", value: "0", indent: 1 },
                  { text: "Total Text Only Bumps Daily:", value: "0", indent: 2 },
                  { text: "Total GIF Bumps Daily:", value: "0", indent: 2 },
                  { text: "Total Sexting Set Bumps Daily:", value: "0", indent: 2 },
                  { text: "Total Link Drop Daily:", value: "0", indent: 1 },
                  { text: "Total Expired Subscriber MMs Daily:", value: "0", indent: 1 },
                  { text: "Total Renew On MMs Daily:", value: "0", indent: 1 },
                  { text: "Total VIP Subscriber MMs Weekly:", value: "0", indent: 1 }
                ].map((item, index) => (
                  <div
                    key={`mass-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      <span 
                        className="text-sm text-gray-700 dark:text-gray-300"
                        style={{ marginLeft: `${(item.indent || 0) * 16}px` }}
                      >
                        {item.text}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200">
                      {item.value}
                    </span>
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
                {[
                  { text: "Total Wall Posts Daily:", value: "0" },
                  { text: "Total GIF Bumps Daily:", value: "0" },
                  { text: "Total Sexting Set Bumps Daily:", value: "0" },
                  { text: "Total Link Drops Daily:", value: "0" },
                  { text: "Total Game Link Drops Daily:", value: "0" },
                  { text: "Total PPV Link Drops Daily:", value: "0" },
                  { text: "Total Single Tape PPVs Daily:", value: "0" },
                  { text: "Total VIP Link Drops Daily:", value: "0" },
                  { text: "Total Single Tape Campagins Daily:", value: "0" },
                  { text: "Total Bundle PPVs Daily:", value: "0" },
                  { text: "Total Bundle Campagins Daily:", value: "0" },
                  { text: "Total Games Weekly:", value: "0" },
                  { text: "Total Tip Me Campaigns Weekly:", value: "0" },
                  { text: "Total 1 Fan Only Campagins Daily:", value: "0" },
                  { text: "Total DM Posts Daily:", value: "0" },
                  { text: "Total Like Farm Posts Daily:", value: "0" },
                  { text: "Total Renew On Posts Daily:", value: "0" }
                ].map((item, index) => (
                  <div
                    key={`wall-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {item.text}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200">
                      {item.value}
                    </span>
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

export default CreatorSheetViewer;
