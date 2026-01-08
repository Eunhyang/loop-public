import { useEffect, useState, useRef } from 'react';
import { useTask, useUpdateTask, useDeleteTask } from '@/features/tasks/queries';
import { useDashboardInit } from '@/queries/useDashboardInit';
import type { Task } from '@/types';

interface TaskDrawerProps {
    taskId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export const TaskDrawer = ({ taskId, isOpen, onClose }: TaskDrawerProps) => {
    const { data: task, isLoading } = useTask(taskId);
    const { mutate: updateTask } = useUpdateTask();
    const { mutate: deleteTask } = useDeleteTask();
    const { data: dashboardData } = useDashboardInit();

    // Local state for form fields to handle inputs before saving or debouncing
    // For this V1, let's trigger updates on blur or change for selects

    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const notesRef = useRef<HTMLTextAreaElement>(null);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleUpdate = (field: keyof Task, value: any) => {
        if (!taskId) return;
        updateTask({ id: taskId, data: { [field]: value } });
    };

    const copyId = () => {
        if (taskId) {
            navigator.clipboard.writeText(taskId);
            // TODO: Toast notification
        }
    };

    const copyShareLink = () => {
        if (taskId) {
            const shareLink = `${window.location.origin}/tasks/${taskId}`;
            navigator.clipboard.writeText(shareLink);
            // TODO: Toast notification
        }
    };

    const handleDelete = () => {
        if (!taskId) return;
        if (window.confirm(`Are you sure you want to delete task ${taskId}?`)) {
            deleteTask(taskId, {
                onSuccess: () => {
                    onClose();
                }
            });
        }
    };

    // Helper to open Obsidian URI
    const openObsidian = () => {
        // This assumes specific vault structure, logic ported from legacy
        // getObsidianUri(vaultPath) ...
        // For now simple alert if path missing
        alert("Obsidian link implementation pending (requires file path logic)");
    };

    // Simple markdown renderer
    const renderMarkdown = (text: string): string => {
        if (!text) return '';

        return text
            // Headers
            .replace(/^### (.*$)/gim, '<h3 class="text-base font-bold mt-4 mb-2">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold mt-5 mb-2">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mt-6 mb-3">$1</h1>')
            // Bold
            .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold">$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-blue-600 hover:underline" target="_blank">$1</a>')
            // Line breaks
            .replace(/\n/gim, '<br/>');
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div className={`fixed inset-y-0 right-0 ${isExpanded ? 'w-full' : 'w-[600px]'} glass-strong z-50 transform transition-all duration-300 flex flex-col border-l border-black/5 bg-white/90`}>

                {/* Header */}
                <div className="p-4 border-b border-black/5 flex items-center justify-between bg-zinc-50/50">
                    <div className="flex items-center gap-2">
                        <span
                            className="font-mono text-xs text-zinc-400 cursor-pointer hover:text-zinc-900 px-1 transition-colors"
                            onClick={copyId}
                            title="Click to copy ID"
                        >
                            {taskId}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={copyShareLink}
                            className="p-1.5 hover:bg-black/5 rounded text-zinc-400 hover:text-zinc-900 transition-colors"
                            title="Copy share link"
                        >
                            🔗
                        </button>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1.5 hover:bg-black/5 rounded text-zinc-400 hover:text-zinc-900 transition-colors"
                            title={isExpanded ? "Collapse" : "Expand"}
                        >
                            ⛶
                        </button>
                        <button onClick={onClose} className="p-1 hover:bg-black/5 rounded text-zinc-400 hover:text-zinc-900 transition-colors">
                            ✕
                        </button>
                    </div>
                </div>

                {isLoading || !task ? (
                    <div className="flex-1 flex items-center justify-center text-zinc-500">Loading...</div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        {/* Title Section */}
                        <div className="p-6 pb-2">
                            <input
                                className="w-full text-xl font-bold bg-transparent border-none focus:ring-0 p-0 placeholder-zinc-400 text-zinc-900"
                                placeholder="Task Title"
                                defaultValue={task.entity_name}
                                onBlur={(e) => handleUpdate('entity_name', e.target.value)}
                            />
                        </div>

                        {/* Task Type Chips */}
                        {dashboardData?.constants?.task_types && (
                            <div className="px-6 pb-4 flex flex-wrap gap-2">
                                {dashboardData.constants.task_types.map((type: string) => (
                                    <button
                                        key={type}
                                        onClick={() => handleUpdate('type', type)}
                                        className={`px-3 py-1 text-xs rounded-full transition-all ${
                                            task.type === type
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
                                value={task.status}
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
                                value={task.priority}
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
                                value={task.assignee}
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
                                value={task.project_id}
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
                            <input
                                type="date"
                                className="border border-zinc-200 p-1 rounded bg-white text-zinc-700 text-sm w-fit focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none shadow-sm"
                                defaultValue={task.start_date || ''}
                                onBlur={(e) => handleUpdate('start_date', e.target.value)}
                            />

                            <label className="text-zinc-500 py-1">Due Date</label>
                            <input
                                type="date"
                                className="border border-zinc-200 p-1 rounded bg-white text-zinc-700 text-sm w-fit focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none shadow-sm"
                                defaultValue={task.due || ''}
                                onBlur={(e) => handleUpdate('due', e.target.value)}
                            />

                            {/* Obsidian Link */}
                            <div className="col-span-2 pt-2">
                                <button
                                    onClick={openObsidian}
                                    className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline flex items-center gap-1 transition-colors"
                                >
                                    <span className="text-lg">💎</span> Open in Obsidian
                                </button>
                            </div>
                        </div>

                        <div className="h-px bg-zinc-200 mx-6 my-2" />

                        {/* Notes Section (Markdown Editor/Preview) */}
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
                                    defaultValue={task.notes || ''}
                                    onBlur={() => { }}
                                />
                            ) : (
                                <div className="prose prose-sm max-w-none text-zinc-800">
                                    {task.notes ? (
                                        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(task.notes) }} />
                                    ) : (
                                        <span className="text-zinc-400 italic">No notes</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Relations Section */}
                        <div className="px-6 py-4 bg-zinc-50 rounded-lg mx-6 mb-6 border border-zinc-200">
                            <h3 className="text-sm font-semibold text-zinc-700 mb-3">Relations</h3>

                            {/* Project */}
                            {task.project_id && (
                                <div className="mb-3">
                                    <span className="text-xs text-zinc-500 font-medium">Project:</span>
                                    <div className="mt-1">
                                        <span className="inline-block px-2 py-1 bg-white border border-zinc-200 rounded text-xs text-zinc-700">
                                            {dashboardData?.projects?.find((p: any) => p.entity_id === task.project_id)?.entity_name || task.project_id}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Track (via Project) */}
                            {task.project_id && dashboardData?.projects && (
                                (() => {
                                    const project = dashboardData.projects.find((p: any) => p.entity_id === task.project_id);
                                    const trackId = project?.parent_id;
                                    const track = trackId ? dashboardData.tracks?.find((t: any) => t.entity_id === trackId) : null;

                                    return track ? (
                                        <div className="mb-3">
                                            <span className="text-xs text-zinc-500 font-medium">Track:</span>
                                            <div className="mt-1">
                                                <span className="inline-block px-2 py-1 bg-white border border-zinc-200 rounded text-xs text-zinc-700">
                                                    {track.entity_name}
                                                </span>
                                            </div>
                                        </div>
                                    ) : null;
                                })()
                            )}

                            {/* Conditions */}
                            {task.conditions_3y && task.conditions_3y.length > 0 && (
                                <div className="mb-3">
                                    <span className="text-xs text-zinc-500 font-medium">Conditions (3Y):</span>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {task.conditions_3y.map((condId: string) => {
                                            const condition = dashboardData?.conditions?.find((c: any) => c.entity_id === condId);
                                            return (
                                                <span key={condId} className="inline-block px-2 py-1 bg-white border border-zinc-200 rounded text-xs text-zinc-700">
                                                    {condition?.entity_name || condId}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Validates */}
                            {task.validates && task.validates.length > 0 && (
                                <div className="mb-3">
                                    <span className="text-xs text-zinc-500 font-medium">Validates:</span>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {task.validates.map((hypId: string) => {
                                            const hypothesis = dashboardData?.hypotheses?.find((h: any) => h.entity_id === hypId);
                                            return (
                                                <span key={hypId} className="inline-block px-2 py-1 bg-white border border-zinc-200 rounded text-xs text-zinc-700">
                                                    {hypothesis?.entity_name || hypId}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Links */}
                            {task.links && task.links.length > 0 && (
                                <div>
                                    <span className="text-xs text-zinc-500 font-medium">Links:</span>
                                    <div className="mt-1 space-y-1">
                                        {task.links.map((link, idx) => (
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
                                </div>
                            )}

                            {!task.project_id && !task.conditions_3y?.length && !task.validates?.length && !task.links?.length && (
                                <p className="text-xs text-zinc-500 italic">No relations defined</p>
                            )}
                        </div>

                    </div>
                )}

                {/* Footer Actions */}
                <div className="p-4 border-t border-black/5 flex justify-between items-center bg-zinc-50/50">
                    <button
                        onClick={handleDelete}
                        className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors font-medium"
                    >
                        Delete Task
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 text-sm text-zinc-500 hover:text-zinc-900 hover:bg-black/5 rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (isEditingNotes && notesRef.current) {
                                    handleUpdate('notes', notesRef.current.value);
                                }
                                onClose();
                            }}
                            className="px-4 py-1.5 text-sm bg-zinc-900 hover:bg-black text-white rounded font-medium shadow-sm transition-all"
                        >
                            Save
                        </button>
                    </div>
                </div>

            </div>
        </>
    );
};
