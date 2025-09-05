"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/components/SidebarProvider";
import ContentLayout from "@/components/ContentLayout";

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Check if we're on a pod-new route
  const isPodNewRoute = pathname?.startsWith('/apps/pod-new')

  return (
    <SidebarProvider>
      {/* Base background layer - admin dashboard style */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-pink-50/30 to-rose-50/50 dark:from-gray-900 dark:via-gray-800/70 dark:to-gray-900/80 -z-50 transition-colors"></div>
      
      {/* Main content container */}
      <div className="min-h-screen flex flex-col relative">
        {/* Enhanced decorative background elements - pinkish circles */}
        <div className="fixed inset-0 -z-40 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-r from-pink-200/40 to-rose-200/40 dark:from-pink-600/20 dark:to-rose-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-32 left-20 w-80 h-80 bg-gradient-to-r from-pink-100/50 to-rose-100/50 dark:from-pink-700/30 dark:to-rose-700/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-r from-pink-50/30 to-rose-50/30 dark:from-pink-800/20 dark:to-rose-800/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/3 w-64 h-64 bg-gradient-to-r from-rose-200/30 to-pink-200/30 dark:from-rose-600/20 dark:to-pink-600/20 rounded-full blur-2xl animate-pulse" />
          <div className="absolute top-1/4 left-10 w-48 h-48 bg-gradient-to-r from-pink-300/20 to-rose-300/20 dark:from-pink-500/15 dark:to-rose-500/15 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-1/3 right-10 w-32 h-32 bg-gradient-to-r from-rose-100/40 to-pink-100/40 dark:from-rose-700/25 dark:to-pink-700/25 rounded-full blur-xl animate-pulse" />
          <div className="absolute top-2/3 left-1/4 w-40 h-40 bg-gradient-to-r from-pink-200/25 to-rose-200/25 dark:from-pink-600/15 dark:to-rose-600/15 rounded-full blur-2xl animate-pulse" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {isPodNewRoute ? (
            // For pod-new routes, render children directly without ContentLayout (sidebar)
            children
          ) : (
            // For all other routes, use ContentLayout with sidebar
            <ContentLayout>{children}</ContentLayout>
          )}
        </div>
      </div>
    </SidebarProvider>
  )
}