---
entity_type: Task
entity_id: tsk-impact-v2-06
entity_name: "Evidence - 품질 메타 표준화 + 승인 로그 구현"
created: 2025-12-28
updated: 2025-12-28
status: done
closed: 2025-12-29
assignee: 김은향
project_id: prj-impact-schema-v2
parent_id: prj-impact-schema-v2
conditions_3y:
  - cond-e
type: dev
target_project: loop
priority: high
---

# Evidence - 품질 메타 표준화 + 승인 로그 구현

## 목표

LOOP_PHILOSOPHY.md 12절 결론에서 제시한 **가장 높은 ROI를 내는 두 가지 우선 구현**:

1. **Evidence 품질 메타 표준화 + 자동 채움**
2. **승인 로그(append-only) + audit(run) 로그로 재현/책임 구조 확보**

---

## 배경 (LOOP_PHILOSOPHY.md 발췌)

### 8.1 Evidence 품질 메타(신뢰 구조)

B는 숫자지만, **숫자의 신뢰 구조**가 없으면 "그럴듯한 점수"로 끝난다.
따라서 Evidence에는 최소한 아래 품질 메타가 필요하다:

- **provenance**: auto/human/mixed
- **source_refs**: 쿼리/링크/샘플
- **sample_size**: 숫자 또는 sample_ids
- **measurement_quality**: low/med/high
- **counterfactual**: none/before_after/controlled (대조군/전후비교 유무)
- **confounders**: 외부 변수 여부
- **query/version**: 어떤 규칙/버전으로 계산했는지

> 이걸 Vault+n8n으로도 lite하게 충분히 만들 수 있다.
> (팔란티어가 강한 건 이걸 "플랫폼 레벨"로 해준다는 점이지만, 지금은 직접 최소 버전만 만들어도 됨)

### 8.2 승인 로그(append-only)

AI가 점점 더 많은 작업을 하게 될수록, "누가 무엇을 승인했는지"는 제품·조직의 안전장치가 된다.

- **decision_log.jsonl** (append-only)
- **audit/run 로그** (재현 가능한 디버깅)

LoopOS ontology-lite 문서가 말하듯, "인과 스위치는 ActionExecution"이고 그건 트랜잭션이어야 한다.
회사 운영에서도 동일하게:

- 누가 무엇을 승인했는지
- 언제 어떤 판단으로 바꿨는지

이게 1줄 로그로라도 남아야, 나중에 팔란티어 없이도 "감사/재현"이 가능해진다.

---

## 구현 범위

### Part 1: Evidence 품질 메타 스키마 확장

`00_Meta/schema_constants.yaml`에 Evidence 품질 메타 필드 추가:

```yaml
Evidence:
  # 기존 필드 (이미 정의됨)
  - normalized_delta
  - evidence_strength
  - attribution_share
  - learning_value

  # 신규 품질 메타 필드
  - provenance           # auto | human | mixed
  - source_refs          # [string] 쿼리/링크/샘플
  - sample_size          # number | null
  - measurement_quality  # low | medium | high
  - counterfactual       # none | before_after | controlled
  - confounders          # [string] 외부 변수 목록
  - query_version        # string (계산 규칙/버전)
```

### Part 2: 승인 로그 시스템

1. **decision_log.jsonl** (append-only)
   - 승인/거부 결정만 기록
   - 형식: `{timestamp, decision, entity_id, entity_type, user, reason}`

2. **audit.log 분리**
   - 기존: 엔티티 CRUD 전체
   - 변경: CRUD 로그만 (decision은 별도)

