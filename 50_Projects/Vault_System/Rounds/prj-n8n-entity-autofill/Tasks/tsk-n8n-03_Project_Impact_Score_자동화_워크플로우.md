---
entity_type: Task
entity_id: tsk-n8n-03
entity_name: Project Impact Score 자동화 n8n 워크플로우
created: 2025-12-27
updated: '2025-12-27'
status: doing
parent_id: prj-n8n-entity-autofill
project_id: prj-n8n-entity-autofill
aliases:
- tsk-n8n-03
outgoing_relations: []
validates: []
assignee: 김은향
start_date: 2025-12-27
due: 2025-12-27
priority: high
estimated_hours: null
actual_hours: null
type: dev
target_project: loop
conditions_3y:
- cond-e
tags:
- n8n
- automation
- impact
- llm
priority_flag: high
---
# Project Impact Score 자동화 n8n 워크플로우

> Task ID: `tsk-n8n-03` | Project: `prj-n8n-entity-autofill` | Status: doing

## 목표

**완료 조건**:
1. n8n 워크플로우로 Project Impact Score 자동 제안
2. A (expected_impact) 없는 프로젝트 → LLM 추론 → pending 저장
3. Done + B (realized_impact) 없는 프로젝트 → LLM 추론 → pending 저장
4. 기존 pending-panel에서 승인/거부 가능

---

## 상세 내용

### 배경

기존 스킬:
- `auto-fill-project-impact` - Expected Score (A) 대화형 제안
- `retrospective-to-evidence` - Realized Score (B) 대화형 제안

n8n으로 자동화하여 스케줄 기반 자동 제안 생성.
tsk-n8n-02에서 구현한 pending API/Dashboard 재사용.

### 작업 내용

1. **워크플로우 설계**
   - GET /api/projects로 전체 Project 조회
   - 필터링: A 필요 / B 필요 분기
   - LLM 추론 (GPT-4)
   - POST /api/pending으로 제안값 저장

2. **A (Expected Impact) 추론**
   - 조건: expected_impact 없음 (tier=null)
   - 입력: Project 정의, parent Track, conditions_3y
   - 출력: tier, impact_magnitude, confidence, contributes

3. **B (Realized Impact) 추론**
   - 조건: status=done AND realized_impact 없음
   - 입력: Project 정의, 회고 문서 (있는 경우)
   - 출력: normalized_delta, evidence_strength, attribution_share, learning_value, realized_status

---

## 체크리스트

- [x] GET /api/projects 응답 구조 확인
- [x] 워크플로우 JSON 작성 (`_build/n8n_workflows/project_impact_autofill.json`)
- [x] A 추론 LLM 프롬프트 작성
- [x] B 추론 LLM 프롬프트 작성
- [x] 통합 워크플로우 생성 (`entity_validator_autofiller.json` - 17노드)
- [x] `/api/strategy/context` 통합 API 엔드포인트 추가
- [x] MCP 서버 재빌드 및 API 검증
- [ ] pending API 연동 테스트
- [ ] n8n GUI에서 import 및 테스트

---

## Notes

### 관련 스킬 참조

- `auto-fill-project-impact` - Expected Score (A) 로직
  - 파일: `.claude/skills/auto-fill-project-impact/SKILL.md`
  - 필드: tier, impact_magnitude, confidence, contributes
  - 계산: `ExpectedScore = magnitude_points[tier][magnitude] × confidence`

- `retrospective-to-evidence` - Realized Score (B) 로직
  - 파일: `.claude/skills/retrospective-to-evidence/SKILL.md`
  - 필드: normalized_delta, evidence_strength, attribution_share, learning_value, realized_status
  - 계산: `RealizedScore = normalized_delta × evidence_strength × attribution_share`

### 기존 인프라 재사용

- `api/routers/pending.py` - Pending API
- `_build/pending_reviews.json` - 저장소
- `_dashboard/js/components/pending-panel.js` - UI

### Todo
- [x] projects API 응답 확인
- [x] 워크플로우 JSON 설계
- [x] LLM 프롬프트 작성
- [ ] prj-impact-schema-v2 변경사항 n8n 워크플로우 반영
- [ ] n8n GUI에서 import 및 E2E 테스트

---

### PRD: Schema v5.2 반영 (prj-impact-schema-v2)

#### 배경

