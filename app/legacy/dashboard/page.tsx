import Calendar from "@/components/Calendar";
import LaunchPrepNotification from "@/components/LaunchPrepNotification";
import PermissionGoogle from "@/components/PermissionGoogle"; // Import the new component
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      {/* Header with pinkish theme */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300">Welcome back! Here&apos;s what&apos;s happening with your projects.</p>
      </div>

      {/* Notifications Section */}
      <div className="mb-8">
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-pink-100 dark:border-pink-500/30 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">!</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Notifications</h2>
          </div>
          <PermissionGoogle apiEndpoint="/api/notifications">
            <LaunchPrepNotification />
          </PermissionGoogle>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-pink-100 dark:border-pink-500/30 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-rose-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">📅</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Calendar</h2>
            </div>
            <Calendar />
          </div>
        </div>
      </div>
    </div>
  );
}
