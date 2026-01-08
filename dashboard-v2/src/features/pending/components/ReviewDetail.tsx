import { FieldValue } from './FieldValue';
import type { PendingReview } from '../types';

interface ReviewDetailProps {
  review: PendingReview;
  onEntityClick: (entityId: string, entityType: PendingReview['entity_type']) => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  isApproving: boolean;
  isRejecting: boolean;
  isDeleting: boolean;
}

export const ReviewDetail = ({
  review,
  onEntityClick,
  onApprove,
  onReject,
  onDelete,
  isApproving,
  isRejecting,
  isDeleting,
}: ReviewDetailProps) => {
  const isLoading = isApproving || isRejecting || isDeleting;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-sm font-medium">
            {review.entity_type}
          </span>
          <button
            onClick={() => onEntityClick(review.entity_id, review.entity_type)}
            className="text-sm text-blue-600 hover:underline"
          >
            {review.entity_id}
          </button>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          {review.entity_name}
        </h2>
        <div className="text-sm text-gray-500 mt-1">
          {new Date(review.created_at).toLocaleString()}
        </div>
      </div>

      {/* Source Workflow */}
      {review.source_workflow && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="text-xs font-medium text-gray-700 mb-1">Source Workflow</div>
          <div className="text-sm text-gray-900">{review.source_workflow}</div>
          {review.run_id && (
            <div className="text-xs text-gray-500 mt-1">Run ID: {review.run_id}</div>
          )}
        </div>
      )}

      {/* Suggested Fields */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Suggested Fields
        </h3>
        <div className="space-y-3 bg-gray-50 p-4 rounded">
          {Object.entries(review.suggested_fields).map(([field, value]) => (
            <FieldValue key={field} field={field} value={value} />
          ))}
        </div>
      </div>

      {/* Reasoning (if available) */}
      {review.reasoning && Object.keys(review.reasoning).length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Reasoning
          </h3>
          <div className="space-y-2 bg-blue-50 p-4 rounded">
            {Object.entries(review.reasoning).map(([field, reason]) => (
              <div key={field} className="text-sm">
                <span className="font-medium text-gray-700">{field}:</span>
                <span className="ml-2 text-gray-900">{reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {review.status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApproving ? 'Approving...' : 'Approve'}
          </button>
          <button
            onClick={onReject}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRejecting ? 'Rejecting...' : 'Reject'}
          </button>
          <button
            onClick={onDelete}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      )}

      {/* Audit Log Link */}
      {review.audit_log_path && (
        <div className="mt-4 pt-4 border-t">
          <a
            href={review.audit_log_path}
            className="text-sm text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Audit Log
          </a>
        </div>
      )}
    </div>
  );
};
