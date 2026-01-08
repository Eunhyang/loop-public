import { useState, useMemo } from 'react';
import type { Member, Project } from '@/types';
import type { KanbanFilters as Filters } from './useKanbanFilters';
import { useFilterContext } from '@/features/filters/context/FilterContext';
import { getWeekOptions, getMonthOptions } from '@/utils/dateUtils';

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
  const {
    assignees,
    projectId,
    dateFilter,
    selectedWeeks,
    selectedMonths,
    setAssignees,
    setProjectId,
    setDateFilter,
    setSelectedWeeks,
    setSelectedMonths,
    clearFilters
  } = filters;
  const { togglePanel, isPanelOpen } = useFilterContext();

  // Quick Date mode state
  const [dateMode, setDateMode] = useState<'week' | 'month'>(() => {
    if (selectedMonths.length > 0) return 'month';
    return 'week';
  });

  // Generate week/month options
  const weekOptions = useMemo(() => getWeekOptions(5), []);
  const monthOptions = useMemo(() => getMonthOptions(5), []);

  // Toggle week selection
  const toggleWeek = (key: string) => {
    const next = selectedWeeks.includes(key)
      ? selectedWeeks.filter(k => k !== key)
      : [...selectedWeeks, key];
    setSelectedWeeks(next);
    // Clear legacy dateFilter
    if (dateFilter) setDateFilter('');
  };

  // Toggle month selection
  const toggleMonth = (key: string) => {
    const next = selectedMonths.includes(key)
      ? selectedMonths.filter(k => k !== key)
      : [...selectedMonths, key];
    setSelectedMonths(next);
    // Clear legacy dateFilter
    if (dateFilter) setDateFilter('');
  };

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
            value={projectId || ''}
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

        {/* Quick Date Multi-Select */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
            Due Date
          </label>
          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex">
              <button
                onClick={() => setDateMode('week')}
                className={`btn-filter !rounded-r-none !border-r-0 ${dateMode === 'week' ? 'btn-filter-active' : ''}`}
              >
                W
              </button>
              <button
                onClick={() => setDateMode('month')}
                className={`btn-filter !rounded-l-none ${dateMode === 'month' ? 'btn-filter-active' : ''}`}
              >
                M
              </button>
            </div>

            {/* Week/Month Buttons */}
            <div className="flex gap-1">
              {dateMode === 'week'
                ? weekOptions.map(({ key, label, isCurrent }) => {
                    const isSelected = selectedWeeks.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleWeek(key)}
                        className={`btn-filter ${isSelected ? 'btn-filter-active' : ''} ${isCurrent && !isSelected ? '!ring-1 !ring-primary/50' : ''}`}
                        title={key}
                      >
                        {label}
                      </button>
                    );
                  })
                : monthOptions.map(({ key, label, isCurrent }) => {
                    const isSelected = selectedMonths.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleMonth(key)}
                        className={`btn-filter ${isSelected ? 'btn-filter-active' : ''} ${isCurrent && !isSelected ? '!ring-1 !ring-primary/50' : ''}`}
                        title={key}
                      >
                        {label}
                      </button>
                    );
                  })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="self-end ml-auto flex items-center gap-3">
          <button
            onClick={togglePanel}
            className={`btn-filter flex items-center gap-2 ${isPanelOpen ? 'btn-filter-active' : ''}`}
            title="Toggle Filters"
          >
            <span className="text-lg">⚙</span>
            Filters
          </button>

          <button
            onClick={clearFilters}
            disabled={assignees.length === 0 && !projectId && !dateFilter && selectedWeeks.length === 0 && selectedMonths.length === 0}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};
