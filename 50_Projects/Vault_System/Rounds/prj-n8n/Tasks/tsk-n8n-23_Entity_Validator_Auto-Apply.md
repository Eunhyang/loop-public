---
entity_type: Task
entity_id: tsk-n8n-23
entity_name: n8n - Entity Validator Auto-Apply 기능
created: 2026-01-11
updated: '2026-01-11'
revision_count: 2
status: doing
closed: null
parent_id: prj-n8n
project_id: prj-n8n
aliases:
- tsk-n8n-23
- Entity Validator Auto-Apply
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
start_date: null
due: null
priority: high
estimated_hours: null
actual_hours: null
type: dev
target_project: loop
tags:
- n8n
- entity-validator
- automation
- llm
- auto-apply
priority_flag: high
---

# n8n - Entity Validator Auto-Apply 기능

> Task ID: `tsk-n8n-23` | Project: `prj-n8n` | Status: doing

## 목표

Entity Validator가 **고확신 필드**를 자동으로 적용하고, `pending_reviews.json`에 `auto_applied` 상태로 기록하여 사용자가 나중에 확인할 수 있도록 함.

## 완료 조건

1. `mode: "auto_apply"` 파라미터 지원
2. 고확신 필드(confidence ≥ 0.85)는 엔티티에 자동 적용
3. 모든 자동 적용 내역은 `pending_reviews.json`에 `status: "auto_applied"`로 기록
4. Dashboard에서 Auto-Applied 탭으로 조회 가능

---

## Revision History

### 2026-01-11 Rev.2 - 추가 이슈 발견 (Post-Implementation)

**상태**: `done` → `doing` (재작업 필요, Revision 2)

**발견된 추가 이슈**:

1. **Issue 4: n8n 워크플로우 미반영**
   - **문제**: JSON 파일 수정만으로는 n8n에 반영되지 않음. n8n은 자체 SQLite DB 사용
   - **영향**: auto_apply 모드가 호출되지 않고 여전히 pending 모드로 실행됨
   - **수정 방향**: n8n API로 워크플로우 직접 업데이트 (`PUT /workflows/{id}`)

2. **Issue 5: LLM이 confidence 미반환**
   - **문제**: LLM(gpt-4o-mini)이 프롬프트의 confidence 요청을 무시
   - **영향**: 모든 필드의 confidence가 0이 되어 auto_apply 조건(≥0.85) 불충족
   - **수정 방향**: `ai.py`에 규칙 기반 default confidence 로직 추가
     - Deterministic 필드 (status, priority, type 정규화): confidence = 1.0
     - Mapping 기반 필드 (assignee alias): confidence = 0.95
     - 날짜 추출 필드 (due): confidence = 0.85 (명시적 날짜 발견 시)

3. **Issue 6: source_workflow가 null**
   - **문제**: n8n에서 source_workflow 필드를 HTTP Request body에 전달하지 않음
   - **영향**: `pending_reviews.json`에 감사 추적(audit trail) 불가
   - **수정 방향**: n8n HTTP Request 노드에 `"source_workflow": "entity_validator_autofiller"` 필드 추가

---

### 2026-01-11 Rev.1 - Code Review 이슈 발견 (Codex)

**상태**: `done` → `doing` (재작업 필요)

**발견된 이슈**:

1. **Issue 1: confidence 추출 누락**
   - **위치**: `api/routers/ai.py` Line 1473-1474
   - **문제**: LLM 응답에서 `confidence` 필드를 추출하지 않음
   - **영향**: auto_apply 기능이 confidence 점수 없이는 동작 불가
   - **수정 필요**: `confidence = content.get("confidence", {})` 추가

2. **Issue 2: auto_apply 모드 분기 없음**
   - **위치**: `api/routers/ai.py` Line 1489-1508
   - **문제**: `mode == "pending"` 분기만 존재, `auto_apply` 처리 로직 없음
   - **영향**: `mode: "auto_apply"`로 호출해도 아무 일도 안 함
   - **수정 필요**: `elif request.mode == "auto_apply":` 분기 추가하여 `auto_apply.py` 서비스 연결

3. **Issue 3: n8n workflow mode 하드코딩**
   - **위치**: `_build/n8n_workflows/entity_validator_autofiller.json` Line 223, 335
   - **문제**: `"mode": "pending"` 하드코딩
   - **영향**: 워크플로우가 항상 pending 모드로 실행되어 auto_apply 불가
   - **수정 필요**: `"mode": "auto_apply"`로 변경

**이미 완료된 부분** (이슈 없음):
- `api/services/auto_apply.py` - 완전히 구현됨
- `api/prompts/task_schema.py` - confidence 요청 프롬프트 있음

