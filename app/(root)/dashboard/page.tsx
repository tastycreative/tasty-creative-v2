import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic features available to all logged-in users */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button type="submit">Sign Out</button>
          </form>
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Name: {session.user.name || "Not set"}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Email: {session.user.email}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Status:{" "}
            {session.user.emailVerified ? (
              <span className="text-green-600">Verified ✓</span>
            ) : (
              <span className="text-yellow-600">Unverified</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
