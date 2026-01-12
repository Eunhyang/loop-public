import { useDashboardInit } from '@/queries/useDashboardInit';
import { PropertiesGrid, PropertyRow, SectionDivider } from '@/components/common/form';
import { EntityBadge, EntityBadgeGroup, StaticBadge } from '@/components/common/entity';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import type { Condition } from '@/types';

interface ConditionFormProps {
    id: string;
}

export const ConditionForm = ({ id }: ConditionFormProps) => {
    const { data: dashboardData } = useDashboardInit();

    const condition: any = dashboardData?.conditions?.find((c: Condition) => c.entity_id === id);

    if (!condition) {
        return (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
                Condition not found
            </div>
        );
    }

    // Get child tracks
    const childTracks = dashboardData?.tracks?.filter((t: any) => t.parent_id === condition.entity_id) || [];

    return (
        <div className="flex-1 overflow-y-auto p-6">
            {/* View-only notice */}
            <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700">
                    <strong>View Only:</strong> Conditions cannot be edited from the dashboard. Use vault files directly.
                </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-zinc-900 mb-6">{condition.entity_name}</h2>

            {/* Properties Grid */}
            <PropertiesGrid>
                <PropertyRow label="Status">
                    <StaticBadge label={condition.status} variant="status" />
                </PropertyRow>

                {condition.parent_id && (
                    <PropertyRow label="Parent MH">
                        <EntityBadge type="hypothesis" id={condition.parent_id} mode="view" />
                    </PropertyRow>
                )}

                {condition.condition && (
                    <PropertyRow label="Condition">
                        <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                            {condition.condition}
                        </div>
                    </PropertyRow>
                )}

                {condition.unlock && (
                    <PropertyRow label="Unlock">
                        <div className="text-sm text-green-700 bg-green-50 p-3 rounded-md">
                            {condition.unlock}
                        </div>
                    </PropertyRow>
                )}

                {condition.if_broken && (
                    <PropertyRow label="If Broken">
                        <div className="text-sm text-red-700 bg-red-50 p-3 rounded-md">
                            {condition.if_broken}
                        </div>
                    </PropertyRow>
                )}

                {condition.metrics && Array.isArray(condition.metrics) && condition.metrics.length > 0 && (
                    <PropertyRow label="Metrics">
                        <div className="space-y-2">
                            {condition.metrics.map((metric: any, idx: number) => (
                                <div key={idx} className="text-sm bg-gray-50 p-2 rounded-md">
                                    <div className="font-medium">{metric.name}</div>
                                    {metric.threshold && (
                                        <div className="text-xs text-gray-600">Threshold: {metric.threshold}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </PropertyRow>
                )}

                {condition.validates && Array.isArray(condition.validates) && condition.validates.length > 0 && (
                    <PropertyRow label="Validates">
                        <EntityBadgeGroup type="hypothesis" ids={condition.validates} mode="view" />
                    </PropertyRow>
                )}

                {condition.validated_by && Array.isArray(condition.validated_by) && condition.validated_by.length > 0 && (
                    <PropertyRow label="Validated By">
                        <div className="flex flex-wrap gap-2">
                            {condition.validated_by.map((v: string) => {
                                const type = v.startsWith('mh-') ? 'hypothesis' :
                                    v.startsWith('trk-') ? 'track' :
                                        v.startsWith('prj-') ? 'project' : 'condition';
                                return <EntityBadge key={v} type={type as any} id={v} mode="view" />;
                            })}
                        </div>
                    </PropertyRow>
                )}
            </PropertiesGrid>

            {/* Child Tracks */}
            {childTracks.length > 0 && (
                <>
                    <SectionDivider title="Child Tracks" />
                    <EntityBadgeGroup type="track" ids={childTracks.map((t: any) => t.entity_id)} mode="view" />
                </>
            )}

            {/* Outgoing Relations */}
            {condition.outgoing_relations && Array.isArray(condition.outgoing_relations) && condition.outgoing_relations.length > 0 && (
                <>
                    <SectionDivider title="Outgoing Relations" />
                    <div className="space-y-2">
                        {condition.outgoing_relations.map((rel: any, idx: number) => (
                            <div key={idx} className="bg-gray-50 p-3 rounded-md text-sm">
                                <div className="font-medium text-gray-700">{rel.type}</div>
                                {rel.target_id && <div className="text-xs text-gray-600 mt-1">Target: {rel.target_id}</div>}
                                {rel.description && <div className="text-xs text-gray-600 mt-1">{rel.description}</div>}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Body Content */}
            {condition._body && (
                <>
                    <SectionDivider title="Content" />
                    <MarkdownEditor
                        value={condition._body}
                        readOnly={true}
                        minHeight="100px"
                        className="border-0"
                    />
                </>
            )}
        </div>
    );
};
