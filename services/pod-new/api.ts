// services/pod-new/api.ts

export type TeamOption = { row: number; name: string; label: string };
export type TeamMember = { id: string; name: string; role: string };
export type Creator = { id: string; name: string };
export type SheetLink = { id?: string; name: string; url: string };

export type PodNewTeam = {
  rowNumber: number;
  teamName: string;
  teamMembers: TeamMember[];
  creators: Creator[];
  schedulerSpreadsheetUrl?: string;
  sheetLinks?: SheetLink[];
  lastUpdated: string;
};

async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

export async function fetchPodNewTeams(): Promise<TeamOption[]> {
  const result = await http<{ success: boolean; teams: TeamOption[] }>(
    "/api/pod/teams-db"
  );
  if (!result.success) throw new Error("Failed to fetch teams");
  return result.teams;
}

export async function fetchPodNewTeam(rowNumber: number): Promise<PodNewTeam> {
  const result = await http<{ success: boolean; data: PodNewTeam }>(
    "/api/pod/fetch-db",
    { method: "POST", body: JSON.stringify({ rowId: rowNumber }) }
  );
  if (!result.success) throw new Error("Failed to fetch team");
  return result.data;
}

export type SidebarData = {
  teamName: string;
  teamMembers: TeamMember[];
  assignedModels: { name: string; owner: string }[];
  sheetGroups: { name: string; count: number; items: SheetLink[] }[];
};

export function deriveSidebarData(team: PodNewTeam): SidebarData {
  const teamName = team.teamName;
  const teamMembers = team.teamMembers || [];

  const creators = team.creators || [];
  const sheetLinks = team.sheetLinks || [];

  // Assigned models list from creators with owner in parentheses
  const assignedModels = creators.map((c, idx) => ({
    name: c.name,
    owner: teamMembers[idx % Math.max(1, teamMembers.length)]?.name || "—",
  }));

  // Group sheet links by creator name (simple heuristic)
  const groups: Record<string, { count: number; items: SheetLink[] }> = {};
  const creatorNames = new Set(creators.map((c) => c.name.toLowerCase()));
  for (const link of sheetLinks) {
    let group = "Others";
    for (const name of creatorNames) {
      if (link.name.toLowerCase().includes(name)) {
        group = [...creatorNames].find((n) => n === name) || "Others";
        break;
      }
    }
    if (!groups[group]) groups[group] = { count: 0, items: [] };
    groups[group].count += 1;
    groups[group].items.push(link);
  }

  const sheetGroups = Object.entries(groups).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count: value.count,
    items: value.items,
  }));

  return { teamName, teamMembers, assignedModels, sheetGroups };
}
