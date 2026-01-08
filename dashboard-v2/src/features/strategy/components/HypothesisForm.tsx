import { useDashboardInit } from '@/queries/useDashboardInit';

interface HypothesisFormProps {
    mode: 'create' | 'edit' | 'view';
    id?: string;
    prefill?: Record<string, any>; // eslint-disable-line @typescript-eslint/no-unused-vars
}

export const HypothesisForm = ({ mode, id }: HypothesisFormProps) => {
    const { data: dashboardData } = useDashboardInit();

    // View mode - show hypothesis details read-only
    if (mode === 'view' && id) {
        const hypothesis = dashboardData?.hypotheses?.find((h: any) => h.entity_id === id);

        if (!hypothesis) {
            return (
                <div className="p-6 text-center text-zinc-500">
                    <p>Hypothesis not found: {id}</p>
                </div>
            );
        }

        return (
            <div className="flex-1 overflow-y-auto">
                {/* View-only notice */}
                <div className="px-6 pt-4 pb-3">
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">
                        <strong>View Only:</strong> Hypotheses cannot be edited from the dashboard. Use vault files directly.
                    </div>
                </div>

                {/* ID Badge */}
                <div className="px-6 pb-2">
                    <span className="font-mono text-xs text-zinc-400 px-2 py-1 bg-zinc-50 rounded">
                        {hypothesis.entity_id}
                    </span>
                </div>

                {/* Title */}
                <div className="px-6 pb-4">
                    <h2 className="text-xl font-bold text-zinc-900">{hypothesis.entity_name}</h2>
                </div>

                {/* Properties Grid */}
                <div className="px-6 py-4 grid grid-cols-[100px_1fr] gap-y-3 gap-x-4 text-sm border-t border-zinc-200">
                    <label className="text-zinc-500 py-1">Status</label>
                    <div className="py-1">
                        <span className="inline-block px-2 py-1 bg-zinc-100 text-zinc-700 rounded text-xs capitalize">
                            {hypothesis.status || 'active'}
                        </span>
                    </div>

                    {hypothesis.hypothesis_text && (
                        <>
                            <label className="text-zinc-500 py-1">Hypothesis</label>
                            <p className="text-zinc-700 text-sm py-1">{hypothesis.hypothesis_text}</p>
                        </>
                    )}

                    {hypothesis.validates && hypothesis.validates.length > 0 && (
                        <>
                            <label className="text-zinc-500 py-1">Validates</label>
                            <div className="py-1 space-y-1">
                                {hypothesis.validates.map((v: string) => (
                                    <div key={v} className="text-xs text-zinc-700 bg-white border border-zinc-200 rounded px-2 py-1">
                                        {v}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {hypothesis.validated_by && hypothesis.validated_by.length > 0 && (
                        <>
                            <label className="text-zinc-500 py-1">Validated By</label>
                            <div className="py-1 space-y-1">
                                {hypothesis.validated_by.map((v: string) => (
                                    <div key={v} className="text-xs text-zinc-700 bg-white border border-zinc-200 rounded px-2 py-1">
                                        {v}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Notes/Description */}
                {(hypothesis.notes || hypothesis.description) && (
                    <>
                        <div className="h-px bg-zinc-200 mx-6 my-2" />
                        <div className="px-6 py-4">
                            <h3 className="text-sm font-semibold text-zinc-500 mb-2">Notes</h3>
                            <div className="prose prose-sm max-w-none text-zinc-700 whitespace-pre-wrap">
                                {hypothesis.notes || hypothesis.description}
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    }

    // Create/Edit mode - not yet implemented
    return (
        <div className="p-6 text-center text-zinc-500">
            <p>Hypothesis CRUD not yet implemented.</p>
            <p className="text-sm mt-2">
                {mode === 'create' ? 'Create hypothesis via vault files.' : `Editing hypothesis: ${id}`}
            </p>
            <p className="text-xs mt-4 text-zinc-400">
                Requires useHypothesis, useCreateHypothesis, useUpdateHypothesis hooks.
            </p>
        </div>
    );
};
