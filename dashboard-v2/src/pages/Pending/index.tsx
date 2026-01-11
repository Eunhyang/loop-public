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
  WorkflowFilters,
} from '@/features/pending/components';
import { usePendingFilters } from '@/features/pending/hooks/usePendingFilters';
import type { PendingReview, PendingStatus } from '@/features/pending/types';
import { TaskForm } from '@/features/tasks/components/TaskForm';
import { ProjectForm } from '@/features/projects/components/ProjectForm';
import { TrackForm } from '@/features/strategy/components/TrackForm';
import { ConditionForm } from '@/features/strategy/components/ConditionForm';
import { HypothesisForm } from '@/features/strategy/components/HypothesisForm';
import { useReviewMode } from '@/hooks/useReviewMode';

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

  const isLoadingAction = approveMutation.isPending || rejectMutation.isPending || deleteMutation.isPending;

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

  // Review mode hook for tracking changes
  const reviewMode = useReviewMode({
    entityData: null, // Not used here, entity data loaded by Form
    suggestedFields: selectedReview?.suggested_fields,
    reasoning: selectedReview?.reasoning,
  });

  // Handlers
  const handleApprove = async () => {
    if (!selectedReview) return;

    try {
      // Get only modified fields from reviewMode
      const modifiedFields = reviewMode.getModifiedFields();

      await approveMutation.mutateAsync({
        id: selectedReview.id,
        fields: Object.keys(modifiedFields).length > 0 ? modifiedFields : undefined
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

    if (!confirm(`Dismiss this review suggestion for "${selectedReview.entity_name}"?\n\nThe ${selectedReview.entity_type} will not be affected.`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(selectedReview.id);
      setSelectedReview(null); // Clear selection after deletion
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // Render entity form in review mode
  const renderReviewDetail = () => {
    if (!selectedReview) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          Select a review to see details
        </div>
      );
    }

    const handleRelationClick = (id: string, type: string) => {
      setPreviewEntityId(id);
      // Normalize type to PascalCase (TaskForm passes lowercase, header passes uppercase)
      const normalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
      setPreviewEntityType(normalizedType as PendingReview['entity_type']);
    };

    const handleFieldChange = (field: string, value: unknown) => {
      reviewMode.setFieldValue(field, value);
    };

    // Render appropriate form based on entity type
    switch (selectedReview.entity_type) {
      case 'Task':
        return (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 px-6 pt-4 pb-2 border-b">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-sm font-medium">
                  {selectedReview.entity_type}
                </span>
                <button
                  onClick={() => handleRelationClick(selectedReview.entity_id, selectedReview.entity_type)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {selectedReview.entity_id}
                </button>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">{selectedReview.entity_name}</h2>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(selectedReview.created_at).toLocaleString()}
              </div>
            </div>

            {/* TaskForm in review mode */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <TaskForm
                mode="review"
                id={selectedReview.entity_id}
                suggestedFields={selectedReview.suggested_fields}
                reasoning={selectedReview.reasoning}
                onRelationClick={handleRelationClick}
                onFieldChange={handleFieldChange}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex-shrink-0 p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={handleDelete}
                disabled={isLoadingAction}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                title="Remove this review suggestion (Task will not be affected)"
              >
                Dismiss
              </button>
              <button
                onClick={handleReject}
                disabled={isLoadingAction}
                className="px-4 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={isLoadingAction}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {approveMutation.isPending ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        );

      case 'Project':
        return (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 px-6 pt-4 pb-2 border-b">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-sm font-medium">
                  {selectedReview.entity_type}
                </span>
                <button
                  onClick={() => handleRelationClick(selectedReview.entity_id, selectedReview.entity_type)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {selectedReview.entity_id}
                </button>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">{selectedReview.entity_name}</h2>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(selectedReview.created_at).toLocaleString()}
              </div>
            </div>

            {/* ProjectForm in review mode */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <ProjectForm
                mode="review"
                id={selectedReview.entity_id}
                suggestedFields={selectedReview.suggested_fields}
                reasoning={selectedReview.reasoning}
                onRelationClick={handleRelationClick}
                onFieldChange={handleFieldChange}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex-shrink-0 p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={handleDelete}
                disabled={isLoadingAction}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                title="Remove this review suggestion (Project will not be affected)"
              >
                Dismiss
              </button>
              <button
                onClick={handleReject}
                disabled={isLoadingAction}
                className="px-4 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={isLoadingAction}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {approveMutation.isPending ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        );

      case 'Hypothesis':
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="font-semibold">Hypothesis review mode</p>
              <p className="text-sm mt-1">Not yet implemented</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500 p-4 text-center">
            <div>
              <p className="font-semibold">Unsupported entity type: {selectedReview.entity_type}</p>
              <p className="text-sm mt-1">This entity type cannot be previewed.</p>
            </div>
          </div>
        );
    }
  };

  // Render entity preview based on type
  const renderEntityPreview = () => {
    if (!previewEntityId || !previewEntityType) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500 p-4 text-center">
          Click an entity ID to preview
        </div>
      );
    }

    switch (previewEntityType) {
      case 'Task':
        return <TaskForm mode="view" id={previewEntityId} />;
      case 'Project':
        return <ProjectForm mode="view" id={previewEntityId} />;
      case 'Track':
        return <TrackForm id={previewEntityId} />;
      case 'Condition':
        return <ConditionForm id={previewEntityId} />;
      case 'Hypothesis':
        return <HypothesisForm mode="view" id={previewEntityId} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500 p-4 text-center">
            <div>
              <p className="font-semibold">Unsupported entity type: {previewEntityType}</p>
              <p className="text-sm mt-1">This entity type cannot be previewed.</p>
            </div>
          </div>
        );
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
          activeStatus={activeTab}
          filterWorkflow={filterWorkflow}
          filterRunId={filterRunId}
          onWorkflowChange={setFilterWorkflow}
          onRunIdChange={setFilterRunId}
          onDeleteFiltered={handleDeleteFiltered}
          isDeleting={deleteBatchMutation.isPending}
        />
      </div>

      {/* Center Pane - Review Detail */}
      <div className="flex-1 flex flex-col min-h-0">
        {renderReviewDetail()}
      </div>

      {/* Right Pane - Entity Preview */}
      <div className="w-80 border-l min-h-0 overflow-y-auto">
        {renderEntityPreview()}
      </div>
    </div>
  );
};
