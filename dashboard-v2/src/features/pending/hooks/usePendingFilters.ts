import { useState, useMemo, useCallback, useEffect } from 'react';
import type { PendingReview, PendingStatus } from '../types';

interface UsePendingFiltersProps {
  reviews: PendingReview[];
  activeStatus: PendingStatus;
  onDeleteBatch: (params: { source_workflow?: string; run_id?: string; status?: string }) => Promise<unknown>;
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

  // Filter reviews (matches legacy getFilteredReviews)
  const filteredReviews = useMemo(() => {
    let result = reviews.filter((r) => r.status === activeStatus);

    if (filterWorkflow !== '') {
      result = result.filter((r) => r.source_workflow === filterWorkflow);
    }
    if (filterRunId !== '') {
      result = result.filter((r) => r.run_id === filterRunId);
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

    // Call delete API (only send non-empty params)
    const params: { source_workflow?: string; run_id?: string; status?: string } = {};
    if (filterWorkflow !== '') params.source_workflow = filterWorkflow;
    if (filterRunId !== '') params.run_id = filterRunId;
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
