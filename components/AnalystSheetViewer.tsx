"use client";

import React, { useState } from "react";

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
  const [activeSubtab, setActiveSubtab] = useState<"top-performing" | "scraped" | "chatter-submitted" | "mm-ideas">("top-performing");

  const handleOpenInNewTab = () => {
    if (sheetUrl && sheetUrl.startsWith("http")) {
      window.open(sheetUrl, "_blank");
    }
  };

  const handleGenerateCaption = () => {
    // TODO: Implement caption generation logic
    console.log("Generate caption for:", sheetName);
  };

  // Static captions data
  const topPerformingCaptions = [
    {
      caption: "Sample top performing caption text here...",
      captionCategory: "Engagement",
      contentType: "Photo",
    },
    {
      caption: "Another high-performing caption example...",
      captionCategory: "Promotional",
      contentType: "Video",
    },
  ];

  const scrapedCaptions = [
    {
      caption: "Scraped caption example from social media...",
      captionCategory: "Lifestyle",
      contentType: "Story",
    },
    {
      caption: "Another scraped caption for reference...",
      captionCategory: "Entertainment",
      contentType: "Reel",
    },
  ];

  const chatterSubmittedCaptions = [
    {
      caption: "Chatter submitted caption idea...",
      captionCategory: "Interactive",
      contentType: "Live",
    },
    {
      caption: "Fan-suggested caption content...",
      captionCategory: "Community",
      contentType: "Photo",
    },
  ];

  const scrapedCaptionsMMIdeas = [
    {
      caption: "Mass message idea based on trending content...",
      captionCategory: "Marketing",
      descriptionExplanation: "This caption works well for promotional mass messages due to its engaging hook and clear call-to-action.",
    },
    {
      caption: "Another MM idea from scraped content...",
      captionCategory: "Conversion",
      descriptionExplanation: "Effective for driving subscriptions by creating curiosity and offering value.",
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

      {/* Folder-Style Tab Navigation */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-50 dark:bg-gray-900 pt-6">
          <div className="px-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Caption Categories
              </h3>
              <button
                onClick={handleGenerateCaption}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Generate Caption</span>
              </button>
            </div>
          </div>
          <nav className="flex relative ">
            <button
              onClick={() => setActiveSubtab("top-performing")}
              className={`px-6 py-3 transition-all duration-200 flex items-center space-x-3 font-medium relative border-l border-t border-r ${
                activeSubtab === "top-performing"
                  ? "bg-white dark:bg-gray-800 text-green-700 dark:text-green-300 border-gray-200 dark:border-gray-600 rounded-t-lg -mb-px z-20"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-100 rounded-t-lg border-gray-300 dark:border-gray-600 z-10 border-b border-b-gray-300 dark:border-b-gray-600"
              } -mr-3`}
            >
              <span className="h-3 w-3 bg-green-500 rounded-full flex-shrink-0"></span>
              <span className="text-sm">Top Performing</span>
            </button>
            
            <button
              onClick={() => setActiveSubtab("scraped")}
              className={`px-6 py-3 transition-all duration-200 flex items-center space-x-3 font-medium relative border-l border-t border-r ${
                activeSubtab === "scraped"
                  ? "bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border-gray-200 dark:border-gray-600 rounded-t-lg -mb-px z-20"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-100 rounded-t-lg border-gray-300 dark:border-gray-600 z-10 border-b border-b-gray-300 dark:border-b-gray-600"
              } -mr-3`}
            >
              <span className="h-3 w-3 bg-blue-500 rounded-full flex-shrink-0"></span>
              <span className="text-sm">Scraped Captions</span>
            </button>
            
            <button
              onClick={() => setActiveSubtab("chatter-submitted")}
              className={`px-6 py-3 transition-all duration-200 flex items-center space-x-3 font-medium relative border-l border-t border-r ${
                activeSubtab === "chatter-submitted"
                  ? "bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 border-gray-200 dark:border-gray-600 rounded-t-lg -mb-px z-20"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-100 rounded-t-lg border-gray-300 dark:border-gray-600 z-10 border-b border-b-gray-300 dark:border-b-gray-600"
              } -mr-3`}
            >
              <span className="h-3 w-3 bg-purple-500 rounded-full flex-shrink-0"></span>
              <span className="text-sm">Chatter-submitted</span>
            </button>
            
            <button
              onClick={() => setActiveSubtab("mm-ideas")}
              className={`px-6 py-3 transition-all duration-200 flex items-center space-x-3 font-medium relative border-l border-t border-r ${
                activeSubtab === "mm-ideas"
                  ? "bg-white dark:bg-gray-800 text-orange-700 dark:text-orange-300 border-gray-200 dark:border-gray-600 rounded-t-lg -mb-px z-20"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-100 rounded-t-lg border-gray-300 dark:border-gray-600 z-10 border-b border-b-gray-300 dark:border-b-gray-600"
              }`}
            >
              <span className="h-3 w-3 bg-orange-500 rounded-full flex-shrink-0"></span>
              <span className="text-sm">MM Ideas</span>
            </button>
          </nav>
        </div>

        {/* Main Content Area - Connected to Active Tab */}
        <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 border-t-0 shadow-sm ${
          activeSubtab === "top-performing" 
            ? "rounded-b-lg rounded-tr-lg rounded-tl-0" 
            : activeSubtab === "scraped"
            ? "rounded-b-lg rounded-tr-lg "
            : activeSubtab === "chatter-submitted"
            ? "rounded-b-lg rounded-tr-lg "
            : "rounded-b-lg rounded-tr-lg "
        }`}>
          {activeSubtab === "top-performing" && (
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                <span className="h-3 w-3 bg-green-500 rounded-full mr-3"></span>
                Top Performing Captions
              </h3>
              <div className="overflow-hidden">
                {/* Header */}
                <div className="bg-green-50 dark:bg-green-900/20 px-6 py-4 border-b border-green-200 dark:border-green-500/30">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm font-medium text-green-700 dark:text-green-300">
                    <div>Caption</div>
                    <div>Caption Category</div>
                    <div>Content Type</div>
                  </div>
                </div>
                {/* Content */}
                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                  {topPerformingCaptions.map((caption, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Caption:</div>
                          <div className="text-sm text-gray-900 dark:text-gray-100">{caption.caption}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Caption Category:</div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                              {caption.captionCategory}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Content Type:</div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">{caption.contentType}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSubtab === "scraped" && (
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                <span className="h-3 w-3 bg-blue-500 rounded-full mr-3"></span>
                Scraped Captions
              </h3>
              <div className="overflow-hidden">
                {/* Header */}
                <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-4 border-b border-blue-200 dark:border-blue-500/30">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm font-medium text-blue-700 dark:text-blue-300">
                    <div>Caption</div>
                    <div>Caption Category</div>
                    <div>Content Type</div>
                  </div>
                </div>
                {/* Content */}
                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                  {scrapedCaptions.map((caption, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Caption:</div>
                          <div className="text-sm text-gray-900 dark:text-gray-100">{caption.caption}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Caption Category:</div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                              {caption.captionCategory}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Content Type:</div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">{caption.contentType}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSubtab === "chatter-submitted" && (
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                <span className="h-3 w-3 bg-purple-500 rounded-full mr-3"></span>
                Chatter-submitted Captions
              </h3>
              <div className="overflow-hidden">
                {/* Header */}
                <div className="bg-purple-50 dark:bg-purple-900/20 px-6 py-4 border-b border-purple-200 dark:border-purple-500/30">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm font-medium text-purple-700 dark:text-purple-300">
                    <div>Caption</div>
                    <div>Caption Category</div>
                    <div>Content Type</div>
                  </div>
                </div>
                {/* Content */}
                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                  {chatterSubmittedCaptions.map((caption, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Caption:</div>
                          <div className="text-sm text-gray-900 dark:text-gray-100">{caption.caption}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Caption Category:</div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                              {caption.captionCategory}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Content Type:</div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">{caption.contentType}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSubtab === "mm-ideas" && (
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                <span className="h-3 w-3 bg-orange-500 rounded-full mr-3"></span>
                Scraped Captions/MM Ideas
              </h3>
              <div className="overflow-hidden">
                {/* Header */}
                <div className="bg-orange-50 dark:bg-orange-900/20 px-6 py-4 border-b border-orange-200 dark:border-orange-500/30">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm font-medium text-orange-700 dark:text-orange-300">
                    <div>Caption</div>
                    <div>Caption Category</div>
                    <div>Description/Explanation</div>
                  </div>
                </div>
                {/* Content */}
                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                  {scrapedCaptionsMMIdeas.map((caption, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Caption:</div>
                          <div className="text-sm text-gray-900 dark:text-gray-100">{caption.caption}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Caption Category:</div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">
                              {caption.captionCategory}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 lg:hidden">Description/Explanation:</div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">{caption.descriptionExplanation}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalystSheetViewer;
