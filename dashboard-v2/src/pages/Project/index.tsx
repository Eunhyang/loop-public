import { useParams, Link } from 'react-router-dom';
import { useProjectContext } from '@/features/projects/queries';
import { useUi } from '@/contexts/UiContext';
import type { Task } from '@/types';
import { useState } from 'react';

// Priority mapping for sorting (critical=4, high=3, medium=2, low=1)
const PRIORITY_WEIGHT: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// Status order for display
const STATUS_ORDER = ['doing', 'todo', 'hold', 'done', 'blocked'] as const;
type TaskStatus = typeof STATUS_ORDER[number];

export const ProjectPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useProjectContext(id || null);
  const { openEntityDrawer } = useUi();

  // Track which status groups are expanded (all expanded by default)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    doing: true,
    todo: true,
    hold: true,
    done: true,
    blocked: true,
  });

  const toggleSection = (status: string) => {
    setExpandedSections(prev => ({ ...prev, [status]: !prev[status] }));
  };

  const handleTaskClick = (taskId: string) => {
    openEntityDrawer({ type: 'task', mode: 'edit', id: taskId });
  };

  // Sort tasks by priority DESC, then due date ASC (nulls last)
  const sortTasks = (tasks: Task[]): Task[] => {
    return [...tasks].sort((a, b) => {
      // Priority sort (descending)
      const priorityA = PRIORITY_WEIGHT[a.priority] || 0;
      const priorityB = PRIORITY_WEIGHT[b.priority] || 0;
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }

      // Due date sort (ascending, nulls last)
      if (!a.due && !b.due) return 0;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due.localeCompare(b.due);
    });
  };

  // Group tasks by status
  const groupTasksByStatus = (tasks: Task[]) => {
    const grouped: Record<string, Task[]> = {
      doing: [],
      todo: [],
      hold: [],
      done: [],
      blocked: [],
    };

    tasks.forEach(task => {
      const status = task.status as TaskStatus;
      if (grouped[status]) {
        grouped[status].push(task);
      } else {
        // Unknown status - add to todo with warning
        console.warn(`Unknown task status "${task.status}" for task ${task.entity_id}`);
        grouped.todo.push(task);
      }
    });

    // Sort each group
    Object.keys(grouped).forEach(status => {
      grouped[status] = sortTasks(grouped[status]);
    });

    return grouped;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading project...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">
          <h2 className="text-xl font-bold mb-2">Error loading project</h2>
          <p>{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data state (shouldn't happen if enabled:!!id works)
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No project data available</div>
      </div>
    );
  }

  const { project, tasks, parent_track } = data;
  const groupedTasks = groupTasksByStatus(tasks);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600 mb-4">
        <Link to="/kanban" className="hover:text-blue-600">Dashboard</Link>
        {parent_track && (
          <>
            <span className="mx-2">/</span>
            <span>{parent_track.entity_name}</span>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="font-semibold">{project.entity_name}</span>
      </div>

      {/* Project Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{project.entity_name}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div>
            <span className="font-semibold">ID:</span> {project.entity_id}
          </div>
          {parent_track && (
            <div>
              <span className="font-semibold">Track:</span> {parent_track.entity_id}
            </div>
          )}
          <div>
            <span className="font-semibold">Owner:</span> {project.owner}
          </div>
          <div>
            <span className="font-semibold">Status:</span>{' '}
            <span className={`px-2 py-1 rounded ${
              project.status === 'active' ? 'bg-green-100 text-green-800' :
              project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
              project.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
              project.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {project.status}
            </span>
          </div>
          {project.priority_flag && (
            <div>
              <span className="font-semibold">Priority:</span>{' '}
              <span className={`px-2 py-1 rounded ${
                project.priority_flag === 'critical' ? 'bg-red-100 text-red-800' :
                project.priority_flag === 'high' ? 'bg-orange-100 text-orange-800' :
                project.priority_flag === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {project.priority_flag}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tasks Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold mb-4">Tasks ({tasks.length})</h2>

        {/* Empty state */}
        {tasks.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="mb-2">No tasks in this project yet</p>
            <button
              onClick={() => openEntityDrawer({
                type: 'task',
                mode: 'create',
                prefill: { project_id: project.entity_id }
              })}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create First Task
            </button>
          </div>
        ) : (
          /* Task groups */
          <div className="space-y-4">
            {STATUS_ORDER.map(status => {
              const statusTasks = groupedTasks[status];
              if (statusTasks.length === 0) return null;

              const isExpanded = expandedSections[status];

              return (
                <div key={status} className="border rounded-lg">
                  {/* Section header */}
                  <button
                    onClick={() => toggleSection(status)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold capitalize">{status}</span>
                      <span className="text-sm text-gray-500">({statusTasks.length})</span>
                    </div>
                    <svg
                      className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Task list */}
                  {isExpanded && (
                    <div className="border-t divide-y">
                      {statusTasks.map(task => (
                        <button
                          key={task.entity_id}
                          onClick={() => handleTaskClick(task.entity_id)}
                          className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{task.entity_name}</span>
                                <span className="text-xs text-gray-500">{task.entity_id}</span>
                              </div>
                              <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                                <span>@{task.assignee}</span>
                                {task.due && (
                                  <span className="text-gray-500">Due: {task.due}</span>
                                )}
                                {task.type && (
                                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                                    {task.type}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className={`px-2 py-1 rounded text-xs ${
                                task.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
