
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminDatabasePage() {
  const session = await auth();

  if (session?.user?.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Database Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage database operations and backups</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Database Tools Coming Soon
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          This section will contain database management tools, backup options, and data migration utilities.
        </p>
      </div>
    </div>
  );
}
