import { formatRelativeTime, getUserInitials, formatFieldName } from '../utils';
import type { HistoryActivityItem } from '../types';

interface HistoryItemProps {
  item: HistoryActivityItem;
}

export function HistoryItem({ item }: HistoryItemProps) {
  const getActionText = () => {
    switch (item.action) {
      case 'create':
        return 'created';
      case 'update':
        return 'updated';
      case 'delete':
        return 'deleted';
      case 'autofill':
        return 'auto-filled';
      default:
        return item.action;
    }
  };

  const getActionColor = () => {
    switch (item.action) {
      case 'create':
        return 'text-green-600';
      case 'update':
        return 'text-blue-600';
      case 'delete':
        return 'text-red-600';
      case 'autofill':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-3">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center text-sm font-medium">
          {getUserInitials(item.actor)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">{item.actor}</span>
            <span className={`text-sm ${getActionColor()}`}>{getActionText()}</span>
            <span className="text-gray-400 text-sm">{formatRelativeTime(item.timestamp)}</span>
          </div>

          {/* Entity reference */}
          <div className="text-sm text-gray-700 mb-2">
            <span className="text-gray-500">{item.entityType}:</span>{' '}
            <span className="font-medium">{item.entityName}</span>
          </div>

          {/* Modified fields */}
          {item.modifiedFields && item.modifiedFields.length > 0 && (
            <div className="text-sm text-gray-600 mt-2">
              <span className="text-gray-500">Changed fields:</span>{' '}
              <span className="font-mono bg-gray-100 px-1 rounded">
                {item.modifiedFields.map(formatFieldName).join(', ')}
              </span>
            </div>
          )}

          {/* Diff details */}
          {item.diff && Object.keys(item.diff).length > 0 && (
            <div className="mt-2 space-y-1">
              {Object.entries(item.diff).map(([field, changes]) => (
                <div key={field} className="text-sm bg-gray-50 p-2 rounded">
                  <div className="font-medium text-gray-700">{formatFieldName(field)}</div>
                  <div className="flex items-center gap-2 text-gray-600 font-mono text-xs">
                    <span className="line-through text-red-600">
                      {JSON.stringify(changes.old)}
                    </span>
                    <span>→</span>
                    <span className="text-green-600">{JSON.stringify(changes.new)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
