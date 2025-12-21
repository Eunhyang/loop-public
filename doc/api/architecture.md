# Dashboard API Architecture

> LOOP Dashboard API 아키텍처 및 필터링 설계 문서

**Version**: 1.0.0
**Last Updated**: 2025-12-21

---

## 1. 엔티티 계층 구조

### 1.1 전체 계층도

```
NorthStar (ns-001)                    # 10년 비전 (불변)
    │
    └── MetaHypothesis (mh-1~4)       # 메타 가설 (회사 존재 이유)
            │
            └── Condition (cond-a~e)   # 3년 조건 (전략 진입 조건)
                    │
                    └── Track (trk-1~6)        # 12개월 트랙 (투자 방향)
                            │
                            ├── Project (prj-001~999)  # 프로젝트 (실험 단위)
                            │       │
                            │       └── Task (tsk-001-01~99)  # 태스크 (실행 단위)
                            │
                            └── Hypothesis (hyp-1-01~99)  # 가설 (검증 대상)
                                    ↑
                                    validates (Project → Hypothesis)
```

### 1.2 ID 형식 (하이픈 사용)

| Entity | Pattern | Example |
|--------|---------|---------|
| NorthStar | `ns-{number}` | `ns-001` |
| MetaHypothesis | `mh-{number}` | `mh-3` |
| Condition | `cond-{letter}` | `cond-b` |
| Track | `trk-{number}` | `trk-2` |
| Project | `prj-{number}` | `prj-003` |
| Task | `tsk-{prj}-{seq}` | `tsk-003-01` |
| Hypothesis | `hyp-{trk}-{seq}` | `hyp-2-01` |

---

## 2. 엔티티 간 연결 필드

### 2.1 계층 연결 (parent_id)

| From | To | Field | Example |
|------|----|-------|---------|
| MetaHypothesis | NorthStar | `parent_id` | `parent_id: ns-001` |
| Condition | MetaHypothesis | `parent_id` | `parent_id: mh-3` |
| Track | Condition | `parent_id` | `parent_id: cond-b` |
| Project | Track | `parent_id` | `parent_id: trk-2` |
| Task | Project | `parent_id`, `project_id` | `parent_id: prj-003`, `project_id: prj-003` |
| Hypothesis | Track | `parent_id` | `parent_id: trk-2` |

### 2.2 전략 연결

| Relation | From | To | Field | Example |
|----------|------|----|-------|---------|
| validates | Project | Hypothesis | `validates` | `validates: [hyp-2-01, hyp-2-02]` |
| conditions_3y | Project/Task | Condition | `conditions_3y` | `conditions_3y: [cond-b]` |

### 2.3 연결 다이어그램

```
Track (trk-2)
    │
    ├── parent_id ──────────────────┐
    │                               ▼
    │                         Project (prj-003)
    │                               │
    │                               ├── validates ──────► Hypothesis (hyp-2-01)
    │                               │
    │                               ├── conditions_3y ──► Condition (cond-b)
    │                               │
    │                               └── project_id ◄──── Task (tsk-003-01)
    │                                                         │
    │                                                         └── conditions_3y ──► Condition (cond-b)
    │
    └── parent_id ──────────────────► Hypothesis (hyp-2-01)
```

---

## 3. 캐시 구조

### 3.1 현재 캐시 대상

| Entity | Cached | Location |
|--------|--------|----------|
| Task | ✅ | `api/cache/vault_cache.py` |
| Project | ✅ | `api/cache/vault_cache.py` |
| Track | ❌ | 파일 직접 읽음 |
| Condition | ❌ | 파일 직접 읽음 |
| Hypothesis | ❌ | 파일 직접 읽음 |

### 3.2 확장 필요 (TODO)

```python
class VaultCache:
    # 현재
    self.tasks: Dict[str, CacheEntry] = {}
    self.projects: Dict[str, CacheEntry] = {}

    # 추가 필요
    self.tracks: Dict[str, CacheEntry] = {}
    self.conditions- Dict[str, CacheEntry] = {}
    self.hypotheses: Dict[str, CacheEntry] = {}
```

### 3.3 인덱스 구조 (추가 필요)

빠른 필터링을 위한 역인덱스:

