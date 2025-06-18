
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminAnalyticsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">Detailed analytics and reporting</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Advanced Analytics Coming Soon
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          This section will contain detailed analytics, user behavior tracking, and comprehensive reports.
        </p>
      </div>
    </div>
  );
}
