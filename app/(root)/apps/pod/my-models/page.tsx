"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ModelsList from "@/components/models/ModelList";
import ModelsHeader from "@/components/models/ModelsHeader";
import PermissionGoogle from "@/components/PermissionGoogle";
import { transformRawModel } from "@/lib/utils";
import { usePodData } from "@/lib/stores/podStore";

export default function MyModelsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { podData } = usePodData();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ModelStatus | "all">("all");
  const [isLoadingModels, setLoadingModels] = useState(false);
  const [allModels, setAllModels] = useState<ModelDetails[]>([]);

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

  // Filter models based on user permissions
  const accessibleModels = useMemo(() => {
    console.log("🔍 My Models Debug:", {
      sessionUser: session?.user,
      podData: podData ? {
        teamName: podData.teamName,
        teamMembers: podData.teamMembers,
        creators: podData.creators
      } : null,
      allModelsCount: allModels.length,
      allModelNames: allModels.map(m => m.name)
    });

    if (!session?.user) return [];
    
    // If user is admin, show all models
    if (session.user.role === "ADMIN") {
      console.log("🔑 Admin user - showing all models");
      return allModels;
    }

    // For non-admin users, we need to check team membership and creator assignments
    if (!podData?.creators || !podData?.teamMembers) {
      console.log("❌ No pod data or creators/team members");
      return [];
    }

    // Get user's email
    const userEmail = session.user.email;
    if (!userEmail) {
      console.log("❌ No user email");
      return [];
    }

    // Check if user is in the current team members
    const isTeamMember = podData.teamMembers.some(member => 
      member.email?.toLowerCase() === userEmail.toLowerCase()
    );

    console.log("👥 Team membership check:", {
      userEmail,
      isTeamMember,
      teamMembers: podData.teamMembers.map(m => ({ name: m.name, email: m.email }))
    });

    // If user is not a team member, return empty array
    if (!isTeamMember) return [];

    // If user is a team member, show models for ALL creators assigned to this team
    const filtered = allModels.filter(model => {
      const modelName = model.name.toLowerCase();
      
      // Check if model name matches any of the team's assigned creators
      const matches = podData.creators.some(creator => {
        const creatorName = creator.name.toLowerCase();
        
        // More precise matching - check for exact matches or word boundaries
        const modelWords = modelName.split(/[\s\-_]+/);
        const creatorWords = creatorName.split(/[\s\-_]+/);
        
        // Check if any creator word exactly matches any model word
        const exactMatch = creatorWords.some(creatorWord => 
          modelWords.some(modelWord => 
            modelWord === creatorWord && creatorWord.length >= 3 // Minimum 3 characters to avoid false positives
          )
        );
        
        // Also check for exact full name matches
        const fullMatch = modelName === creatorName || 
                         modelName.includes(` ${creatorName} `) || 
                         modelName.startsWith(`${creatorName} `) || 
                         modelName.endsWith(` ${creatorName}`) ||
                         creatorName.includes(` ${modelName} `) || 
                         creatorName.startsWith(`${modelName} `) || 
                         creatorName.endsWith(` ${modelName}`);
        
        const match = exactMatch || fullMatch;
        
        if (match) {
          console.log("✅ Model match found:", { modelName, creatorName, exactMatch, fullMatch });
        }
        
        return match;
      });
      
      return matches;
    });

    console.log("🎯 Final filtered models:", filtered.map(m => m.name));
    return filtered;
  }, [allModels, session, podData]);

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
            : "Models assigned to you or your team"
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