```python
class VaultCache:
    # 역인덱스 (track_id → project_ids)
    self.projects_by_track: Dict[str, List[str]] = {}

    # 역인덱스 (hypothesis_id → project_ids)
    self.projects_by_hypothesis: Dict[str, List[str]] = {}

    # 역인덱스 (condition_id → project_ids)
    self.projects_by_condition: Dict[str, List[str]] = {}

    # 역인덱스 (condition_id → task_ids)
    self.tasks_by_condition: Dict[str, List[str]] = {}
```

---

## 4. API 필터링 설계

### 4.1 Projects API

**Endpoint**: `GET /api/projects`

**Query Parameters**:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `track_id` | string | Track으로 필터 (parent_id 매칭) | `?track_id=trk-2` |
| `hypothesis_id` | string | Hypothesis로 필터 (validates 포함) | `?hypothesis_id=hyp-2-01` |
| `condition_id` | string | Condition으로 필터 (conditions_3y 포함) | `?condition_id=cond-b` |
| `status` | string | 상태로 필터 | `?status=active` |
| `owner` | string | 담당자로 필터 | `?owner=김은향` |

**필터링 로직**:

```python
def get_all_projects(
    track_id: Optional[str] = None,
    hypothesis_id: Optional[str] = None,
    condition_id: Optional[str] = None,
    status: Optional[str] = None,
    owner: Optional[str] = None
) -> List[Dict]:

    results = []

    for project in self.projects.values():
        # Track 필터: parent_id 매칭
        if track_id and project.get('parent_id') != track_id:
            continue

        # Hypothesis 필터: validates 배열에 포함
        if hypothesis_id:
            validates = project.get('validates', [])
            if hypothesis_id not in validates:
                continue

        # Condition 필터: conditions_3y 배열에 포함
        if condition_id:
            conditions = project.get('conditions_3y', [])
            if condition_id not in conditions-
                continue

        # Status 필터
        if status and project.get('status') != status:
            continue

        # Owner 필터
        if owner and project.get('owner') != owner:
            continue

        results.append(project)

    return results
```

### 4.2 Tasks API

**Endpoint**: `GET /api/tasks`

**Query Parameters**:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `track_id` | string | Track의 Project들의 Task | `?track_id=trk-2` |
| `hypothesis_id` | string | Hypothesis validates하는 Project의 Task | `?hypothesis_id=hyp-2-01` |
| `condition_id` | string | conditions_3y에 포함된 Task | `?condition_id=cond-b` |
| `project_id` | string | Project로 필터 | `?project_id=prj-003` |
| `status` | string | 상태로 필터 | `?status=doing` |
| `assignee` | string | 담당자로 필터 | `?assignee=김은향` |

**필터링 로직**:

```python
def get_all_tasks(
    track_id: Optional[str] = None,
    hypothesis_id: Optional[str] = None,
    condition_id: Optional[str] = None,
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    assignee: Optional[str] = None
) -> List[Dict]:

    # 1. Track/Hypothesis 필터 시 먼저 해당 Project 목록 구함
    valid_project_ids = None

    if track_id:
        valid_project_ids = self._get_project_ids_by_track(track_id)

    if hypothesis_id:
        hyp_projects = self._get_project_ids_by_hypothesis(hypothesis_id)
        if valid_project_ids is None:
            valid_project_ids = hyp_projects
        else:
            valid_project_ids = valid_project_ids & hyp_projects

    # 2. Task 필터링
    results = []

    for task in self.tasks.values():
        # Track/Hypothesis 필터 (Project 기반)
        if valid_project_ids is not None:
            if task.get('project_id') not in valid_project_ids:
                continue

        # Project 직접 필터
        if project_id and task.get('project_id') != project_id:
            continue

        # Condition 필터: Task의 conditions_3y 체크
        if condition_id:
            conditions = task.get('conditions_3y', [])
            if condition_id not in conditions-
                continue

        # Status 필터
        if status and task.get('status') != status:
            continue

        # Assignee 필터
        if assignee and task.get('assignee') != assignee:
            continue

        results.append(task)

    return results
```

---

## 5. 사이드바 → API 호출 흐름

### 5.1 Track 클릭

```
[사이드바] Track "trk-2" 클릭
    │
    ├── 1. GET /api/projects?track_id=trk-2
    │       → 상단 Project 탭에 표시
    │       → [P003 LoopOS] [P005 선제학습] ...
    │
    └── 2. GET /api/tasks?track_id=trk-2
            → Kanban/Calendar에 표시
```

