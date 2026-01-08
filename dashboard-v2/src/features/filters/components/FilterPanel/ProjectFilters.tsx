import { useFilterContext } from '../../context/FilterContext';

const PROJECT_STATUSES = ['planning', 'active', 'paused', 'completed', 'cancelled'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];

export const ProjectFilters = () => {
    const { projectStatus, projectPriority, toggleFilterArray } = useFilterContext();

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Project Status</h3>
                <div className="flex flex-wrap gap-2">
                    {PROJECT_STATUSES.map(status => (
                        <button
                            key={status}
                            onClick={() => toggleFilterArray('projectStatus', status)}
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
                            onClick={() => toggleFilterArray('projectPriority', priority)}
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
