---
entity_type: Task
entity_id: tsk-dashboard-ux-v1-12
entity_name: state.js YAML 일원화
created: 2025-12-27
updated: '2025-12-27'
status: done
closed: '2025-12-27'
parent_id: prj-dashboard-ux-v1
project_id: prj-dashboard-ux-v1
aliases:
- tsk-dashboard-ux-v1-12
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
due: '2025-12-27'
priority: medium
estimated_hours: null
actual_hours: null
type: dev
target_project: loop
tags:
- dashboard
- refactoring
- yaml
priority_flag: medium
start_date: '2025-12-27'
notes: "# state.js YAML 일원화\n\n> Task ID: `tsk-dashboard-ux-v1-12` | Project: `prj-dashboard-ux-v1`\
  \ | Status: doing\n\n## 목표\n\n**완료 조건**:\n1. `_dashboard/js/state.js`에서 하드코딩된 Fallback\
  \ 상수 제거\n2. `normalizeStatus()` 매핑을 API constants에서 로드\n3. 필터 초기값을 API에서 동적으로 로드\n\
  \n---\n\n## 상세 내용\n\n### 배경\n\n`state.js`에 다음 상수들이 하드코딩되어 있음:\n- `normalizeStatus()`\
  \ 함수 내 status 매핑 로직\n- 필터 초기값 (status, priority 등)\n- Fallback 값들\n\n이를 `api/constants`\
  \ 엔드포인트에서 로드하도록 변경하여 Single Source of Truth 유지.\n\n### 작업 내용\n\n**변경 대상:**\n- `_dashboard/js/state.js`\n\
  \n**의존성:**\n- Task 4 (tsk-dashboard-ux-v1-10): api/constants.py 응답 확장 ✅ 완료\n\n**참조할\
  \ API 응답:**\n- `GET /api/constants` 응답의 `status_mapping` 필드\n- `task.status`, `project.status`\
  \ 필드\n- `priority.values` 필드\n\n---\n\n## 체크리스트\n\n- [ ] 현재 state.js 코드 분석\n- [\
  \ ] normalizeStatus() 함수에서 status_mapping 활용\n- [ ] 필터 초기값 API에서 로드\n- [ ] Fallback\
  \ 값 최소화\n- [ ] 테스트 (Dashboard 동작 확인)\n\n---\n\n## Notes\n\n### Tech Spec\n\n**파일**:\
  \ `_dashboard/js/state.js`\n**API 엔드포인트**: `https://mcp.sosilab.synology.me/api/constants`\n\
  **의존성**: tsk-dashboard-ux-v1-10 완료됨\n\n#### 현재 하드코딩된 Fallback 목록\n\n| 함수 | Line\
  \ | 하드코딩 내용 |\n|------|------|--------------|\n| `getTaskStatuses()` | 114-117 |\
  \ `['todo', 'doing', 'hold', 'done', 'blocked']` |\n| `getTaskStatusLabels()` |\
  \ 119-124 | `{ todo: 'To Do', ... }` |\n| `getTaskStatusColors()` | 126-130 | `{\
  \ todo: '#6b7280', ... }` |\n| `getPriorities()` | 133-136 | `['critical', 'high',\
  \ 'medium', 'low']` |\n| `getPriorityLabels()` | 138-143 | `{ critical: 'Critical',\
  \ ... }` |\n| `getProjectStatuses()` | 145-148 | `['planning', 'active', 'paused',\
  \ 'done', 'cancelled']` |\n| `getProjectStatusLabels()` | 150-155 | `{ planning:\
  \ 'Planning', ... }` |\n| `normalizeProjectStatus()` | 322-345 | `standardStatuses`,\
  \ `reverseMapping` |\n| `normalizeStatus()` | 349-376 | `standardStatuses`, `fallbackMap`\
  \ |\n| `filters` 초기값 | 35-53 | 하드코딩된 status/priority 배열 |\n\n#### 변경 방향\n\n1. **normalizeStatus()\
  \ / normalizeProjectStatus()**\n   - `this.constants?.status_mapping` 사용\n   - Fallback은\
  \ 유지 (API 로드 실패 대비)\n\n2. **Helper 함수 Fallback**\n   - 현재 구조 유지 (API 우선, Fallback\
  \ 보조)\n   - 주석으로 YAML 참조 명시 (이미 되어있음)\n\n3. **Filter 초기값**\n   - `resetFilters()`에서\
  \ 이미 동적 로드 (line 626-646)\n   - 초기 `filters` 객체만 수정 필요\n\n#### API Constants 응답\
  \ 구조\n\n```javascript\n{\n  task: { status, status_labels, status_colors, types,\
  \ target_projects },\n  priority: { values, labels, colors },\n  project: { status,\
  \ status_labels, status_colors },\n  status_mapping: { planning: 'todo', active:\
  \ 'doing', ... },\n  // ... 기타 필드\n}\n```\n\n### Todo\n- [ ] normalizeStatus()에서\
  \ status_mapping 활용 개선\n- [ ] normalizeProjectStatus()에서 status_mapping 역매핑 활용\n\
  - [ ] filters 초기값을 loadAll() 이후 동적 설정으로 변경\n- [ ] Fallback 값 주석 정리 (YAML 참조 명시)\n\
  - [ ] Dashboard 동작 테스트\n\n### 작업 로그\n<!--\n작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동\
  \ 생성)\n\n#### YYYY-MM-DD HH:MM\n**개요**: 2-3문장 요약\n\n**변경사항**:\n- 개발:\n- 수정:\n- 개선:\n\
  \n**핵심 코드**: (필요시)\n\n**결과**: ✅ 빌드 성공 / ❌ 실패\n\n**다음 단계**:\n-->\n\n\n---\n\n## 참고\
  \ 문서\n\n- [[prj-dashboard-ux-v1]] - 소속 Project\n- [[tsk-dashboard-ux-v1-10]] - 선행\
  \ Task (api/constants.py 확장)\n- [[00_Meta/schema_constants.yaml]] - Single Source\
  \ of Truth\n\n---\n\n**Created**: 2025-12-27\n**Assignee**: 김은향\n**Due**:\n"
