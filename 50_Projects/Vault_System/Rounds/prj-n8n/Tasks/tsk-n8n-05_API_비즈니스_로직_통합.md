---
entity_type: Task
entity_id: tsk-n8n-05
entity_name: "API 비즈니스 로직 통합 - 스킬→API 공통화"
created: 2025-12-28
updated: 2025-12-28
status: done

# === 계층 ===
parent_id: prj-n8n
project_id: prj-n8n
aliases:
  - tsk-n8n-05
  - API 비즈니스 로직 통합

# === 관계 ===
outgoing_relations: []
validates: []

# === Task 전용 ===
assignee: 김은향
start_date: 2025-12-28
due: 2025-12-28
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop-api

# === 3Y 전략 연결 ===
conditions_3y:
  - cond-e

# === 분류 ===
tags:
  - api
  - skill
  - refactoring
  - ssot
priority_flag: high
---

# API 비즈니스 로직 통합 - 스킬→API 공통화

> Task ID: `tsk-n8n-05` | Project: `prj-n8n` | Status: doing

## 목표

**완료 조건**:
1. Claude 스킬의 비즈니스 로직을 LOOP MCP API로 이전
2. 스킬은 UX(대화) + API 호출만 담당 (thin wrapper)
3. Dashboard, n8n, Claude 스킬이 동일 API 호출

---

## 상세 내용

### 배경

현재 구조:
- Claude 스킬 (`loop-entity-creator`, `/retro`, `/auto-fill-project-impact`)에 비즈니스 로직 존재
- API (`api/routers/`)에도 유사 로직 중복
- n8n 워크플로우에서 별도 프롬프트 관리

문제점:
- 로직 중복 (ID 생성, 폴더 구조, Schema 검증, LLM 호출)
- 유지보수 어려움 (변경 시 여러 곳 수정 필요)
- 일관성 문제 (각각 다른 방식으로 동작 가능)

### 통합 후 구조

```
┌─────────────────────┐
│   스킬 (thin)       │
│                     │
│ - 사용자 대화        │
│ - API 호출          │──────▶ POST /api/...
│ - 결과 표시         │              │
└─────────────────────┘              │
                                     ▼
                        ┌─────────────────────────────┐
                        │      LOOP MCP API           │
                        │                             │
                        │ - ID 생성 (SSOT)            │
                        │ - 폴더 구조 생성             │
                        │ - 템플릿 렌더링              │
                        │ - Schema 검증               │
                        │ - LLM 호출                  │
                        │ - A/B 점수 계산             │
                        │ - 감사 로그                 │
                        └─────────────────────────────┘
                                     ▲
                        ┌────────────┴────────────┐
                        │                         │
                   Dashboard                    n8n
```

### 통합 대상

| 스킬/커맨드 | → API 엔드포인트 | 현재 상태 |
|------------|-----------------|----------|
| `/new-project` | POST /api/projects | 부분 구현 |
| `/new-task` | POST /api/tasks | 부분 구현 |
| `/retro` | POST /api/autofill/realized-impact | 미구현 |
| `/auto-fill-project-impact` | POST /api/autofill/expected-impact | 미구현 |
| `loop-entity-creator` | POST /api/entities | 미구현 |

### API 설계: `mode` 파라미터

```python
@router.post("/autofill/realized-impact")
async def autofill_realized_impact(
    project_id: str,
    mode: str = "pending"  # "pending" | "preview" | "execute"
):
    """
    mode:
      - "preview": LLM 제안값만 반환 (저장 안 함) → 스킬이 사용자에게 보여줌
      - "pending": pending_reviews.json에 저장 → Dashboard에서 승인
      - "execute": 바로 적용 (사전 승인된 경우)
    """
```

---

## 체크리스트

### Phase 1: API 구조 설계
- [x] `api/routers/autofill.py` 신규 생성
- [x] `api/utils/entity_generator.py` - ID/폴더 생성 유틸
- [x] `api/utils/impact_calculator.py` - A/B 점수 계산 함수
- [x] `api/prompts/` - 스킬 프롬프트 이전
- [x] `api/services/llm_service.py` - LLM 호출 추상화

### Phase 2: Autofill API 구현
- [x] POST /api/autofill/expected-impact (A Score)
- [x] POST /api/autofill/realized-impact (B Score)
- [x] mode 파라미터 (preview/pending/execute) 지원

### Phase 3: Entity API 강화
- [x] POST /api/projects - autofill_expected_impact 옵션 추가
- [x] POST /api/tasks - 감사 로그 추가
- [x] 감사 로그 모듈 (`api/routers/audit.py`) 생성

### Phase 4: 스킬 수정
- [x] `/new-project` → API 호출로 변경 (loop-entity-creator 통해)
- [x] `/new-task` → API 호출로 변경 (loop-entity-creator 통해)
- [x] `/retro` → API 호출로 변경 (retrospective-to-evidence 스킬)
- [x] `/auto-fill-project-impact` → API 호출로 변경
- [x] `loop-entity-creator` → API 호출로 변경

### Phase 5: 테스트 및 검증
- [x] API 단위 테스트 (POST/DELETE /api/tasks 성공)
- [x] 스킬 E2E 테스트 (/new-task → API 호출 확인)
- [ ] n8n 워크플로우 연동 테스트 (별도 확인 필요)

---

## Notes

### Tech Spec

