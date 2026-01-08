import { useState, useEffect } from 'react';
import { useUi } from '@/contexts/UiContext';
import { useCreateProgram } from '../queries';
import type { Member } from '@/types';

interface ProgramCreateModalProps {
    members: Member[];
    constants: Record<string, any>;
}

export const ProgramCreateModal = ({ members, constants }: ProgramCreateModalProps) => {
    const { activeModal, closeAllModals } = useUi();
    const { mutate: createProgram, isPending, error } = useCreateProgram();

    // Program types from constants or fallback
    const programTypes = constants?.program_types || [
        'hiring', 'fundraising', 'grants', 'launch', 'experiments', 'infrastructure'
    ];

    const [formData, setFormData] = useState({
        entity_name: '',
        program_type: '',
        owner: '',
        description: '',
    });

    const [formError, setFormError] = useState<string | null>(null);

    const isOpen = activeModal === 'createProgram';

    useEffect(() => {
        if (isOpen) {
            setFormData({
                entity_name: '',
                program_type: '',
                owner: '',
                description: '',
            });
            setFormError(null);
        }
    }, [isOpen]);

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
                    closeAllModals();
                },
                onError: (err: any) => {
                    setFormError(err.response?.data?.message || err.message || 'Failed to create program');
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
                    <h3 className="text-lg font-medium text-text-main">New Program</h3>
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
                        <label className="block text-sm font-medium text-zinc-400">Program Name *</label>
                        <input
                            type="text"
                            autoFocus
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-text-main focus:border-blue-500 focus:outline-none placeholder-zinc-600"
                            placeholder="Enter program name"
                            value={formData.entity_name}
                            onChange={e => setFormData(prev => ({ ...prev, entity_name: e.target.value }))}
                        />
                    </div>

                    {/* Type */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-zinc-400">Type *</label>
                        <select
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-text-main focus:border-blue-500 focus:outline-none capitalize"
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

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-zinc-400">Description</label>
                        <textarea
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-text-main focus:border-blue-500 focus:outline-none placeholder-zinc-600 min-h-[80px]"
                            placeholder="Optional description"
                            value={formData.description}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
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
                            {isPending ? 'Creating...' : 'Create Program'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
