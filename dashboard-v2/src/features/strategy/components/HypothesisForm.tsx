interface HypothesisFormProps {
    mode: 'create' | 'edit';
    id?: string;
    prefill?: Record<string, any>; // eslint-disable-line @typescript-eslint/no-unused-vars
}

export const HypothesisForm = ({ mode, id }: HypothesisFormProps) => {
    return (
        <div className="p-6 text-center text-zinc-500">
            <p>Hypothesis CRUD not yet implemented.</p>
            <p className="text-sm mt-2">
                {mode === 'create' ? 'Create hypothesis via vault files.' : `Viewing hypothesis: ${id}`}
            </p>
            <p className="text-xs mt-4 text-zinc-400">
                Requires useHypothesis, useCreateHypothesis, useUpdateHypothesis hooks.
            </p>
        </div>
    );
};
