import { useQuery } from "@tanstack/react-query";

interface QuickStats {
  activeTasks: number;
  tasksCreatedToday: number;
  overdueTasks: number;
  activeModels: number;
  totalModels: number;
  totalRevenue: number;
}

interface TaskPipeline {
  byStatus: Array<{
    status: string;
    count: number;
    label: string;
    color: string;
  }>;
  byPriority: Array<{
    priority: string;
    count: number;
  }>;
  unassignedCount: number;
}

interface ContentProduction {
  otpCount: number;
  ptrCount: number;
  styleDistribution: Array<{
    style: string;
    count: number;
  }>;
  recentSubmissions: Array<{
    id: string;
    modelName: string;
    type: string;
    style: string | null;
    createdAt: Date;
    taskId?: string;
    taskTitle?: string;
    taskStatus?: string;
  }>;
}

interface TeamPerformance {
  teamWorkload: Array<{
    teamId: string;
    teamName: string;
    taskCount: number;
    memberCount: number;
    tasksPerMember: number;
  }>;
  topContributors: Array<{
    userId: string;
    name: string;
    email: string;
    image: string | null;
    taskCount: number;
  }>;
  activeTeams: number;
  totalMembers: number;
}

interface RoleSpecificData {
  type: 'admin' | 'manager' | 'user';
  [key: string]: any;
}

export interface DashboardMetrics {
  quickStats: QuickStats;
  taskPipeline: TaskPipeline;
  contentProduction: ContentProduction;
  teamPerformance: TeamPerformance;
  roleSpecific: RoleSpecificData;
}

async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const response = await fetch("/api/dashboard/metrics");

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard metrics");
  }

  const data = await response.json();

  // Convert date strings to Date objects
  if (data.contentProduction?.recentSubmissions) {
    data.contentProduction.recentSubmissions = data.contentProduction.recentSubmissions.map(
      (sub: any) => ({
        ...sub,
        createdAt: new Date(sub.createdAt)
      })
    );
  }

  return data;
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: fetchDashboardMetrics,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
}
