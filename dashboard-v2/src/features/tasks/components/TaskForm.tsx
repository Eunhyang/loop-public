import { useState, useMemo } from 'react';
import { useTask, useUpdateTask, useCreateTask, useParseTaskNL } from '@/features/tasks/queries';
import { useDashboardInit } from '@/queries/useDashboardInit';
import { useUi } from '@/contexts/UiContext';
import { useToast } from '@/contexts/ToastContext';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { ChipSelect, type ChipOption } from '@/components/common/ChipSelect';
import { ChipSelectExpand } from '@/components/common/ChipSelectExpand';
import { statusColors, priorityColors, taskTypeColors, memberColor, projectColor, getColor } from '@/components/common/chipColors';
import { CORE_ROLES } from '@/features/tasks/selectors';
import { ReviewFieldWrapper } from '@/components/common/ReviewFieldWrapper';
import { useReviewMode } from '@/hooks/useReviewMode';
import { LinkEditor } from './LinkEditor';
import { AttachmentPanel } from './AttachmentPanel';
import { CommentSection } from '@/features/comments';
import type { Task } from '@/types';

// Task body templates for Create and Edit mode
type TemplateType = 'default' | 'simple' | 'dev' | 'bug' | 'meeting';
type TaskType = NonNullable<Task['type']>; // 'dev' | 'bug' | 'strategy' | 'research' | 'ops' | 'meeting'

const TASK_TEMPLATES: Record<TemplateType, { label: string; content: string; showFor: 'all' | TaskType[] }> = {
    default: {
        label: 'Default',
        showFor: 'all',
        content: `## 목표

-

---

## 작업 내용

-

---

## 완료 기록

-`
    },
    simple: {
        label: 'Simple',
        showFor: 'all',
        content: `## Todo

- [ ]

---

## Done

-`
    },
    dev: {
        label: 'Dev Task',
        showFor: ['dev'],
        content: `## 목표

**완료 조건**:
1.

---

## 상세 내용

### 배경


### 작업 내용


---

## 체크리스트

- [ ] 구현 완료
- [ ] 테스트 통과
- [ ] 빌드 성공

---

## Notes

### Todo
- [ ]

### 작업 로그
`
    },
    bug: {
        label: 'Bug Report',
        showFor: ['bug'],
        content: `## Bug 설명

**증상**:


**재현 단계**:
1.
2.
3.

**예상 동작**:


**실제 동작**:


---

## 환경

- Browser:
- OS:
- Version:

---

## 해결 방안

### 원인 분석


### 수정 내용


---

## 검증

- [ ] 버그 재현 불가 확인
- [ ] 회귀 테스트 통과
`
    },
    meeting: {
        label: 'Meeting Notes',
        showFor: ['meeting'],
        content: `## Meeting Info

- Date:
- Attendees:
- Duration:

---

## Agenda

1.
2.
3.

---

## Discussion

### Topic 1


### Topic 2


---

## Action Items

- [ ] [@Person]
- [ ] [@Person]

---

## Next Meeting

- Date:
- Agenda:
`
    }
};

// Helper: Filter templates by task type
// Note: 'strategy', 'research', 'ops' types will only see 'all' templates (intentional)
const filterTemplatesByType = (type: Task['type'] | undefined): [TemplateType, typeof TASK_TEMPLATES[TemplateType]][] => {
    const taskType: TaskType = type ?? 'dev'; // Default to 'dev' if null/undefined
    return Object.entries(TASK_TEMPLATES).filter(([_, template]) => {
        return template.showFor === 'all' ||
            (Array.isArray(template.showFor) && template.showFor.includes(taskType));
    }) as [TemplateType, typeof TASK_TEMPLATES[TemplateType]][];
};

interface TaskFormProps {
    mode: 'create' | 'edit' | 'view' | 'review';
    id?: string;
    prefill?: Partial<Task>;
    // Review mode props (optional, only used when mode='review')
    suggestedFields?: Record<string, unknown>;
    reasoning?: Record<string, string>;
    onRelationClick?: (id: string, type: string) => void;
    onFieldChange?: (field: string, value: unknown) => void;
}

