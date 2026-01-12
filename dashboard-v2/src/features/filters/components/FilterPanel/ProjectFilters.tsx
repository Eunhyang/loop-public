import { useCombinedFilters } from '@/hooks/useCombinedFilters';
import { useConstants } from '@/contexts/ConstantsContext';
import type { LocalFilterState } from '@/types/filters';

type ArrayFilterKey = 'projectStatus' | 'projectPriority';

export const ProjectFilters = () => {
  const { projectStatus, projectPriority, setFilter } = useCombinedFilters();
  const constants = useConstants();

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
          {constants.project.status.map(status => (
            <button
              key={status}
              onClick={() => toggleFilter('projectStatus', status)}
              className={`btn-filter ${projectStatus.includes(status) ? 'btn-filter-active' : ''}`}
            >
              {constants.project.status_labels?.[status] || status}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Project Priority</h3>
        <div className="flex flex-wrap gap-2">
          {constants.priority.values.map(priority => (
            <button
              key={priority}
              onClick={() => toggleFilter('projectPriority', priority)}
              className={`btn-filter ${projectPriority.includes(priority) ? 'btn-filter-active' : ''}`}
            >
              {constants.priority.labels?.[priority] || priority}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