### 5.2 Hypothesis 클릭

```
[사이드바] Hypothesis "hyp-2-01" 클릭
    │
    ├── 1. GET /api/projects?hypothesis_id=hyp-2-01
    │       → 상단 Project 탭에 표시
    │       → validates에 hyp-2-01 포함된 Project만
    │
    └── 2. GET /api/tasks?hypothesis_id=hyp-2-01
            → Kanban/Calendar에 표시
            → 해당 Project들의 Task만
```

### 5.3 Condition 클릭

```
[사이드바] Condition "cond-b" 클릭
    │
    ├── 1. GET /api/projects?condition_id=cond-b
    │       → 상단 Project 탭에 표시
    │       → conditions_3y에 cond-b 포함된 Project만
    │
    └── 2. GET /api/tasks?condition_id=cond-b
            → Kanban/Calendar에 표시
            → conditions_3y에 cond-b 포함된 Task만
```

---

## 6. 프론트엔드 연동

### 6.1 현재 구조 (클라이언트 필터링)

```javascript
// state.js - 현재
State.loadAll()                    // 전체 데이터 로드
State.getFilteredTasks()           // 클라이언트에서 필터링
State.getProjectsForAssignee()     // 클라이언트에서 필터링
```

### 6.2 목표 구조 (서버 필터링)

```javascript
// api.js - 변경 후
API.getProjects({ track_id: 'trk-2' })       // 서버에서 필터링
API.getTasks({ track_id: 'trk-2' })          // 서버에서 필터링

// state.js - 단순화
State.currentProjects = await API.getProjects(filters)
State.currentTasks = await API.getTasks(filters)
```

### 6.3 API.js 확장

```javascript
const API = {
    // 기존
    getProjects() { ... },
    getTasks() { ... },

    // 확장 (필터 파라미터 지원)
    async getProjects(filters = {}) {
        const params = new URLSearchParams();
        if (filters.track_id) params.append('track_id', filters.track_id);
        if (filters.hypothesis_id) params.append('hypothesis_id', filters.hypothesis_id);
        if (filters.condition_id) params.append('condition_id', filters.condition_id);
        if (filters.status) params.append('status', filters.status);

        const res = await fetch(`${BASE_URL}/projects?${params}`);
        const data = await res.json();
        return data.projects;
    },

    async getTasks(filters = {}) {
        const params = new URLSearchParams();
        if (filters.track_id) params.append('track_id', filters.track_id);
        if (filters.hypothesis_id) params.append('hypothesis_id', filters.hypothesis_id);
        if (filters.condition_id) params.append('condition_id', filters.condition_id);
        if (filters.project_id) params.append('project_id', filters.project_id);
        if (filters.status) params.append('status', filters.status);
        if (filters.assignee) params.append('assignee', filters.assignee);

        const res = await fetch(`${BASE_URL}/tasks?${params}`);
        const data = await res.json();
        return data.tasks;
    }
};
```

---

## 7. 구현 순서 (TODO)

### Phase 1: 캐시 확장
- [ ] `VaultCache`에 tracks, conditions, hypotheses 캐시 추가
- [ ] 역인덱스 구조 추가 (projects_by_track, etc.)
- [ ] 초기 로드 시 인덱스 빌드

### Phase 2: API 필터링
- [ ] `/api/projects` 필터 파라미터 추가
- [ ] `/api/tasks` 필터 파라미터 추가
- [ ] 캐시 기반 필터링 로직 구현

### Phase 3: 프론트엔드 연동
- [ ] `api.js` 필터 파라미터 지원
- [ ] `state.js` 서버 필터링으로 전환
- [ ] `sidebar.js` API 호출로 변경

### Phase 4: 정리
- [ ] 클라이언트 필터링 코드 제거
- [ ] 테스트 및 검증
- [ ] 문서 업데이트

---

## 8. 참조 문서

- **Vault 스키마**: `00_Meta/schema_registry.md`
- **관계 타입**: `00_Meta/relation_types.md`
- **API 작업 목록**: `doc/api/todo.md`
- **API README**: `api/README.md`

---

**Version**: 1.0.0
**Last Updated**: 2025-12-21
