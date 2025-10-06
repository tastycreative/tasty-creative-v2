import { useState, useEffect } from 'react';

// Define types for the pod-new onboarding API response
interface OnboardingModel {
  Model: string;
  Status: string;
  [key: string]: string; // For dynamic task fields
}

interface OnboardingApiResponse {
  models: OnboardingModel[];
  totalModels: number;
  lastUpdated: string;
  sheetId: string;
  tasks: string[];
}

interface OnboardingStats {
  totalModels: number;
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
  onboardingStatus: number;
  tasksPerModel: number;
  topPerformingModels: Array<{
    model: string;
    completed: number;
    total: number;
  }>;
}

export function usePodOnboarding() {
  const [apiData, setApiData] = useState<OnboardingApiResponse | null>(null);
  const [stats, setStats] = useState<OnboardingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateStats = (data: OnboardingApiResponse): OnboardingStats => {
    let totalTasks = 0;
    let completedTasks = 0;

    const topPerformingModels: OnboardingStats['topPerformingModels'] = [];

    data.models.forEach((model) => {
      let modelCompletedTasks = 0;

      data.tasks.forEach((task) => {
        totalTasks++;
        if (model[task] === "TRUE") {
          completedTasks++;
          modelCompletedTasks++;
        }
      });

      topPerformingModels.push({
        model: model.Model,
        completed: modelCompletedTasks,
        total: data.tasks.length
      });
    });

    // Sort by completion rate and take top performers
    topPerformingModels.sort((a, b) => b.completed - a.completed);

    const onboardingStatus = data.models.filter(m => m.Status === "Onboarding").length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalModels: data.totalModels,
      totalTasks,
      completedTasks,
      completionPercentage,
      onboardingStatus,
      tasksPerModel: data.tasks.length,
      topPerformingModels: topPerformingModels.slice(0, 3)
    };
  };

  const fetchOnboardingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/pod-new/onboarding');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: Failed to fetch POD onboarding data`);
      }

      const data: OnboardingApiResponse = await response.json();
      setApiData(data);

      // Calculate statistics
      const stats = calculateStats(data);
      setStats(stats);
    } catch (err) {
      console.error('Error fetching POD onboarding data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboardingData();
  }, []);

  return {
    data: apiData,
    stats,
    loading,
    error,
    refetch: fetchOnboardingData
  };
}

export type { OnboardingModel, OnboardingApiResponse, OnboardingStats };