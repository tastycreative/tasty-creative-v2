import { auth, signOut } from "@/auth";
import TastyCreativeLanding from "@/components/LandingPage";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import Link from "next/link";
import { redirect } from "next/navigation";

import React from "react";

const HomePage = async () => {
  const session = await auth();

  // Redirect authenticated users to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="relative bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors">
      <TastyCreativeLanding session={session} />
      
      {/* Navigation overlay - styled to match the pinkish theme */}
      <div className="absolute top-6 right-6 z-50 flex gap-4">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-2 rounded-xl border border-pink-200 dark:border-pink-500/30 shadow-lg">
          <ThemeToggle />
        </div>
        {session ? (
          <div className="flex items-center gap-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-xl border border-pink-200 dark:border-pink-500/30 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Welcome, {session.user.name || "User"}
              </span>
              
              <Link 
                href="/dashboard" 
                className="px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm rounded-lg hover:shadow-md transition-all duration-300"
              >
                Dashboard
              </Link>

              {session.user.role === "ADMIN" && (
                <Link
                  href="/admin/dashboard"
                  className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-lg hover:shadow-md transition-all duration-300"
                >
                  Admin
                </Link>
              )}
            </div>
            
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <button 
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                type="submit"
              >
                Sign Out
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-xl border border-pink-200 dark:border-pink-500/30 shadow-lg">
            <Link 
              href="/sign-in" 
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm rounded-lg hover:shadow-md transition-all duration-300"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>

    </div>
  );
};

export default HomePage;
