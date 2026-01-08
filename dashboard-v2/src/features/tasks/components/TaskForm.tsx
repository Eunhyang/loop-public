import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { useTask, useUpdateTask, useCreateTask } from '@/features/tasks/queries';
import { useDashboardInit } from '@/queries/useDashboardInit';
import { useUi } from '@/contexts/UiContext';
import type { Task } from '@/types';
import { DatePicker } from '@/components/common/DatePicker';

interface TaskFormProps {
    mode: 'create' | 'edit';
    id?: string;
    prefill?: Partial<Task>;
}

export interface TaskFormHandle {
    saveNotes: () => void;
}

export const TaskForm = forwardRef<TaskFormHandle, TaskFormProps>(({ mode, id, prefill }, ref) => {
    const { data: task, isLoading } = useTask(mode === 'edit' ? id || null : null);
    const { mutate: updateTask } = useUpdateTask();
    const { mutate: createTask, isPending, error } = useCreateTask();
    const { data: dashboardData } = useDashboardInit();
    const { closeEntityDrawer } = useUi();

    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const notesRef = useRef<HTMLTextAreaElement>(null);

    // Create mode state
    const [formData, setFormData] = useState({
        entity_name: prefill?.entity_name || '',
        project_id: prefill?.project_id || '',
        assignee: prefill?.assignee || '',
        status: prefill?.status || dashboardData?.constants?.task?.status_default || 'todo',
        priority: prefill?.priority || 'medium',
        type: prefill?.type || '',
        start_date: prefill?.start_date || '',
        due: prefill?.due || '',
    });

    const [formError, setFormError] = useState<string | null>(null);

    // Sync status default when dashboardData loads
    useEffect(() => {
        if (mode === 'create' && dashboardData?.constants?.task?.status_default && !prefill?.status) {
            setFormData(prev => ({
                ...prev,
                status: dashboardData.constants.task.status_default
            }));
        }
    }, [mode, dashboardData, prefill]);

    // For edit mode, use task data; for create mode, use formData
    const displayData = mode === 'edit' ? task : (formData as any);

    // Expose saveNotes method via ref
    useImperativeHandle(ref, () => ({
        saveNotes: () => {
            if (isEditingNotes && notesRef.current && id) {
                updateTask({ id, data: { notes: notesRef.current.value } });
            }
        }
    }));

    if (mode === 'edit' && (isLoading || !task)) {
        return <div className="flex-1 flex items-center justify-center text-zinc-500">Loading...</div>;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        // Validation
        if (!formData.entity_name.trim()) {
            setFormError('Task name is required');
            return;
        }
        if (!formData.project_id) {
            setFormError('Project is required');
            return;
        }
        if (!formData.assignee) {
            setFormError('Assignee is required');
            return;
        }

        // Client-side format validation (backend will also validate)
        if (!formData.entity_name.includes(' - ')) {
            setFormError('Task name must follow format: "주제 - 내용"');
            return;
        }

        createTask(
            formData,
            {
                onSuccess: () => {
                    closeEntityDrawer();
                },
                onError: (err: any) => {
                    setFormError(err.response?.data?.message || err.message || 'Failed to create task');
                }
            }
        );
    };

    const handleUpdate = (field: keyof Task, value: any) => {
        if (!id) return;
        updateTask({ id, data: { [field]: value } });
    };

    const copyId = () => {
        if (id) {
            navigator.clipboard.writeText(id);
        }
    };

    const copyShareLink = () => {
        if (id) {
            const shareLink = `${window.location.origin}/tasks/${id}`;
            navigator.clipboard.writeText(shareLink);
        }
    };

    const renderMarkdown = (text: string): string => {
        if (!text) return '';

        return text
            .replace(/^### (.*$)/gim, '<h3 class="text-base font-bold mt-4 mb-2">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold mt-5 mb-2">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mt-6 mb-3">$1</h1>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold">$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-blue-600 hover:underline" target="_blank">$1</a>')
            .replace(/\n/gim, '<br/>');
    };

    if (mode === 'create') {
        return (
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Error Message */}
                    {(formError || error) && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200">
                            {formError || (error as any)?.message}
                        </div>
                    )}

                    {/* Task Name */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-zinc-700">Task Name *</label>
                        <input
                            type="text"
                            autoFocus
                            className="w-full px-3 py-2 bg-white border border-zinc-300 rounded text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder-zinc-400"
                            placeholder='Format: "주제 - 내용"'
                            value={formData.entity_name}
                            onChange={e => setFormData(prev => ({ ...prev, entity_name: e.target.value }))}
                        />
                    </div>

                    {/* Project */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-zinc-700">Project *</label>
                        <select
                            className="w-full px-3 py-2 bg-white border border-zinc-300 rounded text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            value={formData.project_id}
                            onChange={e => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                        >
                            <option value="">-- Select Project --</option>
                            {dashboardData?.projects?.map((p: any) => (
                                <option key={p.entity_id} value={p.entity_id}>
                                    {p.entity_name || p.entity_id}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Assignee */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-zinc-700">Assignee *</label>
                        <select
                            className="w-full px-3 py-2 bg-white border border-zinc-300 rounded text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            value={formData.assignee}
                            onChange={e => setFormData(prev => ({ ...prev, assignee: e.target.value }))}
                        >
                            <option value="">-- Select Assignee --</option>
                            {dashboardData?.members?.map((m: any) => (
                                <option key={m.id} value={m.name}>{m.name}</option>
                            ))}
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
                                <option value="todo">Todo</option>
                                <option value="doing">Doing</option>
                                <option value="hold">Hold</option>
                                <option value="blocked">Blocked</option>
                                <option value="done">Done</option>
                            </select>
                        </div>

                        {/* Priority */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-zinc-700">Priority</label>
                            <select
                                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none capitalize"
                                value={formData.priority}
                                onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                            >
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                    </div>

                    {/* Task Type Chips */}
                    {dashboardData?.constants?.task?.types && (
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-zinc-700">Type</label>
                            <div className="flex flex-wrap gap-2">
                                {dashboardData.constants.task.types.map((type: string) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, type }))}
                                        className={`px-3 py-1 text-xs rounded-full transition-all ${
                                            formData.type === type
                                                ? 'bg-zinc-900 text-white shadow-sm'
                                                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {/* Start Date */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-zinc-700">Start Date</label>
                            <DatePicker
                                value={formData.start_date || null}
                                onChange={(value) => setFormData(prev => ({ ...prev, start_date: value || '' }))}
                            />
                        </div>

                        {/* Due Date */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-zinc-700">Due Date</label>
                            <DatePicker
                                value={formData.due || null}
                                onChange={(value) => setFormData(prev => ({ ...prev, due: value || '' }))}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-200 flex justify-end gap-3 bg-zinc-50">
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
                        className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? 'Creating...' : 'Create Task'}
                    </button>
                </div>
            </form>
        );
    }

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
                <button
                    onClick={copyShareLink}
                    className="ml-2 text-xs text-zinc-400 hover:text-zinc-900 transition-colors"
                    title="Copy share link"
                >
                    🔗 Share
                </button>
            </div>

            {/* Title Section */}
            <div className="px-6 pb-2">
                <input
                    className="w-full text-xl font-bold bg-transparent border-none focus:ring-0 p-0 placeholder-zinc-400 text-zinc-900"
                    placeholder="Task Title"
                    defaultValue={displayData?.entity_name}
                    onBlur={(e) => handleUpdate('entity_name', e.target.value)}
                />
            </div>

            {/* Task Type Chips */}
            {dashboardData?.constants?.task?.types && (
                <div className="px-6 pb-4 flex flex-wrap gap-2">
                    {dashboardData.constants.task.types.map((type: string) => (
                        <button
                            key={type}
                            onClick={() => handleUpdate('type', type)}
                            className={`px-3 py-1 text-xs rounded-full transition-all ${
                                displayData?.type === type
                                    ? 'bg-zinc-900 text-white shadow-sm'
                                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            )}

            {/* Properties Grid */}
            <div className="px-6 py-4 grid grid-cols-[100px_1fr] gap-y-3 gap-x-4 text-sm">
                {/* Status */}
                <label className="text-zinc-500 py-1">Status</label>
                <select
                    className="border border-zinc-200 p-1 rounded bg-white text-zinc-700 text-sm w-fit focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none shadow-sm"
                    value={displayData?.status}
                    onChange={(e) => handleUpdate('status', e.target.value)}
                >
                    <option value="todo">To Do</option>
                    <option value="doing">Doing</option>
                    <option value="hold">Hold</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                </select>

                {/* Priority */}
                <label className="text-zinc-500 py-1">Priority</label>
                <select
                    className="border border-zinc-200 p-1 rounded bg-white text-zinc-700 text-sm w-fit focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none shadow-sm"
                    value={displayData?.priority}
                    onChange={(e) => handleUpdate('priority', e.target.value)}
                >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>

                {/* Assignee */}
                <label className="text-zinc-500 py-1">Assignee</label>
                <select
                    className="border border-zinc-200 p-1 rounded bg-white text-zinc-700 text-sm w-fit focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none shadow-sm"
                    value={displayData?.assignee}
                    onChange={(e) => handleUpdate('assignee', e.target.value)}
                >
                    <option value="">Unassigned</option>
                    {dashboardData?.members?.map((m: any) => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                </select>

                {/* Project */}
                <label className="text-zinc-500 py-1">Project</label>
                <select
                    className="border border-zinc-200 p-1 rounded bg-white text-zinc-700 text-sm w-full truncate focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none shadow-sm"
                    value={displayData?.project_id}
                    onChange={(e) => handleUpdate('project_id', e.target.value)}
                >
                    <option value="">No Project</option>
                    {dashboardData?.projects?.map((p: any) => (
                        <option key={p.entity_id} value={p.entity_id}>
                            {p.entity_name || p.entity_id}
                        </option>
                    ))}
                </select>

                {/* Date Fields */}
                <label className="text-zinc-500 py-1">Start Date</label>
                <div className="w-fit">
                    <DatePicker
                        value={displayData?.start_date || null}
                        onChange={(value) => handleUpdate('start_date', value || '')}
                        compact={true}
                    />
                </div>

                <label className="text-zinc-500 py-1">Due Date</label>
                <div className="w-fit">
                    <DatePicker
                        value={displayData?.due || null}
                        onChange={(value) => handleUpdate('due', value || '')}
                        compact={true}
                    />
                </div>

                {/* Track (via Project) */}
                {displayData?.project_id && dashboardData?.projects && (() => {
                    const project = dashboardData.projects.find((p: any) => p.entity_id === displayData.project_id);
                    const trackId = project?.parent_id;
                    const track = trackId ? dashboardData.tracks?.find((t: any) => t.entity_id === trackId) : null;
                    return track ? (
                        <>
                            <label className="text-zinc-500 py-1">Track</label>
                            <span className="inline-block px-2 py-1 bg-zinc-100 border border-zinc-200 rounded text-xs text-zinc-700 w-fit">
                                {track.entity_name}
                            </span>
                        </>
                    ) : null;
                })()}

                {/* Conditions */}
                {mode === 'edit' && displayData?.conditions_3y && displayData.conditions_3y.length > 0 && (
                    <>
                        <label className="text-zinc-500 py-1">Conditions</label>
                        <div className="flex flex-wrap gap-1">
                            {displayData.conditions_3y.map((condId: string) => {
                                const condition = dashboardData?.conditions?.find((c: any) => c.entity_id === condId);
                                return (
                                    <span key={condId} className="inline-block px-2 py-1 bg-zinc-100 border border-zinc-200 rounded text-xs text-zinc-700">
                                        {condition?.entity_name || condId}
                                    </span>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Validates */}
                {mode === 'edit' && displayData?.validates && displayData.validates.length > 0 && (
                    <>
                        <label className="text-zinc-500 py-1">Validates</label>
                        <div className="flex flex-wrap gap-1">
                            {displayData.validates.map((hypId: string) => {
                                const hypothesis = dashboardData?.hypotheses?.find((h: any) => h.entity_id === hypId);
                                return (
                                    <span key={hypId} className="inline-block px-2 py-1 bg-zinc-100 border border-zinc-200 rounded text-xs text-zinc-700">
                                        {hypothesis?.entity_name || hypId}
                                    </span>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Links */}
                {mode === 'edit' && displayData?.links && displayData.links.length > 0 && (
                    <>
                        <label className="text-zinc-500 py-1">Links</label>
                        <div className="space-y-1">
                            {displayData.links.map((link: any, idx: number) => (
                                <a
                                    key={idx}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-xs text-blue-600 hover:underline"
                                >
                                    {link.label || link.url}
                                </a>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="h-px bg-zinc-200 mx-6 my-2" />

            {/* Notes Section */}
            <div className="px-6 py-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-zinc-500">Notes</h3>
                    <button
                        onClick={() => setIsEditingNotes(!isEditingNotes)}
                        className="text-xs px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded transition-colors"
                    >
                        {isEditingNotes ? 'Preview' : 'Edit'}
                    </button>
                </div>

                {isEditingNotes ? (
                    <textarea
                        ref={notesRef}
                        className="w-full min-h-[200px] border border-zinc-200 p-3 rounded bg-white text-sm font-mono leading-relaxed focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none text-zinc-800"
                        defaultValue={displayData?.notes || ''}
                    />
                ) : (
                    <div className="prose prose-sm max-w-none text-zinc-800">
                        {mode === 'edit' && displayData?.notes ? (
                            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(displayData.notes) }} />
                        ) : (
                            <span className="text-zinc-400 italic">No notes</span>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
});