`prj-impact-schema-v2` 프로젝트에서 다음 변경사항이 적용됨:
- Schema version 5.1 → 5.2
- Realized Impact에 window 필드 추가
- Evidence 엔티티 정식 등록
- derived 필드 규칙 추가

#### 반영 대상

| 구분 | 현재 | 변경 | 우선순위 |
|------|------|------|----------|
| `contributes` | 사용 중 | → `condition_contributes` | 🔴 High |
| `track_contributes` | 없음 | 신규 추가 | 🟡 Medium |
| `hypothesis_id` | 사용 중 | → `primary_hypothesis_id` (deprecated) | 🟡 Medium |
| `validates` | 없음 | 신규 추가 (LLM 제안 가능) | 🟡 Medium |
| `window_id` | 없음 | Realized Impact에 추가 | 🔴 High |
| `time_range` | 없음 | Realized Impact에 추가 | 🔴 High |
| `metrics_snapshot` | 없음 | Realized Impact에 추가 | 🟡 Medium |
| `validated_by` | 있음 | **삭제** (derived 필드) | 🔴 High |

#### LLM 자동 채움 필드 정의

**🧠 LLM 제안 가능 (컨텍스트 분석)**

| 필드 | 위치 | LLM 프롬프트 힌트 |
|------|------|-------------------|
| `tier` | Project 루트 | strategic/enabling/operational/none 분류 |
| `impact_magnitude` | Project 루트 | high(전사)/mid(트랙)/low(단일기능) |
| `confidence` | Project 루트 | 0.9(검증됨)/0.7(예상)/0.5(가설) |
| `condition_contributes[].to` | Project | cond-a~e 중 기여 대상 |
| `condition_contributes[].weight` | Project | 0.1(간접)/0.3(부분)/0.6(직접) |
| `condition_contributes[].description` | Project | 기여 방식 한 줄 설명 |
| `track_contributes` | Project | secondary Track 기여 (대부분 빈 배열) |
| `expected_impact.statement` | Project | "프로젝트 성공 시 증명될 가설" |
| `expected_impact.metric` | Project | 측정 가능한 핵심 지표명 |
| `expected_impact.target` | Project | 목표값 또는 정성적 기준 |
| `validates` | 공통(all) | 60_Hypotheses에서 관련 가설 ID 매칭 |
| `primary_hypothesis_id` | Project | validates 중 핵심 1개 |
| `parent_id` | 공통(all) | 누락 시 Track 목록에서 제안 |
| `conditions_3y` | 공통(all) | condition_contributes.to와 일치 검증 |
| `outgoing_relations` | 공통(all) | 다른 엔티티 관계 분석 |

**🤖 자동 계산 (LLM 불필요)**

| 필드 | 계산 로직 |
|------|----------|
| `window_id` | decided 날짜 기준 `YYYY-MM` |
| `time_range` | window_id 기준 `YYYY-MM-01..YYYY-MM-{lastDay}` |

**👤 사람 판단 필수**

| 필드 | 이유 |
|------|------|
| `verdict` | go/no-go/pivot 결정 |
| `outcome` | supported/rejected/inconclusive 판정 |
| `metrics_snapshot` | 실제 측정값 |
| `evidence_links` | 근거 문서 연결 |

**⛔ 저장 금지 (derived 필드)**

| 필드 | 이유 |
|------|------|
| `validated_by` | Evidence에서 역인덱스 계산 |
| `realized_sum` (Track/Condition) | 하위 Project B 집계 |

#### n8n 워크플로우 수정 사항

**1. Expected Impact 프롬프트 (`buildExpectedImpactPrompt`)**
```diff
- "contributes": [...]
+ "condition_contributes": [
+   { "to": "cond-a", "weight": 0.6, "description": "..." }
+ ]
+ "track_contributes": []
+ "validates": ["hyp-2-01", "hyp-2-03"]
+ "primary_hypothesis_id": "hyp-2-01"
```

**2. Realized Impact 프롬프트 (`buildRealizedImpactPrompt`)**
```diff
"realized_impact": {
  "verdict": "go | no-go | pivot | pending",
  "outcome": "supported | rejected | inconclusive",
  "evidence_links": [],
  "decided": "2025-12-27",
+ "window_id": "2025-12",
+ "time_range": "2025-12-01..2025-12-31",
+ "metrics_snapshot": {}
}
```

