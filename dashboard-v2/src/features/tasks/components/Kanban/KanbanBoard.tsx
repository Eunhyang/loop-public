import type { Task } from '@/types';
import { KanbanColumn } from './KanbanColumn';

export interface KanbanColumns {
  todo: Task[];
  doing: Task[];
  hold: Task[];
  done: Task[];
  blocked: Task[];
}

interface KanbanBoardProps {
  columns: KanbanColumns;
  onCardClick: (task: Task) => void;
}

/**
 * Kanban board layout with 5 columns
 * Renders status columns in horizontal layout
 */
export const KanbanBoard = ({ columns, onCardClick }: KanbanBoardProps) => {
  const columnOrder: Array<keyof KanbanColumns> = ['todo', 'doing', 'hold', 'done', 'blocked'];

  return (
    <div className="flex-1 overflow-hidden">
      <div className="grid grid-cols-5 gap-4 h-full p-4">
        {columnOrder.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={columns[status]}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
};
