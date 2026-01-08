import { useState, useEffect } from 'react';
import {
  usePendingReviews,
  useApproveReview,
  useRejectReview,
  useDeleteReview,
  useDeleteBatch,
} from '@/features/pending/queries';
import {
  ReviewList,
  ReviewDetail,
  EntityPreview,
  WorkflowFilters,
} from '@/features/pending/components';
import { usePendingFilters } from '@/features/pending/hooks/usePendingFilters';
import type { PendingReview, PendingStatus } from '@/features/pending/types';

export const PendingPage = () => {
  const { data: allReviews = [], isPending: isLoading, error, refetch } = usePendingReviews();
  const approveMutation = useApproveReview();
  const rejectMutation = useRejectReview();
  const deleteMutation = useDeleteReview();
  const deleteBatchMutation = useDeleteBatch();

  const [activeTab, setActiveTab] = useState<PendingStatus>('pending');
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null);
  const [previewEntityId, setPreviewEntityId] = useState<string | null>(null);
  const [previewEntityType, setPreviewEntityType] = useState<PendingReview['entity_type'] | null>(null);

  // Filter hook
  const {
    filterWorkflow,
    filterRunId,
    setFilterWorkflow,
    setFilterRunId,
    filteredReviews,
    handleDeleteFiltered,
  } = usePendingFilters({
    reviews: allReviews,
    activeStatus: activeTab,
    onDeleteBatch: deleteBatchMutation.mutateAsync,
  });

  // Reset selection when tab changes
  useEffect(() => {
    setSelectedReview(null);
    setPreviewEntityId(null);
    setPreviewEntityType(null);
  }, [activeTab]);

  // Sync selectedReview with current data (handle backend updates)
  useEffect(() => {
    if (selectedReview) {
      const currentReview = allReviews.find((r) => r.id === selectedReview.id);
      if (!currentReview) {
        // Review no longer exists, clear selection
        setSelectedReview(null);
        setPreviewEntityId(null);
        setPreviewEntityType(null);
      } else if (currentReview.status !== activeTab) {
        // Review moved to different tab, clear selection
        setSelectedReview(null);
        setPreviewEntityId(null);
        setPreviewEntityType(null);
      }
    }
  }, [allReviews, selectedReview, activeTab]);

  // Handlers
  const handleApprove = async (fields?: Record<string, unknown>) => {
    if (!selectedReview) return;

    try {
      await approveMutation.mutateAsync({
        id: selectedReview.id,
        fields
      });
      setSelectedReview(null); // Clear selection after approval
    } catch (error) {
      console.error('Approve failed:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedReview) return;

    const reason = prompt('Enter rejection reason (required):');
    if (!reason || reason.trim() === '') {
      alert('Rejection reason is required');
      return;
    }

    try {
      await rejectMutation.mutateAsync({ id: selectedReview.id, reason: reason.trim() });
      setSelectedReview(null); // Clear selection after rejection
    } catch (error) {
      console.error('Reject failed:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedReview) return;

    if (!confirm(`Are you sure you want to delete this review for ${selectedReview.entity_name}?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(selectedReview.id);
      setSelectedReview(null); // Clear selection after deletion
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // Error state display
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            Failed to load pending reviews
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Left Pane - Review List */}
      <div className="w-80 border-r flex flex-col min-h-0">
        <ReviewList
          reviews={filteredReviews}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedId={selectedReview?.id ?? null}
          onSelect={(review) => {
            setSelectedReview(review);
            setPreviewEntityId(null); // Reset preview when selecting new review
            setPreviewEntityType(null);
          }}
          isLoading={isLoading}
        />

        {/* Workflow/Run Filters */}
        <WorkflowFilters
          reviews={allReviews}
          filterWorkflow={filterWorkflow}
          filterRunId={filterRunId}
          onWorkflowChange={setFilterWorkflow}
          onRunIdChange={setFilterRunId}
          onDeleteFiltered={handleDeleteFiltered}
          isDeleting={deleteBatchMutation.isPending}
        />
      </div>

      {/* Center Pane - Review Detail */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {selectedReview ? (
          <ReviewDetail
            review={selectedReview}
            onEntityClick={(entityId, entityType) => {
              setPreviewEntityId(entityId);
              setPreviewEntityType(entityType);
            }}
            onApprove={handleApprove}
            onReject={handleReject}
            onDelete={handleDelete}
            isApproving={approveMutation.isPending}
            isRejecting={rejectMutation.isPending}
            isDeleting={deleteMutation.isPending}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a review to see details
          </div>
        )}
      </div>

      {/* Right Pane - Entity Preview */}
      <div className="w-80 border-l min-h-0 overflow-y-auto">
        {previewEntityId && previewEntityType ? (
          <EntityPreview entityId={previewEntityId} entityType={previewEntityType} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 p-4 text-center">
            Click an entity ID to preview
          </div>
        )}
      </div>
    </div>
  );
};
