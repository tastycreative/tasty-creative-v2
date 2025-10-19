import Floating3DObjects from "@/components/3DFloatingObjects";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: {
    template: "%s | Auth",
    default: "Authentication",
  },
  description: "Sign in or create an account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - Auth Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          {/* Auth Form Content */}
          {children}
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:block relative w-0 flex-1 lg:w-1/2">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="absolute inset-0 bg-black/20"></div>
          <Floating3DObjects />
        </div>
      </div>
    </div>
  );
}
