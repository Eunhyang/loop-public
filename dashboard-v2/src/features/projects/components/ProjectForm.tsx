import { useState, useEffect } from 'react';
import { useCreateProject } from '../queries';
import { useDashboardInit } from '@/queries/useDashboardInit';
import { useUi } from '@/contexts/UiContext';
import type { Project } from '@/types';

interface ProjectFormProps {
    mode: 'create' | 'edit' | 'view';
    id?: string;
    prefill?: Partial<Project>;
}

export const ProjectForm = ({ mode, id, prefill }: ProjectFormProps) => {
    const { mutate: createProject, isPending, error } = useCreateProject();
    const { data: dashboardData } = useDashboardInit();
    const { closeEntityDrawer } = useUi();

    const [formData, setFormData] = useState({
        entity_name: prefill?.entity_name || '',
        owner: prefill?.owner || '',
        parent_id: prefill?.parent_id || '',
        status: prefill?.status || dashboardData?.constants?.project?.status_default || 'todo',
        priority_flag: prefill?.priority_flag || 'medium',
        description: '',
    });

    const [formError, setFormError] = useState<string | null>(null);

    // Constants
    const statuses = dashboardData?.constants?.project?.status || ['todo', 'doing', 'hold', 'done'];
    const priorities = dashboardData?.constants?.project?.priority || ['low', 'medium', 'high', 'critical'];

    useEffect(() => {
        if (dashboardData?.constants?.project?.status_default && !prefill?.status) {
            setFormData(prev => ({
                ...prev,
                status: dashboardData.constants.project.status_default
            }));
        }
    }, [dashboardData, prefill]);

    if (mode === 'edit') {
        return (
            <div className="p-6 text-center text-zinc-500">
                <p>Project edit mode not yet implemented.</p>
                <p className="text-sm mt-2">Use useProject + useUpdateProject hooks to enable editing.</p>
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
            { ...formData, parent_id: formData.parent_id || undefined },
            {
                onSuccess: () => {
                    closeEntityDrawer();
                },
                onError: (err: any) => {
                    setFormError(err.response?.data?.message || err.message || 'Failed to create project');
                }
            }
        );
    };

    return (
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4">
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
                    <label className="block text-sm font-medium text-zinc-700">Owner *</label>
                    <select
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        value={formData.owner}
                        onChange={e => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                    >
                        <option value="">-- Select Owner --</option>
                        {dashboardData?.members?.map((m: any) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
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
                    {isPending ? 'Creating...' : 'Create Project'}
                </button>
            </div>
        </form>
    );
};
