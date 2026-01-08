import { useCombinedFilters } from '@/hooks/useCombinedFilters';
import type { LocalFilterState } from '@/types/filters';

const PROJECT_STATUSES = ['planning', 'active', 'paused', 'completed', 'cancelled'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];

type ArrayFilterKey = 'projectStatus' | 'projectPriority';

export const ProjectFilters = () => {
  const { projectStatus, projectPriority, setFilter } = useCombinedFilters();

  const toggleFilter = (key: ArrayFilterKey, value: string) => {
    const currentArray = key === 'projectStatus' ? projectStatus : projectPriority;
    const isIncluded = currentArray.includes(value);
    const newArray = isIncluded
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    setFilter(key as keyof LocalFilterState, newArray);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Project Status</h3>
        <div className="flex flex-wrap gap-2">
          {PROJECT_STATUSES.map(status => (
            <button
              key={status}
              onClick={() => toggleFilter('projectStatus', status)}
              className={`btn-filter ${projectStatus.includes(status) ? 'btn-filter-active' : ''}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Project Priority</h3>
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map(priority => (
            <button
              key={priority}
              onClick={() => toggleFilter('projectPriority', priority)}
              className={`btn-filter ${projectPriority.includes(priority) ? 'btn-filter-active' : ''}`}
            >
              {priority}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
