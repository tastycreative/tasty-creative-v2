
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function CampaignStatsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Campaign Stats Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">Track campaign performance and conversion metrics</p>
      </div>

      <div className="grid gap-6">
        {/* Campaign Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Campaigns</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
            <p className="text-sm text-blue-600">3 new this week</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Conversion Rate</h3>
            <p className="text-2xl font-bold text-green-600">3.8%</p>
            <p className="text-sm text-green-600">+0.5% from last week</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</h3>
            <p className="text-2xl font-bold text-green-600">$12,340</p>
            <p className="text-sm text-green-600">+25% from last week</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">ROI</h3>
            <p className="text-2xl font-bold text-purple-600">285%</p>
            <p className="text-sm text-green-600">+15% from last week</p>
          </div>
        </div>

        {/* Campaign Performance Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Campaign Performance</h2>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-600 dark:text-gray-400">
              <p>Campaign analytics dashboard coming soon...</p>
              <p className="text-sm mt-2">This will include detailed campaign metrics, A/B test results, and conversion tracking.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
