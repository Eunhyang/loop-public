---
entity_type: Task
entity_id: tsk-n8n-18
entity_name: "Dashboard - Pending Reviews 워크플로우 필터링 및 일괄 삭제"
created: 2026-01-06
updated: 2026-01-06
status: done

# === 계층 ===
parent_id: prj-n8n
project_id: prj-n8n
aliases:
- tsk-n8n-18

# === 관계 ===
outgoing_relations:
- tsk-n8n-10
- tsk-n8n-13
validates: []

# === Task 전용 ===
assignee: 김은향
start_date: 2026-01-06
due: 2026-01-06
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===

# === 분류 ===
tags:
- dashboard
- pending-reviews
- ux
- filter
priority_flag: high
---

# Dashboard - Pending Reviews 워크플로우 필터링 및 일괄 삭제

> Task ID: `tsk-n8n-18` | Project: `prj-n8n` | Status: done

## 목표

**완료 조건**:
1. Pending Review에 워크플로우 이름(source_workflow)과 실행 ID(run_id) 표시
2. 워크플로우 이름별, 실행 ID별 필터링 기능 구현
3. 필터된 pending review 일괄 삭제 기능 구현
4. 테스트 완료 및 NAS 배포

---

## 상세 내용

### 배경

현재 Pending Reviews UI에서:
- ✅ 실행 시간(created_at)은 표시됨
- ❌ 어떤 n8n 워크플로우에서 생성됐는지 알 수 없음
- ❌ 같은 실행 배치의 항목들을 구분할 수 없음
- ❌ 특정 워크플로우/배치 결과만 삭제하기 어려움

### 요구사항

**1. 메타데이터 표시**
| 정보 | 예시 |
|------|------|
| 워크플로우 이름 | `hypothesis-seeder`, `entity-validator` |
| 실행 ID | `run-20260106-143000` |

**2. 필터링 기능**
- 워크플로우 이름별 필터 (드롭다운)
- 실행 ID별 필터 (드롭다운)

**3. 일괄 삭제**
- 현재 필터된 pending review들 전체 삭제
- 확인 다이얼로그 표시

### 목표 UI

```
┌─────────────────────────────────────────────────────────┐
│ Filter: [All Workflows ▼] [All Runs ▼]  [Delete All ⚠] │
├─────────────────────────────────────────────────────────┤
│ hypothesis-seeder | run-0106-1430 | 2026-01-06 14:30   │
│  • hyp-3-01 - 코칭 효과 가설                            │
│  • hyp-3-02 - 리텐션 가설                               │
├─────────────────────────────────────────────────────────┤
│ entity-validator | run-0106-1500 | 2026-01-06 15:00    │
│  • tsk-001 - 필드 검증 결과                             │
└─────────────────────────────────────────────────────────┘
```

---

## 체크리스트

- [ ] pending_reviews.json 스키마에 source_workflow, run_id 필드 추가
- [ ] n8n 워크플로우에서 source_workflow, run_id 전달하도록 수정
- [ ] API: POST /api/pending에 source_workflow, run_id 필드 지원
- [ ] API: DELETE /api/pending/batch 일괄 삭제 엔드포인트 추가
- [ ] Dashboard: 필터 드롭다운 UI 구현
- [ ] Dashboard: 일괄 삭제 버튼 및 확인 다이얼로그
- [ ] 로컬 테스트
- [ ] NAS 동기화 및 Docker 재배포

---

## Notes

### PRD (Product Requirements Document)

