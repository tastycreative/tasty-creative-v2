// app/providers.tsx
"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  // Create a client instance per component to avoid sharing state between requests
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Disable automatic refetching to give us more control
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        retry: 2,
        staleTime: 0, // Always consider data stale for fresh results
      },
      mutations: {
        retry: 1,
      },
    },
  }))

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
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
                cancelButton: 'group-[.toast]:bg-gray-100 group-[.toast]:text-gray-500 dark:group-[.toast]:bg-gray-800 dark:group-[.toast]:text-gray-400',
              },
            }}
            visibleToasts={5}
            expand={true}
            gap={8}
          />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}