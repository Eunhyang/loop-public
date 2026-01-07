import type { Task } from '@/types';
import type { KanbanColumns } from './components/Kanban/KanbanBoard';
import { getWeekRange, getMonthRange, isWithinRange } from '@/utils/date';

export interface KanbanFiltersState {
    assignees: string[];
    projectId: string | null;
    dateFilter: 'W' | 'M' | '';
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

export const buildKanbanColumns = (tasks: Task[], filters: KanbanFiltersState): KanbanColumns => {
    const filtered = filterTasks(tasks, filters);
    return groupTasksByStatus(filtered);
};
