import { useState } from 'react';
import { useCreateProgram } from '../queries';
import { useDashboardInit } from '@/queries/useDashboardInit';
import { useUi } from '@/contexts/UiContext';

interface ProgramFormProps {
    mode: 'create' | 'edit';
    id?: string; // eslint-disable-line @typescript-eslint/no-unused-vars
    prefill?: Record<string, any>;
}

export const ProgramForm = ({ mode, prefill }: ProgramFormProps) => {
    const { mutate: createProgram, isPending, error } = useCreateProgram();
    const { data: dashboardData } = useDashboardInit();
    const { closeEntityDrawer } = useUi();

    const programTypes = dashboardData?.constants?.program_types || [
        'hiring', 'fundraising', 'grants', 'launch', 'experiments', 'infrastructure'
    ];

    const [formData, setFormData] = useState({
        entity_name: prefill?.entity_name || '',
        program_type: prefill?.program_type || '',
        owner: prefill?.owner || '',
        description: prefill?.description || '',
    });

    const [formError, setFormError] = useState<string | null>(null);

    if (mode === 'edit') {
        return (
            <div className="p-6 text-center text-zinc-500">
                <p>Program edit mode not yet implemented.</p>
                <p className="text-sm mt-2">Use useProgram + useUpdateProgram hooks to enable editing.</p>
            </div>
        );
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        // Validation
        if (!formData.entity_name.trim()) {
            setFormError('Program name is required');
            return;
        }
        if (!formData.program_type) {
            setFormError('Program type is required');
            return;
        }
        if (!formData.owner) {
            setFormError('Owner is required');
            return;
        }

        createProgram(
            formData,
            {
                onSuccess: () => {
                    closeEntityDrawer();
                },
                onError: (err: any) => {
                    setFormError(err.response?.data?.message || err.message || 'Failed to create program');
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
                    <label className="block text-sm font-medium text-zinc-700">Program Name *</label>
                    <input
                        type="text"
                        autoFocus
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder-zinc-400"
                        placeholder="Enter program name"
                        value={formData.entity_name}
                        onChange={e => setFormData(prev => ({ ...prev, entity_name: e.target.value }))}
                    />
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700">Type *</label>
                    <select
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none capitalize"
                        value={formData.program_type}
                        onChange={e => setFormData(prev => ({ ...prev, program_type: e.target.value }))}
                    >
                        <option value="">-- Select Type --</option>
                        {programTypes.map((t: string) => (
                            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                        ))}
                    </select>
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

                {/* Description */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700">Description</label>
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
                    {isPending ? 'Creating...' : 'Create Program'}
                </button>
            </div>
        </form>
    );
};
