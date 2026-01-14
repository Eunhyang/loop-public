import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProject, useCreateProject, useUpdateProject, usePrograms } from '../queries';
import { useDashboardInit } from '@/queries/useDashboardInit';
import { queryKeys } from '@/queries/keys';
import { useUi } from '@/contexts/UiContext';
import { ChipSelect, type ChipOption } from '@/components/common/ChipSelect';
import { ChipSelectExpand } from '@/components/common/ChipSelectExpand';
import { EntityChip } from '@/components/common/entity';
import { statusColors, priorityColors, memberColor, trackColor, programColor, getColor } from '@/components/common/chipColors';
import { CORE_ROLES } from '@/features/tasks/selectors';
import type { Project, ExpectedImpact, TrackContribution, RealizedImpact } from '@/types';
import { MarkdownEditor } from '@/components/MarkdownEditor/MarkdownEditor';
import { ReviewFieldWrapper } from '@/components/common/ReviewFieldWrapper';
import { useReviewMode } from '@/hooks/useReviewMode';
import { ImpactSection } from '@/features/impact/components/ImpactSection';
import { calculateExpectedScore } from '@/features/impact/utils/calculator';
import { TrackContributionEditor } from '@/features/impact/components/TrackContributionEditor';
import { HypothesisSelector } from '@/features/impact/components/HypothesisSelector';
import { useInferExpectedImpact, useInferHypothesisDraft } from '@/features/impact';
import type { ExpectedInferResponse, HypothesisInferResponse, ExpectedMode } from '@/features/impact/api';

interface ProjectFormProps {
    mode: 'create' | 'edit' | 'view' | 'review';
    id?: string;
    prefill?: Partial<Project>;
    // Review mode props (optional, only used when mode='review')
    suggestedFields?: Record<string, unknown>;
    reasoning?: Record<string, string>;
    onRelationClick?: (id: string, type: string) => void;
    onFieldChange?: (field: string, value: unknown) => void;
}