#### 📊 아키텍처 도식

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 Pending Reviews 워크플로우 필터링 Architecture               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ n8n Layer (Source)                                                     │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │  entity-validator ──→ POST /api/ai/infer/* ──→ pending_reviews.json   │ │
│  │  hypothesis-seeder      │                         │                    │ │
│  │  impact-rebuild         ↓                         ↓                    │ │
│  │                   source_workflow: "entity-validator"                  │ │
│  │                   run_id: "run-20260106-143000-abc1"                   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│       │                                                                      │
│       ↓                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ API Layer (api/routers/)                                               │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │  pending.py                                                            │ │
│  │  ├── GET /api/pending?workflow=xxx&run_id=yyy   (필터 지원)           │ │
│  │  ├── DELETE /api/pending/batch                  (일괄 삭제)           │ │
│  │  └── PendingCreate에 source_workflow 필드 추가                        │ │
│  │                                                                        │ │
│  │  ai.py                                                                 │ │
│  │  └── create_pending_review()에 source_workflow 파라미터 추가          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│       │                                                                      │
│       ↓                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Dashboard Layer (_dashboard/)                                          │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │  pending-panel.js                                                      │ │
│  │  ├── Filter dropdowns: [Workflow ▼] [Run ID ▼]                        │ │
│  │  ├── "Delete Filtered" 버튼                                           │ │
│  │  ├── List에 워크플로우/run_id 뱃지 표시                               │ │
│  │  └── 그룹핑 UI (같은 run_id 묶어서 표시)                              │ │
│  │                                                                        │ │
│  │  api.js                                                                │ │
│  │  └── deletePendingBatch(workflow, run_id) 추가                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 📋 프로젝트 컨텍스트

- **Backend**: FastAPI (Python 3.11)
- **Frontend**: Vanilla JS (no framework)
- **Data Store**: JSON file (`_build/pending_reviews.json`)
- **Source**: n8n workflows (entity-validator, hypothesis-seeder, impact-rebuild)

#### 🎯 구현 범위

**주요 기능**:
1. `source_workflow` 필드 추가 (어떤 n8n 워크플로우에서 왔는지)
2. 워크플로우별, run_id별 필터링 UI
3. 필터된 항목 일괄 삭제 기능

**파일 구조**:
```
api/routers/
├── pending.py          # 스키마 + 일괄 삭제 API
└── ai.py               # source_workflow 파라미터 전달

_dashboard/js/
├── components/
│   └── pending-panel.js   # 필터 UI + 일괄 삭제 버튼
└── api.js                 # deletePendingBatch() 추가
```

#### 📝 상세 요구사항

**1. API: PendingCreate 스키마 확장**
- **위치**: `api/routers/pending.py:37-43`
- **추가 필드**: `source_workflow: Optional[str]`
- **기존 `source`**: "ai_infer" (고정값) → 유지
- **새 `source_workflow`**: "entity-validator", "hypothesis-seeder" 등 (n8n 워크플로우명)

**2. API: create_pending_review() 확장**
- **위치**: `api/routers/ai.py:319-364`
- **추가 파라미터**: `source_workflow: str`
- **저장**: `new_review["source_workflow"] = source_workflow`

**3. API: 일괄 삭제 엔드포인트**
- **위치**: `api/routers/pending.py` (새 엔드포인트)
- **경로**: `DELETE /api/pending/batch`
- **Query params**: `workflow`, `run_id`, `status` (선택)
- **응답**: `{"deleted_count": N, "deleted_ids": [...]}`

**4. Dashboard: 필터 드롭다운**
- **위치**: `_dashboard/js/components/pending-panel.js`
- **UI 위치**: List Pane 상단
- **드롭다운 2개**:
  - `[All Workflows ▼]` - source_workflow 값 목록
  - `[All Runs ▼]` - run_id 값 목록 (최근 순)

**5. Dashboard: List 항목에 메타 표시**
- **UI**: 각 카드에 작은 뱃지로 표시
  - 워크플로우 이름 (짧게)
  - run_id 앞 8자리

**6. Dashboard: 일괄 삭제 버튼**
- **UI**: 필터 드롭다운 옆 "Delete Filtered" 버튼
- **동작**:
  1. 현재 필터 조건으로 API 호출
  2. 확인 다이얼로그 표시
  3. 삭제 후 목록 새로고침

#### ✅ 성공 기준

- [ ] pending_reviews.json에 source_workflow 필드 저장됨
- [ ] GET /api/pending?workflow=xxx 필터 동작
- [ ] GET /api/pending?run_id=yyy 필터 동작
- [ ] DELETE /api/pending/batch로 일괄 삭제 가능
- [ ] Dashboard에서 필터 드롭다운 동작
- [ ] Dashboard에서 일괄 삭제 버튼 동작
- [ ] 기존 pending review (source_workflow 없는 것) 호환

---

### Tech Spec

#### 1. pending_reviews.json 스키마 변경

```json
{
  "reviews": [
    {
      "id": "review-20260106-143000-abc1",
      "entity_id": "tsk-001",
      "entity_type": "Task",
      "entity_name": "Task Name",
      "status": "pending",
      "source": "ai_infer",
      "source_workflow": "entity-validator",  // 🆕 추가
      "run_id": "run-20260106-143000-abc1",   // 기존
      "actor": "n8n",
      "created_at": "2026-01-06T14:30:00",
      "suggested_fields": {...},
      "reasoning": {...}
    }
  ]
}
```

#### 2. API 변경사항

**pending.py - PendingCreate 확장:**
```python
class PendingCreate(BaseModel):
    entity_id: str
    entity_type: str
    entity_name: str
    suggested_fields: Dict[str, Any]
    reasoning: Dict[str, str]
    source_workflow: Optional[str] = None  # 🆕
```

**pending.py - GET /api/pending 필터 파라미터:**
```python
@router.get("")
def list_pending_reviews(
    status: Optional[str] = Query(None),
    workflow: Optional[str] = Query(None),  # 🆕
    run_id: Optional[str] = Query(None)     # 🆕
):
```

**pending.py - DELETE /api/pending/batch:**
```python
class BatchDeleteRequest(BaseModel):
    workflow: Optional[str] = None
    run_id: Optional[str] = None
    status: Optional[str] = None
    ids: Optional[List[str]] = None  # 명시적 ID 목록

@router.delete("/batch")
def batch_delete_pending(request: BatchDeleteRequest):
    """필터 조건에 맞는 pending 일괄 삭제"""
```

#### 3. Dashboard 변경사항

**pending-panel.js - 상태 추가:**
```javascript
const PendingPanel = {
    // 기존 상태...

    // 🆕 필터 상태
    filterWorkflow: null,    // 선택된 워크플로우
    filterRunId: null,       // 선택된 run_id
    availableWorkflows: [],  // 워크플로우 목록
    availableRunIds: [],     // run_id 목록
```

**pending-panel.js - 필터 UI 렌더링:**
```javascript
renderFilters() {
    return `
        <div class="pending-filters">
            <select id="filter-workflow">
                <option value="">All Workflows</option>
                ${this.availableWorkflows.map(w =>
                    `<option value="${w}">${w}</option>`
                ).join('')}
            </select>
            <select id="filter-run-id">
                <option value="">All Runs</option>
                ${this.availableRunIds.map(r =>
                    `<option value="${r}">${r.slice(0, 20)}...</option>`
                ).join('')}
            </select>
            <button class="btn-delete-filtered" onclick="PendingPanel.deleteFiltered()">
                Delete Filtered
            </button>
        </div>
    `;
}
```

**api.js - 일괄 삭제:**
```javascript
async deletePendingBatch(workflow, runId) {
    return await this.request('/api/pending/batch', {
        method: 'DELETE',
        body: JSON.stringify({ workflow, run_id: runId })
    });
}
```

#### 4. n8n 워크플로우 수정

**각 워크플로우에서 source_workflow 전달:**
- entity-validator: `source_workflow: "entity-validator"`
- hypothesis-seeder: `source_workflow: "hypothesis-seeder"`
- impact-rebuild: `source_workflow: "impact-rebuild"`

api_request 객체에 추가:
```javascript
api_request: {
    // 기존 필드...
    source_workflow: "entity-validator"  // 🆕
}
```

### Todo

- [ ] API: PendingCreate에 source_workflow 필드 추가
- [ ] API: create_pending_review()에 source_workflow 파라미터 추가
- [ ] API: GET /api/pending에 workflow, run_id 필터 파라미터 추가
- [ ] API: DELETE /api/pending/batch 엔드포인트 구현
- [ ] Dashboard: 필터 상태 변수 추가
- [ ] Dashboard: 필터 드롭다운 UI 렌더링
- [ ] Dashboard: 일괄 삭제 버튼 및 확인 다이얼로그
- [ ] Dashboard: List 항목에 워크플로우/run_id 뱃지 표시
- [ ] n8n: entity-validator에 source_workflow 추가
- [ ] n8n: hypothesis-seeder에 source_workflow 추가
- [ ] 로컬 테스트
- [ ] NAS 동기화 및 Docker 재배포

### 작업 로그

---

## 참고 문서

- [[prj-n8n]] - 소속 Project
- [[tsk-n8n-10]] - 선행 Task (3단 레이아웃)
- [[tsk-n8n-13]] - 선행 Task (필드 선택 UX)

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
