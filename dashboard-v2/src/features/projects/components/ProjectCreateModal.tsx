import { useState, useEffect } from 'react';
import { useUi } from '@/contexts/UiContext';
import { useCreateProject } from '../queries';
import type { Member, Track } from '@/types';

interface ProjectCreateModalProps {
    members: Member[];
    tracks: Track[];
    constants: Record<string, any>;
}

export const ProjectCreateModal = ({ members, tracks, constants }: ProjectCreateModalProps) => {
    const { activeModal, closeAllModals } = useUi();
    const { mutate: createProject, isPending, error } = useCreateProject();

    const [formData, setFormData] = useState({
        entity_name: '',
        owner: '',
        parent_id: '',
        status: constants?.project?.status_default || 'todo',
        priority_flag: 'medium',
    });

    const [formError, setFormError] = useState<string | null>(null);

    // Constants
    const statuses = constants?.project?.status || ['todo', 'doing', 'hold', 'done'];
    const priorities = constants?.project?.priority || ['low', 'medium', 'high', 'critical'];

    const isOpen = activeModal === 'createProject';

    useEffect(() => {
        if (isOpen) {
            setFormData({
                entity_name: '',
                owner: '', // Could define a default logic if needed
                parent_id: '',
                status: constants?.project?.status_default || 'todo',
                priority_flag: 'medium',
            });
            setFormError(null);
        }
    }, [isOpen, constants]);

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
            { ...formData, parent_id: formData.parent_id || undefined }, // Convert empty string to undefined
            {
                onSuccess: () => {
                    closeAllModals();
                },
                onError: (err: any) => {
                    setFormError(err.response?.data?.message || err.message || 'Failed to create project');
                }
            }
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeAllModals} />
            <div className="relative bg-surface border border-zinc-700 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-700 flex items-center justify-between bg-zinc-800/50">
                    <h3 className="text-lg font-medium text-text-main">New Project</h3>
                    <button onClick={closeAllModals} className="text-zinc-400 hover:text-white">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Error Message */}
                    {(formError || error) && (
                        <div className="p-3 bg-red-900/30 text-red-200 text-sm rounded border border-red-800">
                            {formError || (error as any)?.message}
                        </div>
                    )}

                    {/* Name */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-zinc-400">Project Name *</label>
                        <input
                            type="text"
                            autoFocus
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-text-main focus:border-blue-500 focus:outline-none placeholder-zinc-600"
                            placeholder="Enter project name"
                            value={formData.entity_name}
                            onChange={e => setFormData(prev => ({ ...prev, entity_name: e.target.value }))}
                        />
                    </div>

                    {/* Owner */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-zinc-400">Owner *</label>
                        <select
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-text-main focus:border-blue-500 focus:outline-none"
                            value={formData.owner}
                            onChange={e => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                        >
                            <option value="">-- Select Owner --</option>
                            {members.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Track */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-zinc-400">Track (Optional)</label>
                        <select
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-text-main focus:border-blue-500 focus:outline-none"
                            value={formData.parent_id}
                            onChange={e => setFormData(prev => ({ ...prev, parent_id: e.target.value }))}
                        >
                            <option value="">None</option>
                            {tracks.map(t => (
                                <option key={t.entity_id} value={t.entity_id}>{t.entity_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Status */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-zinc-400">Status</label>
                            <select
                                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-text-main focus:border-blue-500 focus:outline-none capitalize"
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
                            <label className="block text-sm font-medium text-zinc-400">Priority</label>
                            <select
                                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-text-main focus:border-blue-500 focus:outline-none capitalize"
                                value={formData.priority_flag}
                                onChange={e => setFormData(prev => ({ ...prev, priority_flag: e.target.value }))}
                            >
                                {priorities.map((p: string) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={closeAllModals}
                            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? 'Creating...' : 'Create Project'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};
