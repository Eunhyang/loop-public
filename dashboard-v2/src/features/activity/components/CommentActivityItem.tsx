import { formatRelativeTime, getUserInitials } from '../utils';
import type { CommentActivityItem } from '../types';

interface CommentActivityItemProps {
  item: CommentActivityItem;
}

export function CommentActivityItem({ item }: CommentActivityItemProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-3">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {item.author.icon ? (
            <img
              src={item.author.icon}
              alt={item.author.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
              {getUserInitials(item.author.name)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">{item.author.name}</span>
            <span className="text-gray-400 text-sm">commented</span>
            <span className="text-gray-400 text-sm">{formatRelativeTime(item.timestamp)}</span>
          </div>

          {/* Comment content */}
          <div className="text-sm text-gray-700 whitespace-pre-wrap">{item.content}</div>

          {/* Mentions */}
          {item.mentions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.mentions.map((mention, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                >
                  @{mention}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
