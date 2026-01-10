/**
 * useMergedPerformance Hook
 * Task: tsk-content-os-15 - Snapshot Integration (Clean Architecture)
 *
 * Combines YouTube API data with IndexedDB snapshot data.
 * Uses clean architecture use case for orchestration.
 */

'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePerformanceData } from './use-performance-data';
import { useSnapshot } from './use-snapshot';
import type { MergedPerformance, MatchStats } from '@/lib/domain/performance/types';
import { MergePerformanceDataUseCase } from '@/lib/application/performance/usecases/MergePerformanceDataUseCase';
import { createIndexedDBSnapshotRepository } from '@/lib/infrastructure/performance/IndexedDBSnapshotRepository';

interface UseMergedPerformanceOptions {
  /** Maximum results to fetch from API */
  maxResults?: number;
  /** Include 24h delta calculations */
  includeDeltas?: boolean;
  /** Use dummy data */
  useDummy?: boolean;
  /** Enable query */
  enabled?: boolean;
}

interface MergedPerformanceResult {
  data: MergedPerformance[];
  snapshotDate: string | null;
  matchStats: MatchStats | null;
  deltaAvailable: boolean;
  source: 'youtube_analytics' | 'dummy';
  warning?: string;
}

/**
 * Hook for merged performance data (API + Snapshot)
 */
export function useMergedPerformance(options: UseMergedPerformanceOptions = {}) {
  const {
    maxResults = 100,
    includeDeltas = true,
    useDummy = false,
    enabled = true,
  } = options;

  // Fetch API data
  const {
    data: performanceResult,
    isLoading: isLoadingApi,
    isError: isApiError,
    error: apiError,
    refetch,
    isFetching,
  } = usePerformanceData({ maxResults, useDummy, enabled });

  // Get snapshot state
  const { latestSnapshot, isLoading: isLoadingSnapshot } = useSnapshot();

  // Create use case instance (memoized)
  const useCase = useMemo(() => {
    const repo = createIndexedDBSnapshotRepository();
    return new MergePerformanceDataUseCase(repo);
  }, []);

  // Merge data when both sources are available
  const {
    data: mergedResult,
    isLoading: isMerging,
    error: mergeError,
  } = useQuery({
    queryKey: [
      'performance',
      'merged',
      performanceResult?.data?.length ?? 0,
      latestSnapshot?.snapshotDate ?? null,
      includeDeltas,
    ],
    queryFn: async (): Promise<MergedPerformanceResult> => {
      const apiVideos = performanceResult?.data || [];

      if (apiVideos.length === 0) {
        return {
          data: [],
          snapshotDate: null,
          matchStats: null,
          deltaAvailable: false,
          source: performanceResult?.source || 'dummy',
          warning: performanceResult?.warning,
        };
      }

      try {
        const result = await useCase.execute({
          apiVideos,
          includeDeltas,
        });

        return {
          data: result.mergedData,
          snapshotDate: result.snapshotDate,
          matchStats: result.matchStats,
          deltaAvailable: result.deltaAvailable,
          source: performanceResult?.source || 'dummy',
          warning: performanceResult?.warning,
        };
      } catch (error) {
        console.error('Merge failed:', error);
        // Return API data with default displayMetrics on merge failure
        const fallbackData: MergedPerformance[] = apiVideos.map((video) => ({
          ...video,
          displayMetrics: {
            ...video.metrics,
            impressionsSource: 'api' as const,
            ctrSource: 'api' as const,
          },
          snapshotMatch: null,
        }));

        return {
          data: fallbackData,
          snapshotDate: null,
          matchStats: null,
          deltaAvailable: false,
          source: performanceResult?.source || 'dummy',
          warning: performanceResult?.warning,
        };
      }
    },
    enabled: enabled && !isLoadingApi && performanceResult !== undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Combined loading state
  const isLoading = isLoadingApi || isLoadingSnapshot || isMerging;

  return {
    // Data
    data: mergedResult?.data || [],
    snapshotDate: mergedResult?.snapshotDate || null,
    matchStats: mergedResult?.matchStats || null,
    deltaAvailable: mergedResult?.deltaAvailable || false,
    source: mergedResult?.source || 'dummy',
    warning: mergedResult?.warning,

    // Loading states
    isLoading,
    isLoadingApi,
    isLoadingSnapshot,
    isMerging,

    // Error states
    isError: isApiError || !!mergeError,
    error: apiError || mergeError,

    // Actions
    refetch,
    isFetching,
  };
}

/**
 * Hook for single merged performance detail by videoId
 */
export function useMergedPerformanceDetail(videoId: string) {
  const {
    data,
    isLoading,
    isError,
    error,
    snapshotDate,
    matchStats,
    deltaAvailable,
  } = useMergedPerformance({
    maxResults: 50,
    includeDeltas: true,
    enabled: !!videoId,
  });

  const detail = useMemo(() => {
    return data.find((item) => item.videoId === videoId) || null;
  }, [data, videoId]);

  return {
    data: detail,
    isLoading,
    isError,
    error,
    snapshotDate,
    matchStats,
    deltaAvailable,
  };
}
