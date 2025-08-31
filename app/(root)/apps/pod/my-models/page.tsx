"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ModelsList from "@/components/models/ModelList";
import ModelsHeader from "@/components/models/ModelsHeader";
import PermissionGoogle from "@/components/PermissionGoogle";
import { transformRawModel } from "@/lib/utils";
import { usePodData, useAvailableTeams, usePodStore } from "@/lib/stores/podStore";

export default function MyModelsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { podData } = usePodData();
  const { teams, fetchAvailableTeams } = useAvailableTeams();
  const { fetchPodData } = usePodStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ModelStatus | "all">("all");
  const [isLoadingModels, setLoadingModels] = useState(false);
  const [allModels, setAllModels] = useState<ModelDetails[]>([]);
  const [userAssignedCreators, setUserAssignedCreators] = useState<string[]>([]);

  // Fetch all models
  useEffect(() => {
    const fetchModels = async () => {
      setLoadingModels(true);
      try {
        const res = await fetch("/api/models?all=true");
        const { models: rawModels } = await res.json();
        const transformed = rawModels.map(transformRawModel);
        setAllModels(transformed);
      } catch (error) {
        console.error("Error fetching models:", error);
      } finally {
        setLoadingModels(false);
      }
    };
    fetchModels();
  }, []);

  // Fetch user assignments across all teams
  useEffect(() => {
    const fetchUserAssignments = async () => {
      if (!session?.user?.email) return;

      try {
        // First fetch available teams
        await fetchAvailableTeams();
        
        // Then check each team for user membership and collect assigned creators
        const allUserCreators: string[] = [];
        
        if (teams && teams.length > 0) {
          for (const team of teams) {
            try {
              // Fetch pod data for each team row
              await fetchPodData(team.row);
              
              // Get the pod data for this team using database API
              const teamPodResponse = await fetch("/api/pod/fetch-db", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  rowId: team.row,
                }),
              });
              
              if (teamPodResponse.ok) {
                const { data: teamData } = await teamPodResponse.json();
                
                // Check if user is a member of this team
                const isUserInTeam = teamData?.teamMembers?.some(
                  (member: any) => member.email?.toLowerCase() === session.user.email?.toLowerCase()
                );
                
                // If user is in this team, add all creators from this team
                if (isUserInTeam && teamData?.creators) {
                  teamData.creators.forEach((creator: any) => {
                    if (!allUserCreators.includes(creator.name)) {
                      allUserCreators.push(creator.name);
                    }
                  });
                }
              }
            } catch (error) {
              console.error(`Error fetching data for team row ${team.row}:`, error);
            }
          }
        }
        
        console.log("🎯 User assigned creators across all teams:", allUserCreators);
        setUserAssignedCreators(allUserCreators);
        
      } catch (error) {
        console.error("Error fetching user assignments:", error);
      }
    };

    if (session?.user?.email && teams.length === 0) {
      // Fetch teams first if they haven't been loaded
      fetchAvailableTeams();
    } else if (session?.user?.email && teams.length > 0) {
      fetchUserAssignments();
    }
  }, [session?.user?.email, teams, fetchAvailableTeams, fetchPodData]);

  // Filter models based on user permissions
  const accessibleModels = useMemo(() => {
    console.log("🔍 My Models Debug:", {
      sessionUser: session?.user,
      userAssignedCreators,
      allModelsCount: allModels.length,
      allModelNames: allModels.map(m => m.name)
    });

    if (!session?.user) return [];
    
    // If user is admin, show all models
    if (session.user.role === "ADMIN") {
      console.log("🔑 Admin user - showing all models");
      return allModels;
    }

    // For non-admin users, check models against all assigned creators across teams
    if (userAssignedCreators.length === 0) {
      console.log("❌ No assigned creators found for user");
      return [];
    }

    // Get user's email
    const userEmail = session.user.email;
    if (!userEmail) {
      console.log("❌ No user email");
      return [];
    }

    console.log("👥 User assigned creators:", userAssignedCreators);

    // Show models for ALL creators assigned to the user across all teams
    const filtered = allModels.filter(model => {
      const modelName = model.name.toLowerCase();
      
      // Check if model name matches any of the user's assigned creators
      const matches = userAssignedCreators.some(creatorName => {
        const lowerCreatorName = creatorName.toLowerCase();
        
        // More precise matching - check for exact matches or word boundaries
        const modelWords = modelName.split(/[\s\-_]+/);
        const creatorWords = lowerCreatorName.split(/[\s\-_]+/);
        
        // Check if any creator word exactly matches any model word
        const exactMatch = creatorWords.some(creatorWord => 
          modelWords.some(modelWord => 
            modelWord === creatorWord && creatorWord.length >= 3 // Minimum 3 characters to avoid false positives
          )
        );
        
        // Also check for exact full name matches
        const fullMatch = modelName === lowerCreatorName || 
                         modelName.includes(` ${lowerCreatorName} `) || 
                         modelName.startsWith(`${lowerCreatorName} `) || 
                         modelName.endsWith(` ${lowerCreatorName}`) ||
                         lowerCreatorName.includes(` ${modelName} `) || 
                         lowerCreatorName.startsWith(`${modelName} `) || 
                         lowerCreatorName.endsWith(` ${modelName}`);
        
        const match = exactMatch || fullMatch;
        
        if (match) {
          console.log("✅ Model match found:", { modelName, creatorName: lowerCreatorName, exactMatch, fullMatch });
        }
        
        return match;
      });
      
      return matches;
    });

    console.log("🎯 Final filtered models:", filtered.map(m => m.name));
    return filtered;
  }, [allModels, session, userAssignedCreators]);

  // Apply search and status filters
  const filteredModels = useMemo(() => {
    return accessibleModels.filter((model) => {
      if (!model.name || typeof model.name !== "string") {
        return false;
      }
      
      const matchesSearch =
        searchQuery.trim() === "" ||
        model.name
          .toLowerCase()
          .trim()
          .includes(searchQuery.toLowerCase().trim());
      
      if (!model.status || typeof model.status !== "string") {
        return statusFilter === "all";
      }
      
      const matchesStatus =
        statusFilter === "all" ||
        model.status.toLowerCase().trim() === statusFilter.toLowerCase().trim();
      
      return matchesSearch && matchesStatus;
    });
  }, [accessibleModels, searchQuery, statusFilter]);

  const handleModelClick = (model: ModelDetails) => {
    // Navigate to creator page instead of model page
    router.push(`/apps/pod/creator?creator=${encodeURIComponent(model.name)}`);
  };

  // Show loading or error states
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 w-full max-w-7xl mx-auto p-4 lg:p-6 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Please log in to view your models.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 w-full max-w-7xl mx-auto p-4 lg:p-6 animate-in fade-in duration-500">
      <ModelsHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        totalModels={accessibleModels.length}
        activeModels={
          accessibleModels.filter((m) => m.status.toLowerCase() === "active").length
        }
        isLoading={isLoadingModels}
        title="My Models"
        subtitle={
          session.user.role === "ADMIN" 
            ? "All models in the system"
            : `Models assigned to you across all teams (${userAssignedCreators.length} creators)`
        }
      />
      <PermissionGoogle apiEndpoint="/api/models">
        <ModelsList
          key={`${searchQuery}-${statusFilter}-${filteredModels.length}`}
          models={filteredModels}
          onModelClick={handleModelClick}
          isLoading={isLoadingModels}
        />
      </PermissionGoogle>
    </div>
  );
}