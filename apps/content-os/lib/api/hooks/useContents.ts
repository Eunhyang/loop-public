/**
 * React Query Hook: useContents
 * For /explorer page - all content with flexible filtering
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { getContents, subscribeToContents, ContentsFilters } from '../firestore/contents';

const QUERY_KEY = 'contents';

export function useContents(filters?: ContentsFilters) {
  const queryClient = useQueryClient();

  // Stable filters
  const stableFilters: ContentsFilters = useMemo(
    () => ({
      orderByField: 'createdAt' as const,
      limitCount: 100,
      ...filters,
    }),
    [filters]
  );

  // Initial fetch
  const query = useQuery({
    queryKey: [QUERY_KEY, stableFilters],
    queryFn: () => getContents(stableFilters),
  });

  // Real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToContents(
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