---
# state.js YAML 일원화

> Task ID: `tsk-dashboard-ux-v1-12` | Project: `prj-dashboard-ux-v1` | Status: doing

## 목표

**완료 조건**:
1. `_dashboard/js/state.js`에서 하드코딩된 Fallback 상수 제거
2. `normalizeStatus()` 매핑을 API constants에서 로드
3. 필터 초기값을 API에서 동적으로 로드

---

## 상세 내용

### 배경

`state.js`에 다음 상수들이 하드코딩되어 있음:
- `normalizeStatus()` 함수 내 status 매핑 로직
- 필터 초기값 (status, priority 등)
- Fallback 값들

이를 `api/constants` 엔드포인트에서 로드하도록 변경하여 Single Source of Truth 유지.

### 작업 내용

**변경 대상:**
- `_dashboard/js/state.js`

**의존성:**
- Task 4 (tsk-dashboard-ux-v1-10): api/constants.py 응답 확장 ✅ 완료

**참조할 API 응답:**
- `GET /api/constants` 응답의 `status_mapping` 필드
- `task.status`, `project.status` 필드
- `priority.values` 필드

---

## 체크리스트

- [ ] 현재 state.js 코드 분석
- [ ] normalizeStatus() 함수에서 status_mapping 활용
- [ ] 필터 초기값 API에서 로드
- [ ] Fallback 값 최소화
- [ ] 테스트 (Dashboard 동작 확인)

---

## Notes

### Tech Spec

**파일**: `_dashboard/js/state.js`
**API 엔드포인트**: `https://mcp.sosilab.synology.me/api/constants`
**의존성**: tsk-dashboard-ux-v1-10 완료됨

#### 현재 하드코딩된 Fallback 목록

