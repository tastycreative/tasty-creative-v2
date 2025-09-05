"use client"

import React, { useEffect, Suspense } from "react"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  usePodData, 
  useTasks, 
  usePricingPreview,
  usePodStore 
} from "@/lib/stores/podStore"
import { usePricingRotation } from "@/lib/hooks/usePricingRotation"

// Dynamic import for better performance - using new component with team sidebar
const DashboardWithTeamSidebar = dynamic(() => import("@/components/DashboardWithTeamSidebar").then(mod => ({ default: mod.DashboardWithTeamSidebar })), {
  loading: () => <div className="p-6"><Skeleton className="h-64 w-full" /></div>,
  ssr: false,
})

export default function PodDashboardPage() {
  const { selectedRow } = usePodStore()
  const { podData, loading: isLoading } = usePodData()
  const { tasks, loading: isTasksLoading, fetchTasks } = useTasks()
  const { 
    preview: pricingPreview, 
    fetchPricingPreview
  } = usePricingPreview()
  
  // Use the pricing rotation hook
  const { pricingRotationProgress } = usePricingRotation(podData?.creators || [])

  // Fetch tasks when selectedRow changes
  useEffect(() => {
    if (selectedRow) {
      const teamId = `team-${selectedRow}`
      fetchTasks(teamId)
    }
  }, [selectedRow, fetchTasks])

  // Fetch pricing preview only when podData is fully loaded with creators
  useEffect(() => {
    if (
      podData?.creators &&
      podData.creators.length > 0 &&
      !isLoading &&
      podData.lastUpdated
    ) {
      console.log('🎯 POD Dashboard triggering fetchPricingPreview with:', {
        creatorsCount: podData.creators.length,
        creators: podData.creators.map(c => c.name)
      })
      fetchPricingPreview(podData.creators)
    }
  }, [
    podData?.creators,
    podData?.lastUpdated,
    isLoading,
    fetchPricingPreview,
  ])

  if (isLoading) {
    return <div className="p-6"><Skeleton className="h-64 w-full" /></div>
  }

  if (!podData) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6 text-center">
        <span className="text-gray-500 dark:text-gray-400">
          Select a team to view workflow
        </span>
      </div>
    )
  }

  if (isTasksLoading) {
    return <div className="p-6"><Skeleton className="h-64 w-full" /></div>
  }

  return (
    <Suspense fallback={<div className="p-6"><Skeleton className="h-64 w-full" /></div>}>
      <DashboardWithTeamSidebar
        tasks={tasks}
        creators={podData?.creators || []}
      />
    </Suspense>
  )
}