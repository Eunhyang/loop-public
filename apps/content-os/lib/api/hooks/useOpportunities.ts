/**
 * React Query Hook: useOpportunities
 * For /opportunity page - candidate content with high finalScore
 *
 * Pattern (per Codex guidance):
 * - queryFn: Initial getDocs (one-time fetch)
 * - useEffect: Setup onSnapshot for real-time updates
 * - Cleanup: Unsubscribe on unmount
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { getContents, subscribeToContents, ContentsFilters } from '../firestore/contents';

const QUERY_KEY = 'opportunities';

export function useOpportunities() {
  const queryClient = useQueryClient();

  // Stable filters (memoized to prevent duplicate listeners)
  const filters: ContentsFilters = useMemo(
    () => ({
      status: 'candidate',
      orderByField: 'finalScore' as const,
      limitCount: 50,
    }),
    []
  );

  // Initial fetch with React Query
  const query = useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: () => getContents(filters),
  });

  // Real-time updates with onSnapshot
  useEffect(() => {
    const unsubscribe = subscribeToContents(
      filters,
      (data) => {
        // Update React Query cache with fresh data
        queryClient.setQueryData([QUERY_KEY, filters], data);
      },
      (error) => {
        // Propagate error to React Query properly
        console.error('Firestore subscription error:', error);
        const queryCache = queryClient.getQueryCache();
        const existingQuery = queryCache.find({ queryKey: [QUERY_KEY, filters] });
        if (existingQuery) {
          existingQuery.setState({ status: 'error', error });
        }
      }
    );

    return () => unsubscribe();
  }, [queryClient, filters]);

  return query;
}
