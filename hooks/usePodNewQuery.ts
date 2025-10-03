import { useQuery } from "@tanstack/react-query";
import {
  fetchPodNewTeams,
  fetchPodNewTeam,
  deriveSidebarData,
  PodNewTeam,
  TeamOption,
} from "@/services/pod-new/api";

export const POD_NEW_KEYS = {
  teams: ["pod-new", "teams"] as const,
  team: (row: number) => ["pod-new", "team", row] as const,
  sidebar: (row: number) => ["pod-new", "sidebar", row] as const,
};

export function usePodNewTeams() {
  return useQuery<TeamOption[]>({
    queryKey: POD_NEW_KEYS.teams,
    queryFn: fetchPodNewTeams,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function usePodNewTeam(row: number, enabled = true) {
  return useQuery<PodNewTeam>({
    queryKey: POD_NEW_KEYS.team(row),
    queryFn: () => fetchPodNewTeam(row),
    enabled: enabled && Number.isFinite(row) && row > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function usePodNewSidebarData(row: number, enabled = true) {
  return useQuery({
    queryKey: POD_NEW_KEYS.sidebar(row),
    queryFn: async () => {
      const team = await fetchPodNewTeam(row);
      return deriveSidebarData(team);
    },
    enabled: enabled && Number.isFinite(row) && row > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
