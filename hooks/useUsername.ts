import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  username: string | null;
  email: string;
  name: string | null;
  hasUsername: boolean;
}

interface UseUsernameReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  hasUsername: boolean;
  setUsername: (username: string) => Promise<boolean>;
  checkUsername: () => Promise<void>;
}

export function useUsername(): UseUsernameReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkUsername = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/username');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to check username: ${response.status}`);
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error checking username:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const setUsername = useCallback(async (username: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to set username');
      }

      const data = await response.json();
      setUser({ ...data.user, hasUsername: true });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error setting username:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUsername();
  }, [checkUsername]);

  return {
    user,
    loading,
    error,
    hasUsername: user?.hasUsername || false,
    setUsername,
    checkUsername,
  };
}
