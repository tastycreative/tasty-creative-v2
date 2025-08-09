import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
  title: "Settings",
};

const Settings = () => {
  return (
    <div className="container mx-auto p-6">
      {/* Header with pinkish theme */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-300">Manage your account preferences and application settings.</p>
      </div>

      {/* Settings Card */}
      <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-pink-100 dark:border-pink-500/30 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">⚙️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">General Settings</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Settings page coming soon...</p>
      </div>
    </div>
  )
}

export default Settings
