import type { Task } from '@/types';
import { Draggable } from '@hello-pangea/dnd';

interface KanbanCardProps {
  task: Task;
  index: number;
  onClick: (task: Task) => void;
}

/**
 * Individual task card component
 * Displays task summary with click handler
 */
export const TaskCard = ({ task, index, onClick }: KanbanCardProps) => {
  const getPriorityColor = (priority?: string) => {
    if (!priority) return 'border-l-zinc-800'; // Default to Low/Dark Gray

    switch (priority.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'border-l-zinc-200'; // White/Light Gray
      case 'medium':
        return 'border-l-zinc-500'; // Medium Gray
      case 'low':
        return 'border-l-zinc-800'; // Dark Gray
      default:
        return 'border-l-transparent';
    }
  };

  const priorityColor = getPriorityColor(task.priority);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(task);
    }
  };

  return (
    <Draggable draggableId={task.entity_id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
          }}
          className={`glass-subtle rounded-lg p-3 mb-2 cursor-grab active:cursor-grabbing border-l-4 ${priorityColor} focus:outline-none focus:ring-2 focus:ring-black/20 group hover:shadow-md transition-all duration-200 ${snapshot.isDragging ? 'shadow-lg ring-2 ring-black/10 rotate-2 bg-white' : ''
            }`}
          onClick={() => onClick(task)}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-label={`Task: ${task.entity_name}`}
        >
          {/* Task ID and name */}
          <div className="flex flex-col gap-1 mb-2">
            <span className="text-[10px] text-zinc-400 font-mono truncate">
              {task.entity_id}
            </span>
            <h3 className="text-sm font-medium text-zinc-800 leading-snug group-hover:text-black">
              {task.entity_name}
            </h3>
          </div>

          {/* Assignee */}
          {task.assignee && (
            <div className="flex items-center text-xs text-zinc-500 mb-2">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              {task.assignee}
            </div>
          )}

          {/* Due date */}
          {task.due && (
            <div className="flex items-center text-xs text-zinc-500 mb-2">
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
                  className="inline-block px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded border border-gray-200"
                >
                  {tag}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="text-[10px] text-gray-400">+{task.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};
