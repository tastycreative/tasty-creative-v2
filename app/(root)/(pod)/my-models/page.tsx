import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EnhancedModelsPage from "@/components/pod-new/features/models/pages/EnhancedModelsPage";
import { MyModelsHeader } from "./Header";

// Optimized query to get only the client names assigned to user's teams
async function getUserAssignedCreators(userId: string): Promise<string[]> {
  // Use a flattened query with select to minimize data transfer
  const assignments = await prisma.podTeamClientAssignment.findMany({
    where: {
      isActive: true,
      podTeam: {
        members: {
          some: { userId }
        }
      }
    },
    select: {
      clientModel: {
        select: { clientName: true }
      }
    }
  });

  // Extract unique client names
  const creatorNames = new Set<string>();
  for (const assignment of assignments) {
    if (assignment.clientModel.clientName) {
      creatorNames.add(assignment.clientModel.clientName);
    }
  }
  return Array.from(creatorNames);
}

// Server Component
export default async function PodNewMyModelsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  let userAssignedCreators: string[] = [];

  // Fetch user assignments server-side (only for non-admin users)
  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
    try {
      if (session.user.id) {
        userAssignedCreators = await getUserAssignedCreators(session.user.id);
      }
    } catch (error) {
      console.error("Error fetching user assigned creators:", error);
      // Fail gracefully - EnhancedModelsPage will show empty state
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Client-side Header with Refresh capability */}
        <MyModelsHeader />

        {/* Enhanced Models Page */}
        <EnhancedModelsPage
          assignedCreators={userAssignedCreators}
          userRole={session.user.role}
          showHeader={false}
        />
      </div>
    </div>
  );
}