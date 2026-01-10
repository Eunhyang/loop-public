---
entity_type: Task
entity_id: tsk-n8n-23
entity_name: n8n - Entity Validator Auto-Apply 기능
created: 2026-01-11
updated: '2026-01-11'
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

### 2026-01-11 - Code Review 이슈 발견 (Codex)

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

---

## 안전장치

1. **Kill Switch**: `AUTO_APPLY_CONFIG["enabled"] = False`로 전역 비활성화
2. **Never Auto-Apply 목록**: 전략적 필드는 절대 자동 적용 안 함
3. **Audit Trail**: 모든 auto_applied 변경은 pending_reviews.json + decision_log.jsonl에 기록
4. **Revert 가능**: Dashboard에서 auto_applied 항목 확인 및 되돌리기 가능

---

## 재작업 요약

### 수정 필요한 파일

| 파일 | 라인 | 수정 내용 |
|------|------|----------|
| `api/routers/ai.py` | 1474 | `confidence = content.get("confidence", {})` 추가 |
| `api/routers/ai.py` | 1509 | `elif request.mode == "auto_apply":` 분기 추가 |
| `_build/n8n_workflows/entity_validator_autofiller.json` | 223 | `"mode": "auto_apply"` 변경 |
| `_build/n8n_workflows/entity_validator_autofiller.json` | 335 | `"mode": "auto_apply"` 변경 |

### 구현 완료된 부분 (재사용 가능)

- `api/services/auto_apply.py` - 전체 auto-apply 로직 완성
- `api/prompts/task_schema.py` - confidence 요청 프롬프트
- `api/prompts/project_schema.py` - confidence 요청 프롬프트

### 예상 작업 시간

- Issue 1, 2 수정: 30분 (ai.py 2곳 수정)
- Issue 3 수정: 5분 (workflow JSON 2곳 수정)
- 테스트: 15분 (n8n 워크플로우 트리거 → Dashboard 확인)
- **총 예상 시간**: 50분
