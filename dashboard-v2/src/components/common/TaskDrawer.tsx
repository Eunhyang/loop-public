import { useEffect, useState, useRef } from 'react';
import { useTask, useUpdateTask } from '@/queries/useTask';
import { useDashboardInit } from '@/queries/useDashboardInit';
import type { Task } from '@/types/task';

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
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div className="fixed inset-y-0 right-0 w-[600px] glass-panel shadow-2xl z-50 transform transition-transform duration-300 flex flex-col border-l border-glass-border">

                {/* Header */}
                <div className="p-4 border-b border-glass-border flex items-center justify-between bg-black/20">
                    <div className="flex items-center gap-2">
                        <span
                            className="font-mono text-xs text-gray-500 cursor-pointer hover:text-primary px-1 transition-colors"
                            onClick={copyId}
                            title="Click to copy ID"
                        >
                            {taskId}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors">
                        ✕
                    </button>
                </div>

                {isLoading || !task ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500">Loading...</div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        {/* Title Section */}
                        <div className="p-6 pb-2">
                            <input
                                className="w-full text-xl font-bold bg-transparent border-none focus:ring-0 p-0 placeholder-gray-600 text-glow text-white"
                                placeholder="Task Title"
                                defaultValue={task.entity_name}
                                onBlur={(e) => handleUpdate('entity_name', e.target.value)}
                            />
                        </div>

                        {/* Properties Grid */}
                        <div className="px-6 py-4 grid grid-cols-[100px_1fr] gap-y-3 gap-x-4 text-sm">

                            {/* Status */}
                            <label className="text-gray-500 py-1">Status</label>
                            <select
                                className="border border-glass-border p-1 rounded bg-[#0f1115] text-gray-300 text-sm w-fit focus:border-primary focus:ring-1 focus:ring-primary outline-none"
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
                            <label className="text-gray-500 py-1">Priority</label>
                            <select
                                className="border border-glass-border p-1 rounded bg-[#0f1115] text-gray-300 text-sm w-fit focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                value={task.priority}
                                onChange={(e) => handleUpdate('priority', e.target.value)}
                            >
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>

                            {/* Assignee */}
                            <label className="text-gray-500 py-1">Assignee</label>
                            <select
                                className="border border-glass-border p-1 rounded bg-[#0f1115] text-gray-300 text-sm w-fit focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                value={task.assignee}
                                onChange={(e) => handleUpdate('assignee', e.target.value)}
                            >
                                <option value="">Unassigned</option>
                                {dashboardData?.members?.map((m: any) => (
                                    <option key={m.id} value={m.name}>{m.name}</option>
                                ))}
                            </select>

                            {/* Project */}
                            <label className="text-gray-500 py-1">Project</label>
                            <select
                                className="border border-glass-border p-1 rounded bg-[#0f1115] text-gray-300 text-sm w-full truncate focus:border-primary focus:ring-1 focus:ring-primary outline-none"
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
                            <label className="text-gray-500 py-1">Due Date</label>
                            <input
                                type="date"
                                className="border border-glass-border p-1 rounded bg-[#0f1115] text-gray-300 text-sm w-fit focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                defaultValue={task.due}
                                onBlur={(e) => handleUpdate('due', e.target.value)}
                            />

                            {/* Obsidian Link */}
                            <div className="col-span-2 pt-2">
                                <button
                                    onClick={openObsidian}
                                    className="text-xs text-primary hover:text-primary-glow hover:underline flex items-center gap-1 transition-colors"
                                >
                                    <span className="text-lg">💎</span> Open in Obsidian
                                </button>
                            </div>
                        </div>

                        <div className="h-px bg-glass-border mx-6 my-2" />

                        {/* Notes Section (Markdown Editor/Preview) */}
                        <div className="px-6 py-4 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-semibold text-gray-400">Notes</h3>
                                <button
                                    onClick={() => setIsEditingNotes(!isEditingNotes)}
                                    className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 text-gray-300 rounded transition-colors"
                                >
                                    {isEditingNotes ? 'Preview' : 'Edit'}
                                </button>
                            </div>

                            {isEditingNotes ? (
                                <textarea
                                    ref={notesRef}
                                    className="w-full min-h-[200px] border border-glass-border p-3 rounded bg-black/20 text-sm font-mono leading-relaxed focus:border-primary focus:ring-1 focus:ring-primary outline-none text-gray-300"
                                    defaultValue={task.notes || ''}
                                    onBlur={() => { }}
                                />
                            ) : (
                                <div className="prose prose-sm prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
                                    {task.notes || <span className="text-gray-600 italic">No notes</span>}
                                </div>
                            )}
                        </div>

                        {/* Links / Relations placeholder */}
                        <div className="px-6 py-4 bg-white/5 rounded-lg mx-6 mb-6 border border-glass-border">
                            <p className="text-xs text-gray-500 italic">
                                Relations & Links features are pending implementation.
                            </p>
                        </div>

                    </div>
                )}

                {/* Footer Actions */}
                <div className="p-4 border-t border-glass-border flex justify-end gap-2 bg-black/20">
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
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
                        className="px-4 py-1.5 text-sm bg-primary hover:bg-indigo-500 text-white rounded font-medium shadow-[0_0_10px_rgba(99,102,241,0.3)] transition-all"
                    >
                        Save
                    </button>
                </div>

            </div>
        </>
    );
};
