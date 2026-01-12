import { useState, useEffect, useMemo } from 'react';
import { useProject, useCreateProject, useUpdateProject, usePrograms } from '../queries';
import { useDashboardInit } from '@/queries/useDashboardInit';
import { useUi } from '@/contexts/UiContext';
import { ChipSelect, type ChipOption } from '@/components/common/ChipSelect';
import { ChipSelectExpand } from '@/components/common/ChipSelectExpand';
import { EntityChip } from '@/components/common/entity';
import { statusColors, priorityColors, memberColor, trackColor, programColor, getColor } from '@/components/common/chipColors';
import { CORE_ROLES } from '@/features/tasks/selectors';
import type { Project, ExpectedImpact, TrackContribution, RealizedImpact } from '@/types';
import { MarkdownEditor } from '@/components/MarkdownEditor/MarkdownEditor';
import { ReviewFieldWrapper } from '@/components/common/ReviewFieldWrapper';
import { useReviewMode } from '@/hooks/useReviewMode';
import { ImpactSection } from '@/features/impact/components/ImpactSection';
import { TrackContributionEditor } from '@/features/impact/components/TrackContributionEditor';
import { HypothesisSelector } from '@/features/impact/components/HypothesisSelector';

interface ProjectFormProps {
    mode: 'create' | 'edit' | 'view' | 'review';
    id?: string;
    prefill?: Partial<Project>;
    // Review mode props (optional, only used when mode='review')
    suggestedFields?: Record<string, unknown>;
    reasoning?: Record<string, string>;
    onRelationClick?: (id: string, type: string) => void;
    onFieldChange?: (field: string, value: unknown) => void;
}

