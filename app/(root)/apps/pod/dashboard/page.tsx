"use client";

import React, { useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { WorkflowDashboardSkeleton } from "@/components/ui/skeleton";
import { 
  usePodData, 
  useTasks, 
  usePricingPreview,
  usePodStore,
  useAvailableTeams 
} from "@/lib/stores/podStore";
import { usePricingRotation } from "@/lib/hooks/usePricingRotation";
import NoTeamSelected from "@/components/pod/NoTeamSelected";

// Dynamic import for better performance
const WorkflowDashboard = dynamic(() => import("@/components/WorkflowDashboard"), {
  loading: () => <WorkflowDashboardSkeleton />,
  ssr: false,
});

export default function DashboardPage() {
  const { selectedTeamId } = usePodStore();
  const { podData, loading: isLoading } = usePodData();
  const { tasks, loading: isTasksLoading, fetchTasks } = useTasks();
  const { teams: availableTeams, loading: isLoadingTeams } = useAvailableTeams();
  const { 
    preview: pricingPreview, 
    fetchPricingPreview
  } = usePricingPreview();
  
  // Use the pricing rotation hook
  const { pricingRotationProgress } = usePricingRotation(podData?.creators || []);

  // Fetch tasks when selectedTeamId changes
  useEffect(() => {
    if (selectedTeamId) {
      fetchTasks(selectedTeamId);
    }
  }, [selectedTeamId, fetchTasks]);

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
    // Show loading while teams are being fetched initially
    if (isLoadingTeams) {
      return <NoTeamSelected variant="loading" />;
    }
    // Show no-projects if user has no teams, otherwise show select message
    return availableTeams.length === 0 ? (
      <NoTeamSelected variant="no-projects" />
    ) : (
      <NoTeamSelected 
        variant="select" 
        title="Select a Team"
        description="Choose a team from the sidebar to view the workflow dashboard."
      />
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