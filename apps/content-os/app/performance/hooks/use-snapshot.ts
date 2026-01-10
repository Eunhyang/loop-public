/**
 * useSnapshot Hook
 * Task: tsk-content-os-15 - YouTube Studio Snapshot System
 *
 * React hook for managing snapshot state and operations
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  YouTubeSnapshot,
  SnapshotDelta,
  SnapshotStorageStats,
} from '@/types/youtube-snapshot';
import {
  getLatestSnapshot,
  listSnapshotDates,
  getStorageStats,
  saveSnapshot,
  getSnapshot,
} from '@/lib/youtube/snapshot-storage';
import {
  calculateDeltas,
  getPreviousDate,
  validateSnapshotDates,
} from '@/lib/youtube/snapshot-calculator';

/**
 * Hook for snapshot management
 */
export function useSnapshot() {
  const queryClient = useQueryClient();

  // Query latest snapshot
  const {
    data: latestSnapshot,
    isLoading: isLoadingLatest,
    error: latestError,
  } = useQuery<YouTubeSnapshot | null>({
    queryKey: ['snapshot', 'latest'],
    queryFn: getLatestSnapshot,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Query snapshot dates list
  const {
    data: snapshotDates,
    isLoading: isLoadingDates,
  } = useQuery<string[]>({
    queryKey: ['snapshot', 'dates'],
    queryFn: listSnapshotDates,
    staleTime: 1000 * 60 * 5,
  });

  // Query storage stats
  const {
    data: storageStats,
    isLoading: isLoadingStats,
  } = useQuery<SnapshotStorageStats>({
    queryKey: ['snapshot', 'stats'],
    queryFn: getStorageStats,
    staleTime: 1000 * 60 * 5,
  });

  // Mutation for saving snapshot
  const saveMutation = useMutation({
    mutationFn: ({
      snapshot,
      overwrite,
    }: {
      snapshot: YouTubeSnapshot;
      overwrite: boolean;
    }) => saveSnapshot(snapshot, overwrite),
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['snapshot'] });
    },
  });

  return {
    // State
    latestSnapshot,
    snapshotDates,
    storageStats,

    // Loading states
    isLoading: isLoadingLatest || isLoadingDates || isLoadingStats,
    isLoadingLatest,
    isLoadingDates,
    isLoadingStats,

    // Errors
    error: latestError,

    // Mutations
    saveSnapshot: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}

/**
 * Hook for calculating deltas
 */
export function useSnapshotDeltas(date?: string) {
  const [deltas, setDeltas] = useState<SnapshotDelta[] | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date) {
      setDeltas(null);
      return;
    }

    const calculateDeltasAsync = async () => {
      setIsCalculating(true);
      setError(null);

      try {
        // Get today's snapshot
        const today = await getSnapshot(date);
        if (!today) {
          setError('Snapshot not found for the specified date');
          setDeltas(null);
          setIsCalculating(false);
          return;
        }

        // Get yesterday's snapshot
        const yesterdayDate = getPreviousDate(date);
        const yesterday = await getSnapshot(yesterdayDate);

        if (!yesterday) {
          setError(`No snapshot found for ${yesterdayDate}. Cannot calculate 24h deltas.`);
          setDeltas(null);
          setIsCalculating(false);
          return;
        }

        // Validate date range
        const validation = validateSnapshotDates(date, yesterdayDate);
        if (!validation.valid) {
          setError(validation.error || 'Invalid date range');
          setDeltas(null);
          setIsCalculating(false);
          return;
        }

        // Calculate deltas
        const calculatedDeltas = calculateDeltas(today, yesterday);
        setDeltas(calculatedDeltas);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setDeltas(null);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateDeltasAsync();
  }, [date]);

  return {
    deltas,
    isCalculating,
    error,
  };
}

/**
 * Hook for getting snapshot by date
 */
export function useSnapshotByDate(date?: string) {
  return useQuery<YouTubeSnapshot | null>({
    queryKey: ['snapshot', 'byDate', date],
    queryFn: () => (date ? getSnapshot(date) : Promise.resolve(null)),
    enabled: !!date,
    staleTime: 1000 * 60 * 10, // 10 minutes (snapshots don't change)
  });
}
