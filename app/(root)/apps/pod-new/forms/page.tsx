"use client";

import { useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { usePodStore, useAvailableTeams } from "@/lib/stores/podStore";
import ModularWorkflowForm from "@/components/pod-new/forms/ModularWorkflowForm";
import { FileText } from "lucide-react";

export default function FormsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { selectedTeamId, setSelectedTeamId } = usePodStore();
  const { teams: availableTeams } = useAvailableTeams();

  // Memoize search params to avoid unnecessary re-renders
  const teamParam = useMemo(() => searchParams?.get("team"), [searchParams]);

  // Memoize team existence check to avoid recalculating on every render
  const teamExists = useMemo(() => {
    if (!teamParam || !availableTeams.length) return false;
    return availableTeams.some(team => team.id === teamParam);
  }, [teamParam, availableTeams]);

  // Debounced URL update function
  const updateURL = useCallback((teamId: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("team", teamId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  // Sync URL team parameter with Zustand store on mount - reduced dependencies
  useEffect(() => {
    // Skip if teams are not loaded yet
    if (!availableTeams.length) return;

    if (teamParam && teamParam !== selectedTeamId && teamExists) {
      setSelectedTeamId(teamParam);
    } else if (selectedTeamId && !teamParam) {
      updateURL(selectedTeamId);
    }
  }, [teamParam, selectedTeamId, teamExists, setSelectedTeamId, updateURL, availableTeams.length]);

  // Update URL when team changes in store - simplified
  useEffect(() => {
    if (selectedTeamId && teamParam !== selectedTeamId) {
      updateURL(selectedTeamId);
    }
  }, [selectedTeamId, teamParam, updateURL]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <div className="w-full px-6 py-12 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-400/20 dark:to-purple-400/20 rounded-xl border border-pink-200/50 dark:border-pink-500/30 flex items-center justify-center shadow-lg">
              <FileText className="h-6 w-6 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-gray-900 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Workflow Forms
                </span>
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">
                Dynamic content submission with automated workflow routing
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <ModularWorkflowForm />
        </div>
      </div>
    </div>
  );
}
