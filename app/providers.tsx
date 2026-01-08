// app/providers.tsx
"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useState, lazy, Suspense } from 'react'
import { NotificationProvider } from '@/contexts/NotificationContext'

// Only load devtools in development
const ReactQueryDevtools = process.env.NODE_ENV === 'development'
  ? lazy(() => import('@tanstack/react-query-devtools').then(mod => ({ default: mod.ReactQueryDevtools })))
  : () => null

export function Providers({ children }: { children: React.ReactNode }) {
  // Create a client instance per component to avoid sharing state between requests
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Disable automatic refetching to give us more control
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        retry: 2,
        staleTime: 60 * 1000, // 1 minute - prevents excessive refetching while keeping data reasonably fresh
      },
      mutations: {
        retry: 1,
      },
    },
  }))

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            {process.env.NODE_ENV === 'development' && (
              <Suspense fallback={null}>
                <ReactQueryDevtools initialIsOpen={false} />
              </Suspense>
            )}
            <Toaster 
              richColors 
              position="bottom-right"
              closeButton
              duration={4000}
              theme="system"
              className="toaster group"
              toastOptions={{
                classNames: {
                  toast: 'group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-950 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-gray-950 dark:group-[.toaster]:text-gray-50 dark:group-[.toaster]:border-gray-800',
                  description: 'group-[.toast]:text-gray-500 dark:group-[.toast]:text-gray-400',
                  actionButton: 'group-[.toast]:bg-gray-900 group-[.toast]:text-gray-50 dark:group-[.toast]:bg-gray-50 dark:group-[.toast]:text-gray-900',
                  cancelButton: 'group-[.toast]:bg-gray-100 group-[.toaster]:text-gray-500 dark:group-[.toaster]:bg-gray-800 dark:group-[.toaster]:text-gray-400',
                },
              }}
              visibleToasts={5}
              expand={true}
              gap={8}
            />
          </ThemeProvider>
        </NotificationProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}