"use client";

import React, { useEffect } from "react";
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
    <div className="rounded-2xl bg-white/90 dark:bg-slate-900/70 border border-gray-200/50 dark:border-white/10 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <div className="text-xs uppercase tracking-wide text-gray-600 dark:text-slate-400">
          {title}
        </div>
      </div>
      {children}
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
      <div className="text-sm font-medium text-gray-800 dark:text-slate-200">{title}</div>
      {subtitle && (
        <div className="mt-1 text-xs text-gray-600 dark:text-slate-400">{subtitle}</div>
      )}
    </div>
  );
}

export function RightSidebar() {
  const selectedRow = usePodStore((s) => s.selectedRow);
  const setSelectedRow = usePodStore((s) => s.setSelectedRow);
  const setSelectedTeamId = usePodStore((s) => s.setSelectedTeamId);
  const { data: teams } = usePodNewTeams();
  const { data, isLoading } = usePodNewSidebarData(selectedRow || 1, true);

  // Initialize with first team if no selection
  useEffect(() => {
    if (!selectedRow && teams && teams.length > 0) {
      setSelectedRow(1);
    }
  }, [selectedRow, teams, setSelectedRow]);

  return (
    <div
      role="complementary"
      className="hidden xl:block space-y-6 w-[320px] sticky top-24 self-start"
    >
      <div className="rounded-2xl bg-white/90 dark:bg-slate-900/70 border border-gray-200/50 dark:border-white/10 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="text-sm font-semibold text-gray-800 dark:text-slate-200">
              {data?.teamName || "Team"}
            </div>
          </div>
          <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-800/70 border border-gray-200/50 dark:border-white/10" />
        </div>
        <div className="relative">
          <select
            aria-label="Select Team"
            className="w-full appearance-none px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800/70 border border-gray-200/50 dark:border-white/10 text-gray-800 dark:text-slate-200 pr-8"
            value={selectedRow || 1}
            onChange={async (e) => {
              const rowNumber = parseInt(e.target.value);
              setSelectedRow(rowNumber);

              // Also fetch teams to get the team ID for the selected row
              try {
                const teamsResponse = await fetch('/api/pod/teams-db');
                const { success, teams: dbTeams } = await teamsResponse.json();
                if (success && dbTeams[rowNumber - 1]) {
                  setSelectedTeamId(dbTeams[rowNumber - 1].id);
                }
              } catch (error) {
                console.error('Error syncing team selection:', error);
              }
            }}
          >
            {(teams || []).map((t) => (
              <option key={t.row} value={t.row}>
                {t.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-slate-500" />
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
              <div
                className={`w-7 h-7 rounded-full text-white text-xs font-medium flex items-center justify-center ${["bg-rose-500", "bg-violet-500", "bg-cyan-500", "bg-emerald-500", "bg-orange-500"][i % 5]}`}
              >
                {m.name?.charAt(0) || "?"}
              </div>
              <div className="min-w-0">
                <div className="text-sm text-gray-900 dark:text-white truncate">{m.name}</div>
                <div className="text-xs text-gray-600 dark:text-slate-400 truncate">{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title={`Assigned Models${data?.assignedModels ? ` (${data.assignedModels.length})` : ""}`}
        icon={<ListChecks className="w-4 h-4 text-gray-600 dark:text-slate-400" />}
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
                <div className="text-sm text-gray-900 dark:text-white truncate">{m.name}</div>
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
        icon={<LinkIcon className="w-4 h-4 text-gray-600 dark:text-slate-400" />}
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
                <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-semibold rounded-full bg-emerald-600/30 dark:bg-emerald-600/30 text-emerald-800 dark:text-emerald-200 border border-emerald-500/40 dark:border-emerald-500/30">
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

export default RightSidebar;
