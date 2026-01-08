import { useCombinedFilters } from '@/hooks/useCombinedFilters';
import type { LocalFilterState } from '@/types/filters';

const TASK_STATUSES = ['todo', 'doing', 'hold', 'done', 'blocked'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];
const TASK_TYPES = ['dev', 'bug', 'strategy', 'research', 'ops', 'meeting'];

type ArrayFilterKey = 'taskStatus' | 'taskPriority' | 'taskTypes';

export const TaskFilters = () => {
  const { taskStatus, taskPriority, taskTypes, setFilter } = useCombinedFilters();

  const toggleFilter = (key: ArrayFilterKey, value: string) => {
    const currentArray = key === 'taskStatus' ? taskStatus :
                         key === 'taskPriority' ? taskPriority : taskTypes;
    const isIncluded = currentArray.includes(value);
    const newArray = isIncluded
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    setFilter(key as keyof LocalFilterState, newArray);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Task Status</h3>
        <div className="flex flex-wrap gap-2">
          {TASK_STATUSES.map(status => (
            <button
              key={status}
              onClick={() => toggleFilter('taskStatus', status)}
              className={`btn-filter ${taskStatus.includes(status) ? 'btn-filter-active' : ''}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Task Priority</h3>
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map(priority => (
            <button
              key={priority}
              onClick={() => toggleFilter('taskPriority', priority)}
              className={`btn-filter ${taskPriority.includes(priority) ? 'btn-filter-active' : ''}`}
            >
              {priority}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Task Type</h3>
        <div className="flex flex-wrap gap-2">
          {TASK_TYPES.map(type => (
            <button
              key={type}
              onClick={() => toggleFilter('taskTypes', type)}
              className={`btn-filter ${taskTypes.includes(type) ? 'btn-filter-active' : ''}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
