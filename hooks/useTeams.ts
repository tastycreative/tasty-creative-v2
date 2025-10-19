'use client';

import { useState, useEffect } from 'react';

export interface Team {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt: string;
  memberCount: number;
  clientCount: number;
}

export interface UseTeamsResult {
  teams: Team[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTeams(): UseTeamsResult {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/pod/teams-db');
      
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      
      const data = await response.json();
      
      if (data.success && data.teams) {
        setTeams(data.teams);
      } else {
        throw new Error(data.error || 'Failed to fetch teams');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return {
    teams,
    loading,
    error,
    refetch: fetchTeams,
  };
}