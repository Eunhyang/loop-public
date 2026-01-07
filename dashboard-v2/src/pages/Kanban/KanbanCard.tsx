import type { Task } from '@/types';

interface KanbanCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

/**
 * Individual task card component
 * Displays task summary with click handler
 */
export const KanbanCard = ({ task, onClick }: KanbanCardProps) => {
  const priorityColors = {
    critical: 'border-l-red-600',
    high: 'border-l-orange-500',
    medium: 'border-l-blue-500',
    low: 'border-l-gray-400',
  };

  const priorityColor = priorityColors[task.priority] || priorityColors.medium;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(task);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 ${priorityColor} p-3 mb-2 cursor-pointer hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500`}
      onClick={() => onClick(task)}
      onKeyDown={handleKeyDown}
      aria-label={`Task: ${task.entity_name}`}
    >
      {/* Task ID and name */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900 flex-1 mr-2">
          {task.entity_name}
        </h3>
        <span className="text-xs text-gray-500 font-mono whitespace-nowrap">
          {task.entity_id}
        </span>
      </div>

      {/* Assignee */}
      {task.assignee && (
        <div className="flex items-center text-xs text-gray-600 mb-2">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          {task.assignee}
        </div>
      )}

      {/* Due date */}
      {task.due && (
        <div className="flex items-center text-xs text-gray-600 mb-2">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          {task.due}
        </div>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span
              key={`${task.entity_id}-tag-${index}`}
              className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{task.tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
};
