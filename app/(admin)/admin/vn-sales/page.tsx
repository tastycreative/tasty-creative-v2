
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function VNSalesPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">VN Sales Tracker</h1>
        <p className="text-gray-600 dark:text-gray-400">Track video note sales, loyalty points, and transactions</p>
      </div>

      <div className="grid gap-6">
        {/* Sales Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">VN Sales Today</h3>
            <p className="text-2xl font-bold text-green-600">$890</p>
            <p className="text-sm text-green-600">+15% from yesterday</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total VN Count</h3>
            <p className="text-2xl font-bold text-blue-600">247</p>
            <p className="text-sm text-blue-600">12 new today</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Loyalty Points Earned</h3>
            <p className="text-2xl font-bold text-purple-600">3,450</p>
            <p className="text-sm text-purple-600">+8% this week</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Average VN Price</h3>
            <p className="text-2xl font-bold text-orange-600">$25.50</p>
            <p className="text-sm text-green-600">+$2.50 from last week</p>
          </div>
        </div>

        {/* Sales by Model */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sales by Model</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Model A</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">45 VN sales</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">$1,125</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">890 loyalty pts</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Model B</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">32 VN sales</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">$800</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">640 loyalty pts</p>
                </div>
              </div>
              <div className="text-center text-gray-600 dark:text-gray-400 py-4">
                <p className="text-sm">Detailed sales tracking and analytics coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
