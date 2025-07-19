import { auth, signOut } from "@/auth";
import TastyCreativeLanding from "@/components/LandingPage";
import Link from "next/link";

import React from "react";

const HomePage = async () => {
  const session = await auth();

  return (
    <div className="relative">
      <TastyCreativeLanding session={session} />
      
      {/* Navigation overlay - styled to match the pinkish theme */}
      <div className="absolute top-6 right-6 z-50 flex">
        {session ? (
          <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-pink-100 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
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
                className="text-sm text-gray-600 hover:text-pink-600 transition-colors"
                type="submit"
              >
                Sign Out
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-pink-100 shadow-lg">
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
