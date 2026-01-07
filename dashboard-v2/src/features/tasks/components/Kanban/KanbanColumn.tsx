import type { Task } from '@/features/tasks/types';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  status: Task['status'];
  tasks: Task[];
  onCardClick: (task: Task) => void;
}

const STATUS_CONFIG = {
  todo: {
    title: 'To Do',
    color: 'border-b-2 border-gray-500/30',
    textColor: 'text-gray-400',
  },
  doing: {
    title: 'Doing',
    color: 'border-b-2 border-blue-500/50',
    textColor: 'text-blue-400',
  },
  hold: {
    title: 'Hold',
    color: 'border-b-2 border-yellow-500/50',
    textColor: 'text-yellow-400',
  },
  done: {
    title: 'Done',
    color: 'border-b-2 border-green-500/50',
    textColor: 'text-green-400',
  },
  blocked: {
    title: 'Blocked',
    color: 'border-b-2 border-red-500/50',
    textColor: 'text-red-400',
  },
};

/**
 * Single Kanban column component
 * Displays a column with title, task count, and task cards
 */
export const KanbanColumn = ({ status, tasks, onCardClick }: KanbanColumnProps) => {
  const config = STATUS_CONFIG[status] || {
    title: status.charAt(0).toUpperCase() + status.slice(1),
    color: 'border-b-2 border-gray-500/30',
    textColor: 'text-gray-400',
  };

  return (
    <div className="flex flex-col h-full rounded-lg glass-subtle">
      {/* Column header */}
      <div className={`p-3 ${config.color}`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-sm font-semibold tracking-wide uppercase ${config.textColor}`}>
            {config.title}
          </h2>
          <span className={`text-xs font-medium ${config.textColor} bg-white/10 px-2 py-1 rounded-full`}>
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
            <TaskCard
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