export const TaskForm = ({ mode, id, prefill, suggestedFields, reasoning, onRelationClick, onFieldChange }: TaskFormProps) => {
    // view/edit/review 모두 useTask로 전체 데이터 로드
    const { data: task, isLoading } = useTask(mode !== 'create' ? id || null : null);
    const { mutate: updateTask } = useUpdateTask();
    const { mutate: createTask, isPending, error } = useCreateTask();
    const { data: dashboardData } = useDashboardInit();
    const { pushDrawer, closeEntityDrawer } = useUi();
    const { showToast } = useToast();

    const isReadOnly = mode === 'view';
    const isReviewMode = mode === 'review';

    // Review mode hook (always called, but only active when mode='review')
    const reviewMode = useReviewMode({
        enabled: isReviewMode,
        entityData: task as Record<string, unknown> | null | undefined,
        suggestedFields,
        reasoning,
    });

    // Create mode form state - default dates to today
    const today = new Date().toISOString().split('T')[0];
    const [createFormData, setCreateFormData] = useState({
        entity_name: prefill?.entity_name || '',
        project_id: prefill?.project_id || '',
        assignee: prefill?.assignee || '',
        priority: prefill?.priority || 'medium',
        status: prefill?.status || 'todo',
        type: prefill?.type || 'dev',
        start_date: prefill?.start_date || today,
        due: prefill?.due || today,
        notes: prefill?.notes || TASK_TEMPLATES.default.content,
    });

    const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('default');
    const [formError, setFormError] = useState<string | null>(null);

    // AI Natural Language Parsing
    const [nlInput, setNlInput] = useState('');
    const { mutate: parseNL, isPending: isParsing } = useParseTaskNL();

    // For edit mode, use task data
    const formData = mode === 'create' ? prefill : task;

    // Chip options for status and priority
    const statusOptions: ChipOption[] = [
        { value: 'todo', label: 'To Do', color: getColor('todo', statusColors) },
        { value: 'doing', label: 'Doing', color: getColor('doing', statusColors) },
        { value: 'hold', label: 'Hold', color: getColor('hold', statusColors) },
        { value: 'blocked', label: 'Blocked', color: getColor('blocked', statusColors) },
        { value: 'done', label: 'Done', color: getColor('done', statusColors) },
    ];

    const priorityOptions: ChipOption[] = [
        { value: 'critical', label: 'Critical', color: getColor('critical', priorityColors) },
        { value: 'high', label: 'High', color: getColor('high', priorityColors) },
        { value: 'medium', label: 'Medium', color: getColor('medium', priorityColors) },
        { value: 'low', label: 'Low', color: getColor('low', priorityColors) },
    ];

    const typeOptions: ChipOption[] = useMemo(() => {
        const types = dashboardData?.constants?.task?.types || ['dev', 'bug', 'strategy', 'research', 'ops', 'meeting'];
        return types.map((t: string) => ({
            value: t,
            label: t.charAt(0).toUpperCase() + t.slice(1),
            color: getColor(t, taskTypeColors),
        }));
    }, [dashboardData?.constants?.task?.types]);

    // Member options (for assignee ChipSelectExpand)
    // Filter: active members only, exclude role="Unassigned" (미정)
    const memberOptions: ChipOption[] = useMemo(() => {
        return (dashboardData?.members || [])
            .filter((m: any) => m.active !== false && m.role !== 'Unassigned')
            .map((m: any) => ({
                value: m.name, // TaskForm uses m.name (not m.id)
                label: m.name,
                color: memberColor,
            }));
    }, [dashboardData?.members]);

    const coreMemberOptions: ChipOption[] = useMemo(() => {
        return memberOptions.filter(opt => {
            const member = dashboardData?.members?.find((m: any) => m.name === opt.value);
            return member && CORE_ROLES.includes(member.role);
        });
    }, [memberOptions, dashboardData?.members]);

    // Project options (for project ChipSelectExpand)
    const projectOptions: ChipOption[] = useMemo(() => {
        return (dashboardData?.projects || []).map((p: any) => ({
            value: p.entity_id,
            label: p.entity_name || p.entity_id,
            color: projectColor,
        }));
    }, [dashboardData?.projects]);

    // Primary projects (show up to 6, or all if <= 6)
    const primaryProjectOptions: ChipOption[] = useMemo(() => {
        return projectOptions.slice(0, 6);
    }, [projectOptions]);

    // view/edit/review 모드 로딩 처리
    if ((mode === 'edit' || mode === 'view' || mode === 'review') && (isLoading || !task)) {
        return <div className="flex-1 flex items-center justify-center text-zinc-500">Loading...</div>;
    }

    // Helper: Get field value (review mode uses reviewMode.getFieldValue, others use task directly)
    const getFieldValue = (field: keyof Task) => {
        if (isReviewMode && reviewMode) {
            return reviewMode.getFieldValue(field);
        }
        return formData?.[field];
    };

    // Helper: Handle field change (review mode calls onFieldChange + reviewMode.setFieldValue)
    const handleFieldChangeInternal = (field: keyof Task, value: any) => {
        if (isReviewMode && reviewMode) {
            reviewMode.setFieldValue(field, value);
            onFieldChange?.(field, value);
        } else if (!isReadOnly) {
            handleUpdate(field, value);
        }
    };

    // Helper: Handle relation click (review mode uses onRelationClick, others use pushDrawer)
    const handleRelationClickInternal = (id: string, type: string) => {
        if (isReviewMode && onRelationClick) {
            onRelationClick(id, type);
        } else {
            pushDrawer({ type: type as any, mode: 'view', id });
        }
    };

    const handleParseLLM = () => {
        if (!nlInput.trim()) {
            showToast('Please enter text to parse', 'error');
            return;
        }

        parseNL(nlInput, {
            onSuccess: (result) => {
                if (result.success && result.parsed_fields) {
                    // Merge parsed fields into form data, filtering out undefined/null
                    const updates: any = {};
                    if (result.parsed_fields.entity_name) updates.entity_name = result.parsed_fields.entity_name;
                    if (result.parsed_fields.project_id) updates.project_id = result.parsed_fields.project_id;
                    if (result.parsed_fields.assignee) updates.assignee = result.parsed_fields.assignee;
                    if (result.parsed_fields.priority) updates.priority = result.parsed_fields.priority;
                    if (result.parsed_fields.status) updates.status = result.parsed_fields.status;
                    if (result.parsed_fields.type) updates.type = result.parsed_fields.type;
                    if (result.parsed_fields.due) updates.due = result.parsed_fields.due;
                    if (result.parsed_fields.notes) updates.notes = result.parsed_fields.notes;

                    setCreateFormData(prev => ({
                        ...prev,
                        ...updates,
                    }));
                    showToast('Fields auto-filled from natural language', 'success');
                    setNlInput(''); // Clear input after successful parse
                } else {
                    showToast('Failed to parse text', 'error');
                }
            },
            onError: (err: any) => {
                showToast(
                    err.response?.data?.detail || 'Failed to parse text',
                    'error'
                );
            },
        });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        // Validation
        if (!createFormData.entity_name.trim()) {
            setFormError('Task name is required');
            return;
        }
        if (!createFormData.project_id) {
            setFormError('Project is required');
            return;
        }
        if (!createFormData.assignee) {
            setFormError('Assignee is required');
            return;
        }

        createTask(
            createFormData,
            {
                onSuccess: () => {
                    closeEntityDrawer();
                },
                onError: (err: any) => {
                    setFormError(err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to create task');
                }
            }
        );
    };

    if (mode === 'create') {
        return (
            <form onSubmit={handleCreate} className="flex flex-col h-full min-h-0">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Error Message */}
                    {(formError || error) && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200">
                            {formError || (error as any)?.message}
                        </div>
                    )}

                    {/* AI Natural Language Input */}
                    <div className="p-3 bg-zinc-50 border border-zinc-200 rounded">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                AI Assistant
                            </label>
                        </div>
                        <div className="relative">
                            <textarea
                                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded text-sm text-zinc-900 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none placeholder-zinc-400 resize-none min-h-[100px] pr-10 pb-8"
                                placeholder="자연어로 입력하세요... (예: @홍길동 내일까지 로그인 버그 수정 high)"
                                rows={3}
                                value={nlInput}
                                onChange={e => setNlInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && e.metaKey) {
                                        e.preventDefault();
                                        handleParseLLM();
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={handleParseLLM}
                                disabled={isParsing || !nlInput.trim()}
                                className="absolute bottom-2 right-2 p-1.5 bg-zinc-900 text-white rounded-md hover:bg-black disabled:bg-zinc-100 disabled:text-zinc-400 disabled:cursor-not-allowed transition-all shadow-md group"
                                title="AI Fill (Cmd+Enter)"
                            >
                                {isParsing ? (
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-zinc-700">Task Name *</label>
                        <input
                            type="text"
                            autoFocus
                            className="w-full px-3 py-2 bg-white border border-zinc-300 rounded text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder-zinc-400"
                            placeholder="Enter task name"
                            value={createFormData.entity_name}
                            onChange={e => setCreateFormData(prev => ({ ...prev, entity_name: e.target.value }))}
                        />
                    </div>

                    {/* Project */}
                    <div className="space-y-1.5">
                        {projectOptions.length > 6 ? (
                            <ChipSelectExpand
                                primaryOptions={primaryProjectOptions}
                                allOptions={projectOptions}
                                value={createFormData.project_id}
                                onChange={(value) => setCreateFormData(prev => ({ ...prev, project_id: value }))}
                                label="Project *"
                            />
                        ) : (
                            <ChipSelect
                                options={projectOptions}
                                value={createFormData.project_id}
                                onChange={(value) => setCreateFormData(prev => ({ ...prev, project_id: value }))}
                                label="Project *"
                            />
                        )}
                    </div>

                    {/* Assignee */}
                    <div className="space-y-1.5">
                        <ChipSelectExpand
                            primaryOptions={coreMemberOptions}
                            allOptions={memberOptions}
                            value={createFormData.assignee}
                            onChange={(value) => setCreateFormData(prev => ({ ...prev, assignee: value }))}
                            allowUnassigned
                            label="Assignee *"
                        />
                    </div>

                    {/* Status */}
                    <div className="space-y-1.5">
                        <ChipSelect
                            options={statusOptions}
                            value={createFormData.status}
                            onChange={(value) => setCreateFormData(prev => ({ ...prev, status: value as any }))}
                            label="Status"
                        />
                    </div>

                    {/* Priority */}
                    <div className="space-y-1.5">
                        <ChipSelect
                            options={priorityOptions}
                            value={createFormData.priority}
                            onChange={(value) => setCreateFormData(prev => ({ ...prev, priority: value as any }))}
                            label="Priority"
                        />
                    </div>

                    {/* Type */}
                    <div className="space-y-1.5">
                        <ChipSelect
                            options={typeOptions}
                            value={createFormData.type}
                            onChange={(value) => setCreateFormData(prev => ({ ...prev, type: value as any }))}
                            label="Type"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Start Date */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-zinc-700">Start Date</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                value={createFormData.start_date}
                                onChange={e => setCreateFormData(prev => ({ ...prev, start_date: e.target.value }))}
                            />
                        </div>

                        {/* Due Date */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-zinc-700">Due Date</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                value={createFormData.due}
                                onChange={e => setCreateFormData(prev => ({ ...prev, due: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Template Selector */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-zinc-700">Notes Template</label>
                        <div className="flex gap-2">
                            {filterTemplatesByType(createFormData.type).map(([key, template]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => {
                                        const currentNotes = createFormData.notes?.trim() || '';
                                        if (currentNotes && !window.confirm('기존 내용이 삭제됩니다. 템플릿을 적용하시겠습니까?')) {
                                            return;
                                        }
                                        setSelectedTemplate(key);
                                        setCreateFormData(prev => ({ ...prev, notes: template.content }));
                                    }}
                                    className={`px-3 py-1 text-xs rounded transition-colors ${selectedTemplate === key
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                                        }`}
                                >
                                    {template.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes Field */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-zinc-700">Notes</label>
                        <MarkdownEditor
                            value={createFormData.notes || ''}
                            onChange={(markdown) => setCreateFormData(prev => ({ ...prev, notes: markdown }))}
                            minHeight="200px"
                            placeholder="Add notes or select a template..."
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
                        className="px-3 py-1.5 text-xs font-semibold !bg-[#f0f9ff] hover:!bg-[#e0f2fe] !text-[#082f49] border border-[#bae6fd] rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending ? 'Creating...' : 'Create Task'}
                    </button>
                </div>
            </form>
        );
    }

    const handleUpdate = (field: keyof Task, value: any) => {
        if (!id) return;
        updateTask({ id, data: { [field]: value } });
    };



    const handleNotesBlur = () => {
        // Autosave is handled by MarkdownEditor's internal debounce
        // This is called after the debounced onChange
    };

    return (
        <div className="flex-1 overflow-y-auto">
            {/* Title Section */}
            <div className="px-6 pb-2">
                {isReadOnly ? (
                    <h2 className="text-xl font-bold text-zinc-900">{formData?.entity_name}</h2>
                ) : (
                    <input
                        className="w-full text-xl font-bold bg-transparent border-none focus:ring-0 p-0 placeholder-zinc-400 text-zinc-900"
                        placeholder="Task Title"
                        defaultValue={formData?.entity_name}
                        onBlur={(e) => handleUpdate('entity_name', e.target.value)}
                    />
                )}
            </div>



            {/* Properties Grid */}
            <div className="px-6 py-4 grid grid-cols-[100px_1fr] gap-y-3 gap-x-4 text-sm">
                {/* Status */}
                <label className="text-zinc-500 py-1">Status</label>
                <ReviewFieldWrapper
                    isSuggested={isReviewMode && reviewMode ? reviewMode.isSuggested('status') : false}
                    reasoning={isReviewMode && reviewMode ? reviewMode.getReasoning('status') : undefined}
                >
                    {isReadOnly ? (
                        <span className="inline-block px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-700 w-fit capitalize">
                            {String(getFieldValue('status') || '')}
                        </span>
                    ) : (
                        <div className="py-1">
                            <ChipSelect
                                options={statusOptions}
                                value={(getFieldValue('status') as string) || 'todo'}
                                onChange={(value) => handleFieldChangeInternal('status', value)}
                                aria-label="Task status"
                            />
                        </div>
                    )}
                </ReviewFieldWrapper>

                {/* Priority */}
                <label className="text-zinc-500 py-1">Priority</label>
                <ReviewFieldWrapper
                    isSuggested={isReviewMode && reviewMode ? reviewMode.isSuggested('priority') : false}
                    reasoning={isReviewMode && reviewMode ? reviewMode.getReasoning('priority') : undefined}
                >
                    {isReadOnly ? (
                        <span className="inline-block px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-700 w-fit capitalize">
                            {String(getFieldValue('priority') || 'medium')}
                        </span>
                    ) : (
                        <div className="py-1">
                            <ChipSelect
                                options={priorityOptions}
                                value={(getFieldValue('priority') as string) || 'medium'}
                                onChange={(value) => handleFieldChangeInternal('priority', value)}
                                aria-label="Task priority"
                            />
                        </div>
                    )}
                </ReviewFieldWrapper>

                {/* Type */}
                <label className="text-zinc-500 py-1">Type</label>
                <div className="py-1">
                    <ChipSelect
                        options={typeOptions}
                        value={(getFieldValue('type') as string) || 'dev'}
                        onChange={(value) => {
                            if (!id) return;
                            handleFieldChangeInternal('type', value);
                        }}
                    />
                </div>

                {/* Assignee */}
                <label className="text-zinc-500 py-1">Assignee</label>
                <ReviewFieldWrapper
                    isSuggested={isReviewMode && reviewMode ? reviewMode.isSuggested('assignee') : false}
                    reasoning={isReviewMode && reviewMode ? reviewMode.getReasoning('assignee') : undefined}
                >
                    {isReadOnly ? (
                        <span className="text-zinc-700">{String(getFieldValue('assignee') || '-')}</span>
                    ) : (
                        <div className="py-1">
                            <ChipSelectExpand
                                primaryOptions={coreMemberOptions}
                                allOptions={memberOptions}
                                value={(getFieldValue('assignee') as string) || ''}
                                onChange={(value) => handleFieldChangeInternal('assignee', value)}
                                allowUnassigned
                                aria-label="Task assignee"
                            />
                        </div>
                    )}
                </ReviewFieldWrapper>

                {/* Project */}
                <label className="text-zinc-500 py-1">Project</label>
                <ReviewFieldWrapper
                    isSuggested={isReviewMode && reviewMode ? reviewMode.isSuggested('project_id') : false}
                    reasoning={isReviewMode && reviewMode ? reviewMode.getReasoning('project_id') : undefined}
                >
                    {isReadOnly ? (
                        <span className="inline-block px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-700 w-fit">
                            {String(dashboardData?.projects?.find((p: any) => p.entity_id === getFieldValue('project_id'))?.entity_name || getFieldValue('project_id') || '-')}
                        </span>
                    ) : projectOptions.length > 6 ? (
                        <div className="py-1">
                            <ChipSelectExpand
                                primaryOptions={primaryProjectOptions}
                                allOptions={projectOptions}
                                value={(getFieldValue('project_id') as string) || ''}
                                onChange={(value) => handleFieldChangeInternal('project_id', value)}
                                aria-label="Task project"
                            />
                        </div>
                    ) : (
                        <div className="py-1">
                            <ChipSelect
                                options={projectOptions}
                                value={(getFieldValue('project_id') as string) || ''}
                                onChange={(value) => handleFieldChangeInternal('project_id', value)}
                                aria-label="Task project"
                            />
                        </div>
                    )}
                </ReviewFieldWrapper>

                {/* Date Fields */}
                <label className="text-zinc-500 py-1">Start Date</label>
                <ReviewFieldWrapper
                    isSuggested={isReviewMode && reviewMode ? reviewMode.isSuggested('start_date') : false}
                    reasoning={isReviewMode && reviewMode ? reviewMode.getReasoning('start_date') : undefined}
                >
                    {isReadOnly ? (
                        <span className="text-zinc-700">{String(getFieldValue('start_date') || '-')}</span>
                    ) : (
                        <input
                            type="date"
                            className="border border-zinc-200 px-2 py-0.5 rounded bg-white text-zinc-700 text-xs w-fit focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none shadow-sm"
                            value={(getFieldValue('start_date') as string) || ''}
                            onChange={(e) => handleFieldChangeInternal('start_date', e.target.value)}
                        />
                    )}
                </ReviewFieldWrapper>

                <label className="text-zinc-500 py-1">Due Date</label>
                <ReviewFieldWrapper
                    isSuggested={isReviewMode && reviewMode ? reviewMode.isSuggested('due') : false}
                    reasoning={isReviewMode && reviewMode ? reviewMode.getReasoning('due') : undefined}
                >
                    {isReadOnly ? (
                        <span className="text-zinc-700 text-xs">{String(getFieldValue('due') || '-')}</span>
                    ) : (
                        <input
                            type="date"
                            className="border border-zinc-200 px-2 py-0.5 rounded bg-white text-zinc-700 text-xs w-fit focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none shadow-sm"
                            value={(getFieldValue('due') as string) || ''}
                            onChange={(e) => handleFieldChangeInternal('due', e.target.value)}
                        />
                    )}
                </ReviewFieldWrapper>

                {/* Relations - Project */}
                {Boolean(getFieldValue('project_id')) && (
                    <>
                        <label className="text-zinc-500 py-1">Project</label>
                        <span
                            className="inline-block px-2 py-0.5 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-700 w-fit cursor-pointer hover:bg-zinc-100 hover:border-zinc-300 transition-colors"
                            onClick={() => handleRelationClickInternal(getFieldValue('project_id') as string, 'project')}
                        >
                            {String(dashboardData?.projects?.find((p: any) => p.entity_id === getFieldValue('project_id'))?.entity_name || getFieldValue('project_id'))}
                        </span>
                    </>
                )}

                {/* Relations - Track (via Project) */}
                {Boolean(getFieldValue('project_id')) && dashboardData?.projects && (() => {
                    const project = dashboardData.projects.find((p: any) => p.entity_id === getFieldValue('project_id'));
                    const trackId = project?.parent_id;
                    const track = trackId ? dashboardData.tracks?.find((t: any) => t.entity_id === trackId) : null;
                    return track ? (
                        <>
                            <label className="text-zinc-500 py-1">Track</label>
                            <span
                                className="inline-block px-2 py-0.5 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-700 w-fit cursor-pointer hover:bg-zinc-100 hover:border-zinc-300 transition-colors"
                                onClick={() => handleRelationClickInternal(trackId!, 'track')}
                            >
                                {track.entity_name}
                            </span>
                        </>
                    ) : null;
                })()}

                {/* Relations - Conditions */}
                {Array.isArray(getFieldValue('conditions_3y')) && (getFieldValue('conditions_3y') as string[]).length > 0 && (
                    <>
                        <label className="text-zinc-500 py-1">Conditions</label>
                        <div className="flex flex-wrap gap-1">
                            {(getFieldValue('conditions_3y') as string[]).map((condId: string) => {
                                const condition = dashboardData?.conditions?.find((c: any) => c.entity_id === condId);
                                return (
                                    <span
                                        key={condId}
                                        className="inline-block px-2 py-0.5 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-700 cursor-pointer hover:bg-zinc-100 hover:border-zinc-300 transition-colors"
                                        onClick={() => handleRelationClickInternal(condId, 'condition')}
                                    >
                                        {condition?.entity_name || condId}
                                    </span>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Relations - Validates */}
                {Array.isArray(getFieldValue('validates')) && (getFieldValue('validates') as string[]).length > 0 && (
                    <>
                        <label className="text-zinc-500 py-1">Validates</label>
                        <div className="flex flex-wrap gap-1">
                            {(getFieldValue('validates') as string[]).map((hypId: string) => (
                                <span
                                    key={hypId}
                                    className="inline-block px-2 py-0.5 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-700 cursor-pointer hover:bg-zinc-100 hover:border-zinc-300 transition-colors"
                                    onClick={() => handleRelationClickInternal(hypId, 'hypothesis')}
                                >
                                    {dashboardData?.hypotheses?.find((h: any) => h.entity_id === hypId)?.entity_name || hypId}
                                </span>
                            ))}
                        </div>
                    </>
                )}

                {/* Links (editable) */}
                <label className="text-zinc-500 py-1">Links</label>
                <LinkEditor
                    links={(getFieldValue('links') as Array<{ label: string; url: string }>) || []}
                    onChange={(newLinks) => {
                        if (!id) return;
                        handleFieldChangeInternal('links', newLinks);
                    }}
                    readOnly={isReadOnly}
                />

                {/* GitHub Integration - PR URL & Commit */}
                {(getFieldValue('pr_url') || getFieldValue('merged_commit') || !isReadOnly) && (
                    <>
                        <label className="text-zinc-500 py-1">PR URL</label>
                        {isReadOnly ? (
                            getFieldValue('pr_url') ? (
                                (() => {
                                    const url = getFieldValue('pr_url') as string;
                                    const isValid = url.startsWith('http://') || url.startsWith('https://');
                                    return isValid ? (
                                        <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline text-xs truncate block"
                                        >
                                            {url}
                                        </a>
                                    ) : (
                                        <span className="text-zinc-700 text-xs">{url}</span>
                                    );
                                })()
                            ) : <span className="text-zinc-400 text-xs">-</span>
                        ) : (
                            <input
                                type="url"
                                className="border border-zinc-200 px-2 py-0.5 rounded bg-white text-zinc-700 text-xs w-full focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none shadow-sm"
                                placeholder="https://github.com/..."
                                defaultValue={(getFieldValue('pr_url') as string) || ''}
                                onBlur={(e) => {
                                    if (!id) return;
                                    const trimmed = e.target.value.trim();
                                    handleFieldChangeInternal('pr_url', trimmed || null);
                                }}
                            />
                        )}

                        <label className="text-zinc-500 py-1">Commit</label>
                        {isReadOnly ? (
                            getFieldValue('merged_commit') ? (
                                <div className="flex items-center gap-2">
                                    <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded">
                                        {(getFieldValue('merged_commit') as string).substring(0, 7)}
                                    </code>
                                    <button
                                        onClick={() => {
                                            const commit = getFieldValue('merged_commit') as string;
                                            navigator.clipboard.writeText(commit)
                                                .then(() => showToast?.('Commit SHA copied', 'success'))
                                                .catch(() => showToast?.('Failed to copy', 'error'));
                                        }}
                                        className="text-zinc-400 hover:text-zinc-600"
                                        title="Copy full SHA"
                                    >
                                        📋
                                    </button>
                                </div>
                            ) : <span className="text-zinc-400 text-xs">-</span>
                        ) : (
                            <input
                                type="text"
                                className="border border-zinc-200 px-2 py-0.5 rounded bg-white text-zinc-700 text-xs w-full focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 outline-none shadow-sm"
                                placeholder="e.g., abc1234..."
                                defaultValue={(getFieldValue('merged_commit') as string) || ''}
                                onBlur={(e) => {
                                    if (!id) return;
                                    const trimmed = e.target.value.trim();
                                    handleFieldChangeInternal('merged_commit', trimmed || null);
                                }}
                            />
                        )}
                    </>
                )}
            </div>

            <div className="h-px bg-zinc-200 mx-6 my-2" />

            {/* Notes Section */}
            <div className="px-6 py-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-zinc-500">Notes</h3>
                    {!isReadOnly && (
                        <div className="flex gap-2">
                            {filterTemplatesByType(getFieldValue('type') as Task['type']).map(([key, template]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => {
                                        const currentNotes = ((getFieldValue('notes') || getFieldValue('_body') || '') as string).trim();
                                        if (currentNotes && !window.confirm('기존 내용이 삭제됩니다. 템플릿을 적용하시겠습니까?')) {
                                            return;
                                        }
                                        setSelectedTemplate(key);
                                        if (id) {
                                            handleFieldChangeInternal('notes', template.content);
                                        }
                                    }}
                                    className={`px-2 py-1 text-xs rounded transition-colors ${selectedTemplate === key
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                                        }`}
                                >
                                    {template.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <ReviewFieldWrapper
                    isSuggested={isReviewMode && reviewMode ? reviewMode.isSuggested('notes') : false}
                    reasoning={isReviewMode && reviewMode ? reviewMode.getReasoning('notes') : undefined}
                >
                    <MarkdownEditor
                        value={(getFieldValue('notes') ?? getFieldValue('_body') ?? '') as string}
                        onChange={(markdown) => {
                            if (!id) return;
                            handleFieldChangeInternal('notes', markdown);
                        }}
                        onBlur={handleNotesBlur}
                        readOnly={isReadOnly}
                        placeholder="Type / for commands..."
                        minHeight="300px"
                        taskId={id}
                    />
                </ReviewFieldWrapper>
            </div>

            {/* Attachments Section - only show for existing tasks */}
            {id && (
                <>
                    <div className="h-px bg-zinc-200 mx-6 my-2" />
                    <div className="px-6 py-4">
                        <h3 className="text-sm font-semibold text-zinc-500 mb-2">Attachments</h3>
                        <AttachmentPanel taskId={id} readOnly={isReadOnly} />
                    </div>
                </>
            )}

            {/* Comments Section - only show for existing tasks */}
            {id && (
                <>
                    <div className="h-px bg-zinc-200 mx-6 my-2" />
                    <div className="px-6 py-4">
                        <CommentSection entityType="task" entityId={id} />
                    </div>
                </>
            )}
        </div>
    );
};
