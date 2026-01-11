import { useState, useMemo, useCallback, useEffect } from 'react';
import type { PendingReview, PendingStatus } from '../types';

// Extract "YYYY-MM-DD HH:MM" from created_at field
const extractTimestamp = (createdAt: string | undefined): string | null => {
  if (!createdAt) return null;
  try {
    const str = typeof createdAt === 'string' ? createdAt : new Date(createdAt).toISOString();
    return str.slice(0, 16).replace('T', ' ');
  } catch {
    return null;
  }
};

interface UsePendingFiltersProps {
  reviews: PendingReview[];
  activeStatus: PendingStatus;
  onDeleteBatch: (params: { source_workflow?: string; run_id?: string; status?: string; ids?: string[] }) => Promise<unknown>;
}

export const usePendingFilters = ({
  reviews,
  activeStatus,
  onDeleteBatch,
}: UsePendingFiltersProps) => {
  // Filter state (empty string = "All")
  const [filterWorkflow, setFilterWorkflow] = useState<string>('');
  const [filterRunId, setFilterRunId] = useState<string>('');

  // Reset filters when tab changes
  useEffect(() => {
    setFilterWorkflow('');
    setFilterRunId('');
  }, [activeStatus]);

  // Filter reviews by status, workflow, and timestamp
  const filteredReviews = useMemo(() => {
    let result = reviews.filter((r) => r.status === activeStatus);

    if (filterWorkflow !== '') {
      result = result.filter((r) => r.source_workflow === filterWorkflow);
    }
    if (filterRunId !== '') {
      // filterRunId now contains timestamp like "2026-01-11 07:44"
      // Filter by matching timestamp prefix from created_at
      result = result.filter((r) => {
        const ts = extractTimestamp(r.created_at);
        return ts === filterRunId;
      });
    }

    return result;
  }, [reviews, activeStatus, filterWorkflow, filterRunId]);

  // Delete handler
  const handleDeleteFiltered = useCallback(async () => {
    // Check if no filter selected
    if (filterWorkflow === '' && filterRunId === '') {
      alert('Select a filter first');
      return;
    }

    // Check if no reviews match filter
    if (filteredReviews.length === 0) {
      alert('No reviews match current filter');
      return;
    }

    // Build confirmation message
    const filterDesc: string[] = [];
    if (filterWorkflow !== '') filterDesc.push(`workflow: ${filterWorkflow}`);
    if (filterRunId !== '') {
      const truncated = filterRunId.length > 24 ? filterRunId.substring(0, 24) + '...' : filterRunId;
      filterDesc.push(`run: ${truncated}`);
    }

    const confirmed = confirm(
      `Delete ${filteredReviews.length} reviews?\n\nFilter: ${filterDesc.join(', ')}\nStatus: ${activeStatus}\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

    // Call delete API
    // For timestamp-based filtering, pass explicit IDs since backend doesn't support timestamp prefix
    const params: { source_workflow?: string; run_id?: string; status?: string; ids?: string[] } = {};
    if (filterWorkflow !== '') params.source_workflow = filterWorkflow;
    // Don't pass run_id for timestamp filtering - pass IDs instead
    if (filterRunId !== '') {
      params.ids = filteredReviews.map((r) => r.id);
    }
    params.status = activeStatus;

    try {
      await onDeleteBatch(params);

      // Reset filters after successful delete
      setFilterWorkflow('');
      setFilterRunId('');
    } catch (error) {
      // Error will be handled by React Query onError if configured
      // Or show user feedback here
      console.error('Failed to delete batch:', error);
      alert('Failed to delete reviews. Please try again.');
    }
  }, [filterWorkflow, filterRunId, filteredReviews.length, activeStatus, onDeleteBatch]);

  return {
    filterWorkflow,
    filterRunId,
    setFilterWorkflow,
    setFilterRunId,
    filteredReviews,
    handleDeleteFiltered,
  };
};
