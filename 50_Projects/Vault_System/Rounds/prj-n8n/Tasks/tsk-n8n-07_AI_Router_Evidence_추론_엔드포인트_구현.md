---
entity_type: Task
entity_id: tsk-n8n-07
entity_name: "AI Router - Evidence 추론 엔드포인트 구현"
created: 2025-12-29
updated: 2025-12-29
status: done
closed: 2025-12-29

# === 계층 ===
parent_id: prj-n8n
project_id: prj-n8n
aliases:
- tsk-n8n-07

# === 관계 ===
outgoing_relations: []
validates: []

# === Task 전용 ===
assignee: 김은향
start_date: 2025-12-29
due: 2025-12-29
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===

# === 분류 ===
tags:
- n8n
- ai
- evidence
- api
- llm
priority_flag: high
---

# AI Router - Evidence 추론 엔드포인트 구현

> Task ID: `tsk-n8n-07` | Project: `prj-n8n` | Status: doing

## 목표

**완료 조건**:
1. `/api/ai/infer/evidence` 엔드포인트 구현 (B1 경로)
2. v5.3 품질 메타 7개 필드 자동 채움 포함
3. pending 생성 + decision_log 기록 통합
4. ai.py output schema를 v5.3에 정합 (contributes → condition_contributes 등)

---

## 상세 내용

### 배경

tsk-n8n-03에서 B(Realized Impact) 입력 경로가 두 갈래로 분기됨:
- **B1 (정석)**: Evidence 문서 생성 → build_impact가 B Score 계산
- **B2 (임시)**: Project.realized_impact 직접 패치

현재 `api/routers/ai.py`에는 Expected Impact(`/infer/project_impact`)만 구현되어 있고,
Evidence 생성 엔드포인트가 없어서 B1 경로가 동작하지 않음.

v5.3에서 Evidence 품질 메타 7개 필드가 추가됨:
- provenance, source_refs, sample_size, measurement_quality
- counterfactual, confounders, query_version

### 작업 내용

1. **Evidence 추론 엔드포인트 구현**
   - `POST /api/ai/infer/evidence`
   - 입력: project_id, mode, provider
   - LLM이 Evidence 필드 제안 (normalized_delta, evidence_strength, learning_value 등)
   - v5.3 품질 메타 7개 필드 자동 채움

2. **프롬프트 템플릿 작성**
   - `api/prompts/evidence.py` 신규 생성
   - Project 컨텍스트 + 전략 계층 포함
   - 품질 메타 필드 가이드라인 포함

3. **ai.py v5.3 정합**
   - `contributes` → `condition_contributes` 변경
   - `hypothesis_id` → `primary_hypothesis_id` (deprecated 표시)
   - `validates` 필드 추가

---

## 체크리스트

- [x] `api/prompts/evidence.py` 생성
- [x] `/api/ai/infer/evidence` 엔드포인트 구현
- [x] v5.3 품질 메타 자동 채움 로직
- [x] pending 생성 + decision_log 통합
- [x] ai.py 기존 코드 v5.3 정합 (contributes → condition_contributes)
- [x] 단위 테스트 또는 curl 테스트 (import 검증)
- [x] MCP 서버 재빌드 및 검증

---

## Notes

### PRD (Product Requirements Document)

**Task ID**: tsk-n8n-07
**Project**: prj-n8n (LOOP Vault)

#### 1. 프로젝트 컨텍스트

- **Framework**: Python 3.11+ / FastAPI
- **Architecture**: RESTful API + MCP 통합
- **주요 라이브러리**: FastAPI, Pydantic v2, OpenAI/Anthropic SDK, PyYAML
- **Schema Version**: v5.3
- **Impact Model Version**: v1.3.0

#### 2. 핵심 목표

1. `/api/ai/infer/evidence` 엔드포인트 구현 (B1 경로 - Evidence 기반 Realized Impact)
2. v5.3 품질 메타 7개 필드 자동 채움
3. pending 생성 + decision_log 기록 통합
4. 기존 ai.py의 output schema를 v5.3에 정합 (`contributes` -> `condition_contributes`)

