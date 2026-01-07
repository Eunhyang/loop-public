import type { Task } from '@/types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  status: Task['status'];
  tasks: Task[];
  onCardClick: (task: Task) => void;
}

const STATUS_CONFIG = {
  todo: {
    title: 'To Do',
    color: 'bg-gray-100',
    textColor: 'text-gray-700',
  },
  doing: {
    title: 'Doing',
    color: 'bg-blue-100',
    textColor: 'text-blue-700',
  },
  hold: {
    title: 'Hold',
    color: 'bg-yellow-100',
    textColor: 'text-yellow-700',
  },
  done: {
    title: 'Done',
    color: 'bg-green-100',
    textColor: 'text-green-700',
  },
  blocked: {
    title: 'Blocked',
    color: 'bg-red-100',
    textColor: 'text-red-700',
  },
};

/**
 * Single Kanban column component
 * Displays a column with title, task count, and task cards
 */
export const KanbanColumn = ({ status, tasks, onCardClick }: KanbanColumnProps) => {
  const config = STATUS_CONFIG[status] || {
    title: status.charAt(0).toUpperCase() + status.slice(1),
    color: 'bg-gray-100',
    textColor: 'text-gray-700',
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg">
      {/* Column header */}
      <div className={`${config.color} p-3 rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-sm font-semibold ${config.textColor}`}>
            {config.title}
          </h2>
          <span className={`text-xs font-medium ${config.textColor} bg-white px-2 py-1 rounded-full`}>
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Cards container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            No tasks
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard
              key={task.entity_id}
              task={task}
              onClick={onCardClick}
            />
          ))
        )}
      </div>
    </div>
  );
};
