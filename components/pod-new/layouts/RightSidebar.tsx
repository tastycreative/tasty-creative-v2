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
    <div className="rounded-2xl bg-white/90 dark:bg-slate-900/70 border border-gray-200/50 dark:border-white/10 shadow-sm p-4 overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <div className="text-xs uppercase tracking-wide text-gray-600 dark:text-slate-400 truncate">
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
    <div className="rounded-xl border border-gray-200/50 dark:border-white/10 bg-gradient-to-b from-gray-100/40 to-gray-200/40 dark:from-slate-800/40 dark:to-slate-900/40 p-4 text-center">
      <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100/70 dark:bg-white/5 ring-1 ring-gray-200/50 dark:ring-white/10 text-gray-600 dark:text-slate-300">
        {icon}
      </div>
      <div className="text-sm font-medium text-gray-800 dark:text-slate-200">
        {title}
      </div>
      {subtitle && (
        <div className="mt-1 text-xs text-gray-600 dark:text-slate-400">
          {subtitle}
        </div>
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
      className="hidden xl:block space-y-6 w-[320px] sticky top-24 self-start overflow-hidden"
    >
      {/* Team Header - Display Only */}
      <div className="rounded-2xl bg-white/90 dark:bg-slate-900/70 border border-gray-200/50 dark:border-white/10 shadow-sm p-4 overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-bold text-gray-900 dark:text-slate-100 truncate">
              {data?.teamName || "Select a Team"}
            </div>
            <div className="text-sm text-gray-600 dark:text-slate-400">
              Team Information
            </div>
          </div>
        </div>
      </div>

      <Card
        title={`Team Members${data?.teamMembers ? ` (${data.teamMembers.length})` : ""}`}
        icon={<User className="w-4 h-4 text-gray-600 dark:text-slate-400" />}
      >
        <div className="space-y-3">
          {isLoading && (
            <div className="h-24 rounded-lg bg-gray-200/60 dark:bg-slate-800/40 animate-pulse" />
          )}
          {!isLoading && (data?.teamMembers || []).length === 0 && (
            <EmptyState
              icon={<Users className="w-4 h-4" />}
              title="No team members"
              subtitle="Invite teammates to collaborate."
            />
          )}
          {(data?.teamMembers || []).map((m, i) => (
            <div key={m.name} className="flex items-center gap-3">
              {m.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.image}
                  alt={m.name || "Team member"}
                  className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-slate-700"
                  onError={(e) => {
                    // Fallback to icon if image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div
                className={`w-7 h-7 rounded-full text-white flex items-center justify-center ${m.image ? 'hidden' : ''} ${["bg-rose-500", "bg-violet-500", "bg-cyan-500", "bg-emerald-500", "bg-orange-500"][i % 5]}`}
              >
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm text-gray-900 dark:text-white truncate">
                  {m.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-slate-400 truncate">
                  {m.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title={`Assigned Models${data?.assignedModels ? ` (${data.assignedModels.length})` : ""}`}
        icon={
          <ListChecks className="w-4 h-4 text-gray-600 dark:text-slate-400" />
        }
      >
        <div className="space-y-2">
          {isLoading && (
            <div className="h-20 rounded-lg bg-gray-200/60 dark:bg-slate-800/40 animate-pulse" />
          )}
          {!isLoading && (data?.assignedModels || []).length === 0 && (
            <EmptyState
              icon={<ListChecks className="w-4 h-4" />}
              title="No models assigned"
              subtitle="Assign creators to this team to populate."
            />
          )}
          {(data?.assignedModels || []).map((m, i) => (
            <div key={m.name} className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full text-white text-[10px] font-medium flex items-center justify-center ${["bg-rose-500", "bg-indigo-500", "bg-emerald-500", "bg-orange-500", "bg-pink-500"][i % 5]}`}
              >
                {m.name?.charAt(0) || "?"}
              </div>
              <div className="min-w-0">
                <div className="text-sm text-gray-900 dark:text-white truncate">
                  {m.name}
                </div>
                <div className="text-[11px] text-gray-600 dark:text-slate-400 truncate">
                  {m.owner ? `${m.owner} (Owner)` : "Creator"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="Sheet Links"
        icon={
          <LinkIcon className="w-4 h-4 text-gray-600 dark:text-slate-400" />
        }
      >
        <div className="space-y-2">
          {isLoading && (
            <div className="h-24 rounded-lg bg-gray-200/60 dark:bg-slate-800/40 animate-pulse" />
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
              className="group rounded-lg border border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-100/60 dark:bg-emerald-900/20 open:bg-emerald-200/80 dark:open:bg-emerald-900/30"
            >
              <summary className="flex items-center justify-between px-3 py-2 cursor-pointer list-none">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="transition-transform group-open:rotate-180 text-emerald-600 dark:text-emerald-300">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                  <div className="text-sm text-emerald-800 dark:text-emerald-200 truncate">
                    {g.name}
                  </div>
                </div>
                <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-semibold rounded-full bg-emerald-600/30 dark:bg-emerald-600/30 text-emerald-800 dark:text-emerald-200 border border-emerald-500/40 dark:border-emerald-500/30 flex-shrink-0">
                  {g.count}
                </span>
              </summary>
              <ul className="px-2 pb-2 space-y-1" role="list">
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
                          className="flex items-center justify-between gap-2 px-3 py-2 rounded-md hover:bg-emerald-200/60 dark:hover:bg-emerald-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 text-emerald-800 dark:text-emerald-100"
                        >
                          <span className="truncate inline-flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-300 flex-shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300 flex-shrink-0" />
                        </a>
                      ) : (
                        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-md text-emerald-700/70 dark:text-emerald-200/70 bg-emerald-100/40 dark:bg-emerald-900/10">
                          <span className="truncate inline-flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-300 flex-shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </span>
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
