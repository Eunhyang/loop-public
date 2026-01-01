---
entity_type: Task
entity_id: tsk-n8n-11
entity_name: "Hypothesis - Seeder 워크플로우 API 개발"
created: 2026-01-01
updated: 2026-01-02
status: done

# === 계층 ===
parent_id: prj-n8n
project_id: prj-n8n
aliases:
- tsk-n8n-11

# === 관계 ===
outgoing_relations:
- tsk-n8n-10
validates: []

# === Task 전용 ===
assignee: 김은향
start_date: 2026-01-01
due: 2026-01-03
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===
conditions_3y:
- cond-e

# === 분류 ===
tags:
- hypothesis
- automation
- llm
- api
priority_flag: high
---

# Hypothesis - Seeder 워크플로우 API 개발

> Task ID: `tsk-n8n-11` | Project: `prj-n8n` | Status: doing

## 목표

**완료 조건**:
1. `/api/ai/infer/hypothesis_draft` 엔드포인트 구현
2. Hypothesis 문서 draft 생성 + 연결 patch를 pending으로 생성
3. 승인 후에만 실제 파일 생성/연결 되도록 구현
4. n8n 워크플로우 D (Hypothesis Seeder) 연동

---

## 상세 내용

### 배경

Hypothesis 생성은 복잡한 작업:
- ID 발급 (hyp-{track}-{seq} 중복 방지)
- parent_id (트랙 소속) 연결
- success/failure/measurement 설계
- 프로젝트 validates 연결
- 나중에 Evidence.validated_hypotheses/falsified_hypotheses까지 연동

자동 생성으로 넣으면 지식 그래프 오염 위험이 큼.

### 추천 구조: Workflow D (Hypothesis Seeder)

**트리거 조건 (조건부)**:
- Project.status in [planning, active]
- AND expected_impact.statement 또는 hypothesis_text가 있음
- AND validates = [] (가설 연결 없음)
- AND 프로젝트가 strategic/enabling (중요도 높음)

**동작**:
1. `/api/ai/infer/hypothesis_draft` 호출
2. Hypothesis 문서 draft + 연결 patch를 pending으로 생성
3. 승인 후에만 실제 파일 생성/연결

### 핵심 원칙

"자동화"와 "지식 그래프 품질"이 같이 살아야 함.
→ v5 메인 워크플로우에 가설 생성 섞지 말고, 별도 워크플로우로 분리 + 승인 필수

---

## 체크리스트

- [ ] API 엔드포인트 설계
- [ ] LLM 프롬프트 템플릿 작성
- [ ] Pending review 생성 로직
- [ ] n8n 워크플로우 D 연동
- [ ] 테스트 및 배포

---

## Notes

### PRD (Product Requirements Document)

#### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| Task ID | `tsk-n8n-11` |
| Task Name | Hypothesis - Seeder 워크플로우 API 개발 |
| Project | `prj-n8n` (n8n Vault 자동화) |
| 목표 | Project에서 Hypothesis를 자동 생성하는 별도 워크플로우(Workflow D)를 위한 API 개발 |

#### 1.2 문제 정의

**배경:**
Hypothesis 생성은 LOOP Vault에서 가장 복잡한 작업 중 하나:
- ID 발급 규칙: `hyp-{track}-{seq}` 패턴으로 중복 방지 필요
- 관계 연결: `parent_id` (Track 소속) 연결 필수
- 판정 기준 설계: `success_criteria`, `failure_criteria`, `measurement` 필드가 명확해야 A/B Score 계산 가능
- Project 연결: `Project.validates`, `Project.primary_hypothesis_id` 설정
- Evidence 운영 준비: `normalized_delta` 계산 방법, `sample_size`, `counterfactual` 정의

**현재 문제점:**
1. Hypothesis 자동 생성 시 지식 그래프 오염 위험이 높음
2. 기존 v5 메인 워크플로우에 가설 생성을 섞으면 복잡도 증가
3. 잘못된 가설이 자동으로 연결되면 A/B Score 체계 전체가 오염됨