**3. Project Schema 프롬프트 (`buildLlmPrompt`)**
```diff
- ### For hypothesis_id
+ ### For primary_hypothesis_id (deprecated: hypothesis_id)

- ### For contributes (required)
+ ### For condition_contributes (required)

+ ### For track_contributes (optional)

+ ### For validates (optional)
+ Array of Hypothesis IDs this project validates.

+ ### NEVER suggest these derived fields:
+ - validated_by (computed from Evidence)
+ - realized_sum (computed from child Projects)
```

**4. window_id 자동 계산 로직**
```javascript
// base_date 우선순위: decided → updated → today
const date = realized_impact?.decided
  ? new Date(realized_impact.decided)
  : new Date();
const window_id = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
const lastDay = new Date(date.getFullYear(), date.getMonth()+1, 0).getDate();
const time_range = `${window_id}-01..${window_id}-${lastDay}`;
```

#### 검증 기준

- [ ] `contributes` → `condition_contributes` 변경 반영
- [ ] `track_contributes` 필드 추가
- [ ] `validates`, `primary_hypothesis_id` 필드 추가
- [ ] `validated_by` 필드 제안하지 않음
- [ ] Realized Impact에 window 필드 자동 계산
- [ ] LLM 프롬프트에 derived 필드 경고 추가

---

### 작업 로그

#### 2025-12-27 21:30 - 통합 워크플로우 완성

**개요**: 기존 3개 워크플로우(entity_schema_validator, project_impact_autofill, llm_openai_caller)를 하나의 통합 워크플로우로 병합. API 호출을 5개에서 1개로 단순화.

**변경사항**:
- **신규**: `_build/n8n_workflows/entity_validator_autofiller.json` - 통합 워크플로우 (17노드)
- **신규**: `api/routers/strategy.py` - `/api/strategy/context` 엔드포인트 추가
- **아카이브**: 기존 3개 워크플로우 → `_archive/` 폴더로 이동

**API 개선**:
```python
@router.get("/context")
def get_strategy_context():
    """전체 전략 계층 컨텍스트 반환 (LLM 프롬프트용)"""
    return {
        "northstars": cache.get_all_northstars(),       # 1개
        "metahypotheses": cache.get_all_metahypotheses(), # 4개
        "conditions": cache.get_all_conditions(),       # 5개
        "tracks": cache.get_all_tracks(),               # 6개
        "hypotheses": cache.get_all_hypotheses()        # 45개
    }
```

**워크플로우 구조 (17노드)**:
- Step 0: Get Strategy Context (1 API call)
- Step 1: Build Strategy Context (text formatting)
- Phase 1: Task schema validation → LLM → Pending
- Phase 2: Project schema validation (owner, parent_id, conditions_3y, hypothesis_id, condition_contributes, track_contributes) → LLM → Pending
- Phase 3: Impact auto-fill (expected_impact, realized_impact) → LLM → Pending

**검증 결과**:
```bash
✅ MCP Server rebuild 성공
✅ /api/strategy/context 응답 확인:
  - NorthStars: 1개
  - MetaHypotheses: 4개
  - Conditions: 5개
  - Tracks: 6개
  - Hypotheses: 45개
```

**인증**: `Authorization: Bearer loop_2024_kanban_secret`

---

#### 2025-12-27 (초기)
**완료된 작업:**
1. `_build/n8n_workflows/project_impact_autofill.json` 생성
   - 10개 노드: Schedule Trigger, Get All Projects, Filter Projects, Is Expected?, LLM Expected/Realized Impact, Parse Response x2, Create Pending x2
   - 8개 연결 설정

2. Filter Projects 코드 노드:
   - expected_impact 없는 프로젝트 (tier=null 또는 'none')
   - done 상태 + realized_impact 없는 프로젝트

3. LLM 프롬프트 작성:
   - Expected Impact: tier, magnitude, confidence, contributes 추론
   - Realized Impact: normalized_delta, evidence_strength, attribution_share, learning_value, realized_status 추론

**남은 작업:**
- n8n GUI에서 import 후 테스트

---

## 참고 문서

- [[prj-n8n-entity-autofill]] - 소속 Project
- [[tsk-n8n-02]] - 선행 Task (Schema Validator + Pending UI)

---

**Created**: 2025-12-27
**Assignee**: 김은향
**Due**: 2025-12-27
