---
entity_type: Task
entity_id: "tsk-022-02"
entity_name: "Dashboard - 패턴 기반 폼 자동 기본값 채우기"
created: 2026-01-06
updated: 2026-01-06
status: doing

# === 계층 ===
parent_id: null
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-022-02"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-06
due: 2026-01-06
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 분류 ===
tags: []
priority_flag: high
---

# Dashboard - 패턴 기반 폼 자동 기본값 채우기

> Task ID: `tsk-022-02` | Project: `prj-dashboard-ux-v1` | Status: doing

## 목표

**완료 조건**:
1. Backend API 엔드포인트 `/api/autofill/pattern-defaults` 구현 완료
2. Frontend task-modal.js, project-modal.js에 패턴 분석 로직 통합
3. 새 엔티티 생성 시 부모의 기존 하위 엔티티 패턴 분석하여 모든 필드 자동 채우기

---

## 상세 내용

### 배경

현재 대시보드에서 새 Task/Project 생성 시 항상 고정된 기본값만 사용 (priority='medium', status='todo'). 부모 엔티티의 기존 하위 엔티티들 패턴을 분석하여 최빈값을 자동으로 채워넣으면 생산성이 크게 향상됨.

### 작업 내용

#### 1. Backend API 구현 (`public/api/routers/autofill.py`)

새 엔드포인트 추가:
```
GET /api/autofill/pattern-defaults?parent_type={project|program|track}&parent_id={id}&child_type={task|project}
```

응답 예시:
```json
{
  "defaults": {
    "owner": "김은향",
    "status": "doing",
    "priority": "high",
    "type": "dev",
    "tags": ["urgent"]
  },
  "sample_size": 15
}
```

패턴 분석 로직:
- 부모 엔티티의 모든 하위 엔티티 조회
- 각 필드별 최빈값(most frequent value) 계산
- `collections.Counter`로 최빈값 추출

#### 2. Frontend 수정

**task-modal.js 수정:**
```javascript
async open(options = {}) {
    // 기존 코드...

    // 부모 프로젝트가 선택된 경우, 패턴 분석해서 기본값 채우기
    const projectId = document.getElementById('taskProject').value;
    if (projectId) {
        const defaults = await API.getPatternDefaults('project', projectId, 'task');
        if (defaults && defaults.defaults) {
            document.getElementById('taskAssignee').value = defaults.defaults.assignee || '';
            document.getElementById('taskPriority').value = defaults.defaults.priority || 'medium';
            document.getElementById('taskStatus').value = defaults.defaults.status || 'todo';
            document.getElementById('taskType').value = defaults.defaults.type || 'dev';
        }
    }
}
```

**project-modal.js 수정:**
```javascript
async open(options = {}) {
    // 기존 코드...

    // 부모 Track/Program이 선택된 경우, 패턴 분석해서 기본값 채우기
    const parentId = document.getElementById('projectTrack').value;
    if (parentId) {
        const defaults = await API.getPatternDefaults('track', parentId, 'project');
        if (defaults && defaults.defaults) {
            document.getElementById('projectOwner').value = defaults.defaults.owner || '';
            document.getElementById('projectPriority').value = defaults.defaults.priority || 'medium';
            document.getElementById('projectStatus').value = defaults.defaults.status || 'todo';
        }
    }
}
```

**api.js 수정:**
```javascript
async getPatternDefaults(parentType, parentId, childType) {
    const response = await fetch(
        `${this.baseUrl}/api/autofill/pattern-defaults?parent_type=${parentType}&parent_id=${parentId}&child_type=${childType}`,
        { headers: this.getHeaders() }
    );
    return await response.json();
}
```

---

## 체크리스트

- [ ] Backend: `/api/autofill/pattern-defaults` 엔드포인트 구현
- [ ] Backend: 최빈값 계산 로직 구현 (collections.Counter)
- [ ] Backend: Task 패턴 분석 (assignee, status, priority, type)
- [ ] Backend: Project 패턴 분석 (owner, status, priority)
- [ ] Frontend: `api.js`에 `getPatternDefaults()` 메서드 추가
- [ ] Frontend: `task-modal.js` open() 메서드에 패턴 분석 로직 추가
- [ ] Frontend: `project-modal.js` open() 메서드에 패턴 분석 로직 추가
- [ ] 테스트: 프로젝트 선택 → +new task → 기본값 자동 채워지는지 확인
- [ ] 테스트: Track 선택 → +new project → 기본값 자동 채워지는지 확인
- [ ] 테스트: 기존 하위 엔티티가 0개인 경우 빈 폼 제공 확인

---

## Notes

### 핵심 개념

기존 하위 엔티티들의 패턴을 분석해서 **모든 필드의 기본값**을 자동으로 채워넣기

### 시나리오

1. **프로젝트 A 탭 → +new task**
   - parent_project: "프로젝트 A" 자동 설정
   - 프로젝트 A의 기존 태스크들 분석 → 모든 필드 기본값 채우기

2. **프로그램 X 선택 → +new task**
   - parent_program: "프로그램 X" 자동 설정
   - 프로그램 X의 기존 태스크들 분석 → 모든 필드 기본값 채우기

3. **프로그램 X 선택 → +new project**
   - program_id: "프로그램 X" 자동 설정
   - 프로그램 X의 기존 프로젝트들 분석 → 모든 필드 기본값 채우기

### 예외 케이스

IF 기존 하위 엔티티가 0개인 경우:
- 패턴 분석 스킵
- 빈 폼 제공
- parent 연결만 설정

### Todo
- [ ] Backend API 엔드포인트 구현
- [ ] Frontend 통합
- [ ] E2E 테스트

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)
-->

---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- `_dashboard/js/components/task-modal.js`
- `_dashboard/js/components/project-modal.js`
- `_dashboard/js/api.js`

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
