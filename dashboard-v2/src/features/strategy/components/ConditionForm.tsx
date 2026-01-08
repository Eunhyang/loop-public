import { useDashboardInit } from '@/queries/useDashboardInit';
import type { Condition } from '@/types';

interface ConditionFormProps {
    id: string;
}

export const ConditionForm = ({ id }: ConditionFormProps) => {
    const { data: dashboardData } = useDashboardInit();

    const condition = dashboardData?.conditions?.find((c: Condition) => c.entity_id === id);

    if (!condition) {
        return (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
                Condition not found
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto">
            {/* View-only notice */}
            <div className="px-6 pt-4 pb-3">
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">
                    <strong>View Only:</strong> Conditions cannot be edited from the dashboard. Use vault files directly.
                </div>
            </div>

            {/* ID Badge */}
            <div className="px-6 pb-2">
                <span className="font-mono text-xs text-zinc-400 px-2 py-1 bg-zinc-50 rounded">
                    {condition.entity_id}
                </span>
            </div>

            {/* Title */}
            <div className="px-6 pb-4">
                <h2 className="text-xl font-bold text-zinc-900">{condition.entity_name}</h2>
            </div>

            {/* Properties Grid */}
            <div className="px-6 py-4 grid grid-cols-[100px_1fr] gap-y-3 gap-x-4 text-sm border-t border-zinc-200">
                <label className="text-zinc-500 py-1">Status</label>
                <div className="py-1">
                    <span className="inline-block px-2 py-1 bg-zinc-100 text-zinc-700 rounded text-xs capitalize">
                        {condition.status}
                    </span>
                </div>
            </div>

            {/* Info */}
            <div className="px-6 py-4 bg-zinc-50 rounded-lg mx-6 mb-6 border border-zinc-200">
                <p className="text-xs text-zinc-600">
                    Conditions represent 3-year strategic conditions in the LOOP framework.
                    They are managed centrally in the vault and cannot be modified via the dashboard.
                </p>
            </div>
        </div>
    );
};
