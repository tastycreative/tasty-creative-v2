'use client';

import React from 'react';

interface SheetViewerProps {
  sheetName: string;
  sheetUrl: string;
  onBack: () => void;
}

const SheetViewer: React.FC<SheetViewerProps> = ({ sheetName, sheetUrl, onBack }) => {
  const handleOpenInNewTab = () => {
    if (sheetUrl && sheetUrl.startsWith('http')) {
      window.open(sheetUrl, '_blank');
    }
  };

  // Static schedule data from actual spreadsheet
  const staticScheduleData = [
    { type: 'MM Status', status: '23/48' },
    { type: 'Renew On MM', status: '0/5' },
    { type: 'Wall Posts Status', status: '11/117' },
    { type: 'Renew On Post', status: '0/5' },
    { type: 'Story Posts Status', status: '0/43' },
    { type: 'VIP Sub MM Status', status: '0/5' },
    { type: 'New Sub Campaign Status', status: '0/60' },
    { type: 'Expired Sub Campaign Status', status: '0/60' },
  ];

  const getColorForIndex = (index: number) => {
    const colors = [
      'blue', 'purple', 'pink', 'orange', 'red', 'green', 'teal', 'indigo', 'gray', 'yellow'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v10z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {sheetName}
            </h1>
          </div>
        </div>
      </div>

      {/* Sheet Content Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Sheet Info Panel */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Sheet Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Name
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                    {sheetName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Type
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    Google Sheets Document
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Status
                  </label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    Active
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handleOpenInNewTab}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>Open in Google Sheets</span>
                </button>
                <button
                  onClick={() => {
                    if (sheetUrl) {
                      navigator.clipboard.writeText(sheetUrl);
                    }
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Broad Schedule Overview */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Broad Schedule Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {staticScheduleData.map((item, index) => {
              const color = getColorForIndex(index);
              return (
                <div key={index} className={`bg-${color}-50 dark:bg-${color}-900/20 p-4 rounded-lg border border-${color}-200 dark:border-${color}-500/30`}>
                  <div className={`text-sm font-medium text-${color}-700 dark:text-${color}-300 mb-1`}>
                    {item.type}:
                  </div>
                  <div className={`text-2xl font-bold text-${color}-900 dark:text-${color}-100`}>
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
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Mass Messages Daily:</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">23</span>
                </div>
                <div className="ml-4 space-y-2">
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total PPV Mass Messages Daily:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">0</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total PPV Follow Ups Daily:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">0</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Bumps Daily:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">0</span>
                  </div>
                  <div className="ml-4 space-y-2">
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Total Text Only Bumps Daily:</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">0</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Total GIF Bumps Daily:</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">0</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Total Sexting Set Bumps Daily:</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">0</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Link Drop Daily:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">0</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Expired Subscriber MMs Daily:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">0</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Renew On MMs Daily:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">0</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total VIP Subscriber MMs Weekly:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Wall Posts Section */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <span className="h-2 w-2 bg-purple-500 rounded-full mr-2"></span>
                Wall Posts
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Wall Posts Daily:</span>
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">15</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total GIF Bumps Daily:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">3</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Sexting Set Bumps Daily:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">9</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Link Drops Daily:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">0</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Game Link Drops Daily:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">0</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total PPV Link Drops Daily:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">0</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Single Tape PPVs Daily:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">0</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total VIP Link Drops Daily:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">0</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Single Tape Campaigns Daily:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">0</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Bundle PPVs Daily:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">0</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Bundle Campaigns Daily:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">0</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Games Weekly:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">0</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Tip Me Campaigns Weekly:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">0</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total 1 Fan Only Campaigns Daily:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">0</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total DM Posts Daily:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">0</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Like Farm Posts Daily:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">0</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Renew On Posts Daily:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetViewer;
