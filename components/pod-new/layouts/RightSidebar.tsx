"use client";

import React, { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Link as LinkIcon,
  Users,
  User,
  ListChecks,
  Sparkles,
  FileText,
  ExternalLink,
} from "lucide-react";
import { usePodNewSidebarData, usePodNewTeams } from "@/hooks/usePodNewQuery";
import { usePodStore } from "@/lib/stores/podStore";
import { useTeams } from "@/hooks/useTeams";

function Card({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-800 p-3">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <div className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide">
          {title}
        </div>
      </div>
      <div className="overflow-hidden">
        {children}
      </div>
    </div>
  );
}

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
};
function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <div className="py-4 text-center text-gray-500 dark:text-gray-500">
      <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded bg-gray-100 dark:bg-gray-800">
        {icon}
      </div>
      <div className="text-sm">{title}</div>
      {subtitle && (
        <div className="mt-0.5 text-xs text-gray-400">{subtitle}</div>
      )}
    </div>
  );
}

interface RightSidebarProps {
  collapsed?: boolean;
}

export default function RightSidebar({ collapsed = false }: RightSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedRow = usePodStore((s) => s.selectedRow);
  const selectedTeamId = usePodStore((s) => s.selectedTeamId);
  const setSelectedRow = usePodStore((s) => s.setSelectedRow);
  const setSelectedTeamId = usePodStore((s) => s.setSelectedTeamId);
  const { data: teamOptions } = usePodNewTeams(); // For row mapping
  const { teams: teamsWithIds } = useTeams(); // For team IDs
  
  // Get current team from URL params
  const currentTeamIdFromUrl = searchParams?.get("team");
  
  // Use the current team from URL or fallback to store
  const activeTeamId = currentTeamIdFromUrl || selectedTeamId;
  
  // Find the row number for the active team by mapping team ID to row
  let activeTeamRow = selectedRow || 1;
  if (activeTeamId && teamsWithIds && teamOptions) {
    // Find the team with the ID
    const teamWithId = teamsWithIds.find(team => team.id === activeTeamId);
    if (teamWithId) {
      // Find the corresponding row by matching team name
      const teamOption = teamOptions.find(option => option.name === teamWithId.name);
      if (teamOption) {
        activeTeamRow = teamOption.row;
      }
    }
  }
  
  const { data, isLoading } = usePodNewSidebarData(activeTeamRow, true);

  // Sync store with URL params when team changes
  useEffect(() => {
    if (currentTeamIdFromUrl && currentTeamIdFromUrl !== selectedTeamId) {
      setSelectedTeamId(currentTeamIdFromUrl);
      
      // Find and set the corresponding row number
      const teamWithId = teamsWithIds?.find(t => t.id === currentTeamIdFromUrl);
      if (teamWithId && teamOptions) {
        const teamOption = teamOptions.find(option => option.name === teamWithId.name);
        if (teamOption) {
          setSelectedRow(teamOption.row);
        }
      }
    }
  }, [currentTeamIdFromUrl, selectedTeamId, teamsWithIds, teamOptions, setSelectedTeamId, setSelectedRow]);

  if (collapsed) {
    return null; // Hide completely when collapsed
  }

  // Show sidebar on all main POD routes
  const allowedPaths = [
    // "/",
    // "/dashboard",
    "/board",
    // "/forms",
    // "/pod-admin",
    // "/pricing",
    // "/sheets",
    // "/my-models",
    // "/workspace",
    // "/schedule",
    // "/live-stream",
    // "/calendar",
    // "/team",
    // "/settings",
  ];
  const shouldShowSidebar = allowedPaths.includes(pathname || "");

  if (!shouldShowSidebar) {
    return null;
  }


  return (
    <div
      role="complementary"
      className="hidden xl:block h-full overflow-y-auto"
    >
      {/* Team Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 p-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-purple-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {data?.teamName || "Select a Team"}
            </div>
          </div>
        </div>
      </div>

      <Card
        title={`Team Members${data?.teamMembers ? ` (${data.teamMembers.length})` : ""}`}
        icon={<User className="w-3.5 h-3.5 text-gray-500" />}
      >
        <div className="space-y-2">
          {isLoading && (
            <div className="h-16 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
          )}
          {!isLoading && (data?.teamMembers || []).length === 0 && (
            <EmptyState
              icon={<Users className="w-4 h-4" />}
              title="No team members"
              subtitle="Invite teammates to collaborate."
            />
          )}
          {(data?.teamMembers || []).map((m, i) => (
            <div key={m.name} className="flex items-center gap-2">
              {m.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.image}
                  alt={m.name || "Team member"}
                  className="w-6 h-6 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div
                className={`w-6 h-6 rounded-full text-white text-xs flex items-center justify-center ${m.image ? 'hidden' : ''} ${["bg-rose-500", "bg-violet-500", "bg-cyan-500", "bg-emerald-500", "bg-orange-500"][i % 5]}`}
              >
                <User className="w-3 h-3" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-gray-900 dark:text-white truncate">
                  {m.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title={`Assigned Models${data?.assignedModels ? ` (${data.assignedModels.length})` : ""}`}
        icon={<ListChecks className="w-3.5 h-3.5 text-gray-500" />}
      >
        <div className="space-y-1.5">
          {isLoading && (
            <div className="h-16 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
          )}
          {!isLoading && (data?.assignedModels || []).length === 0 && (
            <EmptyState
              icon={<ListChecks className="w-4 h-4" />}
              title="No models assigned"
              subtitle="Assign creators to this team."
            />
          )}
          {(data?.assignedModels || []).map((m, i) => (
            <div key={m.name} className="flex items-center gap-2">
              <div
                className={`w-5 h-5 rounded-full text-white text-[10px] font-medium flex items-center justify-center ${["bg-rose-500", "bg-indigo-500", "bg-emerald-500", "bg-orange-500", "bg-pink-500"][i % 5]}`}
              >
                {m.name?.charAt(0) || "?"}
              </div>
              <div className="min-w-0">
                <div className="text-sm text-gray-900 dark:text-white truncate">
                  {m.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="Sheet Links"
        icon={<LinkIcon className="w-3.5 h-3.5 text-gray-500" />}
      >
        <div className="space-y-1">
          {isLoading && (
            <div className="h-16 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
          )}
          {!isLoading && (data?.sheetGroups || []).length === 0 && (
            <EmptyState
              icon={<LinkIcon className="w-4 h-4" />}
              title="No sheet links"
              subtitle="Add sheet links to team models."
            />
          )}
          {(data?.sheetGroups || []).map((g) => (
            <details
              key={g.name}
              className="group rounded border border-gray-200 dark:border-gray-700"
            >
              <summary className="flex items-center justify-between px-2 py-1.5 cursor-pointer list-none text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180 text-gray-500" />
                  <FileText className="w-3.5 h-3.5 text-gray-500" />
                  <span className="truncate text-gray-700 dark:text-gray-300">
                    {g.name}
                  </span>
                </div>
                <span className="text-xs text-gray-500 shrink-0">
                  {g.count}
                </span>
              </summary>
              <ul className="px-2 pb-2 space-y-0.5" role="list">
                {g.items.map((item) => {
                  const isExternal =
                    typeof item.url === "string" && item.url.startsWith("http");
                  return (
                    <li key={item.id || item.name} className="w-full">
                      {isExternal ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={item.name}
                          className="flex items-center justify-between gap-2 px-2 py-1 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                        >
                          <span className="truncate inline-flex items-center gap-2 min-w-0">
                            <FileText className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </span>
                          <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 px-2 py-1 rounded text-sm text-gray-500">
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </details>
          ))}
        </div>
      </Card>
    </div>
  );
}
