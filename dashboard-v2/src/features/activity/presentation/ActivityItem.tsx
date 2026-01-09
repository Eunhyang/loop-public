/**
 * Presentation Layer - Activity Item
 *
 * Individual activity card in Notion style
 * Pure presentational component
 */

import type { AuditLogEntry } from '../domain/types';
import { formatRelativeTime } from '../domain/utils';

interface ActivityItemProps {
  item: AuditLogEntry;
  onClick: () => void;
}

/**
 * Notion-style activity card
 * Displays: Action icon, entity type badge, entity name, ID, relative time
 */
export function ActivityItem({ item, onClick }: ActivityItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-lg shadow-sm p-3 hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Action Icon */}
        <ActionIcon action={item.action} />

        <div className="flex-1 min-w-0">
          {/* Entity Type Badge + Name */}
          <div className="flex items-center gap-2 flex-wrap">
            <EntityBadge type={item.entity_type} />
            <span className="font-medium text-gray-900 truncate">
              {item.entity_name}
            </span>
          </div>

          {/* Entity ID + Relative Time */}
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
            <span>{item.entity_id}</span>
            <span>·</span>
            <span>{formatRelativeTime(item.timestamp)}</span>
            {item.user && item.user !== 'api' && (
              <>
                <span>·</span>
                <span>{item.user}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

/**
 * Action icon based on action type
 */
function ActionIcon({ action }: { action: string }) {
  const icons = {
    create: (
      <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>
    ),
    update: (
      <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>
    ),
    delete: (
      <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </div>
    ),
    autofill: (
      <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
    ),
  };

  return icons[action as keyof typeof icons] || icons.update;
}

/**
 * Entity type badge with color coding
 */
function EntityBadge({ type }: { type: string }) {
  const badges = {
    Task: 'bg-blue-100 text-blue-700',
    Project: 'bg-green-100 text-green-700',
    Program: 'bg-purple-100 text-purple-700',
    Track: 'bg-orange-100 text-orange-700',
    Hypothesis: 'bg-pink-100 text-pink-700',
    Condition: 'bg-yellow-100 text-yellow-700',
  };

  const colorClass = badges[type as keyof typeof badges] || 'bg-gray-100 text-gray-700';

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded ${colorClass}`}>
      {type}
    </span>
  );
}
