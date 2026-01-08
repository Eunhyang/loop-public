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

import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { useUpdateTask } from '../../queries';

/**
 * Kanban board layout with 5 columns
 * Renders status columns in horizontal layout
 */
export const KanbanBoard = ({ columns, onCardClick }: KanbanBoardProps) => {
  const columnOrder: Array<keyof KanbanColumns> = ['todo', 'doing', 'hold', 'done', 'blocked'];
  const { mutate: updateTask } = useUpdateTask();

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // Dropped in same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Status change
    if (destination.droppableId !== source.droppableId) {
      updateTask({
        id: draggableId,
        data: { status: destination.droppableId as Task['status'] },
      });
    }
  };

  return (
    <div className="flex-1 overflow-hidden min-h-0">
      <DragDropContext onDragEnd={onDragEnd}>
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
      </DragDropContext>
    </div>
  );
};
