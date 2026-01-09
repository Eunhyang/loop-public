import { useState, useEffect, useMemo } from 'react';
import { useProject, useCreateProject, useUpdateProject, usePrograms } from '../queries';
import { useDashboardInit } from '@/queries/useDashboardInit';
import { useUi } from '@/contexts/UiContext';
import { ChipSelectExpand } from '@/components/common/ChipSelectExpand';
import type { ChipOption } from '@/components/common/ChipSelect';
import { memberColor } from '@/components/common/chipColors';
import { CORE_ROLES } from '@/features/tasks/selectors';
import type { Project } from '@/types';
import { MarkdownEditor } from '@/components/MarkdownEditor/MarkdownEditor';

interface ProjectFormProps {
    mode: 'create' | 'edit' | 'view';
    id?: string;
    prefill?: Partial<Project>;
}

export const ProjectForm = ({ mode, id, prefill }: ProjectFormProps) => {
    const { data: project, isLoading: isLoadingProject } = useProject(mode === 'edit' ? id || null : null);
    const { mutate: createProject, isPending, error } = useCreateProject();
    const { mutate: updateProject } = useUpdateProject();
    const { data: dashboardData } = useDashboardInit();
    const { data: programs, isLoading: isProgramsLoading, error: programsError } = usePrograms();
    const { closeEntityDrawer, openEntityDrawer } = useUi();

    const [formData, setFormData] = useState({
        entity_name: prefill?.entity_name || '',
        owner: prefill?.owner || '',
        parent_id: prefill?.parent_id || '',
        program_id: prefill?.program_id || null,
        status: prefill?.status || dashboardData?.constants?.project?.status_default || 'todo',
        priority_flag: prefill?.priority_flag || 'medium',
        description: '',
    });

    const [formError, setFormError] = useState<string | null>(null);

    // Constants
    const statuses = dashboardData?.constants?.project?.status || ['todo', 'doing', 'hold', 'done'];
    const priorities = dashboardData?.constants?.project?.priority || ['low', 'medium', 'high', 'critical'];

    // Task filtering and grouping (UNCONDITIONAL - fix hooks violation)
    // Use memoized taskStatuses to fix memoization ineffectiveness
    const taskStatuses = useMemo(() =>
        dashboardData?.constants?.task_status || ['todo', 'doing', 'hold', 'done', 'blocked'],
        [dashboardData?.constants?.task_status]
    );

    const projectTasks = useMemo(() => {
        if (!dashboardData?.tasks || !id) return [];
        return dashboardData.tasks.filter((t: any) => t.project_id === id);
    }, [dashboardData?.tasks, id]);

    const tasksByStatus = useMemo(() => {
        const groups: Record<string, any[]> = {};
        taskStatuses.forEach((s: string) => { groups[s] = []; });

        projectTasks.forEach((t: any) => {
            const status = t.status || 'todo';
            if (groups[status]) {
                groups[status].push(t);
            }
        });

        // Sort within groups: priority (high→low), then name
        const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        Object.keys(groups).forEach(status => {
            groups[status].sort((a, b) => {
                const aPrio = priorityOrder[a.priority] ?? 2;
                const bPrio = priorityOrder[b.priority] ?? 2;
                if (aPrio !== bPrio) return aPrio - bPrio;
                return a.entity_name.localeCompare(b.entity_name);
            });
        });

        return groups;
    }, [projectTasks, taskStatuses]);

    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    // Reset expanded state when project OR taskStatuses changes (fix stale state)
    useEffect(() => {
        if (id && taskStatuses.length > 0) {
            const initial: Record<string, boolean> = {};
            taskStatuses.forEach((s: string, i: number) => {
                initial[s] = i < 2; // First 2 statuses expanded by default
            });
            setExpandedGroups(initial);
        }
    }, [id, taskStatuses]);

    // Member options (for owner ChipSelectExpand)
    // ProjectForm uses m.id (unlike TaskForm which uses m.name)
    // Filter: active members only, exclude role="Unassigned" (미정)
    const memberOptions: ChipOption[] = useMemo(() => {
        return (dashboardData?.members || [])
            .filter((m: any) => m.active !== false && m.role !== 'Unassigned')
            .map((m: any) => ({
                value: m.id, // ProjectForm uses m.id
                label: m.name,
                color: memberColor,
            }));
    }, [dashboardData?.members]);

    const coreMemberOptions: ChipOption[] = useMemo(() => {
        return memberOptions.filter(opt => {
            const member = dashboardData?.members?.find((m: any) => m.id === opt.value);
            return member && CORE_ROLES.includes(member.role);
        });
    }, [memberOptions, dashboardData?.members]);

    useEffect(() => {
        if (dashboardData?.constants?.project?.status_default && !prefill?.status) {
            setFormData(prev => ({
                ...prev,
                status: dashboardData.constants.project.status_default
            }));
        }
    }, [dashboardData, prefill]);

    // View mode - show project details read-only
    if (mode === 'view' && id) {
        const project: any = dashboardData?.projects?.find((p: any) => p.entity_id === id);
        const track = project?.parent_id
            ? dashboardData?.tracks?.find((t: any) => t.entity_id === project.parent_id)
            : null;
        const program = project?.program_id
            ? programs?.find((p) => p.entity_id === project.program_id)
            : null;

        if (!project) {
            return (
                <div className="p-6 text-center text-zinc-500">
                    <p>Project not found: {id}</p>
                </div>
            );
        }

        return (
            <div className="flex-1 overflow-y-auto">
                <div className="px-6 pt-4 pb-2">
                    <span className="font-mono text-xs text-zinc-400 px-2 py-1 bg-zinc-50 rounded">
                        {project.entity_id}
                    </span>
                </div>

                <div className="px-6 pb-4">
                    <h2 className="text-xl font-bold text-zinc-900">{project.entity_name}</h2>
                </div>

                <div className="px-6 py-4 grid grid-cols-[100px_1fr] gap-y-3 gap-x-4 text-sm">
                    <label className="text-zinc-500 py-1">Status</label>
                    <span className="inline-block px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-700 w-fit capitalize">
                        {project.status}
                    </span>

                    <label className="text-zinc-500 py-1">Owner</label>
                    <span className="text-zinc-700">{project.owner || '-'}</span>

                    <label className="text-zinc-500 py-1">Priority</label>
                    <span className="inline-block px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-700 w-fit capitalize">
                        {project.priority_flag || 'medium'}
                    </span>

                    {track && (
                        <>
                            <label className="text-zinc-500 py-1">Track</label>
                            <span className="inline-block px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-700 w-fit">
                                {track.entity_name}
                            </span>
                        </>
                    )}

                    {project.program_id && (
                        <>
                            <label className="text-zinc-500 py-1">Program</label>
                            <span className="inline-block px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-700 w-fit">
                                {program?.entity_name || project.program_id}
                            </span>
                        </>
                    )}

                    {project.hypothesis_text && (
                        <>
                            <label className="text-zinc-500 py-1">Hypothesis</label>
                            <p className="text-zinc-700 text-sm">{project.hypothesis_text}</p>
                        </>
                    )}
                </div>

                {project.expected_impact?.statement && (
                    <>
                        <div className="h-px bg-zinc-200 mx-6 my-2" />
                        <div className="px-6 py-4">
                            <h3 className="text-sm font-semibold text-zinc-500 mb-2">Expected Impact</h3>
                            <p className="text-zinc-700 text-sm">{project.expected_impact.statement}</p>
                            {project.expected_impact.metric && (
                                <p className="text-zinc-500 text-xs mt-1">Metric: {project.expected_impact.metric}</p>
                            )}
                            {project.expected_impact.target && (
                                <p className="text-zinc-500 text-xs">Target: {project.expected_impact.target}</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    }

    // Helper functions for Tasks section (UNCONDITIONAL - fix hooks violation)
    const toggleGroup = (status: string) => {
        setExpandedGroups(prev => ({ ...prev, [status]: !prev[status] }));
    };

    const handleTaskClick = (taskId: string) => {
        openEntityDrawer({ type: 'task', mode: 'edit', id: taskId });
    };

    const getStatusIcon = (status: string) => {
        const icons: Record<string, string> = {
            doing: '●',
            todo: '○',
            hold: '◐',
            blocked: '✕',
            done: '✓'
        };
        return icons[status] || '○';
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            doing: 'text-blue-500',
            todo: 'text-zinc-400',
            hold: 'text-amber-500',
            blocked: 'text-red-500',
            done: 'text-green-500'
        };
        return colors[status] || 'text-zinc-400';
    };

    // Edit mode - show editable project details
    if (mode === 'edit') {
        if (isLoadingProject || !project) {
            return (
                <div className="flex-1 flex items-center justify-center text-zinc-500">
                    {isLoadingProject ? 'Loading...' : 'Project not found'}
                </div>
            );
        }

        const handleUpdate = (field: keyof Project, value: any) => {
            if (!id) return;
            updateProject({ id, data: { [field]: value } });
        };

        const copyId = () => {
            if (id) {
                navigator.clipboard.writeText(id);
            }
        };

        return (
            <div className="flex-1 overflow-y-auto">
                {/* ID Badge */}
                <div className="px-6 pt-4 pb-2">
                    <span
                        className="font-mono text-xs text-zinc-400 cursor-pointer hover:text-zinc-900 px-2 py-1 bg-zinc-50 rounded transition-colors"
                        onClick={copyId}
                        title="Click to copy ID"
                    >
                        {id}
                    </span>
                </div>

                {/* Title Section */}
                <div className="px-6 pb-2">
                    <input
                        className="w-full text-xl font-bold bg-transparent border-none focus:ring-0 p-0 placeholder-zinc-400 text-zinc-900"
                        placeholder="Project Title"
                        defaultValue={project.entity_name}
                        onBlur={(e) => handleUpdate('entity_name', e.target.value)}
                    />
                </div>

                {/* Properties Grid */}
                <div className="px-6 py-4 grid grid-cols-[100px_1fr] gap-y-3 gap-x-4 text-sm">
                    {/* Status */}
                    <label className="text-zinc-500 py-1">Status</label>
                    <select
                        className="border border-zinc-200 p-1 rounded bg-white text-zinc-700 text-sm w-fit focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none shadow-sm"
                        value={project.status}
                        onChange={(e) => handleUpdate('status', e.target.value)}
                    >
                        {statuses.map((s: string) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>

                    {/* Owner */}
                    <label className="text-zinc-500 py-1">Owner</label>
                    <div className="py-1">
                        <ChipSelectExpand
                            primaryOptions={coreMemberOptions}
                            allOptions={memberOptions}
                            value={project.owner || ''}
                            onChange={(value) => handleUpdate('owner', value)}
                            allowUnassigned
                            aria-label="Project owner"
                        />
                    </div>

                    {/* Priority */}
                    <label className="text-zinc-500 py-1">Priority</label>
                    <select
                        className="border border-zinc-200 p-1 rounded bg-white text-zinc-700 text-sm w-fit focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none shadow-sm"
                        value={project.priority_flag || 'medium'}
                        onChange={(e) => handleUpdate('priority_flag', e.target.value)}
                    >
                        {priorities.map((p: string) => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>

                    {/* Track */}
                    <label className="text-zinc-500 py-1">Track</label>
                    <select
                        className="border border-zinc-200 p-1 rounded bg-white text-zinc-700 text-sm w-full truncate focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none shadow-sm"
                        value={project.parent_id}
                        onChange={(e) => handleUpdate('parent_id', e.target.value)}
                    >
                        <option value="">No Track</option>
                        {dashboardData?.tracks?.map((t: any) => (
                            <option key={t.entity_id} value={t.entity_id}>
                                {t.entity_name || t.entity_id}
                            </option>
                        ))}
                    </select>

                    {/* Program */}
                    <label className="text-zinc-500 py-1">Program</label>
                    <select
                        className="border border-zinc-200 p-1 rounded bg-white text-zinc-700 text-sm w-full truncate focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none shadow-sm"
                        value={project.program_id || ''}
                        onChange={(e) => handleUpdate('program_id', e.target.value || null)}
                        disabled={isProgramsLoading}
                    >
                        <option value="">No Program</option>
                        {isProgramsLoading ? (
                            <option disabled>Loading programs...</option>
                        ) : programsError ? (
                            <option disabled>Error loading programs</option>
                        ) : (
                            programs?.map((p) => (
                                <option key={p.entity_id} value={p.entity_id}>
                                    {p.entity_name}
                                </option>
                            ))
                        )}
                    </select>

                    {/* Relations - Track (clickable) */}
                    {project.parent_id && (() => {
                        const track = dashboardData?.tracks?.find((t: any) => t.entity_id === project.parent_id);
                        return track ? (
                            <>
                                <label className="text-zinc-500 py-1">Track Link</label>
                                <span
                                    className="inline-block px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-700 w-fit cursor-pointer hover:bg-zinc-100 hover:border-zinc-300 transition-colors"
                                    onClick={() => openEntityDrawer({ type: 'track', mode: 'view', id: project.parent_id! })}
                                >
                                    {track.entity_name}
                                </span>
                            </>
                        ) : null;
                    })()}
                </div>

                {/* Tasks Section */}
                <div className="h-px bg-zinc-200 mx-6 my-2" />
                <div className="px-6 py-4">
                    <h3 className="text-sm font-semibold text-zinc-500 mb-3">
                        Tasks ({projectTasks.length})
                    </h3>

                    {projectTasks.length === 0 ? (
                        <p className="text-zinc-400 text-sm">No tasks in this project</p>
                    ) : (
                        <div className="space-y-2">
                            {taskStatuses.map((status: string) => {
                                const tasks = tasksByStatus[status] || [];
                                if (tasks.length === 0) return null;

                                return (
                                    <div key={status} className="border border-zinc-200 rounded-lg overflow-hidden">
                                        {/* Group Header */}
                                        <button
                                            type="button"
                                            onClick={() => toggleGroup(status)}
                                            className="w-full px-3 py-2 bg-zinc-50 hover:bg-zinc-100 transition-colors flex items-center justify-between text-sm font-medium text-zinc-700"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`text-base ${getStatusColor(status)}`}>
                                                    {expandedGroups[status] ? '▾' : '▸'}
                                                </span>
                                                <span className={`${getStatusColor(status)}`}>
                                                    {getStatusIcon(status)}
                                                </span>
                                                <span className="capitalize">{status}</span>
                                                <span className="text-zinc-400">({tasks.length})</span>
                                            </div>
                                        </button>

                                        {/* Task List */}
                                        {expandedGroups[status] && (
                                            <div className="divide-y divide-zinc-100">
                                                {tasks.map((task: any) => (
                                                    <div
                                                        key={task.entity_id}
                                                        onClick={() => handleTaskClick(task.entity_id)}
                                                        className="px-3 py-2 hover:bg-zinc-50 cursor-pointer transition-colors group"
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm text-zinc-900 group-hover:text-blue-600 transition-colors truncate">
                                                                    {task.entity_name}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    {task.assignee && (
                                                                        <span className="text-xs text-zinc-500">
                                                                            @{task.assignee}
                                                                        </span>
                                                                    )}
                                                                    {task.priority && (
                                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                                            task.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                                                            task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                                                            task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                                                                            'bg-zinc-100 text-zinc-600'
                                                                        }`}>
                                                                            {task.priority}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="h-px bg-zinc-200 mx-6 my-2" />

                {/* Hypothesis Text Section */}
                <div className="px-6 py-4 flex-1 flex flex-col">
                    <h3 className="text-sm font-semibold text-zinc-500 mb-2">Hypothesis</h3>
                    <textarea
                        className="w-full min-h-[100px] border border-zinc-200 p-3 rounded bg-white text-sm leading-relaxed focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none text-zinc-800"
                        defaultValue={(project as any).hypothesis_text || ''}
                        onBlur={(e) => handleUpdate('hypothesis_text' as keyof Project, e.target.value)}
                        placeholder="Enter project hypothesis..."
                    />
                </div>

                {/* Body/Description Editor */}
                <div className="h-px bg-zinc-200 mx-6 my-2" />
                <div className="px-6 py-4 flex-1 flex flex-col">
                    <h3 className="text-sm font-semibold text-zinc-500 mb-2">Description</h3>
                    <MarkdownEditor
                        value={(project as any)._body || ''}
                        onChange={(markdown) => handleUpdate('body' as keyof Project, markdown)}
                        minHeight="200px"
                        placeholder="프로젝트 설명을 작성하세요..."
                    />
                </div>
            </div>
        );
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        // Validation
        if (!formData.entity_name.trim()) {
            setFormError('Project name is required');
            return;
        }
        if (!formData.owner) {
            setFormError('Owner is required');
            return;
        }

        createProject(
            {
                ...formData,
                parent_id: formData.parent_id || undefined,
                program_id: formData.program_id || undefined
            },
            {
                onSuccess: () => {
                    closeEntityDrawer();
                },
                onError: (err: any) => {
                    setFormError(err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to create project');
                }
            }
        );
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Error Message */}
                {(formError || error) && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200">
                        {formError || (error as any)?.message}
                    </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700">Project Name *</label>
                    <input
                        type="text"
                        autoFocus
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder-zinc-400"
                        placeholder="Enter project name"
                        value={formData.entity_name}
                        onChange={e => setFormData(prev => ({ ...prev, entity_name: e.target.value }))}
                    />
                </div>

                {/* Owner */}
                <div className="space-y-1.5">
                    <ChipSelectExpand
                        primaryOptions={coreMemberOptions}
                        allOptions={memberOptions}
                        value={formData.owner}
                        onChange={(value) => setFormData(prev => ({ ...prev, owner: value }))}
                        allowUnassigned
                        label="Owner *"
                    />
                </div>

                {/* Track */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700">Track (Optional)</label>
                    <select
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        value={formData.parent_id}
                        onChange={e => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                    >
                        <option value="">None</option>
                        {dashboardData?.tracks?.map((t: any) => (
                            <option key={t.entity_id} value={t.entity_id}>{t.entity_name}</option>
                        ))}
                    </select>
                </div>

                {/* Program */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700">Program (Optional)</label>
                    <select
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        value={formData.program_id || ''}
                        onChange={e => setFormData(prev => ({ ...prev, program_id: e.target.value || null }))}
                        disabled={isProgramsLoading}
                    >
                        <option value="">None</option>
                        {isProgramsLoading ? (
                            <option disabled>Loading programs...</option>
                        ) : programsError ? (
                            <option disabled>Error loading programs</option>
                        ) : (
                            programs?.map((p) => (
                                <option key={p.entity_id} value={p.entity_id}>
                                    {p.entity_name}
                                </option>
                            ))
                        )}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Status */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-zinc-700">Status</label>
                        <select
                            className="w-full px-3 py-2 bg-white border border-zinc-300 rounded text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none capitalize"
                            value={formData.status}
                            onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        >
                            {statuses.map((s: string) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    {/* Priority */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-zinc-700">Priority</label>
                        <select
                            className="w-full px-3 py-2 bg-white border border-zinc-300 rounded text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none capitalize"
                            value={formData.priority_flag}
                            onChange={e => setFormData(prev => ({ ...prev, priority_flag: e.target.value }))}
                        >
                            {priorities.map((p: string) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700">Description (Optional)</label>
                    <textarea
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder-zinc-400 min-h-[80px]"
                        placeholder="Optional description"
                        value={formData.description}
                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-4 border-t border-zinc-200 flex justify-end gap-3 bg-zinc-50">
                <button
                    type="button"
                    onClick={closeEntityDrawer}
                    className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isPending}
                    className="px-3 py-1.5 text-xs font-semibold !bg-[#f0f9ff] hover:!bg-[#e0f2fe] !text-[#082f49] border border-[#bae6fd] rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? 'Creating...' : 'Create Project'}
                </button>
            </div>
        </form>
    );
};