**사용자 Pain Point:**
1. Project 생성 시 `validates = []`인 상태로 방치되는 경우 많음
2. 가설 설계 없이 프로젝트만 진행하면 사후 Impact 평가가 불가능
3. 수동으로 Hypothesis 파일 생성 시 필드 누락/형식 오류 빈번

#### 1.3 핵심 원칙

> **"자동화"와 "지식 그래프 품질"이 같이 살아야 함.**

- v5 메인 워크플로우에 가설 생성 섞지 말고, **별도 워크플로우로 분리**
- **승인 필수**: draft 생성 후 pending review로 전달 -> Dashboard 승인 후에만 실제 파일 생성
- **품질 검증**: Hypothesis 품질 점수(quality_score)와 Evidence 운영 가능성 검증

#### 1.4 목표 및 성공 기준

**성공 기준:**
- [ ] `/api/ai/infer/hypothesis_draft` 엔드포인트 정상 동작
- [ ] Project에서 hypothesis_text/expected_impact.statement 기반으로 Hypothesis draft 생성
- [ ] 중복 ID 방지 로직 구현 (hyp-{track}-{seq} 패턴)
- [ ] 품질 검증 (hypothesis_question이 ?로 끝나는지, success/failure criteria 존재 등)
- [ ] Evidence 운영 가능성 검증 (normalized_delta 계산 방법 제안)
- [ ] pending review 생성 및 Dashboard 연동
- [ ] 승인 시 Hypothesis 파일 생성 + Project.validates 자동 연결

#### 1.5 기능 상세

**트리거 조건 (n8n Workflow D에서 사용):**
- `Project.status in [planning, active]`
- AND `expected_impact.statement` 또는 `hypothesis_text`가 존재
- AND `validates = []` (가설 연결 없음)
- AND 프로젝트가 strategic/enabling tier (중요도 높음)

