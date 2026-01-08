import { useDashboardInit } from '@/queries/useDashboardInit';
import type { Track } from '@/types';

interface TrackFormProps {
    id: string;
}

export const TrackForm = ({ id }: TrackFormProps) => {
    const { data: dashboardData } = useDashboardInit();

    const track = dashboardData?.tracks?.find((t: Track) => t.entity_id === id);

    if (!track) {
        return (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
                Track not found
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto">
            {/* View-only notice */}
            <div className="px-6 pt-4 pb-3">
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">
                    <strong>View Only:</strong> Tracks cannot be edited from the dashboard. Use vault files directly.
                </div>
            </div>

            {/* ID Badge */}
            <div className="px-6 pb-2">
                <span className="font-mono text-xs text-zinc-400 px-2 py-1 bg-zinc-50 rounded">
                    {track.entity_id}
                </span>
            </div>

            {/* Title */}
            <div className="px-6 pb-4">
                <h2 className="text-xl font-bold text-zinc-900">{track.entity_name}</h2>
            </div>

            {/* Properties Grid */}
            <div className="px-6 py-4 grid grid-cols-[100px_1fr] gap-y-3 gap-x-4 text-sm border-t border-zinc-200">
                <label className="text-zinc-500 py-1">Status</label>
                <div className="py-1">
                    <span className="inline-block px-2 py-1 bg-zinc-100 text-zinc-700 rounded text-xs capitalize">
                        {track.status}
                    </span>
                </div>
            </div>

            {/* Related Projects */}
            <div className="px-6 py-4 bg-zinc-50 rounded-lg mx-6 mb-6 border border-zinc-200">
                <h3 className="text-sm font-semibold text-zinc-700 mb-3">Related Projects</h3>
                {dashboardData?.projects && dashboardData.projects.filter((p: any) => p.parent_id === track.entity_id).length > 0 ? (
                    <div className="space-y-1">
                        {dashboardData.projects
                            .filter((p: any) => p.parent_id === track.entity_id)
                            .map((p: any) => (
                                <div key={p.entity_id} className="text-xs text-zinc-700 bg-white border border-zinc-200 rounded px-2 py-1">
                                    {p.entity_name}
                                </div>
                            ))}
                    </div>
                ) : (
                    <p className="text-xs text-zinc-500 italic">No projects linked to this track</p>
                )}
            </div>
        </div>
    );
};
