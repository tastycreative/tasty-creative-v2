
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function WallStatsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Wall Stats Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">Monitor wall performance and engagement metrics</p>
      </div>

      <div className="grid gap-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Posts</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">1,247</p>
            <p className="text-sm text-green-600">+12% from last week</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Engagement Rate</h3>
            <p className="text-2xl font-bold text-blue-600">8.3%</p>
            <p className="text-sm text-green-600">+2.1% from last week</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue Generated</h3>
            <p className="text-2xl font-bold text-green-600">$4,890</p>
            <p className="text-sm text-green-600">+18% from last week</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Average CPM</h3>
            <p className="text-2xl font-bold text-purple-600">$12.50</p>
            <p className="text-sm text-red-600">-3% from last week</p>
          </div>
        </div>

        {/* Analytics Chart Placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Wall Performance Trends
          </h2>
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Chart visualization coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