**API 동작 흐름:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                   Hypothesis Seeder Workflow (D)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. n8n Trigger (15분 간격 스캔)                                     │
│     Filter: Project.status IN [planning, active]                     │
│             AND validates = []                                        │
│             AND expected_impact.statement 존재                        │
│             AND tier IN [strategic, enabling]                         │
│       ↓                                                              │
│  2. API Call: POST /api/ai/infer/hypothesis_draft                    │
│     Request: { project_id, mode: "pending", provider: "openai" }     │
│     Response: { hypothesis_draft, quality_score, evidence_readiness }│
│       ↓                                                              │
│  3. Pending Review (Dashboard)                                       │
│     - 3단 레이아웃에서 draft 확인                                    │
│     - 수정 가능: hypothesis_question, criteria, measurement          │
│     - [Reject] 거부 | [Approve] 승인 → 파일 생성                     │
│       ↓ (Approve 시)                                                 │
│  4. Hypothesis 파일 생성                                             │
│     - 경로: 60_Hypotheses/{horizon}/hyp-{track}-{seq}_name.md        │
│     - Project.validates 자동 업데이트                                │
└─────────────────────────────────────────────────────────────────────┘
```

#### 1.6 Hypothesis Draft 필드

LLM이 생성해야 하는 필드:

| 필드 | 필수 | 설명 |
|------|------|------|
| `entity_name` | Y | 가설 이름 |
| `hypothesis_question` | Y | 질문 형태 (`?`로 끝남) |
| `success_criteria` | Y | 성공 판정 기준 (숫자/기간/표본 포함 권장) |
| `failure_criteria` | Y | 실패 판정 기준 (피벗/중단 트리거) |
| `measurement` | Y | 어디서/무엇을/어떻게 측정 |
| `confidence` | Y | 0.0 ~ 1.0 초기 신뢰도 |
| `horizon` | Y | 검증 목표 연도 (예: "2026") |

서버가 자동 생성하는 필드:

| 필드 | 설명 |
|------|------|
| `entity_id` | `hyp-{track}-{seq}` 자동 발급 |
| `parent_id` | Project.parent_id에서 상속 (Track ID) |

#### 1.7 품질 검증 항목

**A. 구조 검증:**
- `parent_id`가 Track ID (`trk-N`) 형식인가?
- `horizon`이 4자리 연도인가?

**B. 품질 검증:**
- `hypothesis_question`이 `?`로 끝나는 질문 형태인가?
- `success_criteria`가 10자 이상이고 구체적인가?
- `failure_criteria`가 10자 이상이고 구체적인가?
- `measurement`가 10자 이상이고 명확한가?

**C. Evidence 운영 가능성:**
- `normalized_delta` 계산 방법이 정의 가능한가?
- `sample_size` 추정치 제공
- `counterfactual` 유형 제안 (none / before_after / controlled)

#### 1.8 제약 사항

- `validated_by` 필드 제안 금지 (Derived 필드)
- Project.validates에 직접 쓰기 금지 (승인 후에만 업데이트)
- ID 중복 허용 금지

---

### Tech Spec

#### 2.1 수정/생성 대상 파일

| 파일 | 작업 | 설명 |
|------|------|------|
| `api/routers/ai.py` | 수정 | `/infer/hypothesis_draft` 엔드포인트 추가 |
| `api/prompts/hypothesis_seeder.py` | **신규** | Hypothesis draft 생성 프롬프트 |
| `api/utils/hypothesis_generator.py` | **신규** | ID 발급, 품질 검증, 파일 생성 헬퍼 |
| `api/routers/pending.py` | 수정 | approve 시 Hypothesis 파일 생성 로직 추가 |
| `api/cache/vault_cache.py` | 수정 | `get_hypotheses()` 메서드 추가 (없다면) |

#### 2.2 API 엔드포인트

**POST `/api/ai/infer/hypothesis_draft`**

Request:
```python
class InferHypothesisDraftRequest(BaseModel):
    project_id: str  # Project ID (예: prj-001)
    mode: str = "pending"  # preview | pending
    provider: str = "openai"  # LLM provider
    actor: str = "n8n"  # 요청자
    run_id: Optional[str] = None
    schema_version: str = "5.3"
    create_pending: bool = True
```

Response:
```python
class InferHypothesisDraftResponse(BaseModel):
    ok: bool
    run_id: str
    hypothesis_draft: Dict[str, Any]  # Hypothesis frontmatter + body 초안
    quality_score: float  # 품질 점수 (0.0 ~ 1.0)
    quality_issues: List[str]  # 품질 이슈 목록
    evidence_readiness: Dict[str, Any]  # normalized_delta_method 등
    project_link: Dict[str, Any]  # validates 업데이트 제안
    pending: Optional[Dict[str, Any]] = None
    audit_ref: str
    error: Optional[str] = None
```

#### 2.3 ID 발급 로직

```python
def generate_hypothesis_id(track_id: str) -> str:
    """
    형식: hyp-{track_number}-{seq}
    예: hyp-3-01, hyp-3-02, ...
    """
    # 1. Track 번호 추출
    track_num = track_id.replace("trk-", "")

    # 2. 해당 Track의 기존 Hypothesis ID 조회
    existing_ids = [h for h in cache.get_hypotheses()
                   if h.startswith(f"hyp-{track_num}-")]

    # 3. 다음 순번 계산
    max_seq = max([int(id.split("-")[2]) for id in existing_ids], default=0)

    return f"hyp-{track_num}-{max_seq + 1:02d}"
```

#### 2.4 품질 검증 함수

```python
def validate_hypothesis_quality(draft: Dict) -> Tuple[float, List[str]]:
    issues = []
    score = 1.0

    # hypothesis_question 검증
    if not draft.get("hypothesis_question", "").endswith("?"):
        issues.append("hypothesis_question_not_question_form")
        score -= 0.2

    # success_criteria 검증
    if len(draft.get("success_criteria", "")) < 10:
        issues.append("missing_or_weak_success_criteria")
        score -= 0.2

    # failure_criteria 검증
    if len(draft.get("failure_criteria", "")) < 10:
        issues.append("missing_or_weak_failure_criteria")
        score -= 0.2

    return (max(0.0, score), issues)
