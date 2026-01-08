import { useEffect, useState, useRef } from 'react';
import { useTask, useUpdateTask } from '@/features/tasks/queries';
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
    const { data: dashboardData } = useDashboardInit();

    // Local state for form fields to handle inputs before saving or debouncing
    // For this V1, let's trigger updates on blur or change for selects

    const [isEditingNotes, setIsEditingNotes] = useState(false);
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

    // Helper to open Obsidian URI
    const openObsidian = () => {
        // This assumes specific vault structure, logic ported from legacy
        // getObsidianUri(vaultPath) ...
        // For now simple alert if path missing
        alert("Obsidian link implementation pending (requires file path logic)");
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div className="fixed inset-y-0 right-0 w-[600px] glass-strong z-50 transform transition-transform duration-300 flex flex-col border-l border-black/5 bg-white/90">

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
                    <button onClick={onClose} className="p-1 hover:bg-black/5 rounded text-zinc-400 hover:text-zinc-900 transition-colors">
                        ✕
                    </button>
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
                                <div className="prose prose-sm max-w-none text-zinc-800 whitespace-pre-wrap">
                                    {task.notes || <span className="text-zinc-400 italic">No notes</span>}
                                </div>
                            )}
                        </div>

                        {/* Links / Relations placeholder */}
                        <div className="px-6 py-4 bg-zinc-50 rounded-lg mx-6 mb-6 border border-zinc-200">
                            <p className="text-xs text-zinc-500 italic">
                                Relations & Links features are pending implementation.
                            </p>
                        </div>

                    </div>
                )}

                {/* Footer Actions */}
                <div className="p-4 border-t border-black/5 flex justify-end gap-2 bg-zinc-50/50">
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
        </>
    );
};
