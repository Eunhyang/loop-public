import { useDashboardInit } from '@/queries/useDashboardInit';
import { PropertiesGrid, PropertyRow, SectionDivider } from '@/components/common/form';
import { EntityBadge, EntityBadgeGroup, IdBadge, StaticBadge } from '@/components/common/entity';
import { MarkdownEditor } from '@/components/MarkdownEditor';

interface HypothesisFormProps {
    mode: 'create' | 'edit' | 'view';
    id?: string;
    prefill?: Record<string, any>; // eslint-disable-line @typescript-eslint/no-unused-vars
}

export const HypothesisForm = ({ mode, id }: HypothesisFormProps) => {
    const { data: dashboardData } = useDashboardInit();

    // View mode - show hypothesis details read-only
    if (mode === 'view' && id) {
        const hypothesis: any = dashboardData?.hypotheses?.find((h: any) => h.entity_id === id);

        if (!hypothesis) {
            return (
                <div className="p-6 text-center text-zinc-500">
                    <p>Hypothesis not found: {id}</p>
                </div>
            );
        }

        return (
            <div className="flex-1 overflow-y-auto p-6">
                {/* View-only notice */}
                <div className="mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700">
                        <strong>View Only:</strong> Hypotheses cannot be edited from the dashboard. Use vault files directly.
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-zinc-900 mb-6">{hypothesis.entity_name}</h2>

                {/* Properties Grid */}
                <PropertiesGrid>
                    <PropertyRow label="ID">
                        <IdBadge id={hypothesis.entity_id} />
                    </PropertyRow>

                    <PropertyRow label="Status">
                        <StaticBadge label={hypothesis.status || 'active'} variant="status" />
                    </PropertyRow>

                    {hypothesis.parent_id && (
                        <PropertyRow label="Parent Track">
                            <EntityBadge type="track" id={hypothesis.parent_id} mode="view" />
                        </PropertyRow>
                    )}

                    {hypothesis.horizon && (
                        <PropertyRow label="Horizon">
                            <span className="text-sm text-gray-700">{hypothesis.horizon}</span>
                        </PropertyRow>
                    )}

                    {hypothesis.confidence && (
                        <PropertyRow label="Confidence">
                            <span className="text-sm text-gray-700">{hypothesis.confidence}</span>
                        </PropertyRow>
                    )}

                    {hypothesis.hypothesis_question && (
                        <PropertyRow label="Question">
                            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                                {hypothesis.hypothesis_question}
                            </div>
                        </PropertyRow>
                    )}

                    {hypothesis.success_criteria && (
                        <PropertyRow label="Success Criteria">
                            <div className="text-sm text-green-700 bg-green-50 p-3 rounded-md">
                                {hypothesis.success_criteria}
                            </div>
                        </PropertyRow>
                    )}

                    {hypothesis.failure_criteria && (
                        <PropertyRow label="Failure Criteria">
                            <div className="text-sm text-red-700 bg-red-50 p-3 rounded-md">
                                {hypothesis.failure_criteria}
                            </div>
                        </PropertyRow>
                    )}

                    {hypothesis.measurement && (
                        <PropertyRow label="Measurement">
                            <div className="text-sm text-gray-700">{hypothesis.measurement}</div>
                        </PropertyRow>
                    )}

                    {hypothesis.validates && Array.isArray(hypothesis.validates) && hypothesis.validates.length > 0 && (
                        <PropertyRow label="Validates">
                            <EntityBadgeGroup type="track" ids={hypothesis.validates} mode="view" />
                        </PropertyRow>
                    )}

                    {hypothesis.validated_by && Array.isArray(hypothesis.validated_by) && hypothesis.validated_by.length > 0 && (
                        <PropertyRow label="Validated By">
                            <div className="flex flex-wrap gap-2">
                                {hypothesis.validated_by.map((v: string) => {
                                    // Determine entity type from ID pattern
                                    const type = v.startsWith('mh-') ? 'hypothesis' :
                                                 v.startsWith('trk-') ? 'track' :
                                                 v.startsWith('cond-') ? 'condition' :
                                                 v.startsWith('prj-') ? 'project' : 'hypothesis';
                                    return <EntityBadge key={v} type={type as any} id={v} mode="view" />;
                                })}
                            </div>
                        </PropertyRow>
                    )}
                </PropertiesGrid>

                {/* Body Content */}
                {hypothesis._body && (
                    <>
                        <SectionDivider title="Content" />
                        <MarkdownEditor
                            value={hypothesis._body}
                            readOnly={true}
                            minHeight="100px"
                            className="border-0"
                        />
                    </>
                )}

                {/* Notes/Description fallback */}
                {!hypothesis._body && (hypothesis.notes || hypothesis.description) && (
                    <>
                        <SectionDivider title="Notes" />
                        <div className="prose prose-sm max-w-none text-zinc-700 whitespace-pre-wrap">
                            {hypothesis.notes || hypothesis.description}
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