| 함수 | Line | 하드코딩 내용 |
|------|------|--------------|
| `getTaskStatuses()` | 114-117 | `['todo', 'doing', 'hold', 'done', 'blocked']` |
| `getTaskStatusLabels()` | 119-124 | `{ todo: 'To Do', ... }` |
| `getTaskStatusColors()` | 126-130 | `{ todo: '#6b7280', ... }` |
| `getPriorities()` | 133-136 | `['critical', 'high', 'medium', 'low']` |
| `getPriorityLabels()` | 138-143 | `{ critical: 'Critical', ... }` |
| `getProjectStatuses()` | 145-148 | `['planning', 'active', 'paused', 'done', 'cancelled']` |
| `getProjectStatusLabels()` | 150-155 | `{ planning: 'Planning', ... }` |
| `normalizeProjectStatus()` | 322-345 | `standardStatuses`, `reverseMapping` |
| `normalizeStatus()` | 349-376 | `standardStatuses`, `fallbackMap` |
| `filters` 초기값 | 35-53 | 하드코딩된 status/priority 배열 |

#### 변경 방향

1. **normalizeStatus() / normalizeProjectStatus()**
   - `this.constants?.status_mapping` 사용
   - Fallback은 유지 (API 로드 실패 대비)

2. **Helper 함수 Fallback**
   - 현재 구조 유지 (API 우선, Fallback 보조)
   - 주석으로 YAML 참조 명시 (이미 되어있음)

3. **Filter 초기값**
   - `resetFilters()`에서 이미 동적 로드 (line 626-646)
   - 초기 `filters` 객체만 수정 필요

#### API Constants 응답 구조

```javascript
{
  task: { status, status_labels, status_colors, types, target_projects },
  priority: { values, labels, colors },
  project: { status, status_labels, status_colors },
  status_mapping: { planning: 'todo', active: 'doing', ... },
  // ... 기타 필드
}
```

### Todo
- [x] normalizeStatus()에서 status_mapping 활용 개선
- [x] normalizeProjectStatus()에서 status_mapping 역매핑 활용
- [x] filters 초기값을 loadAll() 이후 동적 설정으로 변경
- [x] Fallback 값 주석 정리 (YAML 참조 명시)
- [ ] Dashboard 동작 테스트 (사용자 확인 필요)

### 작업 로그

#### 2025-12-27 14:00
**개요**: state.js의 하드코딩된 상수들을 API constants(schema_constants.yaml 기반)에서 동적으로 로드하도록 변경. Codex와의 협업 루프(codex-claude-loop)를 통해 계획 검증 및 코드 리뷰 완료.

**변경사항**:
- 수정: `getProjectStatuses()` fallback을 Project 상태로 변경 (line 139-141)
- 수정: `getProjectStatusLabels()` fallback을 Project 라벨로 변경 (line 144-148)
- 수정: `getProjectsForAssignee()`에서 `normalizeProjectStatus()` 적용 (line 586-587)
- 개선: `loadAll()` 후 `resetFilters()` 호출하여 YAML SSOT 적용 (line 95-98)
- 개선: Project 필터 초기값에서 done 제외 (기존 동작 유지)

**파일 변경**:
- `_dashboard/js/state.js` - 7줄 추가, 1줄 수정

**핵심 코드**:
```javascript
// loadAll() 마지막에 추가
this.resetFilters();
this.filters.project.status = this.filters.project.status.filter(s => s !== 'done');
```

**Codex 리뷰 결과**:
- Phase 2: fallback 불일치 문제 발견 → 계획 수정
- Phase 5: 모든 변경 일관성 확인 → 통과

**결과**: ✅ MCP 서버 재빌드 성공, Dashboard 동작 확인 필요

**다음 단계**:
- Dashboard 브라우저 테스트
- 사용자 확인 후 Task 완료 처리


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[tsk-dashboard-ux-v1-10]] - 선행 Task (api/constants.py 확장)
- [[00_Meta/schema_constants.yaml]] - Single Source of Truth

---

**Created**: 2025-12-27
**Assignee**: 김은향
**Due**:
