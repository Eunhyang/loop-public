import type { PendingReview } from '../types';

interface ReviewCardProps {
  review: PendingReview;
  selected: boolean;
  onClick: () => void;
}

export const ReviewCard = ({ review, selected, onClick }: ReviewCardProps) => {
  const fieldCount = Object.keys(review.suggested_fields).length;

  return (
    <div
      onClick={onClick}
      className={`
        p-3 border-b cursor-pointer transition-colors
        ${selected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'}
      `}
    >
      {/* Entity Type Badge */}
      <div className="flex items-center gap-2 mb-1">
        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
          {review.entity_type}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(review.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* Entity Name */}
      <div className="font-medium text-sm text-gray-900 mb-1">
        {review.entity_name}
      </div>

      {/* Entity ID */}
      <div className="text-xs text-gray-500 mb-2">
        {review.entity_id}
      </div>

      {/* Field Count */}
      <div className="text-xs text-gray-600">
        {fieldCount} field{fieldCount !== 1 ? 's' : ''} suggested
      </div>

      {/* Badges - Workflow, Run ID, AUTO-SYNTH */}
      <div className="flex flex-wrap gap-1 mt-2">
        {/* AUTO-SYNTH badge (replaces workflow badge for retro-synth) */}
        {review.source_workflow === 'retro-synth' ? (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
            AUTO-SYNTH
          </span>
        ) : (
          review.source_workflow && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
              {review.source_workflow}
            </span>
          )
        )}

        {/* Run ID badge (truncated, full value in tooltip) */}
        {review.run_id && (
          <span
            className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono"
            title={review.run_id}
          >
            {review.run_id.length > 24 ? review.run_id.substring(0, 24) + '...' : review.run_id}
          </span>
        )}
      </div>
    </div>
  );
};