---

## Tech Spec

### Additional Requirements (Rev.2)

#### Req 4: n8n API 워크플로우 업데이트
```bash
# n8n은 SQLite DB를 사용하므로 JSON 파일 수정은 무의미
# 반드시 n8n REST API로 워크플로우 업데이트 필요

# 워크플로우 조회
GET https://n8n.sosilab.synology.me/api/v1/workflows/{id}

# 워크플로우 업데이트
PUT https://n8n.sosilab.synology.me/api/v1/workflows/{id}
Authorization: Bearer $N8N_API_TOKEN
Content-Type: application/json
{
  "nodes": [...],  # 수정된 노드 포함
  "connections": {...}
}
```

#### Req 5: Default Confidence 규칙 기반 로직
```python
# api/routers/ai.py - LLM이 confidence를 반환하지 않을 때 대비

def get_default_confidence(field: str, value: Any, source: str) -> float:
    """규칙 기반 default confidence 계산"""

    # Deterministic 필드 (enum 정규화)
    if field in ["status", "priority", "type"]:
        return 1.0

    # Mapping 기반 필드 (members.yaml alias)
    if field == "assignee" and source == "alias_match":
        return 0.95

    # 날짜 추출 (명시적 날짜 패턴 발견)
    if field == "due" and is_explicit_date(value):
        return 0.85

    # LLM 추론 필드 (default)
    return 0.5  # auto_apply 조건 미충족
```

#### Req 6: source_workflow 필드 추가
```json
// n8n HTTP Request 노드 body에 추가
{
  "entity_id": "{{ $json.entity_id }}",
  "entity_type": "{{ $json.entity_type }}",
  "mode": "auto_apply",
  "source_workflow": "entity_validator_autofiller"  // 추가 필요
}
```

---

### Auto-Apply 대상 필드

| 카테고리 | 필드 | 기준 |
|----------|------|------|
| **Deterministic (항상)** | status, priority, type 정규화 | 규칙 기반 |
| | assignee 정규화 (members.yaml alias) | 매핑 기반 |
| **LLM 고확신** | due_date | confidence ≥ 0.85 |
| | assignee (신규 제안) | confidence ≥ 0.85 |
| | parent_id (Track) | confidence ≥ 0.90 |
| **Auto-Apply 금지** | expected_impact, realized_impact | 전략적 판단 필요 |
| | validates, validated_by | 가설 관계 중요 |
| | conditions_3y | 전략 정렬 필요 |

### 구현 구조

```
api/
├── services/
│   └── auto_apply.py      # 신규: Auto-Apply 로직
├── routers/
│   ├── ai.py              # 수정: auto_apply 모드 추가
│   └── pending.py         # 수정: auto_applied status 지원
└── prompts/
    ├── task_schema.py     # 수정: confidence 필드 추가
    └── project_schema.py  # 수정: confidence 필드 추가
```

### Auto-Apply 서비스 설계

```python
# api/services/auto_apply.py

AUTO_APPLY_CONFIG = {
    "enabled": True,
    "default_threshold": 0.85,
    "field_thresholds": {
        "due": 0.85,
        "assignee": 0.85,
        "parent_id": 0.90,
        "priority": 0.80,
    },
    "deterministic_fields": ["status", "priority", "type"],
    "never_auto_apply": [
        "expected_impact", "realized_impact",
        "validates", "validated_by", "conditions_3y"
    ],
}

def should_auto_apply(field: str, confidence: float) -> bool:
    """필드별 auto-apply 여부 결정"""

def apply_fields_to_entity(entity_id: str, fields: dict) -> bool:
    """엔티티 파일에 필드 적용"""

def create_auto_applied_review(entity_id, entity_type, ...) -> str:
    """auto_applied 상태로 pending review 생성"""
```

### LLM 응답 스키마 확장

```json
{
  "suggested_fields": {"due": "2026-02-01"},
  "reasoning": {"due": "..."},
  "confidence": {"due": 0.9}
}
```

### Pending Review 스키마 확장

```json
{
  "status": "pending | approved | rejected | auto_applied",
  "auto_applied_at": "2026-01-11T12:00:00",
  "confidence_scores": {"due": 0.9, "assignee": 0.85}
}
```

---

## Todo

### Step 1: Auto-Apply 서비스 모듈 생성
- [x] `api/services/auto_apply.py` 신규 생성 (완료)
- [x] `AUTO_APPLY_CONFIG` 정의 (완료)
- [x] `should_auto_apply()` 함수 구현 (완료)
- [x] `apply_fields_to_entity()` 함수 구현 (완료)
- [x] `create_auto_applied_review()` 함수 구현 (완료)

