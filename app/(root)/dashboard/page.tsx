import Calendar from "@/components/Calendar";
import LaunchPrepNotification from "@/components/LaunchPrepNotification";
import UpcomingEvents from "@/components/UpcomingEvents";
import PermissionGoogle from "@/components/PermissionGoogle"; // Import the new component
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-full">
        {/* Page Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here&apos;s what&apos;s happening with your projects.
          </p>
        </header>

        {/* Main Content Grid - Left to Right Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column - Notifications & Events */}
          <div className="xl:col-span-4 space-y-6">
            {/* Notifications Card */}
            <div className="h-fit">
              <div className="mb-4">
                <h2 className="text-lg font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  Notifications
                </h2>
              </div>
              <PermissionGoogle apiEndpoint="/api/notifications">
                <LaunchPrepNotification />
              </PermissionGoogle>
            </div>

            {/* Upcoming Events Card */}
            <div className="flex-1">
              <div className="mb-4">
                <h2 className="text-lg font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  Upcoming Events
                </h2>
              </div>
              <UpcomingEvents />
            </div>
          </div>

          {/* Right Column - Calendar */}
          <div className="xl:col-span-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Calendar
              </h2>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <Calendar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
