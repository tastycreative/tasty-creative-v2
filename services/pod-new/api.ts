// services/pod-new/api.ts

export type TeamOption = { row: number; name: string; label: string };
export type TeamMember = { id: string; name: string; role: string; image?: string };
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
  const result = await http<{ success: boolean; teams: any[] }>(
    "/api/pod/teams-db"
  );
  if (!result.success) throw new Error("Failed to fetch teams");

  // Convert database teams to row-based format for backward compatibility
  const teamOptions: TeamOption[] = result.teams.map((team, index) => ({
    row: index + 1, // Create sequential row numbers starting from 1
    name: team.name,
    label: team.name
  }));

  return teamOptions;
}

export async function fetchPodNewTeam(rowNumber: number): Promise<PodNewTeam> {
  // First get all teams to map row number to team ID
  const teamsResult = await http<{ success: boolean; teams: any[] }>(
    "/api/pod/teams-db"
  );
  if (!teamsResult.success) throw new Error("Failed to fetch teams");

  // Find the team by row number (1-based indexing)
  const targetTeam = teamsResult.teams[rowNumber - 1];
  if (!targetTeam) throw new Error(`Team not found for row ${rowNumber}`);

  // Now fetch the specific team data using the team ID
  const result = await http<{ success: boolean; data: any }>(
    "/api/pod/fetch-db",
    { method: "POST", body: JSON.stringify({ rowId: targetTeam.id }) }
  );
  if (!result.success) throw new Error("Failed to fetch team");

  // Transform the data to match PodNewTeam format
  const podNewTeam: PodNewTeam = {
    rowNumber: rowNumber,
    teamName: result.data.teamName || targetTeam.name,
    teamMembers: result.data.teamMembers || [],
    creators: result.data.creators || [],
    schedulerSpreadsheetUrl: result.data.schedulerSpreadsheetUrl,
    sheetLinks: result.data.sheetLinks || [],
    lastUpdated: result.data.lastUpdated || new Date().toISOString()
  };

  return podNewTeam;
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
