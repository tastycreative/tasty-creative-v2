"use client"

import React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { PodSidebar } from "@/components/PodSidebar"

interface PodLayoutProps {
  children: React.ReactNode
}

export function PodLayout({ children }: PodLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 text-white">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 px-6 py-8 shadow-2xl">
          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <div className="mb-4">
              <Link 
                href="/apps" 
                className="inline-flex items-center text-white/80 hover:text-white transition-colors duration-200 group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                <span className="font-medium">Tasty Creative Pod</span>
              </Link>
            </div>
            
            {/* Main Header */}
            <div className="text-center">
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
                POD Management Dashboard
              </h1>
              <p className="text-lg text-white/90 max-w-3xl mx-auto leading-relaxed">
                Manage your team, track workflow progress, and sync with Google Spreadsheets
              </p>
            </div>
          </div>
        </div>

        {/* Main Layout with Sidebar */}
        <div className="flex min-h-[calc(100vh-12rem)]">
          {/* Left Sidebar */}
          <PodSidebar />
          
          {/* Main Content Area */}
          <main className="flex-1 bg-white dark:bg-gray-950 relative">
            {/* Sidebar Trigger for Mobile */}
            <div className="lg:hidden p-4 border-b border-gray-200 dark:border-gray-800">
              <SidebarTrigger />
            </div>
            
            {/* Content */}
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}