### Step 2: AI Router 수정 (재작업 필요)
- [x] `api/routers/ai.py`에 `mode: "auto_apply"` 파라미터 정의 추가 (완료)
- [ ] **FIX Issue 1**: LLM 응답에서 `confidence` 필드 추출
  - Line 1473-1474에 `confidence = content.get("confidence", {})` 추가
- [ ] **FIX Issue 2**: `auto_apply` 모드 처리 분기 구현
  - Line 1489-1508 이후에 `elif request.mode == "auto_apply":` 분기 추가
  - `auto_apply.py` 서비스 연결: `process_auto_apply()` 호출
  - 고확신 필드 → 엔티티 적용 + auto_applied 리뷰
  - 저확신 필드 → 기존 pending 리뷰

### Step 3: Pending Router 수정
- [ ] `api/routers/pending.py` status 필터에 `auto_applied` 추가
- [ ] GET /api/pending 쿼리 파라미터 확장
- [ ] (선택) `POST /api/pending/{id}/revert` 엔드포인트

### Step 4: LLM 프롬프트 수정
- [x] `api/prompts/task_schema.py` - confidence 필드 추가 (완료)
- [x] `api/prompts/project_schema.py` - confidence 필드 추가 (완료)

### Step 5: n8n 워크플로우 업데이트 (재작업 필요)
- [ ] **FIX Issue 3**: `entity_validator_autofiller.json` mode 변경
  - Line 223: Task Schema 호출 - `"mode": "pending"` → `"mode": "auto_apply"`
  - Line 335: Project Schema 호출 - `"mode": "pending"` → `"mode": "auto_apply"`
- [ ] 응답 처리 로직 업데이트 (auto_applied 상태 처리)

### Step 6: Dashboard UI 업데이트
- [ ] `pending-panel.js`에 "Auto-Applied" 탭 추가
- [ ] auto_applied 항목에 "AUTO" 배지 표시
- [ ] (선택) Revert 버튼 추가

### Step 7: 테스트 및 검증
- [ ] 단위 테스트: `should_auto_apply()` 함수
- [ ] 통합 테스트: API 호출 → pending_reviews 확인
- [ ] E2E 테스트: n8n 워크플로우 트리거 → Dashboard 확인

### Step 8: Rev.2 이슈 수정 (NEW)

#### 8.1 n8n 워크플로우 API 업데이트 (Issue 4)
- [ ] n8n API로 `entity_validator_autofiller` 워크플로우 ID 조회
- [ ] HTTP Request 노드의 `mode` 값을 `"auto_apply"`로 변경
- [ ] `PUT /api/v1/workflows/{id}`로 워크플로우 업데이트
- [ ] n8n 수동 트리거로 변경 반영 확인

#### 8.2 Default Confidence 로직 추가 (Issue 5)
- [ ] `api/routers/ai.py`에 `get_default_confidence()` 함수 추가
- [ ] Deterministic 필드 → confidence = 1.0
- [ ] Alias 매핑 필드 → confidence = 0.95
- [ ] 명시적 날짜 필드 → confidence = 0.85
- [ ] LLM 응답에 confidence 없으면 default 값 적용

#### 8.3 source_workflow 필드 추가 (Issue 6)
- [ ] n8n HTTP Request 노드 body에 `source_workflow` 필드 추가
- [ ] `pending_reviews.json`에서 source_workflow 기록 확인
- [ ] Dashboard에서 source 표시 확인

### Step 9: Rev.2 통합 테스트
- [ ] n8n 워크플로우 트리거 → auto_apply 모드 호출 확인
- [ ] confidence 값 정상 적용 확인 (0이 아닌 값)
- [ ] source_workflow 기록 확인
- [ ] Dashboard Auto-Applied 탭에서 항목 표시 확인

---

## 수정 파일 목록

| 파일 | 작업 |
|------|------|
| `api/services/auto_apply.py` | 신규 생성 |
| `api/routers/ai.py` | auto_apply 모드 구현 |
| `api/routers/pending.py` | auto_applied status 지원 |
| `api/prompts/task_schema.py` | confidence 필드 추가 |
| `api/prompts/project_schema.py` | confidence 필드 추가 |
| `_build/n8n_workflows/entity_validator_autofiller.json` | mode 변경 |
| `_dashboard/js/components/pending-panel.js` | Auto-Applied 탭 |

### Rev.2 추가 수정 파일

