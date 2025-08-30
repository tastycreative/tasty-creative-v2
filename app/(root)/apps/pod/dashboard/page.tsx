"use client";

import React, { useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { WorkflowDashboardSkeleton } from "@/components/ui/skeleton";
import { 
  usePodData, 
  useTasks, 
  usePricingPreview,
  usePodStore 
} from "@/lib/stores/podStore";
import { usePricingRotation } from "@/lib/hooks/usePricingRotation";

// Dynamic import for better performance
const WorkflowDashboard = dynamic(() => import("@/components/WorkflowDashboard"), {
  loading: () => <WorkflowDashboardSkeleton />,
  ssr: false,
});

export default function DashboardPage() {
  const { selectedRow } = usePodStore();
  const { podData, loading: isLoading } = usePodData();
  const { tasks, loading: isTasksLoading, fetchTasks } = useTasks();
  const { 
    preview: pricingPreview, 
    fetchPricingPreview
  } = usePricingPreview();
  
  // Use the pricing rotation hook
  const { pricingRotationProgress } = usePricingRotation(podData?.creators || []);

  // Fetch tasks when selectedRow changes
  useEffect(() => {
    if (selectedRow) {
      const teamId = `team-${selectedRow}`;
      fetchTasks(teamId);
    }
  }, [selectedRow, fetchTasks]);

  // Fetch pricing preview only when podData is fully loaded with creators
  useEffect(() => {
    if (
      podData?.creators &&
      podData.creators.length > 0 &&
      !isLoading &&
      podData.lastUpdated
    ) {
      console.log('🎯 Dashboard triggering fetchPricingPreview with:', {
        creatorsCount: podData.creators.length,
        creators: podData.creators.map(c => c.name)
      });
      fetchPricingPreview(podData.creators);
    }
  }, [
    podData?.creators,
    podData?.lastUpdated,
    isLoading,
    fetchPricingPreview,
  ]);

  const handlePricingGuideClick = () => {
    // Use Next.js router for better navigation
    window.location.href = "/apps/pod/pricing";
  };

  if (isLoading) {
    return <WorkflowDashboardSkeleton />;
  }

  if (!podData) {
    return (
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-pink-200 dark:border-pink-500/30 rounded-lg p-6 text-center">
        <span className="text-gray-500 dark:text-gray-400">
          Select a team to view workflow
        </span>
      </div>
    );
  }

  if (isTasksLoading) {
    return <WorkflowDashboardSkeleton />;
  }

  return (
    <Suspense fallback={<WorkflowDashboardSkeleton />}>
      <WorkflowDashboard
        tasks={tasks}
        creators={podData?.creators || []}
        onPricingGuideClick={handlePricingGuideClick}
        pricingPreview={pricingPreview}
        pricingRotationProgress={pricingRotationProgress}
      />
    </Suspense>
  );
}