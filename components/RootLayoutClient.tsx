"use client";

import { ProtectedFeature } from "@/components/protected-feature";

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Decorative background elements - subtle pink accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 right-20 w-96 h-96 bg-pink-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-40 w-80 h-80 bg-pink-50/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gray-100/30 rounded-full blur-3xl" />
      </div>

      {/* Header with Tasty Creative branding */}
      <div className="relative z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold bg-gradient-to-b from-indigo-950 via-purple-500 to-indigo-950 bg-clip-text text-transparent">
            Tasty Creative
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-[calc(100vh-73px)]">
        <ProtectedFeature>
          <div className="p-6">
            {children}
          </div>
        </ProtectedFeature>
      </div>
    </div>
  );
}