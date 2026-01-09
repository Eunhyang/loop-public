/**
 * Application Layer - Use Case: Global Audit Log
 *
 * React Query hook for fetching and transforming global activity feed
 * Applies domain logic (time grouping) to API data
 */

import { useQuery } from '@tanstack/react-query';
import { activityApi } from '../data/api';
import { groupByDate } from '../domain/utils';
import type { TimeGroup } from '../domain/types';

/**
 * Fetches global audit log and groups entries by time
 *
 * Features:
 * - Auto-refetches every 60 seconds when panel is open
 * - Caches data for 30 seconds (staleTime)
 * - Applies time-based grouping (Today, Yesterday, This Week, etc.)
 *
 * @param limit - Maximum number of log entries (default: 50)
 * @param enabled - Whether query should run (default: true)
 * @returns Query result with grouped timeline data
 */
export function useGlobalAuditLog(limit: number = 50, enabled: boolean = true) {
  const query = useQuery({
    queryKey: ['activity', 'global', limit],
    queryFn: async () => {
      const response = await activityApi.getGlobalAuditLog(limit);
      return response.data; // Extract data from AxiosResponse
    },
    staleTime: 30_000,       // Data fresh for 30 seconds
    refetchInterval: 60_000, // Auto-refetch every 60 seconds
    enabled,                 // Only fetch when panel is open
  });

  // Apply domain logic: group logs by time
  const groups: TimeGroup[] = query.data?.logs
    ? groupByDate(query.data.logs)
    : [];

  return {
    groups,
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