| 파일 | 작업 |
|------|------|
| `api/routers/ai.py` | `get_default_confidence()` 함수 추가 |
| n8n workflow (via API) | `mode: "auto_apply"` + `source_workflow` 필드 |

---

## 안전장치

1. **Kill Switch**: `AUTO_APPLY_CONFIG["enabled"] = False`로 전역 비활성화
2. **Never Auto-Apply 목록**: 전략적 필드는 절대 자동 적용 안 함
3. **Audit Trail**: 모든 auto_applied 변경은 pending_reviews.json + decision_log.jsonl에 기록
4. **Revert 가능**: Dashboard에서 auto_applied 항목 확인 및 되돌리기 가능

---

## 재작업 요약

### Rev.1 수정 필요한 파일

| 파일 | 라인 | 수정 내용 |
|------|------|----------|
| `api/routers/ai.py` | 1474 | `confidence = content.get("confidence", {})` 추가 |
| `api/routers/ai.py` | 1509 | `elif request.mode == "auto_apply":` 분기 추가 |
| `_build/n8n_workflows/entity_validator_autofiller.json` | 223 | `"mode": "auto_apply"` 변경 |
| `_build/n8n_workflows/entity_validator_autofiller.json` | 335 | `"mode": "auto_apply"` 변경 |

### Rev.2 수정 필요한 항목 (NEW)

| 이슈 | 수정 대상 | 수정 내용 |
|------|----------|----------|
| Issue 4 | n8n workflow (via API) | JSON 파일 아닌 n8n REST API로 업데이트 |
| Issue 5 | `api/routers/ai.py` | `get_default_confidence()` 규칙 기반 로직 추가 |
| Issue 6 | n8n HTTP Request 노드 | `source_workflow` 필드 추가 |

### 구현 완료된 부분 (재사용 가능)

- `api/services/auto_apply.py` - 전체 auto-apply 로직 완성
- `api/prompts/task_schema.py` - confidence 요청 프롬프트
- `api/prompts/project_schema.py` - confidence 요청 프롬프트

### 예상 작업 시간

**Rev.1 이슈:**
- Issue 1, 2 수정: 30분 (ai.py 2곳 수정)
- Issue 3 수정: 5분 (workflow JSON 2곳 수정)

**Rev.2 이슈:**
- Issue 4 수정: 20분 (n8n API 호출 + 워크플로우 업데이트)
- Issue 5 수정: 30분 (default confidence 로직 구현)
- Issue 6 수정: 10분 (n8n 노드에 필드 추가)
- 통합 테스트: 20분

**총 예상 시간**: 1시간 55분

---

## Notes

### Rev.2 Implementation Complete (2026-01-11)

**Code Changes:**
1. Added `get_default_confidence()` helper function in `api/routers/ai.py`
   - Returns rule-based default confidence when LLM doesn't provide it
   - Deterministic fields (status, priority, type): 1.0
   - Date fields with YYYY-MM-DD pattern: 0.85
   - Assignee (conservative): 0.70
   - Entity references: 0.70
   - LLM inference: 0.5 (below threshold)

2. Updated Task endpoint (`infer_task_schema`)
   - Extract confidence from LLM response
   - Apply default confidence when None
   - Store computed confidence for audit
   - Use computed confidence in auto_applied reviews

3. Updated Project endpoint (`infer_project_schema`)
   - Added confidence extraction (was missing)
   - Added complete auto_apply mode handling
   - Same pattern as Task endpoint

**Manual Step Required (Issue 4, 6):**

n8n workflow update via UI (safer than API):

1. Open https://n8n.sosilab.synology.me
2. Find workflow: "entity_validator_autofiller"
3. Edit HTTP Request nodes:
   - **Node 1**: "Call LOOP API - Task Schema"
     - Body Parameters → mode: change "pending" to "auto_apply"
     - Body Parameters → Add: source_workflow: "entity_validator_autofiller"
   - **Node 2**: "Call LOOP API - Project Schema"
     - Body Parameters → mode: change "pending" to "auto_apply"
     - Body Parameters → Add: source_workflow: "entity_validator_autofiller"
4. Save workflow
5. Test manually

**Why manual update?**
- n8n API requires full workflow object (versionId, active, credentials)
- Risk of clobbering concurrent changes
- Manual UI update is safer and verifiable
- Code changes are already deployed and ready

**Testing Checklist:**
- [ ] n8n workflow updated via UI
- [ ] Manual trigger test
- [ ] Verify auto_apply mode called (check audit logs)
- [ ] Verify confidence values non-zero (check pending_reviews.json)
- [ ] Verify source_workflow recorded
- [ ] Check Dashboard Auto-Applied tab
