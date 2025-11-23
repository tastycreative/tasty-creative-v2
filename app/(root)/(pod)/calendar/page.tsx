import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Calendar from "@/components/Calendar";

export default async function CalendarPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 p-4 md:p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-white dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
          Calendar
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
          Manage your schedule and upcoming events
        </p>
      </div>

      {/* Calendar Component */}
      {/* <CalendarView /> */}
      <Calendar />
    </div>
  );
}
