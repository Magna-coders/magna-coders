import { useState, useEffect } from 'react';
import { magnaAIService, UserContext } from '@/services/magnaAiService';
import { useAuth } from '@/contexts/AuthContext';

interface UseUserContextReturn {
  userContext: UserContext | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and cache user context from the AI backend
 * 
 * Features:
 * - Automatically fetches on mount if authenticated
 * - Returns loading, error, and data states
 * - Handles 401 errors with redirect to login
 * - Provides refetch method for manual refresh
 * 
 * @returns User context data, loading state, error state, and refetch function
 */
export function useUserContext(): UseUserContextReturn {
  const { isAuthenticated, token } = useAuth();
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserContext = async () => {
    if (!isAuthenticated || !token) {
      setUserContext(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const context = await magnaAIService.getUserContext();
      setUserContext(context);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch user context');
      setError(error);
      
      // If it's an authentication error, the service will handle redirect
      // We just need to log it here
      console.error('Error fetching user context:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when authentication changes
  useEffect(() => {
    fetchUserContext();
  }, [isAuthenticated, token]);

  return {
    userContext,
    loading,
    error,
    refetch: fetchUserContext,
  };
}