export const ProjectForm = ({ mode, id, prefill, suggestedFields, reasoning, onFieldChange }: ProjectFormProps) => {
    const isReadOnly = mode === 'view';
    const isReviewMode = mode === 'review';
    const { data: project, isLoading: isLoadingProject } = useProject(mode === 'edit' || mode === 'view' || mode === 'review' ? id || null : null);

    // Review mode hook (always called, but only active when mode='review')
    const reviewMode = useReviewMode({
        enabled: isReviewMode,
        entityData: project as Record<string, unknown> | null | undefined,
        suggestedFields,
        reasoning,
    });
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
    const priorities = dashboardData?.constants?.priority?.values || ['low', 'medium', 'high', 'critical'];

    // Task filtering and grouping (UNCONDITIONAL - fix hooks violation)
    // Use memoized taskStatuses to fix memoization ineffectiveness
    const taskStatuses = useMemo(() =>
        dashboardData?.constants?.task?.status || ['todo', 'doing', 'hold', 'done', 'blocked'],
        [dashboardData?.constants?.task?.status]
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

    // Status options (for ChipSelect)
    const statusOptions: ChipOption[] = useMemo(() =>
        statuses.map((s: string) => ({
            value: s,
            label: s.charAt(0).toUpperCase() + s.slice(1),
            color: getColor(s, statusColors),
        })), [statuses]);

    // Priority options (for ChipSelect)
    const priorityOptions: ChipOption[] = useMemo(() =>
        priorities.map((p: string) => ({
            value: p,
            label: p.charAt(0).toUpperCase() + p.slice(1),
            color: getColor(p, priorityColors),
        })), [priorities]);

    // Track options (for ChipSelectExpand)
    const trackOptions: ChipOption[] = useMemo(() =>
        (dashboardData?.tracks || []).map((t: any) => ({
            value: t.entity_id,
            label: t.entity_name || t.entity_id,
            color: trackColor,
        })), [dashboardData?.tracks]);

    // Program options (for ChipSelectExpand)
    const programOptions: ChipOption[] = useMemo(() =>
        (programs || []).map((p: any) => ({
            value: p.entity_id,
            label: p.entity_name,
            color: programColor,
        })), [programs]);

    useEffect(() => {
        if (dashboardData?.constants?.project?.status_default && !prefill?.status) {
            setFormData(prev => ({
                ...prev,
                status: dashboardData.constants.project.status_default
            }));
        }
    }, [dashboardData, prefill]);

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

    // Edit/View mode - show project details (editable or read-only)
    if (mode !== 'create') {
        if (isLoadingProject || !project) {
            return (
                <div className="flex-1 flex items-center justify-center text-zinc-500">
                    {isLoadingProject ? 'Loading...' : 'Project not found'}
                </div>
            );
        }

        // Helper: Handle field change (review mode calls onFieldChange + reviewMode.setFieldValue)
        const handleFieldChange = (field: keyof Project, value: any) => {
            if (isReviewMode) {
                onFieldChange?.(field, value);
                reviewMode?.setFieldValue(field, value);
            } else {
                // edit mode: direct update
                if (!id) return;
                updateProject({ id, data: { [field]: value } });
            }
        };

        // Helper: Get field value (review mode uses reviewMode.getFieldValue, others use project directly)
        const getFieldValue = (field: keyof Project) => {
            if (isReviewMode && reviewMode) {
                return reviewMode.getFieldValue(field);
            }
            return project?.[field];
        };

        // Helper: Combine individual reasonings for expected_impact
        // API returns reasoning like {tier: "...", impact_magnitude: "...", summary: "..."}
        // We combine them into a single string for display
        const getExpectedImpactReasoning = (): string | undefined => {
            if (!isReviewMode || !reasoning) return undefined;

            const parts: string[] = [];

            // summary is the main reasoning (if available)
            if (reasoning.summary) {
                parts.push(reasoning.summary);
            }

            // Add individual field reasonings if no summary
            if (parts.length === 0) {
                if (reasoning.tier) parts.push(`Tier: ${reasoning.tier}`);
                if (reasoning.impact_magnitude) parts.push(`Magnitude: ${reasoning.impact_magnitude}`);
                if (reasoning.confidence) parts.push(`Confidence: ${reasoning.confidence}`);
            }

            return parts.length > 0 ? parts.join(' ') : undefined;
        };

        // Helper: Get track/hypothesis reasoning
        const getTrackContributesReasoning = (): string | undefined => {
            if (!isReviewMode || !reasoning) return undefined;
            return reasoning.contributes || reasoning.track_contributes;
        };

        const getValidatesReasoning = (): string | undefined => {
            if (!isReviewMode || !reasoning) return undefined;
            return reasoning.validates || reasoning.primary_hypothesis_id;
        };



        return (
            <div className="flex-1 overflow-y-auto">
                {/* Title Section */}
                <div className="px-6 pb-2">
                    {isReadOnly ? (
                        <h2 className="text-xl font-bold text-zinc-900">{project.entity_name}</h2>
                    ) : (
                        <input
                            className="w-full text-xl font-bold bg-transparent border-none focus:ring-0 p-0 placeholder-zinc-400 text-zinc-900"
                            placeholder="Project Title"
                            defaultValue={getFieldValue('entity_name') as string}
                            onBlur={(e) => handleFieldChange('entity_name', e.target.value)}
                        />
                    )}
                </div>

                {/* Properties Grid */}
                <div className="px-6 py-4 grid grid-cols-[100px_1fr] gap-y-3 gap-x-4 text-sm">
                    {/* Status */}
                    <label className="text-zinc-500 py-1">Status</label>
                    <ReviewFieldWrapper
                        isSuggested={Boolean(isReviewMode && reviewMode?.isSuggested('status'))}
                        reasoning={isReviewMode ? reviewMode?.getReasoning('status') : undefined}
                    >
                        {isReadOnly ? (
                            <span className="inline-block px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-700 w-fit capitalize">
                                {getFieldValue('status') as string || 'todo'}
                            </span>
                        ) : (
                            <div className="py-1">
                                <ChipSelect
                                    options={statusOptions}
                                    value={(getFieldValue('status') as string) || 'todo'}
                                    onChange={(value) => handleFieldChange('status', value)}
                                    aria-label="Project status"
                                />
                            </div>
                        )}
                    </ReviewFieldWrapper>

                    {/* Owner */}
                    <label className="text-zinc-500 py-1">Owner</label>
                    <ReviewFieldWrapper
                        isSuggested={Boolean(isReviewMode && reviewMode?.isSuggested('owner'))}
                        reasoning={isReviewMode ? reviewMode?.getReasoning('owner') : undefined}
                    >
                        {isReadOnly ? (
                            <span className="text-zinc-700 py-1">
                                {String(dashboardData?.members?.find((m: any) => m.id === getFieldValue('owner'))?.name || getFieldValue('owner') || 'Unassigned')}
                            </span>
                        ) : (
                            <div className="py-1">
                                <ChipSelectExpand
                                    primaryOptions={coreMemberOptions}
                                    allOptions={memberOptions}
                                    value={getFieldValue('owner') as string || ''}
                                    onChange={(value) => handleFieldChange('owner', value)}
                                    allowUnassigned
                                    aria-label="Project owner"
                                />
                            </div>
                        )}
                    </ReviewFieldWrapper>

                    {/* Priority */}
                    <label className="text-zinc-500 py-1">Priority</label>
                    <ReviewFieldWrapper
                        isSuggested={Boolean(isReviewMode && reviewMode?.isSuggested('priority_flag'))}
                        reasoning={isReviewMode ? reviewMode?.getReasoning('priority_flag') : undefined}
                    >
                        {isReadOnly ? (
                            <span className="inline-block px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-700 w-fit capitalize">
                                {getFieldValue('priority_flag') as string || 'medium'}
                            </span>
                        ) : (
                            <div className="py-1">
                                <ChipSelect
                                    options={priorityOptions}
                                    value={(getFieldValue('priority_flag') as string) || 'medium'}
                                    onChange={(value) => handleFieldChange('priority_flag', value)}
                                    aria-label="Project priority"
                                />
                            </div>
                        )}
                    </ReviewFieldWrapper>

                    {/* Track */}
                    <label className="text-zinc-500 py-1">Track</label>
                    {isReadOnly ? (
                        project.parent_id ? (
                            <div className="py-1">
                                <EntityChip
                                    label={dashboardData?.tracks?.find((t: any) => t.entity_id === project.parent_id)?.entity_name || project.parent_id}
                                    mode="link"
                                    color={trackColor}
                                    onNavigate={() => openEntityDrawer({ type: 'track', mode: 'view', id: project.parent_id! })}
                                />
                            </div>
                        ) : (
                            <span className="text-zinc-400 py-1">No Track</span>
                        )
                    ) : (
                        <div className="py-1">
                            <ChipSelectExpand
                                primaryOptions={trackOptions.slice(0, 4)}
                                allOptions={trackOptions}
                                value={project.parent_id || ''}
                                onChange={(value) => handleFieldChange('parent_id', value || null)}
                                allowUnassigned
                                unassignedLabel="No Track"
                                aria-label="Project track"
                            />
                        </div>
                    )}

                    {/* Program */}
                    <label className="text-zinc-500 py-1">Program</label>
                    {isReadOnly ? (
                        project.program_id ? (
                            <div className="py-1">
                                <EntityChip
                                    label={programs?.find((p) => p.entity_id === project.program_id)?.entity_name || project.program_id}
                                    color={programColor}
                                    // Programs don't have a drawer yet, but we keep the style
                                    mode="select"
                                />
                            </div>
                        ) : (
                            <span className="text-zinc-400 py-1">No Program</span>
                        )
                    ) : (
                        <div className="py-1">
                            {isProgramsLoading ? (
                                <span className="text-zinc-400 text-sm">Loading programs...</span>
                            ) : programsError ? (
                                <span className="text-red-500 text-sm">Error loading programs</span>
                            ) : (
                                <ChipSelectExpand
                                    primaryOptions={programOptions.slice(0, 4)}
                                    allOptions={programOptions}
                                    value={project.program_id || ''}
                                    onChange={(value) => handleFieldChange('program_id', value || null)}
                                    allowUnassigned
                                    unassignedLabel="No Program"
                                    aria-label="Project program"
                                />
                            )}
                        </div>
                    )}

                    {/* Impact Section (A + B) */}
                    <div className="col-span-2">
                        <ImpactSection
                            expectedImpact={getFieldValue('expected_impact') as ExpectedImpact | undefined}
                            realizedImpact={getFieldValue('realized_impact') as RealizedImpact | undefined}
                            onExpectedChange={(impact) => handleFieldChange('expected_impact', impact)}
                            onRealizedChange={(impact) => handleFieldChange('realized_impact', impact)}
                            mode={mode}
                            readonly={isReadOnly}
                            reviewMode={isReviewMode ? {
                                isSuggested: (field) => reviewMode?.isSuggested(field) ?? false,
                                getReasoning: (field) => field === 'expected_impact' ? getExpectedImpactReasoning() : undefined,
                            } : undefined}
                        />
                    </div>

                    {/* Track Contributes */}
                    <label className="text-zinc-500 py-1">Track Contributes</label>
                    <ReviewFieldWrapper
                        isSuggested={Boolean(isReviewMode && reviewMode?.isSuggested('track_contributes'))}
                        reasoning={getTrackContributesReasoning()}
                    >
                        <TrackContributionEditor
                            tracks={dashboardData?.tracks || []}
                            value={(getFieldValue('track_contributes') as TrackContribution[]) || []}
                            onChange={(contribs) => handleFieldChange('track_contributes', contribs)}
                            onTrackClick={(trackId) => openEntityDrawer({ type: 'track', mode: 'view', id: trackId })}
                            readonly={isReadOnly}
                        />
                    </ReviewFieldWrapper>

                    {/* Hypothesis Validation */}
                    <label className="text-zinc-500 py-1">Hypotheses</label>
                    <ReviewFieldWrapper
                        isSuggested={Boolean(isReviewMode && (reviewMode?.isSuggested('validates') || reviewMode?.isSuggested('primary_hypothesis_id')))}
                        reasoning={getValidatesReasoning()}
                    >
                        <HypothesisSelector
                            hypotheses={dashboardData?.hypotheses || []}
                            validates={(getFieldValue('validates') as string[]) || []}
                            primaryHypothesisId={(getFieldValue('primary_hypothesis_id') as string | null) || null}
                            onValidatesChange={(ids) => handleFieldChange('validates', ids)}
                            onPrimaryChange={(id) => handleFieldChange('primary_hypothesis_id', id)}
                            onHypothesisClick={(hypId) => openEntityDrawer({ type: 'hypothesis', mode: 'view', id: hypId })}
                            readonly={isReadOnly}
                        />
                    </ReviewFieldWrapper>
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
                                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${task.priority === 'critical' ? 'bg-red-100 text-red-700' :
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
                    {isReadOnly ? (
                        (project as any).hypothesis_text ? (
                            <p className="text-zinc-700 text-sm leading-relaxed whitespace-pre-wrap">
                                {(project as any).hypothesis_text}
                            </p>
                        ) : (
                            <p className="text-zinc-400 text-sm">No hypothesis specified</p>
                        )
                    ) : (
                        <textarea
                            className="w-full min-h-[100px] border border-zinc-200 p-3 rounded bg-white text-sm leading-relaxed focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none text-zinc-800"
                            defaultValue={(project as any).hypothesis_text || ''}
                            onBlur={(e) => handleFieldChange('hypothesis_text' as keyof Project, e.target.value)}
                            placeholder="Enter project hypothesis..."
                        />
                    )}
                </div>

                {/* Body/Description Editor */}
                <div className="h-px bg-zinc-200 mx-6 my-2" />
                <div className="px-6 py-4 flex-1 flex flex-col">
                    <h3 className="text-sm font-semibold text-zinc-500 mb-2">Description</h3>
                    <MarkdownEditor
                        value={(project as any)._body || ''}
                        onChange={(markdown) => !isReadOnly && handleFieldChange('body' as keyof Project, markdown)}
                        readOnly={isReadOnly}
                        minHeight="200px"
                        placeholder={isReadOnly ? '' : '프로젝트 설명을 작성하세요...'}
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
                    <ChipSelectExpand
                        primaryOptions={trackOptions.slice(0, 4)}
                        allOptions={trackOptions}
                        value={formData.parent_id}
                        onChange={(value) => setFormData(prev => ({ ...prev, parent_id: value }))}
                        allowUnassigned
                        unassignedLabel="None"
                        label="Track (Optional)"
                    />
                </div>

                {/* Program */}
                <div className="space-y-1.5">
                    {isProgramsLoading ? (
                        <>
                            <label className="block text-sm font-medium text-zinc-700">Program (Optional)</label>
                            <span className="text-zinc-400 text-sm">Loading programs...</span>
                        </>
                    ) : programsError ? (
                        <>
                            <label className="block text-sm font-medium text-zinc-700">Program (Optional)</label>
                            <span className="text-red-500 text-sm">Error loading programs</span>
                        </>
                    ) : (
                        <ChipSelectExpand
                            primaryOptions={programOptions.slice(0, 4)}
                            allOptions={programOptions}
                            value={formData.program_id || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, program_id: value || null }))}
                            allowUnassigned
                            unassignedLabel="None"
                            label="Program (Optional)"
                        />
                    )}
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                    <ChipSelect
                        options={statusOptions}
                        value={formData.status}
                        onChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                        label="Status"
                    />
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                    <ChipSelect
                        options={priorityOptions}
                        value={formData.priority_flag}
                        onChange={(value) => setFormData(prev => ({ ...prev, priority_flag: value }))}
                        label="Priority"
                    />
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
