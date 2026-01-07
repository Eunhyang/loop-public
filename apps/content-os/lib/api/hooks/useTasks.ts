/**
 * React Query Hook: useTasks
 * For /pipeline page - task management kanban
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { getTasks, subscribeToTasks, TasksFilters } from '../firestore/tasks';

const QUERY_KEY = 'tasks';

export function useTasks(filters?: TasksFilters) {
  const queryClient = useQueryClient();

  // Stable filters
  const stableFilters: TasksFilters = useMemo(
    () => ({
      ...filters,
    }),
    [filters]
  );

  // Initial fetch
  const query = useQuery({
    queryKey: [QUERY_KEY, stableFilters],
    queryFn: () => getTasks(stableFilters),
  });

  // Real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToTasks(
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
