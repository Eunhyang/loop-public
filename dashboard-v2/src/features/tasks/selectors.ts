import type { Task } from '@/types';
import type { KanbanColumns } from '@/features/tasks/components/Kanban/KanbanBoard'; // Will be moved here
// Note: KanbanColumns might currently be in pages/Kanban/KanbanBoard. 
// We will need to adjust imports as we move files. For now, let's define the interface here or import from types if possible.
// Actually, let's define a local interface or shared type for now to avoid circular deps during migration.

export interface KanbanFiltersState {
    assignees: string[];
    projectId: string | null;
    dateFilter: 'W' | 'M';
}

export const filterTasks = (tasks: Task[], filters: KanbanFiltersState): Task[] => {
    const { assignees, projectId, dateFilter } = filters;
    let filtered = tasks;

    // Assignee filter
    if (assignees.length > 0) {
        filtered = filtered.filter(t => assignees.includes(t.assignee));
    }

    // Project filter
    if (projectId) {
        filtered = filtered.filter(t => t.project_id === projectId);
    }

    // Date filter
    const { getWeekRange, getMonthRange, isWithinRange } = await import('@/utils/date');

    if (dateFilter === 'W') {
        const range = getWeekRange();
        filtered = filtered.filter(t => isWithinRange(t.due, range));
    } else if (dateFilter === 'M') {
        const range = getMonthRange();
        filtered = filtered.filter(t => isWithinRange(t.due, range));
    }

    return filtered;
};


export const groupTasksByStatus = (tasks: Task[]): KanbanColumns => {
    return {
        todo: tasks.filter(t => t.status === 'todo'),
        doing: tasks.filter(t => t.status === 'doing'),
        hold: tasks.filter(t => t.status === 'hold'),
        done: tasks.filter(t => t.status === 'done'),
        blocked: tasks.filter(t => t.status === 'blocked'),
    };
};
