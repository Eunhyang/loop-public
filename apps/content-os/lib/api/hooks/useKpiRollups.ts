/**
 * React Query Hook: useKpiRollups
 * For /performance page - pre-aggregated KPI metrics
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { getKpiRollups, subscribeToKpiRollups, KpiFilters } from '../firestore/kpi';

const QUERY_KEY = 'kpi-rollups';

export function useKpiRollups(filters?: KpiFilters) {
  const queryClient = useQueryClient();

  // Stable filters
  const stableFilters: KpiFilters = useMemo(
    () => ({
      limitCount: 30, // Default: last 30 days
      ...filters,
    }),
    [filters]
  );

  // Initial fetch
  const query = useQuery({
    queryKey: [QUERY_KEY, stableFilters],
    queryFn: () => getKpiRollups(stableFilters),
  });

  // Real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToKpiRollups(
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
