import { useState, useEffect, useMemo } from 'react';
import { FieldValue } from './FieldValue';
import { FieldOptionPills } from './FieldOptionPills';
import { useFieldOptions, FIELD_CONFIG } from '../hooks/useFieldOptions';
import type { PendingReview } from '../types';

interface ReviewDetailProps {
  review: PendingReview;
  onEntityClick: (entityId: string, entityType: PendingReview['entity_type']) => void;
  onApprove: (modifiedFields?: Record<string, unknown>) => void;
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
  const fieldOptions = useFieldOptions();

  // Local state for selected fields (initialized from suggested_fields)
  const [selectedFields, setSelectedFields] = useState<Record<string, unknown>>(() => ({
    ...review.suggested_fields,
  }));

  // Reset selectedFields only when switching to a different review
  // Do NOT reset on refetches to preserve user edits in progress
  useEffect(() => {
    setSelectedFields({ ...review.suggested_fields });
  }, [review.id]); // Only depend on review.id, not suggested_fields

  // Compute modified fields (only fields that differ from original suggestions)
  const modifiedFields = useMemo(() => {
    const changes: Record<string, unknown> = {};

    for (const [field, value] of Object.entries(selectedFields)) {
      const original = review.suggested_fields[field];

      // Deep equality check for arrays (normalize to strings for comparison)
      if (Array.isArray(value) && Array.isArray(original)) {
        const sortedValue = value.map(String).sort();
        const sortedOriginal = original.map(String).sort();
        if (JSON.stringify(sortedValue) !== JSON.stringify(sortedOriginal)) {
          changes[field] = value;
        }
      } else {
        // Normalize to strings for comparison to handle numeric vs string IDs
        if (String(value) !== String(original)) {
          changes[field] = value;
        }
      }
    }

    return changes;
  }, [selectedFields, review.suggested_fields]);

  const handleFieldChange = (field: string, value: unknown) => {
    setSelectedFields(prev => ({ ...prev, [field]: value }));
  };

  const handleApproveClick = () => {
    // Only pass modified fields if there are changes
    onApprove(Object.keys(modifiedFields).length > 0 ? modifiedFields : undefined);
  };

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
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {Object.entries(review.suggested_fields).map(([field, value]) => {
            const config = FIELD_CONFIG[field];
            const options = fieldOptions?.[field as keyof typeof fieldOptions];
            const reasoning = review.reasoning?.[field];

            return (
              <div key={field} className="grid grid-cols-[140px_1fr] gap-4 py-3 px-4">
                {/* Label Column */}
                <div className="text-sm text-gray-500 font-medium pt-1">
                  {field}
                </div>

                {/* Value Column */}
                <div>
                  {/* Render interactive pills if field has config and options */}
                  {config && options && options.length > 0 ? (
                    <FieldOptionPills
                      field={field}
                      options={options}
                      selected={selectedFields[field]}
                      suggested={value}
                      multiSelect={config.multiSelect}
                      onChange={(newValue) => handleFieldChange(field, newValue)}
                      reasoning={reasoning}
                    />
                  ) : (
                    /* Fallback to read-only display for unsupported fields */
                    <FieldValue field={field} value={value} reasoning={reasoning} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      {review.status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={handleApproveClick}
            disabled={isLoading}
            className="flex-1 px-3 py-1 !bg-[#f0fdf4] !text-[#166534] border border-[#bbf7d0] text-xs font-semibold rounded hover:!bg-[#dcfce7] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApproving ? 'Approving...' : 'Approve'}
          </button>
          <button
            onClick={onReject}
            disabled={isLoading}
            className="flex-1 px-3 py-1 !bg-[#fef2f2] !text-[#991b1b] border border-[#fecaca] text-xs font-semibold rounded hover:!bg-[#fee2e2] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRejecting ? 'Rejecting...' : 'Reject'}
          </button>
          <button
            onClick={onDelete}
            disabled={isLoading}
            className="px-3 py-1 !bg-[#f4f4f5] !text-[#18181b] border border-[#e4e4e7] text-xs font-semibold rounded hover:!bg-[#e4e4e7] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Remove this review suggestion (Entity will not be affected)"
          >
            {isDeleting ? 'Dismissing...' : 'Dismiss'}
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
