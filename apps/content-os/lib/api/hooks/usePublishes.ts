/**
 * React Query Hook: usePublishes
 * For /retro and /performance pages - published content analytics
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { getPublishes, subscribeToPublishes, PublishesFilters } from '../firestore/publishes';

const QUERY_KEY = 'publishes';

export function usePublishes(filters?: PublishesFilters) {
  const queryClient = useQueryClient();

  // Stable filters
  const stableFilters: PublishesFilters = useMemo(
    () => ({
      ...filters,
    }),
    [filters]
  );

  // Initial fetch
  const query = useQuery({
    queryKey: [QUERY_KEY, stableFilters],
    queryFn: () => getPublishes(stableFilters),
  });

  // Real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToPublishes(
      stableFilters,
      (data) => {
        queryClient.setQueryData([QUERY_KEY, stableFilters], data);
      },
      (error) => {
        console.error('Firestore subscription error:', error);
        const queryCache = queryClient.getQueryCache();
        const existingQuery = queryCache.find({ queryKey: [QUERY_KEY, stableFilters] });
        if (existingQuery) {
          existingQuery.setState({ status: 'error', error });
        }
      }
    );

    return () => unsubscribe();
  }, [queryClient, stableFilters]);

  return query;
}
