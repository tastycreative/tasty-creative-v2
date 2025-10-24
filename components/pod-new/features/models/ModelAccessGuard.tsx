"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageLoadingState } from "../../shared/ui/LoadingStates";

interface ModelAccessGuardProps {
  modelName: string;
  children: React.ReactNode;
}

export function ModelAccessGuard({ modelName, children }: ModelAccessGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (status === "loading") return;

      if (!session?.user) {
        router.push("/auth/signin");
        return;
      }

      // Allow admin and moderator access to all models
      if (session.user.role === "ADMIN" || session.user.role === "MODERATOR") {
        setHasAccess(true);
        setIsChecking(false);
        return;
      }

      try {
        // Fetch user's assigned creators
        const response = await fetch(`/api/pod/user-assigned-creators?userId=${session.user.id}`);
        
        if (!response.ok) {
          console.error("Failed to fetch user assignments");
          router.push("/my-models");
          return;
        }

        const data = await response.json();
        const assignedCreators: string[] = data.assignedCreators || [];

        // Check if the user has access to this specific model
        const hasAccessToModel = assignedCreators.some(creator => 
          creator.toLowerCase() === modelName.toLowerCase()
        );

        if (hasAccessToModel) {
          setHasAccess(true);
        } else {
          // Redirect back to my-models if no access
          router.push("/my-models");
          return;
        }
      } catch (error) {
        console.error("Error checking model access:", error);
        router.push("/my-models");
        return;
      }

      setIsChecking(false);
    };

    checkAccess();
  }, [session, status, modelName, router]);

  // Show loading while checking access
  if (status === "loading" || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
        <PageLoadingState />
      </div>
    );
  }

  // Show children only if user has access
  if (hasAccess) {
    return <>{children}</>;
  }

  // This should not render as we redirect, but just in case
  return null;
}