#### 3. 성공 기준

- [ ] `POST /api/ai/infer/evidence` 엔드포인트 정상 동작
- [ ] LLM이 Evidence 필드를 정확히 제안
- [ ] v5.3 품질 메타 7개 필드가 LLM 응답에 포함됨
- [ ] pending_reviews.json에 pending 생성됨
- [ ] decision_log.jsonl에 pending_created 이벤트 기록됨
- [ ] 기존 `/infer/project_impact` 코드의 v5.3 마이그레이션
- [ ] curl 테스트 성공

#### 4. 파일 구조

```
api/
├── routers/
│   └── ai.py                    # 수정: /infer/evidence 추가, v5.3 정합
├── prompts/
│   ├── expected_impact.py       # 기존 유지
│   └── evidence.py              # 신규: Evidence 추론 프롬프트
├── services/
│   └── decision_logger.py       # 기존 재사용
└── utils/
    └── impact_calculator.py     # 기존 재사용
```

---

### Tech Spec

#### 1. API 명세

**Endpoint**: `POST /api/ai/infer/evidence`

**Request Body**:
```json
{
  "project_id": "prj-001",
  "mode": "pending",
  "provider": "openai",
  "retrospective_content": "## 회고 내용...",
  "actual_result": "D7 리텐션 45% 달성",
  "actor": "n8n",
  "run_id": null,
  "schema_version": "5.3",
  "create_pending": true
}
```

**Response Body**:
```json
{
  "ok": true,
  "run_id": "run-20251229-120000-abc123",
  "patch": {
    "normalized_delta": 0.85,
    "evidence_strength": "strong",
    "attribution_share": 0.9,
    "impact_metric": "retention_d7",
    "learning_value": "high",
    "realized_status": "succeeded",
    "validated_hypotheses": ["hyp-2-01"],
    "falsified_hypotheses": [],
    "confirmed_insights": ["인사이트"]
  },
  "quality_meta": {
    "provenance": "mixed",
    "source_refs": ["https://..."],
    "sample_size": 500,
    "measurement_quality": "high",
    "counterfactual": "before_after",
    "confounders": ["시즌 효과"],
    "query_version": "ai_infer_v1.0.0"
  },
  "derived_autofill": {
    "window_id": "2025-12",
    "time_range": "2025-12-01..2025-12-31"
  },
  "scores": {
    "realized_score": 0.765
  },
  "pending": {
    "review_id": "review-abc123",
    "status": "pending"
  }
}
```

#### 2. Pydantic 모델

```python
class InferEvidenceRequest(BaseModel):
    project_id: str
    mode: str = "preview"  # preview | pending | execute
    provider: str = "openai"
    retrospective_content: Optional[str] = None
    actual_result: Optional[str] = None
    actor: str = "n8n"
    run_id: Optional[str] = None
    schema_version: str = "5.3"
    create_pending: bool = True

class InferEvidenceResponse(BaseModel):
    ok: bool
    run_id: str
    patch: Dict[str, Any] = {}
    quality_meta: Dict[str, Any] = {}
    derived_autofill: Dict[str, Any] = {}
    scores: Dict[str, float] = {}
    validation: Dict[str, Any] = {}
    pending: Optional[Dict[str, Any]] = None
    audit_ref: str = ""
    error: Optional[str] = None
```

#### 3. 품질 메타 자동 채움 로직

| 필드 | 자동 채움 규칙 |
|------|---------------|
| provenance | LLM 추론 시 "auto", 회고 있으면 "mixed" |
| source_refs | 회고 링크, Project.links에서 추출 |
| sample_size | LLM 추론 또는 null |
| measurement_quality | evidence_strength 연동 |
| counterfactual | LLM 추론 (A/B 테스트 → "controlled") |
| confounders | LLM 추론 |
| query_version | "ai_infer_v1.0.0" 고정 |

#### 4. v5.3 정합 수정 사항