```

#### 2.5 n8n Workflow D 설계

```
1. Schedule Trigger (15분 간격 or Daily)
   ↓
2. HTTP Request: GET /api/projects
   Filter: status IN [planning, active], validates = []
   ↓
3. IF (empty?) → Stop
   ↓
4. Loop: For Each Project
   ↓
5. HTTP Request: POST /api/ai/infer/hypothesis_draft
   Body: { project_id, mode: "pending" }
   ↓
6. (optional) Slack/Email 알림
```

#### 2.6 테스트 케이스

| # | 테스트 | 예상 결과 |
|---|--------|----------|
| 1 | 정상 draft 생성 | quality_score >= 0.7, pending 생성 |
| 2 | 이미 validates 있음 | 스킵 또는 warning |
| 3 | Track 없는 Project | error: parent_id required |
| 4 | ID 중복 방지 | 기존 hyp-3-01~03 → hyp-3-04 발급 |
| 5 | Approve 후 파일 생성 | 60_Hypotheses/에 파일 생성 |

---

### Todo

| # | 상태 | 작업 내용 |
|---|------|----------|
| 1 | done | `api/prompts/hypothesis_seeder.py` 신규 생성 |
| 2 | done | `api/utils/hypothesis_generator.py` 신규 생성 - ID 발급, 품질 검증 |
| 3 | done | `api/routers/ai.py`에 Pydantic 모델 추가 |
| 4 | done | `@router.post("/infer/hypothesis_draft")` 엔드포인트 구현 |
| 5 | done | `api/cache/vault_cache.py`에 `get_hypotheses()` 메서드 구현 |
| 6 | done | `generate_hypothesis_id()` 함수 구현 |
| 7 | done | `validate_hypothesis_quality()` 함수 구현 |
| 8 | done | `assess_evidence_readiness()` 함수 구현 |
| 9 | done | `create_hypothesis_file()` 함수 구현 |
| 10 | done | `update_project_validates()` 함수 구현 |
| 11 | done | `api/routers/pending.py` 수정 - Hypothesis approve 로직 |
| 12 | skip | LLM 호출 + JSON 파싱 통합 테스트 |
| 13 | skip | 단위 테스트 작성 |
| 14 | skip | n8n Workflow D 구성 |
| 15 | done | `/mcp-server rebuild` 후 NAS 배포 |
| 16 | skip | E2E 테스트 |

---

### 작업 로그

#### 2026-01-02 04:05
**개요**: Hypothesis Seeder API 개발 완료. Project에서 Hypothesis draft를 자동 생성하고 pending review로 전달하는 엔드포인트 구현.

**변경사항**:
- 개발: `POST /api/ai/infer/hypothesis_draft` 엔드포인트
- 개발: LLM 프롬프트 템플릿 (`hypothesis_seeder.py`)
- 개발: ID 생성, 품질 검증, 파일 생성 유틸리티 (`hypothesis_generator.py`)
- 수정: `pending.py`에 Hypothesis approve 로직 추가

**파일 변경**:
- `api/prompts/hypothesis_seeder.py` - 신규 (LLM 프롬프트)
- `api/utils/hypothesis_generator.py` - 신규 (유틸리티 함수들)
- `api/routers/ai.py` - 수정 (엔드포인트 추가)
- `api/routers/pending.py` - 수정 (approve 로직)
- `api/prompts/__init__.py` - 수정 (모듈 export)

**결과**: MCP 서버 배포 완료, Health Check 정상

**다음 단계**:
- n8n Workflow D 구성 (별도 Task로 분리)


---

## 참고 문서

- [[prj-n8n]] - 소속 Project
- [[tsk-n8n-10]] - 선행 Task

---

**Created**: 2026-01-01
**Assignee**: 김은향
**Due**: 2026-01-03