export const ProjectForm = ({ mode, id, prefill, suggestedFields, reasoning, onFieldChange }: ProjectFormProps) => {
    const isReadOnly = mode === 'view';
    const isReviewMode = mode === 'review';
    const { data: project, isLoading: isLoadingProject } = useProject(mode === 'edit' || mode === 'view' || mode === 'review' ? id || null : null);

    // Review mode hook (always called, but only active when mode='review')
    const reviewMode = useReviewMode({
        enabled: isReviewMode,
        entityData: project as Record<string, unknown> | null | undefined,
        suggestedFields,
        reasoning,
    });
    const { mutate: createProject, isPending, error } = useCreateProject();
    const { mutate: updateProject } = useUpdateProject();
    const { mutateAsync: inferExpectedImpact, isPending: isInferringExpected } = useInferExpectedImpact();
    const { mutateAsync: inferHypothesisDraft, isPending: isInferringHypothesis } = useInferHypothesisDraft();
    const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardInit();
    const { data: programs, isLoading: isProgramsLoading, error: programsError } = usePrograms();
    const { closeEntityDrawer, pushDrawer } = useUi();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        entity_name: prefill?.entity_name || '',
        owner: prefill?.owner || '',
        parent_id: prefill?.parent_id || '',
        program_id: prefill?.program_id || null,
        status: prefill?.status || dashboardData?.constants?.project?.status_default || 'todo',
        priority_flag: prefill?.priority_flag || 'medium',
        description: '',
        expected_impact: (prefill?.expected_impact as ExpectedImpact | undefined) || null,
        validates: (prefill?.validates as string[] | undefined) || [],
        primary_hypothesis_id: (prefill?.primary_hypothesis_id as string | undefined) || '',
    });

    const [formError, setFormError] = useState<string | null>(null);
    const [expectedAiResult, setExpectedAiResult] = useState<ExpectedInferResponse | null>(null);
    const [expectedAiFeedback, setExpectedAiFeedback] = useState('');
    const [expectedAiError, setExpectedAiError] = useState<string | null>(null);
    const [hypothesisAiResult, setHypothesisAiResult] = useState<HypothesisInferResponse | null>(null);
    const [hypothesisAiFeedback, setHypothesisAiFeedback] = useState('');
    const [hypothesisAiError, setHypothesisAiError] = useState<string | null>(null);
    const [isImpactChatOpen, setIsImpactChatOpen] = useState(false);
    const [impactChatMessages, setImpactChatMessages] = useState<Array<{ role: 'ai' | 'user'; text: string }>>([]);

    // Constants
    const statuses = dashboardData?.constants?.project?.status || ['todo', 'doing', 'hold', 'done'];
    const priorities = dashboardData?.constants?.priority?.values || ['low', 'medium', 'high', 'critical'];

    // Task filtering and grouping (UNCONDITIONAL - fix hooks violation)
    // Use memoized taskStatuses to fix memoization ineffectiveness
    const taskStatuses = useMemo(() =>
        dashboardData?.constants?.task?.status || ['todo', 'doing', 'hold', 'done', 'blocked'],
        [dashboardData?.constants?.task?.status]
    );

    const projectTasks = useMemo(() => {
        if (!dashboardData?.tasks || !id) return [];
        return dashboardData.tasks.filter((t: any) => t.project_id === id);
    }, [dashboardData?.tasks, id]);

    const tasksByStatus = useMemo(() => {
        const groups: Record<string, any[]> = {};
        taskStatuses.forEach((s: string) => { groups[s] = []; });

        projectTasks.forEach((t: any) => {
            const status = t.status || 'todo';
            if (groups[status]) {
                groups[status].push(t);
            }
        });

        // Sort within groups: priority (high→low), then name
        const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        Object.keys(groups).forEach(status => {
            groups[status].sort((a, b) => {
                const aPrio = priorityOrder[a.priority] ?? 2;
                const bPrio = priorityOrder[b.priority] ?? 2;
                if (aPrio !== bPrio) return aPrio - bPrio;
                return a.entity_name.localeCompare(b.entity_name);
            });
        });

        return groups;
    }, [projectTasks, taskStatuses]);

    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    // Reset expanded state when project OR taskStatuses changes (fix stale state)
    useEffect(() => {
        if (id && taskStatuses.length > 0) {
            const initial: Record<string, boolean> = {};
            taskStatuses.forEach((s: string, i: number) => {
                initial[s] = i < 2; // First 2 statuses expanded by default
            });
            setExpandedGroups(initial);
        }
    }, [id, taskStatuses]);

    // Member options (for owner ChipSelectExpand)
    // Included inactive members with (Inactive) label, sorted to the bottom
    const memberOptions: ChipOption[] = useMemo(() => {
        const members = (dashboardData?.members || [])
            .filter((m: any) => m.role !== 'Unassigned');

        return members
            .map((m: any) => ({
                value: m.id, // ProjectForm uses m.id
                label: m.active === false ? `${m.name} (Inactive)` : m.name,
                color: memberColor,
                active: m.active !== false
            }))
            .sort((a, b) => {
                // Secondary sort: name
                if (a.active === b.active) return a.label.localeCompare(b.label);
                // Primary sort: active first
                return a.active ? -1 : 1;
            });
    }, [dashboardData?.members]);

    const coreMemberOptions: ChipOption[] = useMemo(() => {
        return memberOptions.filter(opt => {
            const member = dashboardData?.members?.find((m: any) => m.id === opt.value);
            return member && CORE_ROLES.includes(member.role) && opt.active;
        });
    }, [memberOptions, dashboardData?.members]);

    // Status options (for ChipSelect)
    const statusOptions: ChipOption[] = useMemo(() =>
        statuses.map((s: string) => ({
            value: s,
            label: s.charAt(0).toUpperCase() + s.slice(1),
            color: getColor(s, statusColors),
        })), [statuses]);

    // Priority options (for ChipSelect)
    const priorityOptions: ChipOption[] = useMemo(() =>
        priorities.map((p: string) => ({
            value: p,
            label: p.charAt(0).toUpperCase() + p.slice(1),
            color: getColor(p, priorityColors),
        })), [priorities]);

    // Track options (for ChipSelectExpand)
    const trackOptions: ChipOption[] = useMemo(() =>
        (dashboardData?.tracks || []).map((t: any) => ({
            value: t.entity_id,
            label: t.entity_name || t.entity_id,
            color: trackColor,
        })), [dashboardData?.tracks]);

    // Program options (for ChipSelectExpand)
    const programOptions: ChipOption[] = useMemo(() =>
        (programs || []).map((p: any) => ({
            value: p.entity_id,
            label: p.entity_name,
            color: programColor,
        })), [programs]);

    const hasHypotheses = useMemo(() => (dashboardData?.hypotheses?.length || 0) > 0, [dashboardData?.hypotheses]);

    const isFormValid = useMemo(() => {
        if (mode !== 'create') return true;
        if (isDashboardLoading || !hasHypotheses) return false;

        return Boolean(
            formData.entity_name.trim() &&
            formData.owner &&
            formData.expected_impact &&
            formData.validates.length > 0 &&
            formData.primary_hypothesis_id &&
            formData.validates.includes(formData.primary_hypothesis_id)
        );
    }, [mode, isDashboardLoading, hasHypotheses, formData]);

    const expectedScore = useMemo(() => {
        if (!formData.expected_impact) return null;
        const result = calculateExpectedScore(
            formData.expected_impact.tier,
            formData.expected_impact.impact_magnitude,
            formData.expected_impact.confidence
        );
        return result.score.toFixed(2);
    }, [formData.expected_impact]);

    const contextText = useMemo(() => {
        if (mode === 'create') return formData.description || '';
        const p: any = project || {};
        return p._body || p.description || p.hypothesis_text || '';
    }, [mode, formData.description, project]);

    const hasContextText = useMemo(() => {
        return (contextText?.trim().length || 0) >= 200;
    }, [contextText]);

    const hasTrackOrCondition = useMemo(() => {
        if (mode === 'create') return Boolean(formData.parent_id);
        const p: any = project || {};
        return Boolean(p.parent_id || (p.conditions_3y && p.conditions_3y.length > 0));
    }, [mode, formData.parent_id, project]);

    const aiReady = useMemo(() => {
        const name = mode === 'create' ? formData.entity_name : project?.entity_name;
        const ownerVal = mode === 'create' ? formData.owner : (project as any)?.owner;
        return Boolean(name && ownerVal && hasTrackOrCondition && hasContextText);
    }, [mode, formData.entity_name, formData.owner, project, hasTrackOrCondition, hasContextText]);

    const aiReadyReason = useMemo(() => {
        if (aiReady) return '';
        return '제목, 오너, 트랙/컨디션, 컨텍스트 200자 이상이 필요합니다.';
    }, [aiReady]);

    const expectedEnabled = aiReady && mode !== 'create' && Boolean(id);
    const expectedDisabledReason = !aiReady ? aiReadyReason : (mode === 'create' ? '프로젝트 저장 후 사용 가능합니다.' : '프로젝트 ID가 필요합니다.');
    const hypothesisEnabled = expectedEnabled;
    const hypothesisDisabledReason = expectedDisabledReason;

    useEffect(() => {
        if (dashboardData?.constants?.project?.status_default && !prefill?.status) {
            setFormData(prev => ({
                ...prev,
                status: dashboardData.constants.project.status_default
            }));
        }
    }, [dashboardData, prefill]);

    // Helper functions for Tasks section (UNCONDITIONAL - fix hooks violation)
    const toggleGroup = (status: string) => {
        setExpandedGroups(prev => ({ ...prev, [status]: !prev[status] }));
    };

    const handleTaskClick = (taskId: string) => {
        pushDrawer({ type: 'task', mode: 'edit', id: taskId });
    };

    const getStatusIcon = (status: string) => {
        const icons: Record<string, string> = {
            doing: '●',
            todo: '○',
            hold: '◐',
            blocked: '✕',
            done: '✓'
        };
        return icons[status] || '○';
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            doing: 'text-blue-500',
            todo: 'text-zinc-400',
            hold: 'text-amber-500',
            blocked: 'text-red-500',
            done: 'text-green-500'
        };
        return colors[status] || 'text-zinc-400';
    };

    const handleExpectedAi = async (aiMode: ExpectedMode) => {
        if (!id) {
            setExpectedAiError('프로젝트 ID가 필요합니다.');
            return;
        }
        setIsImpactChatOpen(true);
        setExpectedAiError(null);
        if (expectedAiFeedback.trim()) {
            setImpactChatMessages(prev => [...prev, { role: 'user', text: expectedAiFeedback.trim() }]);
        }
        try {
            const res = await inferExpectedImpact({
                project_id: id,
                mode: aiMode,
                previous_output: expectedAiResult?.output,
                user_feedback: expectedAiFeedback || undefined,
                actor: 'dashboard',
            });
            setExpectedAiResult(res);
            const summaryParts = [
                `Tier: ${res.output?.tier ?? '-'}`,
                `Magnitude: ${res.output?.impact_magnitude ?? '-'}`,
                `Confidence: ${res.output?.confidence !== undefined ? Math.round((res.output.confidence || 0) * 100) + '%' : '-'}`,
            ];
            if (res.diff_summary) {
                summaryParts.push(`Diff: ${res.diff_summary}`);
            }
            setImpactChatMessages(prev => [...prev, { role: 'ai', text: summaryParts.join(' | ') }]);
            if (aiMode === 'preview' && res.output && mode === 'create') {
                setFormData(prev => ({ ...prev, expected_impact: res.output || null }));
            }
            if (aiMode === 'apply' && res.output) {
                setFormData(prev => ({ ...prev, expected_impact: res.output || null }));
                queryClient.invalidateQueries({ queryKey: queryKeys.project(id) });
                queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
            }
        } catch (err: any) {
            const detail = err?.response?.data?.detail || err?.message || 'Failed to run Expected Impact inference';
            setExpectedAiError(detail);
            setImpactChatMessages(prev => [...prev, { role: 'ai', text: `에러: ${detail}` }]);
        }
    };

    const handleHypothesisAi = async (aiMode: 'preview' | 'pending') => {
        if (!id) {
            setHypothesisAiError('프로젝트 ID가 필요합니다.');
            return;
        }
        setHypothesisAiError(null);
        try {
            const res = await inferHypothesisDraft({
                project_id: id,
                mode: aiMode,
                previous_output: hypothesisAiResult?.hypothesis_draft,
                user_feedback: hypothesisAiFeedback || undefined,
                actor: 'dashboard',
            });
            setHypothesisAiResult(res);
        } catch (err: any) {
            const detail = err?.response?.data?.detail || err?.message || 'Failed to run Hypothesis draft';
            setHypothesisAiError(detail);
        }
    };

    const renderExpectedAiCard = () => {
        const aiScore =
            (expectedAiResult?.calculated_fields as any)?.score ??
            (expectedAiResult?.calculated_fields as any)?.score_total ??
            (expectedAiResult?.output
                ? calculateExpectedScore(
                    expectedAiResult.output.tier,
                    expectedAiResult.output.impact_magnitude,
                    expectedAiResult.output.confidence
                ).score.toFixed(2)
                : null);

        return (
            <div className="border border-zinc-200 rounded-lg p-3 bg-white space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-zinc-800">AI Expected Impact</div>
                    {aiScore && (
                        <span className="text-xs text-zinc-600">A Score: {aiScore}</span>
                    )}
                </div>
                <div className="text-[11px] text-zinc-500">
                    제목/오너/트랙+컨텍스트(200자 이상)가 필요합니다. 기본 펜딩, 보조 즉시 적용(권한 조건).
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                    <button
                        type="button"
                        onClick={() => setIsImpactChatOpen(true)}
                        className="px-2 py-1 text-[11px] font-semibold rounded border border-zinc-200 bg-white hover:bg-zinc-50"
                    >
                        대화 패널 열기
                    </button>
                    <span className="text-zinc-400">AI 생성/피드백 흐름을 대화로 확인하세요.</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        disabled={!expectedEnabled || isInferringExpected}
                        onClick={() => handleExpectedAi('preview')}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40"
                    >
                        {isInferringExpected ? '생성 중...' : 'AI 생성'}
                    </button>
                    <button
                        type="button"
                        disabled={!expectedEnabled || isInferringExpected}
                        onClick={() => handleExpectedAi('pending')}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 disabled:opacity-40"
                    >
                        펜딩으로 보내기
                    </button>
                    <button
                        type="button"
                        disabled={!expectedEnabled || isInferringExpected}
                        onClick={() => handleExpectedAi('apply')}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-40"
                    >
                        즉시 적용
                    </button>
                </div>
                <textarea
                    value={expectedAiFeedback}
                    onChange={(e) => setExpectedAiFeedback(e.target.value)}
                    placeholder="피드백을 입력하고 AI 생성/재생성을 누르세요."
                    className="w-full min-h-[64px] px-2.5 py-2 text-xs border border-zinc-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                />
                {expectedAiError && (
                    <div className="text-xs text-red-500">{expectedAiError}</div>
                )}
                {expectedAiResult?.output && (
                    <div className="text-xs text-zinc-700 space-y-1 border border-zinc-100 rounded p-2 bg-zinc-50">
                        <div className="font-semibold text-zinc-800">미리보기</div>
                        <div>Tier: {expectedAiResult.output.tier}</div>
                        <div>Magnitude: {expectedAiResult.output.impact_magnitude}</div>
                        <div>Confidence: {Math.round((expectedAiResult.output.confidence || 0) * 100)}%</div>
                        {expectedAiResult.diff_summary && (
                            <div className="text-[11px] text-zinc-500">Diff: {expectedAiResult.diff_summary}</div>
                        )}
                    </div>
                )}
                {!expectedEnabled && (
                    <div className="text-[11px] text-zinc-500">{expectedDisabledReason}</div>
                )}
            </div>
        );
    };

    const renderHypothesisAiCard = () => (
        <div className="border border-zinc-200 rounded-lg p-3 bg-white space-y-2">
            <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-zinc-800">AI Hypothesis Draft</div>
                {hypothesisAiResult?.iteration ? (
                    <span className="text-xs text-zinc-600">iter {hypothesisAiResult.iteration}</span>
                ) : null}
            </div>
            <div className="text-[11px] text-zinc-500">
                제목/오너/트랙+컨텍스트(200자 이상)가 필요합니다. preview는 로컬 확인, pending은 리뷰 전송.
            </div>
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    disabled={!hypothesisEnabled || isInferringHypothesis}
                    onClick={() => handleHypothesisAi('preview')}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40"
                >
                    {isInferringHypothesis ? '생성 중...' : 'AI 초안'}
                </button>
                <button
                    type="button"
                    disabled={!hypothesisEnabled || isInferringHypothesis}
                    onClick={() => handleHypothesisAi('pending')}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 disabled:opacity-40"
                >
                    펜딩으로 보내기
                </button>
            </div>
            <textarea
                value={hypothesisAiFeedback}
                onChange={(e) => setHypothesisAiFeedback(e.target.value)}
                placeholder="피드백 입력 후 재생성 (선택)"
                className="w-full min-h-[64px] px-2.5 py-2 text-xs border border-zinc-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
            />
            {hypothesisAiError && (
                <div className="text-xs text-red-500">{hypothesisAiError}</div>
            )}
            {hypothesisAiResult?.hypothesis_draft && (
                <div className="text-xs text-zinc-700 space-y-1 border border-zinc-100 rounded p-2 bg-zinc-50">
                    <div className="font-semibold text-zinc-800">초안 미리보기</div>
                    <pre className="text-[11px] whitespace-pre-wrap break-words">
                        {JSON.stringify(hypothesisAiResult.hypothesis_draft, null, 2)}
                    </pre>
                </div>
            )}
            {!hypothesisEnabled && (
                <div className="text-[11px] text-zinc-500">{hypothesisDisabledReason}</div>
            )}
        </div>
    );

    const handleAskWhy = (field: 'tier' | 'magnitude' | 'confidence') => {
        const target = {
            tier: 'Tier가 왜 이렇게 나왔는지 설명해줘.',
            magnitude: 'Impact Magnitude가 왜 이렇게 나왔는지 설명해줘.',
            confidence: 'Confidence가 왜 이렇게 나왔는지 설명해줘.',
        }[field];
        setExpectedAiFeedback(target);
        handleExpectedAi('preview');
    };

    const renderImpactChatPanel = () => {
        if (!isImpactChatOpen) return null;
        return (
            <div className="fixed top-0 right-0 h-full w-[360px] border-l border-zinc-200 bg-white shadow-lg z-40 flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
                    <div className="text-sm font-semibold text-zinc-800">AI Expected Impact 대화</div>
                    <button
                        type="button"
                        onClick={() => setIsImpactChatOpen(false)}
                        className="text-xs text-zinc-500 hover:text-zinc-700"
                    >
                        닫기
                    </button>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 text-[11px] text-zinc-500 border-b border-zinc-200">
                    <span>필드별 근거:</span>
                    <button
                        type="button"
                        className="px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-50 text-[11px]"
                        onClick={() => handleAskWhy('tier')}
                    >
                        왜 Tier?
                    </button>
                    <button
                        type="button"
                        className="px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-50 text-[11px]"
                        onClick={() => handleAskWhy('magnitude')}
                    >
                        왜 Magnitude?
                    </button>
                    <button
                        type="button"
                        className="px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-50 text-[11px]"
                        onClick={() => handleAskWhy('confidence')}
                    >
                        왜 Confidence?
                    </button>
                </div>
                <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
                    {impactChatMessages.length === 0 && (
                        <div className="text-[11px] text-zinc-400">AI 생성 후 대화가 여기에 표시됩니다.</div>
                    )}
                    {impactChatMessages.map((msg, idx) => (
                        <div
                            key={`${msg.role}-${idx}`}
                            className={`rounded-md px-3 py-2 text-sm leading-relaxed ${
                                msg.role === 'ai'
                                    ? 'bg-zinc-100 text-zinc-800 border border-zinc-200'
                                    : 'bg-blue-50 text-blue-800 border border-blue-100'
                            }`}
                        >
                            <div className="text-[11px] uppercase tracking-wide mb-1 text-zinc-500">
                                {msg.role === 'ai' ? 'AI' : 'YOU'}
                            </div>
                            <div className="whitespace-pre-wrap break-words text-xs">{msg.text}</div>
                        </div>
                    ))}
                </div>
                <div className="border-t border-zinc-200 p-3 space-y-2">
                    <textarea
                        value={expectedAiFeedback}
                        onChange={(e) => setExpectedAiFeedback(e.target.value)}
                        placeholder="질문/피드백을 입력하세요. (예: Tier가 왜 strategic인지 설명해줘)"
                        className="w-full min-h-[64px] px-2.5 py-2 text-xs border border-zinc-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
                    />
                    <div className="flex justify-end">
                        <button
                            type="button"
                            disabled={isInferringExpected}
                            onClick={() => handleExpectedAi('preview')}
                            className="px-3 py-1.5 text-xs font-semibold rounded border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-50"
                        >
                            질문 보내기
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Edit/View mode - show project details (editable or read-only)
    if (mode !== 'create') {
        if (isLoadingProject || isDashboardLoading || !project || !dashboardData) {
            return (
                <div className="flex-1 flex items-center justify-center text-zinc-500">
                    {isLoadingProject || isDashboardLoading ? 'Loading...' : 'Project not found'}
                </div>
            );
        }

        // Helper: Handle field change (review mode calls onFieldChange + reviewMode.setFieldValue)
        const handleFieldChange = (field: keyof Project, value: any) => {
            if (isReviewMode) {
                onFieldChange?.(field, value);
                reviewMode?.setFieldValue(field, value);
            } else {
                // edit mode: direct update
                if (!id) return;
                updateProject({ id, data: { [field]: value } });
            }
        };

        // Helper: Get field value (review mode uses reviewMode.getFieldValue, others use project directly)
        const getFieldValue = (field: keyof Project) => {
            if (isReviewMode && reviewMode) {
                return reviewMode.getFieldValue(field);
            }
            return project?.[field];
        };

        // Helper: Combine individual reasonings for expected_impact
        // API returns reasoning like {tier: "...", impact_magnitude: "...", summary: "..."}
        // We combine them into a single string for display
        const getExpectedImpactReasoning = (): string | undefined => {
            if (!isReviewMode || !reasoning) return undefined;

            const parts: string[] = [];

            // summary is the main reasoning (if available)
            if (reasoning.summary) {
                parts.push(reasoning.summary);
            }

            // Add individual field reasonings if no summary
            if (parts.length === 0) {
                if (reasoning.tier) parts.push(`Tier: ${reasoning.tier}`);
                if (reasoning.impact_magnitude) parts.push(`Magnitude: ${reasoning.impact_magnitude}`);
                if (reasoning.confidence) parts.push(`Confidence: ${reasoning.confidence}`);
            }

            return parts.length > 0 ? parts.join(' ') : undefined;
        };

        // Helper: Get track/hypothesis reasoning
        const getTrackContributesReasoning = (): string | undefined => {
            if (!isReviewMode || !reasoning) return undefined;
            return reasoning.contributes || reasoning.track_contributes;
        };

        const getValidatesReasoning = (): string | undefined => {
            if (!isReviewMode || !reasoning) return undefined;
            return reasoning.validates || reasoning.primary_hypothesis_id;
        };



        return (
            <>
                <div className="flex-1 overflow-y-auto">
                {/* Title Section */}
                <div className="px-6 pb-2">
                    {isReadOnly ? (
                        <h2 className="text-xl font-bold text-zinc-900">{project.entity_name}</h2>
                    ) : (
                        <input
                            className="w-full text-xl font-bold bg-transparent border-none focus:ring-0 p-0 placeholder-zinc-400 text-zinc-900"
                            placeholder="Project Title"
                            defaultValue={getFieldValue('entity_name') as string}
                            onBlur={(e) => handleFieldChange('entity_name', e.target.value)}
                        />
                    )}
                </div>

                {/* Properties Grid */}
                <div className="px-6 py-4 grid grid-cols-[100px_1fr] gap-y-3 gap-x-4 text-sm">
                    {/* Status */}
                    <label className="text-zinc-500 py-1">Status</label>
                    <ReviewFieldWrapper
                        isSuggested={Boolean(isReviewMode && reviewMode?.isSuggested('status'))}
                        reasoning={isReviewMode ? reviewMode?.getReasoning('status') : undefined}
                    >
                        {isReadOnly ? (
                            <span className="inline-block px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-700 w-fit capitalize">
                                {getFieldValue('status') as string || 'todo'}
                            </span>
                        ) : (
                            <div className="py-1">
                                <ChipSelect
                                    options={statusOptions}
                                    value={(getFieldValue('status') as string) || 'todo'}
                                    onChange={(value) => handleFieldChange('status', value)}
                                    aria-label="Project status"
                                />
                            </div>
                        )}
                    </ReviewFieldWrapper>

                    {/* Owner */}
                    <label className="text-zinc-500 py-1">Owner</label>
                    <ReviewFieldWrapper
                        isSuggested={Boolean(isReviewMode && reviewMode?.isSuggested('owner'))}
                        reasoning={isReviewMode ? reviewMode?.getReasoning('owner') : undefined}
                    >
                        {isReadOnly ? (
                            <span className="text-zinc-700 py-1">
                                {String(dashboardData?.members?.find((m: any) => m.id === getFieldValue('owner'))?.name || getFieldValue('owner') || 'Unassigned')}
                            </span>
                        ) : (
                            <div className="py-1">
                                <ChipSelectExpand
                                    primaryOptions={coreMemberOptions}
                                    allOptions={memberOptions}
                                    value={getFieldValue('owner') as string || ''}
                                    onChange={(value) => handleFieldChange('owner', value)}
                                    allowUnassigned
                                    aria-label="Project owner"
                                />
                            </div>
                        )}
                    </ReviewFieldWrapper>

                    {/* Priority */}
                    <label className="text-zinc-500 py-1">Priority</label>
                    <ReviewFieldWrapper
                        isSuggested={Boolean(isReviewMode && reviewMode?.isSuggested('priority_flag'))}
                        reasoning={isReviewMode ? reviewMode?.getReasoning('priority_flag') : undefined}
                    >
                        {isReadOnly ? (
                            <span className="inline-block px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-700 w-fit capitalize">
                                {getFieldValue('priority_flag') as string || 'medium'}
                            </span>
                        ) : (
                            <div className="py-1">
                                <ChipSelect
                                    options={priorityOptions}
                                    value={(getFieldValue('priority_flag') as string) || 'medium'}
                                    onChange={(value) => handleFieldChange('priority_flag', value)}
                                    aria-label="Project priority"
                                />
                            </div>
                        )}
                    </ReviewFieldWrapper>

                    {/* Deadline */}
                    <label className="text-zinc-500 py-1">Deadline</label>
                    <ReviewFieldWrapper
                        isSuggested={Boolean(isReviewMode && reviewMode?.isSuggested('deadline'))}
                        reasoning={isReviewMode ? reviewMode?.getReasoning('deadline') : undefined}
                    >
                        {isReadOnly ? (
                            <span className="text-zinc-700 text-xs">{String(getFieldValue('deadline') || '-')}</span>
                        ) : (
                            <input
                                type="date"
                                className="border border-zinc-200 px-2 py-0.5 rounded bg-white text-zinc-700 text-xs w-fit focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none shadow-sm"
                                value={(getFieldValue('deadline') as string) || ''}
                                onChange={(e) => handleFieldChange('deadline', e.target.value || null)}
                            />
                        )}
                    </ReviewFieldWrapper>

                    {/* Track */}
                    <label className="text-zinc-500 py-1">Track</label>
                    {isReadOnly ? (
                        project.parent_id ? (
                            <div className="py-1">
                                <EntityChip
                                    label={dashboardData?.tracks?.find((t: any) => t.entity_id === project.parent_id)?.entity_name || project.parent_id}
                                    mode="link"
                                    color={trackColor}
                                    onNavigate={() => pushDrawer({ type: 'track', mode: 'view', id: project.parent_id! })}
                                />
                            </div>
                        ) : (
                            <span className="text-zinc-400 py-1">No Track</span>
                        )
                    ) : (
                        <div className="py-1">
                            <ChipSelectExpand
                                primaryOptions={trackOptions.slice(0, 4)}
                                allOptions={trackOptions}
                                value={project.parent_id || ''}
                                onChange={(value) => handleFieldChange('parent_id', value || null)}
                                allowUnassigned
                                unassignedLabel="No Track"
                                aria-label="Project track"
                            />
                        </div>
                    )}

                    {/* Program */}
                    <label className="text-zinc-500 py-1">Program</label>
                    {isReadOnly ? (
                        project.program_id ? (
                            <div className="py-1">
                                <EntityChip
                                    label={programs?.find((p) => p.entity_id === project.program_id)?.entity_name || project.program_id}
                                    color={programColor}
                                    // Programs don't have a drawer yet, but we keep the style
                                    mode="select"
                                />
                            </div>
                        ) : (
                            <span className="text-zinc-400 py-1">No Program</span>
                        )
                    ) : (
                        <div className="py-1">
                            {isProgramsLoading ? (
                                <span className="text-zinc-400 text-sm">Loading programs...</span>
                            ) : programsError ? (
                                <span className="text-red-500 text-sm">Error loading programs</span>
                            ) : (
                                <ChipSelectExpand
                                    primaryOptions={programOptions.slice(0, 4)}
                                    allOptions={programOptions}
                                    value={project.program_id || ''}
                                    onChange={(value) => handleFieldChange('program_id', value || null)}
                                    allowUnassigned
                                    unassignedLabel="No Program"
                                    aria-label="Project program"
                                />
                            )}
                        </div>
                    )}

                    {/* Expected Impact AI */}
                    <div className="col-span-2">
                        {renderExpectedAiCard()}
                    </div>

                    {/* Impact Section (A + B) */}
                    <div className="col-span-2">
                        <ImpactSection
                            expectedImpact={getFieldValue('expected_impact') as ExpectedImpact | undefined}
                            realizedImpact={getFieldValue('realized_impact') as RealizedImpact | undefined}
                            onExpectedChange={(impact) => handleFieldChange('expected_impact', impact)}
                            onRealizedChange={(impact) => handleFieldChange('realized_impact', impact)}
                            mode={mode}
                            readonly={isReadOnly}
                            reviewMode={isReviewMode ? {
                                isSuggested: (field) => reviewMode?.isSuggested(field) ?? false,
                                getReasoning: (field) => field === 'expected_impact' ? getExpectedImpactReasoning() : undefined,
                            } : undefined}
                        />
                    </div>

                    {/* Track Contributes */}
                    <label className="text-zinc-500 py-1">Track Contributes</label>
                    <ReviewFieldWrapper
                        isSuggested={Boolean(isReviewMode && reviewMode?.isSuggested('track_contributes'))}
                        reasoning={getTrackContributesReasoning()}
                    >
                        <TrackContributionEditor
                            tracks={dashboardData?.tracks || []}
                            value={(getFieldValue('track_contributes') as TrackContribution[]) || []}
                            onChange={(contribs) => handleFieldChange('track_contributes', contribs)}
                            onTrackClick={(trackId) => pushDrawer({ type: 'track', mode: 'view', id: trackId })}
                            readonly={isReadOnly}
                        />
                    </ReviewFieldWrapper>

                    {/* Hypothesis Validation */}
                    <label className="text-zinc-500 py-1">Hypotheses</label>
                    <ReviewFieldWrapper
                        isSuggested={Boolean(isReviewMode && (reviewMode?.isSuggested('validates') || reviewMode?.isSuggested('primary_hypothesis_id')))}
                        reasoning={getValidatesReasoning()}
                    >
                        <HypothesisSelector
                            hypotheses={dashboardData?.hypotheses || []}
                            validates={(getFieldValue('validates') as string[]) || []}
                            primaryHypothesisId={(getFieldValue('primary_hypothesis_id') as string | null) || null}
                            onValidatesChange={(ids) => handleFieldChange('validates', ids)}
                            onPrimaryChange={(id) => handleFieldChange('primary_hypothesis_id', id)}
                            onHypothesisClick={(hypId) => pushDrawer({ type: 'hypothesis', mode: 'view', id: hypId })}
                            readonly={isReadOnly}
                        />
                    </ReviewFieldWrapper>

                    {/* Hypothesis AI */}
                    <div className="col-span-2">
                        {renderHypothesisAiCard()}
                    </div>
                </div>

                {/* Tasks Section */}
                <div className="h-px bg-zinc-200 mx-6 my-2" />
                <div className="px-6 py-4">
                    <h3 className="text-sm font-semibold text-zinc-500 mb-3">
                        Tasks ({projectTasks.length})
                    </h3>

                    {projectTasks.length === 0 ? (
                        <p className="text-zinc-400 text-sm">No tasks in this project</p>
                    ) : (
                        <div className="space-y-2">
                            {taskStatuses.map((status: string) => {
                                const tasks = tasksByStatus[status] || [];
                                if (tasks.length === 0) return null;

                                return (
                                    <div key={status} className="border border-zinc-200 rounded-lg overflow-hidden">
                                        {/* Group Header */}
                                        <button
                                            type="button"
                                            onClick={() => toggleGroup(status)}
                                            className="w-full px-3 py-2 bg-zinc-50 hover:bg-zinc-100 transition-colors flex items-center justify-between text-sm font-medium text-zinc-700"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`text-base ${getStatusColor(status)}`}>
                                                    {expandedGroups[status] ? '▾' : '▸'}
                                                </span>
                                                <span className={`${getStatusColor(status)}`}>
                                                    {getStatusIcon(status)}
                                                </span>
                                                <span className="capitalize">{status}</span>
                                                <span className="text-zinc-400">({tasks.length})</span>
                                            </div>
                                        </button>

                                        {/* Task List */}
                                        {expandedGroups[status] && (
                                            <div className="divide-y divide-zinc-100">
                                                {tasks.map((task: any) => (
                                                    <div
                                                        key={task.entity_id}
                                                        onClick={() => handleTaskClick(task.entity_id)}
                                                        className="px-3 py-2 hover:bg-zinc-50 cursor-pointer transition-colors group"
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm text-zinc-900 group-hover:text-blue-600 transition-colors truncate">
                                                                    {task.entity_name}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    {task.assignee && (
                                                                        <span className="text-xs text-zinc-500">
                                                                            @{task.assignee}
                                                                        </span>
                                                                    )}
                                                                    {task.priority && (
                                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${task.priority === 'critical' ? 'bg-red-100 text-red-700' :
                                                                            task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                                                                task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                                                                                    'bg-zinc-100 text-zinc-600'
                                                                            }`}>
                                                                            {task.priority}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="h-px bg-zinc-200 mx-6 my-2" />

                {/* Hypothesis Text Section */}
                <div className="px-6 py-4 flex-1 flex flex-col">
                    <h3 className="text-sm font-semibold text-zinc-500 mb-2">Hypothesis</h3>
                    {isReadOnly ? (
                        (project as any).hypothesis_text ? (
                            <p className="text-zinc-700 text-sm leading-relaxed whitespace-pre-wrap">
                                {(project as any).hypothesis_text}
                            </p>
                        ) : (
                            <p className="text-zinc-400 text-sm">No hypothesis specified</p>
                        )
                    ) : (
                        <textarea
                            className="w-full min-h-[100px] border border-zinc-200 p-3 rounded bg-white text-sm leading-relaxed focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none text-zinc-800"
                            defaultValue={(project as any).hypothesis_text || ''}
                            onBlur={(e) => handleFieldChange('hypothesis_text' as keyof Project, e.target.value)}
                            placeholder="Enter project hypothesis..."
                        />
                    )}
                </div>

                {/* Body/Description Editor */}
                <div className="h-px bg-zinc-200 mx-6 my-2" />
                <div className="px-6 py-4 flex-1 flex flex-col">
                    <h3 className="text-sm font-semibold text-zinc-500 mb-2">Description</h3>
                    <MarkdownEditor
                        value={(project as any)._body || ''}
                        onChange={(markdown) => !isReadOnly && handleFieldChange('body' as keyof Project, markdown)}
                        readOnly={isReadOnly}
                        minHeight="200px"
                        placeholder={isReadOnly ? '' : '프로젝트 설명을 작성하세요...'}
                    />
                </div>
                </div>
                {renderImpactChatPanel()}
            </>
        );
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        // Validation
        if (!formData.entity_name.trim()) {
            setFormError('Project name is required');
            return;
        }
        if (!formData.owner) {
            setFormError('Owner is required');
            return;
        }
        if (!hasHypotheses) {
            setFormError('등록된 가설이 없습니다. 먼저 가설을 생성하세요.');
            return;
        }
        if (!formData.expected_impact) {
            setFormError('Expected Impact를 입력하세요.');
            return;
        }
        if (formData.validates.length === 0) {
            setFormError('가설을 1개 이상 선택하세요.');
            return;
        }
        if (!formData.primary_hypothesis_id) {
            setFormError('Primary hypothesis를 선택하세요.');
            return;
        }
        if (!formData.validates.includes(formData.primary_hypothesis_id)) {
            setFormError('Primary hypothesis는 선택한 가설 중 하나여야 합니다.');
            return;
        }

        createProject(
            {
                ...formData,
                parent_id: formData.parent_id || undefined,
                program_id: formData.program_id || undefined,
                expected_impact: formData.expected_impact,
                validates: formData.validates,
                primary_hypothesis_id: formData.primary_hypothesis_id,
                conditions_3y: [],
                autofill_expected_impact: false,
            },
            {
                onSuccess: () => {
                    closeEntityDrawer();
                },
                onError: (err: any) => {
                    setFormError(err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to create project');
                }
            }
        );
    };

    return (
        <>
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
                    <label className="block text-sm font-medium text-zinc-700">Project Name *</label>
                    <input
                        type="text"
                        autoFocus
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder-zinc-400"
                        placeholder="Enter project name"
                        value={formData.entity_name}
                        onChange={e => setFormData(prev => ({ ...prev, entity_name: e.target.value }))}
                    />
                </div>

                {/* Owner */}
                <div className="space-y-1.5">
                    <ChipSelectExpand
                        primaryOptions={coreMemberOptions}
                        allOptions={memberOptions}
                        value={formData.owner}
                        onChange={(value) => setFormData(prev => ({ ...prev, owner: value }))}
                        allowUnassigned
                        label="Owner *"
                    />
                </div>

                {/* Track */}
                <div className="space-y-1.5">
                    <ChipSelectExpand
                        primaryOptions={trackOptions.slice(0, 4)}
                        allOptions={trackOptions}
                        value={formData.parent_id}
                        onChange={(value) => setFormData(prev => ({ ...prev, parent_id: value }))}
                        allowUnassigned
                        unassignedLabel="None"
                        label="Track (Optional)"
                    />
                </div>

                {/* Program */}
                <div className="space-y-1.5">
                    {isProgramsLoading ? (
                        <>
                            <label className="block text-sm font-medium text-zinc-700">Program (Optional)</label>
                            <span className="text-zinc-400 text-sm">Loading programs...</span>
                        </>
                    ) : programsError ? (
                        <>
                            <label className="block text-sm font-medium text-zinc-700">Program (Optional)</label>
                            <span className="text-red-500 text-sm">Error loading programs</span>
                        </>
                    ) : (
                        <ChipSelectExpand
                            primaryOptions={programOptions.slice(0, 4)}
                            allOptions={programOptions}
                            value={formData.program_id || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, program_id: value || null }))}
                            allowUnassigned
                            unassignedLabel="None"
                            label="Program (Optional)"
                        />
                    )}
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                    <ChipSelect
                        options={statusOptions}
                        value={formData.status}
                        onChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                        label="Status"
                    />
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                    <ChipSelect
                        options={priorityOptions}
                        value={formData.priority_flag}
                        onChange={(value) => setFormData(prev => ({ ...prev, priority_flag: value }))}
                        label="Priority"
                    />
                </div>

                {/* Expected Impact AI */}
                {renderExpectedAiCard()}

                {/* Expected Impact (Required) */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <label className="block text-sm font-medium text-zinc-700">Expected Impact *</label>
                        {expectedScore && (
                            <span className="text-xs text-zinc-600">A Score: {expectedScore}</span>
                        )}
                    </div>
                    <ImpactSection
                        expectedImpact={formData.expected_impact || undefined}
                        realizedImpact={undefined}
                        onExpectedChange={(impact) => setFormData(prev => ({ ...prev, expected_impact: impact }))}
                        onRealizedChange={(_impact) => {}}
                        mode="create"
                    />
                </div>

                {/* Hypotheses (Required) */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <label className="block text-sm font-medium text-zinc-700">Hypotheses *</label>
                        {!hasHypotheses && !isDashboardLoading && (
                            <span className="text-xs text-red-500">가설이 없습니다. 먼저 생성하세요.</span>
                        )}
                    </div>
                    {isDashboardLoading ? (
                        <span className="text-sm text-zinc-400">Hypotheses 불러오는 중...</span>
                    ) : !hasHypotheses ? (
                        <div className="text-sm text-zinc-500">
                            등록된 가설이 없습니다. 새 가설을 만든 뒤 프로젝트를 생성하세요.
                        </div>
                    ) : (
                        <HypothesisSelector
                            hypotheses={dashboardData?.hypotheses || []}
                            validates={formData.validates}
                            primaryHypothesisId={formData.primary_hypothesis_id || null}
                            onValidatesChange={(validates) => setFormData(prev => ({ ...prev, validates }))}
                            onPrimaryChange={(primary) => setFormData(prev => ({ ...prev, primary_hypothesis_id: primary || '' }))}
                            onHypothesisClick={(hypId) => pushDrawer({ type: 'hypothesis', mode: 'view', id: hypId })}
                        />
                    )}
                </div>

                {/* Hypothesis AI */}
                {renderHypothesisAiCard()}

                {/* Description */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700">Description (Optional)</label>
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
                    disabled={isPending || !isFormValid}
                    className="px-3 py-1.5 text-xs font-semibold !bg-[#f0f9ff] hover:!bg-[#e0f2fe] !text-[#082f49] border border-[#bae6fd] rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? 'Creating...' : 'Create Project'}
                    </button>
                </div>
            </form>
            {renderImpactChatPanel()}
        </>
    );
};
