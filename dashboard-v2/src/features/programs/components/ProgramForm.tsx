import { useState } from 'react';
import { useProgram, useCreateProgram, useUpdateProgram } from '../queries';
import { useDashboardInit } from '@/queries/useDashboardInit';
import { useUi } from '@/contexts/UiContext';
import type { Program } from '@/types';

interface ProgramFormProps {
    mode: 'create' | 'edit';
    id?: string; // eslint-disable-line @typescript-eslint/no-unused-vars
    prefill?: Record<string, any>;
}

export const ProgramForm = ({ mode, id, prefill }: ProgramFormProps) => {
    const { data: program, isLoading: isLoadingProgram } = useProgram(mode === 'edit' ? id || null : null);
    const { mutate: createProgram, isPending, error } = useCreateProgram();
    const { mutate: updateProgram } = useUpdateProgram();
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

    // Edit mode - show editable program details
    if (mode === 'edit') {
        if (isLoadingProgram || !program) {
            return (
                <div className="flex-1 flex items-center justify-center text-zinc-500">
                    {isLoadingProgram ? 'Loading...' : 'Program not found'}
                </div>
            );
        }

        const handleUpdate = (field: keyof Program, value: any) => {
            if (!id) return;
            updateProgram({ id, data: { [field]: value } });
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
                        placeholder="Program Title"
                        defaultValue={program.entity_name}
                        onBlur={(e) => handleUpdate('entity_name', e.target.value)}
                    />
                </div>

                {/* Properties Grid */}
                <div className="px-6 py-4 grid grid-cols-[100px_1fr] gap-y-3 gap-x-4 text-sm">
                    {/* Type */}
                    <label className="text-zinc-500 py-1">Type</label>
                    <select
                        className="border border-zinc-200 p-1 rounded bg-white text-zinc-700 text-sm w-fit focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none shadow-sm capitalize"
                        value={program.program_type}
                        onChange={(e) => handleUpdate('program_type', e.target.value)}
                    >
                        {programTypes.map((t: string) => (
                            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                        ))}
                    </select>

                    {/* Owner */}
                    <label className="text-zinc-500 py-1">Owner</label>
                    <select
                        className="border border-zinc-200 p-1 rounded bg-white text-zinc-700 text-sm w-fit focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none shadow-sm"
                        value={program.owner}
                        onChange={(e) => handleUpdate('owner', e.target.value)}
                    >
                        <option value="">Unassigned</option>
                        {dashboardData?.members?.map((m: any) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>

                <div className="h-px bg-zinc-200 mx-6 my-2" />

                {/* Description Section */}
                <div className="px-6 py-4 flex-1 flex flex-col">
                    <h3 className="text-sm font-semibold text-zinc-500 mb-2">Description</h3>
                    <textarea
                        className="w-full min-h-[100px] border border-zinc-200 p-3 rounded bg-white text-sm leading-relaxed focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none text-zinc-800"
                        defaultValue={program.description || ''}
                        onBlur={(e) => handleUpdate('description', e.target.value)}
                        placeholder="Enter program description..."
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
                    setFormError(err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to create program');
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
                    className="px-4 py-2 text-sm font-semibold bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? 'Creating...' : 'Create Program'}
                </button>
            </div>
        </form>
    );
};
