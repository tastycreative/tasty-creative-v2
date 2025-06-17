import { auth, signOut } from "@/auth";
import TastyCreativeLanding from "@/components/LandingPage";
import Link from "next/link";

import React from "react";

const HomePage = async () => {
  const session = await auth();

  return (
    <div className="">
      <TastyCreativeLanding session={session} />
      <div className="absolute top-6 right-5 z-50 md:flex hidden">
        {session ? (
          <form
            className="flex gap-2"
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <p className="text-gray-600 dark:text-gray-400">
              {session.user.name || "Not set"}
            </p>

            <Link href="/dashboard" className="text-purple-500 hover:underline">
              Dashboard
            </Link>

            {session.user.role === "ADMIN" && (
              <Link
                href="/admin/dashboard"
                className="text-purple-500 hover:underline"
              >
                Admin
              </Link>
            )}
            <button className="cursor-pointer" type="submit">
              Sign Out
            </button>
          </form>
        ) : (
          <div>
            <Link href="/sign-in" className="text-purple-500 hover:underline">
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
