import { ReviewCard } from './ReviewCard';
import type { PendingReview, PendingStatus } from '../types';

interface ReviewListProps {
  reviews: PendingReview[];
  activeTab: PendingStatus;
  onTabChange: (tab: PendingStatus) => void;
  selectedId: string | null;
  onSelect: (review: PendingReview) => void;
  isLoading: boolean;
}

export const ReviewList = ({
  reviews,
  activeTab,
  onTabChange,
  selectedId,
  onSelect,
  isLoading,
}: ReviewListProps) => {
  const tabs: { value: PendingStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tabs */}
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`
              flex-1 px-4 py-2 text-sm font-medium transition-colors
              ${
                activeTab === tab.value
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Review List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No {activeTab} reviews
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              selected={review.id === selectedId}
              onClick={() => onSelect(review)}
            />
          ))
        )}
      </div>
    </div>
  );
};