```python
# Before
patch["contributes"] = normalized

# After
patch["condition_contributes"] = normalized
patch["track_contributes"] = content.get("track_contributes", [])
patch["validates"] = content.get("validates", [])
patch["primary_hypothesis_id"] = content.get("primary_hypothesis_id")
```

---

### Todo

1. [ ] `api/prompts/evidence.py` 생성
   - EVIDENCE_SYSTEM_PROMPT 작성
   - build_evidence_prompt() 함수 구현

2. [ ] `api/routers/ai.py` 수정 - 모델 추가
   - InferEvidenceRequest Pydantic 모델
   - InferEvidenceResponse Pydantic 모델

3. [ ] `/api/ai/infer/evidence` 엔드포인트 구현
   - 프로젝트 조회
   - 프롬프트 생성 + LLM 호출
   - 응답 파싱 (patch + quality_meta)
   - derived_autofill 계산
   - pending 생성 + decision_log 기록

4. [ ] v5.3 정합 - 기존 코드 수정
   - `/infer/project_impact`: `contributes` -> `condition_contributes`
   - `expected_impact.py` 프롬프트 JSON 형식 업데이트

5. [ ] 로컬 테스트
   - curl 명령어로 preview/pending 모드 테스트

6. [ ] MCP 서버 재빌드 및 배포
   - `/mcp-server rebuild`

---

### 관련 파일 참조

- `api/routers/ai.py:215` - 기존 `/infer/project_impact` 구현
- `api/prompts/expected_impact.py` - Expected Impact 프롬프트 템플릿
- `00_Meta/schema_constants.yaml:437-456` - Evidence 품질 메타 필드 정의
- `tsk-n8n-03` - 상위 기획 문서

### v5.3 Evidence 품질 메타 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| provenance | string | auto \| human \| mixed - 데이터 출처 |
| source_refs | [string] | 쿼리 URL/링크/샘플 ID |
| sample_size | number \| null | 표본 크기 |
| measurement_quality | string | low \| medium \| high |
| counterfactual | string | none \| before_after \| controlled |
| confounders | [string] | 외부 변수 목록 |
| query_version | string | 계산 규칙/버전 |

### 작업 로그

#### 2025-12-29 12:10

**개요**: `/api/ai/infer/evidence` 엔드포인트 구현 완료. n8n 워크플로우가 B1 경로(Evidence 기반 Realized Impact)로 LLM 추론을 호출할 수 있게 됨. 기존 `/infer/project_impact`도 v5.3 스키마에 정합.

**변경사항**:
- 개발: `api/prompts/evidence.py` 신규 생성 - Evidence 추론 프롬프트 템플릿 (v5.3 품질 메타 7개 필드 포함)
- 개발: `/api/ai/infer/evidence` 엔드포인트 - Project ID로 Evidence 필드 LLM 추론, pending 생성, decision_log 기록
- 수정: `api/routers/ai.py` - InferEvidenceRequest/Response 모델 추가, v5.3 정합 (contributes → condition_contributes)
- 수정: `api/prompts/expected_impact.py` - 프롬프트 JSON 형식 v5.3 업데이트

**파일 변경**:
- `api/prompts/evidence.py` - 신규 생성 (8.6KB)
- `api/routers/ai.py` - 수정 (+200 lines, /infer/evidence 엔드포인트 + v5.3 정합)
- `api/prompts/expected_impact.py` - 수정 (condition_contributes, track_contributes, validates 반영)

**결과**: ✅ MCP 서버 재빌드 성공, Health check 통과, 엔드포인트 등록 확인

**다음 단계**:
- tsk-n8n-03: n8n 워크플로우 JSON 수정 (OpenAI 노드 → ai router 호출)
- n8n GUI에서 import 및 E2E 테스트

---

## 참고 문서

- [[prj-n8n]] - 소속 Project
- [[tsk-n8n-03]] - 선행 Task (Impact Score 자동화)
- [[tsk-impact-v2-06]] - v5.3 스키마 작업

---

**Created**: 2025-12-29
**Assignee**: 김은향
**Due**: 2025-12-29
