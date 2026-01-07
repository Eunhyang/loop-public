import type { Member, Project } from '@/types';
import type { KanbanFilters as Filters } from './useKanbanFilters';

interface KanbanFiltersProps {
  filters: Filters;
  members: Member[];
  projects: Project[];
}

/**
 * Kanban filter controls
 * Renders assignee tabs, project select, and date range buttons
 */
export const KanbanFilters = ({ filters, members, projects }: KanbanFiltersProps) => {
  const { assignees, projectId, dateFilter, setAssignees, setProjectId, setDateFilter, clearFilters } = filters;

  const toggleAssignee = (memberId: string) => {
    if (assignees.includes(memberId)) {
      setAssignees(assignees.filter(id => id !== memberId));
    } else {
      setAssignees([...assignees, memberId]);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      {/* Assignee tabs (multi-select) */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Assignee
        </label>
        <div className="flex flex-wrap gap-2">
          {members.map((member) => {
            const isActive = assignees.includes(member.id);
            return (
              <button
                key={member.id}
                onClick={() => toggleAssignee(member.id)}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {member.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Project and date filters */}
      <div className="flex items-center gap-4">
        {/* Project select */}
        <div className="flex-1">
          <label htmlFor="project-filter" className="block text-xs font-medium text-gray-700 mb-1">
            Project
          </label>
          <select
            id="project-filter"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project.entity_id} value={project.entity_id}>
                {project.entity_name}
              </option>
            ))}
          </select>
        </div>

        {/* Date range buttons */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Due Date
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setDateFilter(dateFilter === 'W' ? '' : 'W')}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                dateFilter === 'W'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setDateFilter(dateFilter === 'M' ? '' : 'M')}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                dateFilter === 'M'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        {/* Clear filters */}
        <div className="self-end">
          <button
            onClick={clearFilters}
            disabled={assignees.length === 0 && !projectId && !dateFilter}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};
