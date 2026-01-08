import { useState, useMemo } from 'react';
import type { Member, Project, Program, Task } from '@/types';
import type { UseUrlFiltersReturn } from '@/types/filters';
import { useFilterContext } from '@/features/filters/context/FilterContext';
import { getWeekOptions, getMonthOptions } from '@/utils/dateUtils';

interface TaskFilterBarProps {
  filters: UseUrlFiltersReturn;
  members: Member[];
  projects: Project[];
  programs?: Program[];
  tasks?: Task[];
}

/**
 * Shared task filter controls for Kanban and Calendar views
 * Renders assignee tabs, program/project buttons, and date range buttons
 */
export const TaskFilterBar = ({ filters, members, projects, programs = [], tasks = [] }: TaskFilterBarProps) => {
  const {
    assignees,
    projectIds,
    programId,
    dateFilter,
    selectedWeeks,
    selectedMonths,
    setAssignees,
    setProgramId,
    toggleProjectId,
    setProjectIds,
    setDateFilter,
    setSelectedWeeks,
    setSelectedMonths,
    clearUrlFilters
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

  // Filter tasks by current assignee selection
  const filteredTasks = useMemo(() => {
    if (assignees.length === 0) return tasks;
    return tasks.filter(t => assignees.includes(t.assignee));
  }, [tasks, assignees]);

  // Calculate task count for a project
  const getProjectTaskCount = (projectId: string) => {
    return filteredTasks.filter(t => t.project_id === projectId).length;
  };

  // Programs with tasks
  const programsWithTasks = useMemo(() => {
    return programs.map(prog => {
      const programProjects = projects.filter(p => p.program_id === prog.entity_id);
      const projectIdList = programProjects.map(p => p.entity_id);
      const taskCount = filteredTasks.filter(t => projectIdList.includes(t.project_id)).length;
      return { ...prog, taskCount };
    }).filter(p => p.taskCount > 0);
  }, [programs, projects, filteredTasks]);

  // Child projects (when program is selected)
  const childProjects = useMemo(() => {
    if (!programId) return [];
    return projects
      .filter(p => p.program_id === programId)
      .map(p => ({ ...p, taskCount: getProjectTaskCount(p.entity_id) }))
      .filter(p => p.taskCount > 0);
  }, [programId, projects, filteredTasks]);

  // Independent projects (no program)
  const independentProjects = useMemo(() => {
    return projects
      .filter(p => !p.program_id)
      .map(p => ({ ...p, taskCount: getProjectTaskCount(p.entity_id) }))
      .filter(p => p.taskCount > 0);
  }, [projects, filteredTasks]);

  // Total task count
  const totalTasks = filteredTasks.length;

  // Check if "All" is active (no program, no projects selected)
  const isAllActive = !programId && projectIds.length === 0;

  // Handlers
  const handleAllClick = () => {
    // Clear all project filters in one batch to prevent race condition
    const newParams = new URLSearchParams(window.location.search);
    newParams.delete('program');
    newParams.delete('project_ids');
    newParams.delete('project_id'); // Clear legacy param too
    window.history.replaceState({}, '', `${window.location.pathname}?${newParams.toString()}`);
    // Force re-render by updating URL
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleProgramClick = (progId: string) => {
    if (programId === progId) {
      // Toggle off
      setProgramId(null);
    } else {
      setProgramId(progId);
    }
  };

  const handleChildProjectClick = (projId: string) => {
    toggleProjectId(projId);
  };

  const handleIndependentProjectClick = (projId: string) => {
    // Clear program and toggle project in one batch
    const newParams = new URLSearchParams(window.location.search);
    newParams.delete('program');
    newParams.delete('project_id'); // Clear legacy param

    // Toggle project_ids
    const current = new URLSearchParams(window.location.search).getAll('project_ids');
    newParams.delete('project_ids');
    if (current.includes(projId)) {
      current.filter(p => p !== projId).forEach(p => newParams.append('project_ids', p));
    } else {
      [...current, projId].forEach(p => newParams.append('project_ids', p));
    }

    window.history.replaceState({}, '', `${window.location.pathname}?${newParams.toString()}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Toggle functions for date/assignee
  const toggleWeek = (key: string) => {
    const next = selectedWeeks.includes(key)
      ? selectedWeeks.filter(k => k !== key)
      : [...selectedWeeks, key];
    setSelectedWeeks(next);
    if (dateFilter) setDateFilter('');
  };

  const toggleMonth = (key: string) => {
    const next = selectedMonths.includes(key)
      ? selectedMonths.filter(k => k !== key)
      : [...selectedMonths, key];
    setSelectedMonths(next);
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
    <div className="glass-moderate border-b border-white/5 p-4 rounded-lg mb-4 flex flex-col gap-6">
      {/* Top Row: Assignee (Left) and Due Date (Right) */}
      <div className="flex justify-between items-start gap-8">
        {/* Assignee (Left) */}
        <div className="flex-1 min-w-0">
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

        {/* Due Date (Right) */}
        <div className="shrink-0 flex flex-col items-end">
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
            Due Date
          </label>
          <div className="flex items-center gap-2">
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
      </div>

      {/* Bottom Row: Project (Left) and Actions (Right) */}
      <div className="flex justify-between items-end gap-6">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
            Project
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAllClick}
              className={`btn-filter ${isAllActive ? 'btn-filter-active' : ''}`}
            >
              All
              <span className="filter-count">{totalTasks}</span>
            </button>

            {programsWithTasks.map(prog => {
              const isActive = programId === prog.entity_id;
              return (
                <button
                  key={prog.entity_id}
                  onClick={() => handleProgramClick(prog.entity_id)}
                  className={`btn-filter btn-filter-program ${isActive ? 'btn-filter-active' : ''}`}
                >
                  {prog.entity_name}
                  <span className="filter-count">{prog.taskCount}</span>
                </button>
              );
            })}

            {programId && childProjects.length > 0 && (
              <>
                <span className="filter-separator">│</span>
                <button
                  onClick={() => setProjectIds([])}
                  className={`btn-filter btn-filter-child ${projectIds.length === 0 ? 'btn-filter-active' : ''}`}
                >
                  All
                  <span className="filter-count">
                    {childProjects.reduce((sum, p) => sum + p.taskCount, 0)}
                  </span>
                </button>
                {childProjects.map(proj => {
                  const isActive = projectIds.includes(proj.entity_id);
                  return (
                    <button
                      key={proj.entity_id}
                      onClick={() => handleChildProjectClick(proj.entity_id)}
                      className={`btn-filter btn-filter-child ${isActive ? 'btn-filter-active' : ''}`}
                    >
                      {proj.entity_name}
                      <span className="filter-count">{proj.taskCount}</span>
                    </button>
                  );
                })}
              </>
            )}

            {independentProjects.map(proj => {
              const isActive = projectIds.includes(proj.entity_id) && !programId;
              return (
                <button
                  key={proj.entity_id}
                  onClick={() => handleIndependentProjectClick(proj.entity_id)}
                  className={`btn-filter ${isActive ? 'btn-filter-active' : ''}`}
                >
                  {proj.entity_name}
                  <span className="filter-count">{proj.taskCount}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={togglePanel}
            className={`btn-filter flex items-center gap-2 ${isPanelOpen ? 'btn-filter-active' : ''}`}
            title="Toggle Filters"
          >
            <span className="text-lg">⚙</span>
            Filters
          </button>

          <button
            onClick={clearUrlFilters}
            disabled={assignees.length === 0 && !programId && projectIds.length === 0 && !dateFilter && selectedWeeks.length === 0 && selectedMonths.length === 0}
            className="text-xs px-3 py-1.5 text-sm text-gray-500 hover:text-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};
