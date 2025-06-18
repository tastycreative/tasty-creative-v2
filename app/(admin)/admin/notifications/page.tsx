
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminNotificationsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Notifications</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage system notifications and alerts</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Notification Center Coming Soon
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          This section will contain notification management, alert configuration, and communication tools.
        </p>
      </div>
    </div>
  );
}