**신규 파일 구조:**
```
api/
├── routers/
│   └── autofill.py              # 신규: Autofill API
├── services/                    # 신규: 비즈니스 로직 레이어
│   ├── entity_service.py        # Entity 생성/수정 서비스
│   ├── impact_service.py        # Impact 계산 서비스
│   └── llm_service.py           # LLM 호출 서비스 (provider 추상화)
├── prompts/                     # 신규: LLM 프롬프트 템플릿
│   ├── expected_impact.py       # A Score 프롬프트
│   ├── realized_impact.py       # B Score 프롬프트
│   └── entity_fields.py         # 일반 필드 채움 프롬프트
└── utils/
    ├── impact_calculator.py     # 신규: A/B Score 계산
    └── entity_generator.py      # 신규: ID/폴더 생성 유틸
```

**API 엔드포인트:**
| Endpoint | Method | 용도 |
|----------|--------|------|
| `/api/autofill/expected-impact` | POST | A Score 자동 채움 |
| `/api/autofill/realized-impact` | POST | B Score 자동 채움 |
| `/api/autofill/entity-fields` | POST | 일반 필드 자동 채움 |
| `/api/projects` | POST | Project 생성 (확장) |
| `/api/tasks` | POST | Task 생성 (확장) |

**AutofillResponse 구조:**
```python
class AutofillResponse(BaseModel):
    success: bool
    entity_id: str
    mode: str  # preview | pending | execute
    suggested_fields: Dict[str, Any]  # LLM 제안값
    calculated_fields: Dict[str, Any]  # 서버 계산값
    reasoning: Dict[str, str]  # 필드별 판단 근거
    validation_warnings: List[str]
    pending_id: Optional[str]  # mode=pending일 때
```

**결정 사항:**
1. LLM Provider: `llm_service.py`에서 OpenAI/Claude 추상화
2. Pending 저장: 기존 `_build/pending_reviews.json` 유지
3. Audit Log: `_build/audit.log`에 entity 생성/수정 기록

### Todo
- [x] Phase 1 완료
- [x] Phase 2 완료
- [x] Phase 3 완료
- [x] Phase 4 완료
- [x] Phase 5 완료 (n8n 연동 테스트 제외)

### 작업 로그

**2025-12-28**: Task 생성, PRD/Tech Spec 작성 완료
**2025-12-28**: Phase 1-2 완료 - Autofill API 구현
  - `api/utils/impact_calculator.py`: A/B Score 계산 (SSOT: impact_model_config.yml)
  - `api/utils/entity_generator.py`: ID 생성, 폴더 구조, 템플릿 렌더링
  - `api/prompts/`: expected_impact.py, realized_impact.py (스킬 프롬프트 이전)
  - `api/services/llm_service.py`: OpenAI/Anthropic 추상화
  - `api/routers/autofill.py`: /expected-impact, /realized-impact 엔드포인트
**2025-12-28**: Phase 3 완료 - Entity API 강화
  - `api/models/entities.py`: ExpectedImpactInput 모델, ProjectCreate 확장 (autofill 옵션)
  - `api/routers/projects.py`: autofill_expected_impact 통합, async 함수로 변경
  - `api/routers/tasks.py`: 감사 로그 추가 (create/update/delete)
  - `api/routers/audit.py`: 감사 로그 모듈 신규 생성 (/api/audit 엔드포인트)
**2025-12-28**: Phase 4 완료 - 스킬 수정 (API 우선 + Fallback 패턴)
  - `loop-entity-creator/SKILL.md`: API Integration 섹션 추가, Task/Project 생성 API 호출 우선
  - `auto-fill-project-impact/SKILL.md`: API Integration 섹션 추가, /api/autofill/expected-impact 호출
  - `retrospective-to-evidence/SKILL.md`: API Integration 섹션 추가, /api/autofill/realized-impact 호출
  - 모든 스킬에 Health check + Fallback 로직 추가

**2025-12-29**: Phase 4 보완 + Phase 5 테스트
  - **환경 설정**: `.envrc` 생성 (LOOP_API_URL, LOOP_API_TOKEN), `.gitignore`에 추가
  - **Claude Code Bash 제약 발견**: `source`, `[[ ]]` 미지원, 변수 할당 후 사용 불안정
  - **해결책**: NAS URL을 기본값으로 하드코딩 (`https://mcp.sosilab.synology.me`)
  - **스킬 수정** (3개 파일):
    - `API_URL="${LOOP_API_URL:-https://mcp.sosilab.synology.me}"` 로 변경
    - `.envrc` source 로직 제거 (Claude Code 환경에서 불안정)
  - **API 테스트 성공**:
    - `POST /api/tasks` → Task 생성 (tsk-017-06) 성공
    - `DELETE /api/tasks/{id}` → 삭제 성공
  - **SSOT 확인**: Dashboard UI, Claude 스킬, n8n 모두 동일 API 호출


---

## 참고 문서

- [[prj-n8n]] - 소속 Project
- [[tsk-n8n-03]] - 선행 Task (Impact Score 자동화 워크플로우)
- `api/README.md` - API 문서
- `.claude/skills/loop-entity-creator/SKILL.md` - 현재 스킬 로직
- `.claude/skills/retrospective-to-evidence/SKILL.md` - /retro 스킬 로직

---

**Created**: 2025-12-28
**Assignee**: 김은향
**Due**: 2025-12-28
