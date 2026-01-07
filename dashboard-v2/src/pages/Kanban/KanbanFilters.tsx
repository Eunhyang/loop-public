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
    <div className="glass-moderate border-b border-white/5 p-4 rounded-lg mb-4">
      {/* Assignee tabs (multi-select) */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
          Assignee
        </label>
        <div className="flex flex-wrap gap-2">
          {members.map((member) => {
            const isActive = assignees.includes(member.id);
            return (
              <button
                key={member.id}
                onClick={() => toggleAssignee(member.id)}
                className={`btn-filter ${isActive ? 'btn-filter-active' : ''}`}
              >
                {member.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Project and date filters */}
      <div className="flex items-end gap-4">
        {/* Project select */}
        <div className="flex-1 max-w-sm">
          <label htmlFor="project-filter" className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
            Project
          </label>
          <select
            id="project-filter"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full input-filter"
          >
            <option value="" className="bg-zinc-900">All Projects</option>
            {projects.map((project) => (
              <option key={project.entity_id} value={project.entity_id} className="bg-zinc-900">
                {project.entity_name}
              </option>
            ))}
          </select>
        </div>

        {/* Date range buttons */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
            Due Date
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setDateFilter(dateFilter === 'W' ? '' : 'W')}
              className={`btn-filter ${dateFilter === 'W' ? 'btn-filter-active' : ''}`}
            >
              This Week
            </button>
            <button
              onClick={() => setDateFilter(dateFilter === 'M' ? '' : 'M')}
              className={`btn-filter ${dateFilter === 'M' ? 'btn-filter-active' : ''}`}
            >
              This Month
            </button>
          </div>
        </div>

        {/* Clear filters */}
        <div className="self-end ml-auto">
          <button
            onClick={clearFilters}
            disabled={assignees.length === 0 && !projectId && !dateFilter}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};
