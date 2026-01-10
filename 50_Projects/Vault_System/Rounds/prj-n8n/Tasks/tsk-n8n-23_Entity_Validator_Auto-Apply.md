---
entity_type: Task
entity_id: tsk-n8n-23
entity_name: n8n - Entity Validator Auto-Apply 기능
created: 2026-01-11
updated: '2026-01-11'
status: doing
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
- [ ] `api/services/auto_apply.py` 신규 생성
- [ ] `AUTO_APPLY_CONFIG` 정의
- [ ] `should_auto_apply()` 함수 구현
- [ ] `apply_fields_to_entity()` 함수 구현
- [ ] `create_auto_applied_review()` 함수 구현

### Step 2: AI Router 수정
- [ ] `api/routers/ai.py`에 `mode: "auto_apply"` 추가
- [ ] LLM 호출 시 confidence 점수 요청
- [ ] auto_apply 모드 처리 로직 구현
  - 고확신 필드 → 엔티티 적용 + auto_applied 리뷰
  - 저확신 필드 → 기존 pending 리뷰

### Step 3: Pending Router 수정
- [ ] `api/routers/pending.py` status 필터에 `auto_applied` 추가
- [ ] GET /api/pending 쿼리 파라미터 확장
- [ ] (선택) `POST /api/pending/{id}/revert` 엔드포인트

### Step 4: LLM 프롬프트 수정
- [ ] `api/prompts/task_schema.py` - confidence 필드 추가
- [ ] `api/prompts/project_schema.py` - confidence 필드 추가

### Step 5: n8n 워크플로우 업데이트
- [ ] `entity_validator_autofiller.json`에서 `mode: "auto_apply"` 전달
- [ ] 응답 처리 로직 업데이트

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
