
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminModelsPage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Models Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage model profiles and status</p>
      </div>

      <div className="grid gap-6">
        {/* Models Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Models</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Models</h3>
            <p className="text-2xl font-bold text-green-600">18</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Inactive Models</h3>
            <p className="text-2xl font-bold text-red-600">6</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">New This Month</h3>
            <p className="text-2xl font-bold text-blue-600">3</p>
          </div>
        </div>

        {/* Models Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Model Directory</h2>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-600 dark:text-gray-400">
              <p>Model management interface coming soon...</p>
              <p className="text-sm mt-2">This will include CRUD operations for model profiles with active/inactive status management.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
