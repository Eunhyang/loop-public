# Workthrough: tsk-023-08 - Dashboard v2 TaskForm Create 모드 구현

**Date**: 2026-01-08
**Task ID**: tsk-023-08
**Assignee**: 김은향
**Status**: done

---

## Overview

Dashboard v2의 TaskForm 컴포넌트에 Create 모드를 구현하여 Task 생성 기능을 완성했습니다.

**Goal**: TaskForm에서 create 모드를 지원하여 ProjectForm/ProgramForm과 동일한 패턴으로 Task 생성 가능

---

## Work Summary

### 1. API Layer - CreateTaskDTO & createTask 함수

**File**: `src/features/tasks/api.ts`

**Changes**:
```typescript
// CreateTaskDTO 인터페이스 정의
export interface CreateTaskDTO {
    entity_name: string;
    project_id: string;
    assignee: string;
    priority?: string;
    status?: string;
    type?: string;
    start_date?: string;
    due?: string;
}

// createTask 함수 추가
export const createTask = async (data: CreateTaskDTO): Promise<ApiResponse<Task>> => {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create task');
    }

    return response.json();
};
```

**Design Decisions**:
- 필수 필드: entity_name, project_id, assignee
- 선택 필드: priority, status, type, start_date, due
- 서버 측 검증에 의존 (entity_name 형식, project_id 유효성 등)

---

### 2. Query Layer - useCreateTask Hook

**File**: `src/features/tasks/queries.ts`

**Changes**:
```typescript
export const useCreateTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateTaskDTO) => createTask(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardInit });
            queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
        },
    });
};
```

**Design Decisions**:
- ProjectForm/ProgramForm 패턴 일관성 유지
- 성공 시 dashboardInit + tasks 쿼리 invalidate
- 에러 처리는 UI 레이어에서 담당

---

### 3. UI Layer - TaskForm Create Mode

**File**: `src/features/tasks/components/TaskForm.tsx`

**Implementation** (184 lines):

**State Management**:
```typescript
const [formData, setFormData] = useState({
    entity_name: '',
    project_id: '',
    assignee: '',
    priority: 'medium',
    status: 'todo',
    type: 'dev',
    start_date: '',
    due: '',
});
```

**Form Fields**:
- entity_name: Input (필수, "주제 - 내용" 형식)
- project_id: Select (프로젝트 목록)
- assignee: Select (담당자 목록)
- priority/status: Select (기본값 설정)
- type: Chips (dev, bug, strategy 등)
- start_date/due: Date pickers

**Validation**:
```typescript
const isFormValid =
    formData.entity_name.trim() !== '' &&
    formData.project_id !== '' &&
    formData.assignee !== '';
```

**Submit Handler**:
```typescript
const handleSubmit = () => {
    if (!isFormValid) return;
    createMutation.mutate(formData, {
        onSuccess: () => onSuccess?.(),
        onError: (error) => {
            console.error('Task creation failed:', error);
        },
    });
};
```

---

### 4. Layout Fix - DrawerShell Body

**File**: `src/shared/components/drawer/DrawerShell.tsx`

**Issue**: Body 영역에 padding이 있어 폼 레이아웃이 어색했음

**Fix**:
```tsx
const Body: React.FC<BodyProps> = ({ children }) => (
    <div className="flex-1 overflow-y-auto">  {/* padding-4 제거 */}
        {children}
    </div>
);
```

---

## Code Review (Codex)

**Date**: 2026-01-08
**Reviewer**: Codex GPT-5

**Critical Issues**: None

**Suggestions**: 8개
1. ✅ 서버 측 검증 (entity_name 형식) - 백엔드에서 이미 검증
2. ⚠️ entity_name 파싱 (trim, 다중 하이픈, XSS) - dangerouslySetInnerHTML 미사용
3. ✅ 권한 검증 (assignee) - 백엔드에서 검증
4. ✅ project_id 검증 - 백엔드에서 검증
5. ⚠️ 중복 제출 방지 - isPending으로 버튼 비활성화 (구현 예정)
6. ⚠️ 날짜 검증 (start < due) - 선택적 구현
7. ✅ 빈 선택 필드 - 기본값으로 해결
8. ✅ 에러 처리 - ProjectForm 패턴 따름

**Bugs Found & Fixed**: 3개
1. Missing `onSuccess` callback prop in TaskForm
2. Priority dropdown defaultValue consistency
3. Error handling in submit

---

## Build & Test

**Build**:
```bash
npm run build
✓ 빌드 성공
```

**Manual Test Checklist**:
- [x] Create drawer 열기
- [x] 필수 필드 입력 (entity_name, project_id, assignee)
- [x] 선택 필드 입력 (priority, status, type, dates)
- [x] Submit 버튼 활성화/비활성화
- [x] Task 생성 성공
- [x] 리스트 갱신 확인

---

## Files Modified

| File | Lines Changed | Purpose |
|------|---------------|---------|
| `src/features/tasks/api.ts` | +30 | CreateTaskDTO + createTask |
| `src/features/tasks/queries.ts` | +10 | useCreateTask hook |
| `src/features/tasks/components/TaskForm.tsx` | +184 | Create mode form |
| `src/shared/components/drawer/DrawerShell.tsx` | -2 | Body padding 제거 |

**Total**: ~220 lines

---

## Key Design Patterns

### 1. Consistent Pattern with ProjectForm/ProgramForm
- API layer: `CreateXXXDTO` + `createXXX()` 함수
- Query layer: `useCreateXXX()` 훅
- UI layer: `mode === 'create'` 분기 + formData state

### 2. Server-Side Validation
- 클라이언트는 기본적인 필드 존재 여부만 체크
- 형식 검증, 권한 검증, 참조 무결성은 서버에서 처리
- 에러는 API 응답으로 전달

### 3. Query Invalidation Strategy
- 생성 성공 시 dashboardInit + entity-specific 쿼리 invalidate
- Tanstack Query의 자동 refetch로 UI 갱신

---

## Technical Debt

### Future Improvements
1. **중복 제출 방지**: `isPending` 상태로 버튼 비활성화
2. **날짜 검증**: start_date < due 검증 추가
3. **UX 개선**: Loading 상태, Success toast 추가
4. **에러 메시지**: 서버 에러를 사용자 친화적으로 표시

### Not Implemented (Out of Scope)
- Edit mode (tsk-023-07에서 이미 구현됨)
- Delete functionality
- Advanced validation (다중 하이픈, XSS 등)

---

## Lessons Learned

### 1. Consistent Patterns Matter
ProjectForm/ProgramForm과 동일한 패턴을 따라 구현 속도가 빨랐고 버그가 적었음.

### 2. Server-Side Validation Trust
클라이언트에서 과도한 검증을 구현하지 않고 서버를 신뢰함으로써 코드가 간결해짐.

### 3. Layout Issues First
DrawerShell Body padding 제거가 UX에 큰 영향을 미쳤음. 레이아웃 이슈는 먼저 수정하는 게 좋음.

---

## References

- Task File: `/Users/gim-eunhyang/dev/loop/public/50_Projects/Vault_System/Rounds/P023_Dashboard_ReactTS_마이그레이션/Tasks/tsk-023-08.md`
- Related Tasks:
  - tsk-023-07 (TaskDrawer 통합, Edit mode)
  - tsk-023-06 (ProgramForm Create/Edit)
- Code Repository: `/Users/gim-eunhyang/dev/loop/public/dashboard-v2`

---

**Duration**: ~3 hours
**Status**: Completed successfully
**Next Task**: tsk-023-09 (if any)
