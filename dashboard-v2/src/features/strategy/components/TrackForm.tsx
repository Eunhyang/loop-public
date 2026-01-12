import { useDashboardInit } from '@/queries/useDashboardInit';
import { PropertiesGrid, PropertyRow, SectionDivider } from '@/components/common/form';
import { EntityBadge, EntityBadgeGroup, IdBadge, StaticBadge } from '@/components/common/entity';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import type { Track } from '@/types';

interface TrackFormProps {
    id: string;
}

export const TrackForm = ({ id }: TrackFormProps) => {
    const { data: dashboardData } = useDashboardInit();

    const track: any = dashboardData?.tracks?.find((t: Track) => t.entity_id === id);

    if (!track) {
        return (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
                Track not found
            </div>
        );
    }

    // Get related projects and hypotheses
    const relatedProjects = dashboardData?.projects?.filter((p: any) => p.parent_id === track.entity_id) || [];
    const childHypotheses = dashboardData?.hypotheses?.filter((h: any) => h.parent_id === track.entity_id) || [];

    return (
        <div className="flex-1 overflow-y-auto p-6">
            {/* View-only notice */}
            <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700">
                    <strong>View Only:</strong> Tracks cannot be edited from the dashboard. Use vault files directly.
                </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-zinc-900 mb-6">{track.entity_name}</h2>

            {/* Properties Grid */}
            <PropertiesGrid>
                <PropertyRow label="ID">
                    <IdBadge id={track.entity_id} />
                </PropertyRow>

                <PropertyRow label="Status">
                    <StaticBadge label={track.status} variant="status" />
                </PropertyRow>

                {track.parent_id && (
                    <PropertyRow label="Parent Condition">
                        <EntityBadge type="condition" id={track.parent_id} mode="view" />
                    </PropertyRow>
                )}

                {track.owner && (
                    <PropertyRow label="Owner">
                        <span className="text-sm text-gray-700">{track.owner}</span>
                    </PropertyRow>
                )}

                {track.horizon && (
                    <PropertyRow label="Horizon">
                        <span className="text-sm text-gray-700">{track.horizon}</span>
                    </PropertyRow>
                )}

                {track.hypothesis && (
                    <PropertyRow label="Hypothesis">
                        <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                            {track.hypothesis}
                        </div>
                    </PropertyRow>
                )}

                {track.focus && Array.isArray(track.focus) && track.focus.length > 0 && (
                    <PropertyRow label="Focus">
                        <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                            {track.focus.map((item: string, idx: number) => (
                                <li key={idx}>{item}</li>
                            ))}
                        </ul>
                    </PropertyRow>
                )}

                {track.validates && Array.isArray(track.validates) && track.validates.length > 0 && (
                    <PropertyRow label="Validates">
                        <EntityBadgeGroup type="condition" ids={track.validates} mode="view" />
                    </PropertyRow>
                )}

                {track.validated_by && Array.isArray(track.validated_by) && track.validated_by.length > 0 && (
                    <PropertyRow label="Validated By">
                        <div className="flex flex-wrap gap-2">
                            {track.validated_by.map((v: string) => {
                                const type = v.startsWith('prj-') ? 'project' :
                                             v.startsWith('cond-') ? 'condition' :
                                             v.startsWith('hyp-') ? 'hypothesis' : 'track';
                                return <EntityBadge key={v} type={type as any} id={v} mode="view" />;
                            })}
                        </div>
                    </PropertyRow>
                )}
            </PropertiesGrid>

            {/* Child Hypotheses */}
            {childHypotheses.length > 0 && (
                <>
                    <SectionDivider title="Child Hypotheses" />
                    <EntityBadgeGroup type="hypothesis" ids={childHypotheses.map((h: any) => h.entity_id)} mode="view" />
                </>
            )}

            {/* Related Projects */}
            {relatedProjects.length > 0 && (
                <>
                    <SectionDivider title="Related Projects" />
                    <EntityBadgeGroup type="project" ids={relatedProjects.map((p: any) => p.entity_id)} mode="view" />
                </>
            )}

            {/* Body Content */}
            {track._body && (
                <>
                    <SectionDivider title="Content" />
                    <MarkdownEditor
                        value={track._body}
                        readOnly={true}
                        minHeight="100px"
                        className="border-0"
                    />
                </>
            )}
        </div>
    );
};