3. **run_log/** (LLM 호출 기록)
   - run_id 기반 실행 기록
   - 재현/디버깅용

### Part 3: 승인 API 엔드포인트

```
POST /api/pending/{review_id}/approve
POST /api/pending/{review_id}/reject
```

- 승인/거부 시 decision_log.jsonl에 자동 기록
- 승인 시 엔티티에 필드 적용

---

## Notes

### PRD (Product Requirements Document)

#### 프로젝트 컨텍스트
- **Framework**: LOOP Vault (Obsidian + FastAPI + n8n)
- **Architecture**: Document-based SSOT + Derived Build Artifacts
- **Schema SSOT**: `00_Meta/schema_constants.yaml`
- **Impact Config**: `impact_model_config.yml`
- **API**: FastAPI (`api/`) with routers, services, prompts
- **Key Principle**: "계산은 코드가, 판단은 사람이"

#### 주요 기능
1. **Evidence 품질 메타 스키마 확장** - schema_constants.yaml에 신뢰 구조 필드 추가
2. **decision_log.jsonl 구현** - append-only 승인/거부 로그
3. **run_log 시스템** - LLM 호출 재현/디버깅용 기록
4. **승인 API 엔드포인트** - approve/reject 전용 API

#### 성공 기준
- [ ] schema_constants.yaml에 Evidence 품질 메타 필드 7개 추가
- [ ] impact_model_config.yml에 evidence_quality_meta 섹션 추가
- [ ] validate_schema.py가 새 필드 정상 검증
- [ ] decision_log.jsonl 파일 생성 및 append-only 동작
- [ ] run_log/ 디렉토리 생성 및 LLM 호출 기록
- [ ] POST /api/pending/{id}/approve 동작
- [ ] POST /api/pending/{id}/reject 동작
- [ ] 승인 시 엔티티에 필드 적용
- [ ] 모든 결정이 decision_log에 기록됨

---

### Tech Spec

#### 파일 구조
```
00_Meta/
└── schema_constants.yaml          # Evidence 품질 메타 필드 추가

impact_model_config.yml            # evidence_quality_meta 섹션 추가

api/
├── routers/
│   ├── pending.py                 # approve/reject 엔드포인트 추가
│   └── audit.py                   # decision_log 분리
├── services/
│   └── decision_logger.py         # NEW: append-only 로거
└── utils/
    └── run_logger.py              # NEW: LLM 호출 기록

_build/
├── decision_log.jsonl             # NEW: 승인/거부 기록
├── audit.log                      # 기존: 엔티티 CRUD만
└── run_log/                       # NEW: LLM 실행 기록
    └── {run_id}.json
```

#### 1. Evidence 품질 메타 스키마 (schema_constants.yaml)

**위치**: `00_Meta/schema_constants.yaml` - `known_fields.Evidence` 섹션

**추가 필드**:
```yaml
Evidence:
  # 신규 품질 메타 필드
  - provenance           # auto | human | mixed
  - source_refs          # [string] 쿼리 URL/링크/샘플 ID
  - sample_size          # number | null
  - measurement_quality  # low | medium | high
  - counterfactual       # none | before_after | controlled
  - confounders          # [string] 외부 변수 목록
  - query_version        # string (계산 규칙/버전)
```

#### 2. Impact Model Config 확장 (impact_model_config.yml)

```yaml
evidence_quality_meta:
  provenance:
    values: [auto, human, mixed]
    default: human
  measurement_quality:
    values: [low, medium, high]
    default: medium
  counterfactual:
    values: [none, before_after, controlled]
    default: none
```

#### 3. Decision Logger Service (api/services/decision_logger.py)

```python
def log_decision(
    decision: str,           # approve | reject
    entity_id: str,
    entity_type: str,
    review_id: str,
    user: str,
    reason: Optional[str] = None,
    applied_fields: Optional[Dict] = None
) -> str:
    """decision_log.jsonl에 한 줄 추가 (append-only)"""
```

**로그 형식**:
```jsonl
{"decision_id": "dec-20251228-xxxx", "timestamp": "...", "decision": "approve", "entity_id": "prj-001", ...}
```

#### 4. Run Logger (api/utils/run_logger.py)

```python
def create_run_log(
    run_id: str,
    prompt: str,
    system_prompt: str,
    response: Dict,
    provider: str,
    model: str,
    entity_context: Optional[Dict] = None
) -> Path:
    """_build/run_log/{run_id}.json 생성"""
```

#### 5. 승인 API 엔드포인트 (api/routers/pending.py)

```python
@router.post("/{review_id}/approve")
async def approve_review(review_id: str, reason: Optional[str], user: str = "api")

@router.post("/{review_id}/reject")
async def reject_review(review_id: str, reason: str, user: str = "api")  # reason 필수
```

---

### Todo

1. [x] schema_constants.yaml - Evidence 품질 메타 필드 추가 (v5.3)
2. [x] impact_model_config.yml - evidence_quality_meta 섹션 추가 (v1.3.0)
3. [x] api/services/decision_logger.py - 신규 생성 (append-only)
4. [x] api/utils/run_logger.py - 신규 생성 (LLM 호출 기록)
5. [x] api/routers/pending.py - approve/reject 엔드포인트 + decision_log 연동
6. [x] api/routers/audit.py - /decisions, /runs 조회 엔드포인트 추가
7. [x] api/services/llm_service.py - run_log 자동 기록 연동
8. [x] _build/decision_log.jsonl - 초기 파일 생성
9. [x] _build/run_log/ - 디렉토리 생성

---

### 작업 로그

#### 2025-12-29: Evidence 품질 메타 표준화 + 승인 로그 구현

**Overview**

LOOP_PHILOSOPHY.md 12절에서 제시한 "가장 높은 ROI를 내는 두 가지 우선 구현"을 완료:
1. Evidence 품질 메타 표준화: B Score(실제 성과 점수)의 신뢰 구조를 담보하는 7개 메타 필드 추가
2. 승인 로그(append-only) + audit(run) 로그: AI 제안에 대한 인간 승인 추적 시스템

핵심 철학: "숫자의 신뢰 구조가 없으면 그럴듯한 점수로 끝난다"

**Context**

문제 인식:
- B Score는 숫자지만, 그 숫자가 어떻게 생성되었는지 알 수 없었음
- AI가 점점 더 많은 작업을 하면서 "누가 무엇을 승인했는지" 추적 필요
- 3개월 뒤에도 같은 결정을 같은 근거로 설명할 수 있어야 함

해결 방향:
- Evidence에 품질 메타 필드 추가 (provenance, measurement_quality, counterfactual 등)
- decision_log.jsonl: append-only 승인/거부 로그
- run_log/: LLM 호출 기록 (재현 가능한 디버깅)

**Changes Made**

1. Schema Constants 확장 (v5.2 → v5.3)
   - Evidence 품질 메타 필드 7개 추가: provenance, source_refs, sample_size, measurement_quality, counterfactual, confounders, query_version

2. Impact Model Config 확장 (v1.2.0 → v1.3.0)
   - evidence_quality_meta 섹션 추가

3. Decision Logger Service (api/services/decision_logger.py)
   - append-only 승인/거부 로그 시스템
   - log_decision(), get_decisions(), get_entity_decision_history() 등

4. Run Logger Utility (api/utils/run_logger.py)
   - LLM 호출 기록 시스템
   - create_run_log(), get_run_log(), list_run_logs(), delete_old_run_logs()

5. Pending Router 업데이트
   - approve/reject 엔드포인트에 decision_log 자동 기록 연동

6. Audit Router 확장
   - /api/audit/decisions, /api/audit/runs 조회 엔드포인트 추가

7. LLM Service 연동
   - run_log 자동 기록 연동 (entity_context, log_run 파라미터 추가)

**New API Endpoints**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/pending/{id}/approve` | 승인 + decision_log 기록 |
| POST | `/api/pending/{id}/reject` | 거부 + decision_log 기록 |
| GET | `/api/audit/decisions` | 결정 로그 조회 |
| GET | `/api/audit/decisions/{id}` | 특정 결정 조회 |
| GET | `/api/audit/decisions/entity/{id}` | 엔티티별 결정 히스토리 |
| GET | `/api/audit/runs` | LLM 실행 로그 목록 |
| GET | `/api/audit/runs/{id}` | 특정 실행 로그 상세 |
| DELETE | `/api/audit/runs/cleanup` | 오래된 로그 삭제 |

**File Changes Summary**

| File | Change | Description |
|------|--------|-------------|
| `api/services/decision_logger.py` | 신규 | append-only 로거 (226 lines) |
| `api/utils/run_logger.py` | 신규 | LLM 호출 기록 (223 lines) |
| `api/routers/audit.py` | 수정 | /decisions, /runs 엔드포인트 (+116 lines) |
| `api/routers/pending.py` | 수정 | decision_log 연동 |
| `api/services/llm_service.py` | 수정 | run_log 연동 |
| `00_Meta/schema_constants.yaml` | 수정 | v5.3 (Evidence 품질 메타) |
| `impact_model_config.yml` | 수정 | v1.3.0 (evidence_quality_meta) |
| `_build/decision_log.jsonl` | 신규 | 초기화 |
| `_build/run_log/` | 신규 | 디렉토리 생성 |

**Verification Results**

```bash
$ python3 -c "from api.routers import pending, audit; from api.services import llm_service, decision_logger; from api.utils import run_logger; print('All modules import successfully')"
All modules import successfully
```

**Summary**

| 구분 | 변경 |
|------|------|
| Schema 버전 | 5.2 → **5.3** |
| Impact Config 버전 | 1.2.0 → **1.3.0** |
| 신규 파일 | 2개 (decision_logger.py, run_logger.py) |
| 수정 파일 | 5개 |
| 신규 API | 8개 엔드포인트 |

LOOP_PHILOSOPHY 구현 현황:
- 8.1 Evidence 품질 메타: ✅ 7개 필드 추가
- 8.2 승인 로그 (append-only): ✅ decision_log.jsonl
- 8.2 audit/run 로그: ✅ run_log/ 디렉토리

**Next Steps**
- n8n 워크플로우 연동: autofill 워크플로우에서 run_log 활용
- Dashboard 연동: 결정 히스토리 UI 표시
- 품질 메타 자동 채움: Evidence 생성 시 품질 메타 기본값 설정
- Phase 2: quality_adjustment 활성화 (B Score에 품질 반영)
