---
entity_type: Task
entity_id: tsk-022-17
entity_name: Dashboard - State.js FALLBACK_CONSTANTS SSOT 동기화
created: 2026-01-07
updated: 2026-01-07
project_id: prj-dashboard-ux-v1
assignee: 김은향
status: doing
start_date: 2026-01-07
due: 2026-01-07
priority: high
type: dev
target_project: loop
aliases:
- tsk-022-17
- Dashboard State.js FALLBACK_CONSTANTS SSOT 동기화
outgoing_relations: []
tags:
- task
- dashboard
- ssot
- bugfix
---

# Dashboard - State.js FALLBACK_CONSTANTS SSOT 동기화

> Task ID: `tsk-022-17` | Project: [[prj-dashboard-ux-v1]] | Status: doing

## Notes

### PRD (Product Requirements Document)

#### 1. 문제 정의

**증상:**
- Meeting 타입 태스크가 캘린더뷰에서 표시되지 않음
- Google Calendar 이벤트만 표시되고 LOOP Task가 필터링됨

**근본 원인: SSOT 위배**

| 위치 | 값 | 상태 |
|------|-----|------|
| `schema_constants.yaml` (SSOT) | `dev, bug, strategy, research, ops, meeting` | ✅ 정상 |
| `State.js` FALLBACK_CONSTANTS | `dev, strategy, research, ops` | ❌ **outdated** |
| `State.js` 초기 filters | 하드코딩 | ❌ **SSOT 위배** |

**영향:**
- `getFilteredTasks()`에서 `this.filters.task.types.includes('meeting')` 체크 시 **false** 반환
- Meeting 태스크가 캘린더에서 제외됨
- `bug` 타입도 동일하게 필터링됨

#### 2. 해결 방안

**수정 파일:** `_dashboard/js/state.js`

**수정 내용:**

1. **FALLBACK_CONSTANTS.task.types** (라인 19)
   ```javascript
   // Before
   types: ['dev', 'strategy', 'research', 'ops'],

   // After
   types: ['dev', 'bug', 'strategy', 'research', 'ops', 'meeting'],
   ```

2. **FALLBACK_CONSTANTS.task.type_labels** (라인 20-22)
   ```javascript
   // Before
   type_labels: {
       dev: 'Dev', strategy: 'Strategy', research: 'Research', ops: 'Ops'
   }

   // After
   type_labels: {
       dev: 'Dev', bug: 'Bug', strategy: 'Strategy',
       research: 'Research', ops: 'Ops', meeting: 'Meeting'
   }
   ```

3. **초기 filters 전체** (라인 79-98) - FALLBACK_CONSTANTS 참조로 변경
   ```javascript
   // Before (하드코딩)
   filters: {
       project: {
           status: ['planning', 'active', 'paused', 'cancelled'],
           priority: ['critical', 'high', 'medium', 'low'],
       },
       task: {
           status: ['todo', 'doing', 'done', 'blocked'],
           priority: ['critical', 'high', 'medium', 'low'],
           types: ['dev', 'strategy', 'research', 'ops'],
       }
   }

   // After (SSOT 참조)
   filters: {
       project: {
           status: FALLBACK_CONSTANTS.project.status.filter(s => s !== 'done'),
           priority: [...FALLBACK_CONSTANTS.priority.values],
       },
       task: {
           status: [...FALLBACK_CONSTANTS.task.status],
           priority: [...FALLBACK_CONSTANTS.priority.values],
           types: [...FALLBACK_CONSTANTS.task.types],
       }
   }
   ```

#### 3. Tech Spec

**SSOT 참조:**
- Source: `00_Meta/schema_constants.yaml` 라인 56-62
- API: `/api/constants` → `task.types`

**순서 일치:**
```yaml
# schema_constants.yaml
types:
  - dev        # 개발 작업 (신규 기능)
  - bug        # 버그 수정
  - strategy   # 전략 작업
  - research   # 리서치
  - ops        # 운영
  - meeting    # 미팅/약속/일정
```

**검증 항목:**
- [ ] Meeting 태스크가 캘린더뷰에 표시됨
- [ ] Bug 타입 태스크가 캘린더뷰에 표시됨
- [ ] 필터 패널에서 Meeting, Bug 타입 선택 가능
- [ ] API constants 로드 시 동적으로 적용됨

#### 4. Todo

- [ ] `FALLBACK_CONSTANTS.task.types`에 `bug`, `meeting` 추가
- [ ] `FALLBACK_CONSTANTS.task.type_labels`에 `bug`, `meeting` 라벨 추가
- [ ] 초기 `filters.task.types`에 `bug`, `meeting` 추가
- [ ] `/mcp-server rebuild`로 배포
- [ ] 테스트: Meeting 태스크 캘린더뷰 표시 확인

---

### 참고 문서

- [[tsk-019-25]] - Schema Task type에 meeting 추가 (schema_constants.yaml에 추가됨)
- [[tsk-022-11]] - Dashboard 미팅 태스크 클릭/삭제 동기화 버그 수정

---

**Created**: 2026-01-07
**Assignee**: 김은향
