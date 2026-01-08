import type { Task } from '@/types';
import { TaskCard } from './TaskCard';
import { Droppable } from '@hello-pangea/dnd';

interface KanbanColumnProps {
  status: Task['status'];
  tasks: Task[];
  onCardClick: (task: Task) => void;
}

const STATUS_CONFIG = {
  todo: {
    title: 'To Do',
    color: 'border-b-2 border-zinc-200',
    textColor: 'text-zinc-500',
  },
  doing: {
    title: 'Doing',
    color: 'border-b-2 border-zinc-400',
    textColor: 'text-zinc-800',
  },
  hold: {
    title: 'On Hold',
    color: 'border-b-2 border-zinc-300',
    textColor: 'text-zinc-400',
  },
  done: {
    title: 'Done',
    color: 'border-b-2 border-zinc-200',
    textColor: 'text-zinc-300 line-through',
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
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto min-h-0 p-3 space-y-2 transition-colors ${snapshot.isDraggingOver ? 'bg-white/5' : ''
              }`}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver ? (
              <div className="text-center text-gray-400 text-sm py-8">
                No tasks
              </div>
            ) : (
              tasks.map((task, index) => (
                <TaskCard
                  key={task.entity_id}
                  task={task}
                  index={index}
                  onClick={onCardClick}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
