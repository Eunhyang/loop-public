---
entity_type: Task
entity_id: tsk-n8n-03
entity_name: n8n - Project Impact Score 자동화 n8n 워크플로우
created: 2025-12-27
updated: '2025-12-28'
status: doing
parent_id: prj-n8n
project_id: prj-n8n
aliases:
- tsk-n8n-03
outgoing_relations: []
validates: []
assignee: 김은향
start_date: '2025-12-27'
due: '2025-12-27'
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
notes: "# Project Impact Score 자동화 n8n 워크플로우\n\n> Task ID: `tsk-n8n-03` | Project:\
  \ `prj-n8n` | Status: doing\n\n## 목표\n\n**완료 조건**:\n1. n8n 워크플로우로\
  \ Project Impact Score 자동 제안\n2. A (expected_impact) 없는 프로젝트 → LLM 추론 → pending\
  \ 저장\n3. Done + B (realized_impact) 없는 프로젝트 → LLM 추론 → pending 저장\n4. 기존 pending-panel에서\
  \ 승인/거부 가능\n\n---\n\n## 상세 내용\n\n### 배경\n\n기존 스킬:\n- `auto-fill-project-impact`\
  \ - Expected Score (A) 대화형 제안\n- `retrospective-to-evidence` - Realized Score (B)\
  \ 대화형 제안\n\nn8n으로 자동화하여 스케줄 기반 자동 제안 생성.\ntsk-n8n-02에서 구현한 pending API/Dashboard\
  \ 재사용.\n\n### 작업 내용\n\n1. **워크플로우 설계**\n   - GET /api/projects로 전체 Project 조회\n\
  \   - 필터링: A 필요 / B 필요 분기\n   - LLM 추론 (GPT-4)\n   - POST /api/pending으로 제안값 저장\n\
  \n2. **A (Expected Impact) 추론**\n   - 조건: expected_impact 없음 (tier=null)\n   - 입력:\
  \ Project 정의, parent Track, conditions_3y\n   - 출력: tier, impact_magnitude, confidence,\
  \ contributes\n\n3. **B (Realized Impact) 추론**\n   - 조건: status=done AND realized_impact\
  \ 없음\n   - 입력: Project 정의, 회고 문서 (있는 경우)\n   - 출력: normalized_delta, evidence_strength,\
  \ attribution_share, learning_value, realized_status\n\n---\n\n## 체크리스트\n\n- [x]\
  \ GET /api/projects 응답 구조 확인\n- [x] 워크플로우 JSON 작성 (`_build/n8n_workflows/project_impact_autofill.json`)\n\
  - [x] A 추론 LLM 프롬프트 작성\n- [x] B 추론 LLM 프롬프트 작성\n- [x] 통합 워크플로우 생성 (`entity_validator_autofiller.json`\
  \ - 17노드)\n- [x] `/api/strategy/context` 통합 API 엔드포인트 추가\n- [x] MCP 서버 재빌드 및 API\
  \ 검증\n- [ ] pending API 연동 테스트\n- [ ] n8n GUI에서 import 및 테스트\n\n---\n\n## Notes\n\
  \n### 관련 스킬 참조\n\n- `auto-fill-project-impact` - Expected Score (A) 로직\n  - 파일:\
  \ `.claude/skills/auto-fill-project-impact/SKILL.md`\n  - 필드: tier, impact_magnitude,\
  \ confidence, contributes\n  - 계산: `ExpectedScore = magnitude_points[tier][magnitude]\
  \ × confidence`\n\n- `retrospective-to-evidence` - Realized Score (B) 로직\n  - 파일:\
  \ `.claude/skills/retrospective-to-evidence/SKILL.md`\n  - 필드: normalized_delta,\
  \ evidence_strength, attribution_share, learning_value, realized_status\n  - 계산:\
  \ `RealizedScore = normalized_delta × evidence_strength × attribution_share`\n\n\
  ### 기존 인프라 재사용\n\n- `api/routers/pending.py` - Pending API\n- `_build/pending_reviews.json`\
  \ - 저장소\n- `_dashboard/js/components/pending-panel.js` - UI\n\n### Todo\n- [x] projects\
  \ API 응답 확인\n- [x] 워크플로우 JSON 설계\n- [x] LLM 프롬프트 작성\n- [ ] prj-impact-schema-v2\
  \ 변경사항 n8n 워크플로우 반영\n- [ ] n8n GUI에서 import 및 E2E 테스트\n\n---\n\n### PRD: Schema\
  \ v5.2 반영 (prj-impact-schema-v2)\n\n#### 배경\n\n`prj-impact-schema-v2` 프로젝트에서 다음\
  \ 변경사항이 적용됨:\n- Schema version 5.1 → 5.2\n- Realized Impact에 window 필드 추가\n- Evidence\
  \ 엔티티 정식 등록\n- derived 필드 규칙 추가\n\n#### 반영 대상\n\n| 구분 | 현재 | 변경 | 우선순위 |\n|------|------|------|----------|\n\
  | `contributes` | 사용 중 | → `condition_contributes` | \U0001F534 High |\n| `track_contributes`\
  \ | 없음 | 신규 추가 | \U0001F7E1 Medium |\n| `hypothesis_id` | 사용 중 | → `primary_hypothesis_id`\
  \ (deprecated) | \U0001F7E1 Medium |\n| `validates` | 없음 | 신규 추가 (LLM 제안 가능) | \U0001F7E1\
  \ Medium |\n| `window_id` | 없음 | Realized Impact에 추가 | \U0001F534 High |\n| `time_range`\
  \ | 없음 | Realized Impact에 추가 | \U0001F534 High |\n| `metrics_snapshot` | 없음 | Realized\
  \ Impact에 추가 | \U0001F7E1 Medium |\n| `validated_by` | 있음 | **삭제** (derived 필드)\
  \ | \U0001F534 High |\n\n#### LLM 자동 채움 필드 정의\n\n**\U0001F9E0 LLM 제안 가능 (컨텍스트 분석)**\n\
  \n| 필드 | 위치 | LLM 프롬프트 힌트 |\n|------|------|-------------------|\n| `tier` | Project\
  \ 루트 | strategic/enabling/operational/none 분류 |\n| `impact_magnitude` | Project\
  \ 루트 | high(전사)/mid(트랙)/low(단일기능) |\n| `confidence` | Project 루트 | 0.9(검증됨)/0.7(예상)/0.5(가설)\
  \ |\n| `condition_contributes[].to` | Project | cond-a~e 중 기여 대상 |\n| `condition_contributes[].weight`\
  \ | Project | 0.1(간접)/0.3(부분)/0.6(직접) |\n| `condition_contributes[].description`\
  \ | Project | 기여 방식 한 줄 설명 |\n| `track_contributes` | Project | secondary Track\
  \ 기여 (대부분 빈 배열) |\n| `expected_impact.statement` | Project | \"프로젝트 성공 시 증명될 가설\"\
  \ |\n| `expected_impact.metric` | Project | 측정 가능한 핵심 지표명 |\n| `expected_impact.target`\
  \ | Project | 목표값 또는 정성적 기준 |\n| `validates` | 공통(all) | 60_Hypotheses에서 관련 가설 ID\
  \ 매칭 |\n| `primary_hypothesis_id` | Project | validates 중 핵심 1개 |\n| `parent_id`\
  \ | 공통(all) | 누락 시 Track 목록에서 제안 |\n| `conditions_3y` | 공통(all) | condition_contributes.to와\
  \ 일치 검증 |\n| `outgoing_relations` | 공통(all) | 다른 엔티티 관계 분석 |\n\n**\U0001F916 자동\
  \ 계산 (LLM 불필요)**\n\n| 필드 | 계산 로직 |\n|------|----------|\n| `window_id` | decided\
  \ 날짜 기준 `YYYY-MM` |\n| `time_range` | window_id 기준 `YYYY-MM-01..YYYY-MM-{lastDay}`\
  \ |\n\n**\U0001F464 사람 판단 필수**\n\n| 필드 | 이유 |\n|------|------|\n| `verdict` | go/no-go/pivot\
  \ 결정 |\n| `outcome` | supported/rejected/inconclusive 판정 |\n| `metrics_snapshot`\
  \ | 실제 측정값 |\n| `evidence_links` | 근거 문서 연결 |\n\n**⛔ 저장 금지 (derived 필드)**\n\n| 필드\
  \ | 이유 |\n|------|------|\n| `validated_by` | Evidence에서 역인덱스 계산 |\n| `realized_sum`\
  \ (Track/Condition) | 하위 Project B 집계 |\n\n#### n8n 워크플로우 수정 사항\n\n**1. Expected\
  \ Impact 프롬프트 (`buildExpectedImpactPrompt`)**\n```diff\n- \"contributes\": [...]\n\
  + \"condition_contributes\": [\n+   { \"to\": \"cond-a\", \"weight\": 0.6, \"description\"\
  : \"...\" }\n+ ]\n+ \"track_contributes\": []\n+ \"validates\": [\"hyp-2-01\", \"\
  hyp-2-03\"]\n+ \"primary_hypothesis_id\": \"hyp-2-01\"\n```\n\n**2. Realized Impact\
  \ 프롬프트 (`buildRealizedImpactPrompt`)**\n```diff\n\"realized_impact\": {\n  \"verdict\"\
  : \"go | no-go | pivot | pending\",\n  \"outcome\": \"supported | rejected | inconclusive\"\
  ,\n  \"evidence_links\": [],\n  \"decided\": \"2025-12-27\",\n+ \"window_id\": \"\
  2025-12\",\n+ \"time_range\": \"2025-12-01..2025-12-31\",\n+ \"metrics_snapshot\"\
  : {}\n}\n```\n\n**3. Project Schema 프롬프트 (`buildLlmPrompt`)**\n```diff\n- ### For\
  \ hypothesis_id\n+ ### For primary_hypothesis_id (deprecated: hypothesis_id)\n\n\
  - ### For contributes (required)\n+ ### For condition_contributes (required)\n\n\
  + ### For track_contributes (optional)\n\n+ ### For validates (optional)\n+ Array\
  \ of Hypothesis IDs this project validates.\n\n+ ### NEVER suggest these derived\
  \ fields:\n+ - validated_by (computed from Evidence)\n+ - realized_sum (computed\
  \ from child Projects)\n```\n\n**4. window_id 자동 계산 로직**\n```javascript\n// base_date\
  \ 우선순위: decided → updated → today\nconst date = realized_impact?.decided\n  ? new\
  \ Date(realized_impact.decided)\n  : new Date();\nconst window_id = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;\n\
  const lastDay = new Date(date.getFullYear(), date.getMonth()+1, 0).getDate();\n\
  const time_range = `${window_id}-01..${window_id}-${lastDay}`;\n```\n\n#### 검증 기준\n\
  \n- [x] `contributes` → `condition_contributes` 변경 반영\n- [x] `track_contributes`\
  \ 필드 추가\n- [x] `validates`, `primary_hypothesis_id` 필드 추가\n- [x] `validated_by`\
  \ 필드 제안하지 않음\n- [x] Realized Impact에 window 필드 자동 계산\n- [x] LLM 프롬프트에 derived 필드\
  \ 경고 추가\n\n---\n\n### 작업 로그\n\n#### 2025-12-27 23:30 - Schema v5.2 반영 완료\n\n**개요**:\
  \ prj-impact-schema-v2 변경사항을 n8n 워크플로우에 반영. entity_validator_autofiller.json v2\
  \ → v3 업그레이드.\n\n**변경사항**:\n\n1. **Validate Projects 노드 (Phase 2)**\n   - `hypothesis_id`\
  \ → `primary_hypothesis_id` 변경\n   - `validates` 필드 추가 (가설 배열)\n   - `validated_by`\
  \ derived 필드 경고 추가\n   - LLM_REQUIRED_ISSUES에 `missing_validates`, `missing_primary_hypothesis_id`\
  \ 추가\n\n2. **Filter Impact Needed 노드 (Phase 3)**\n   - **Expected Impact 프롬프트**:\n\
  \     - `contributes` → `condition_contributes` 변경\n     - `track_contributes` 필드\
  \ 추가\n     - `validates`, `primary_hypothesis_id` 필드 추가\n     - 응답 구조: tier, impact_magnitude,\
  \ confidence가 루트 레벨\n   - **Realized Impact 프롬프트**:\n     - `window_id` 자동 계산 추가\
  \ (YYYY-MM)\n     - `time_range` 자동 계산 추가 (YYYY-MM-01..YYYY-MM-{lastDay})\n    \
  \ - `metrics_snapshot` 필드 추가\n     - `human_required` 필드로 사람 판단 필수 항목 명시\n\n3. **Meta\
  \ 정보**\n   - templateId: v2 → v3\n   - schemaVersion: \"5.2\" 추가\n   - description\
  \ 업데이트\n\n**파일 변경**:\n- `_build/n8n_workflows/entity_validator_autofiller.json`\
  \ - v3\n\n**검증 기준 충족**:\n- [x] `contributes` → `condition_contributes` 변경 반영\n-\
  \ [x] `track_contributes` 필드 추가\n- [x] `validates`, `primary_hypothesis_id` 필드 추가\n\
  - [x] `validated_by` 필드 제안하지 않음\n- [x] Realized Impact에 window 필드 자동 계산\n- [x] LLM\
  \ 프롬프트에 derived 필드 경고 추가\n\n**다음 단계**:\n- [ ] n8n GUI에서 v3 워크플로우 import\n- [ ] E2E\
  \ 테스트 실행\n\n---\n\n#### 2025-12-27 21:30 - 통합 워크플로우 완성\n\n**개요**: 기존 3개 워크플로우(entity_schema_validator,\
  \ project_impact_autofill, llm_openai_caller)를 하나의 통합 워크플로우로 병합. API 호출을 5개에서 1개로\
  \ 단순화.\n\n**변경사항**:\n- **신규**: `_build/n8n_workflows/entity_validator_autofiller.json`\
  \ - 통합 워크플로우 (17노드)\n- **신규**: `api/routers/strategy.py` - `/api/strategy/context`\
  \ 엔드포인트 추가\n- **아카이브**: 기존 3개 워크플로우 → `_archive/` 폴더로 이동\n\n**API 개선**:\n```python\n\
  @router.get(\"/context\")\ndef get_strategy_context():\n    \"\"\"전체 전략 계층 컨텍스트\
  \ 반환 (LLM 프롬프트용)\"\"\"\n    return {\n        \"northstars\": cache.get_all_northstars(),\
  \       # 1개\n        \"metahypotheses\": cache.get_all_metahypotheses(), # 4개\n\
  \        \"conditions\": cache.get_all_conditions(),       # 5개\n        \"tracks\"\
  : cache.get_all_tracks(),               # 6개\n        \"hypotheses\": cache.get_all_hypotheses()\
  \        # 45개\n    }\n```\n\n**워크플로우 구조 (17노드)**:\n- Step 0: Get Strategy Context\
  \ (1 API call)\n- Step 1: Build Strategy Context (text formatting)\n- Phase 1: Task\
  \ schema validation → LLM → Pending\n- Phase 2: Project schema validation (owner,\
  \ parent_id, conditions_3y, hypothesis_id, condition_contributes, track_contributes)\
  \ → LLM → Pending\n- Phase 3: Impact auto-fill (expected_impact, realized_impact)\
  \ → LLM → Pending\n\n**검증 결과**:\n```bash\n✅ MCP Server rebuild 성공\n✅ /api/strategy/context\
  \ 응답 확인:\n  - NorthStars: 1개\n  - MetaHypotheses: 4개\n  - Conditions: 5개\n  - Tracks:\
  \ 6개\n  - Hypotheses: 45개\n```\n\n**인증**: `Authorization: Bearer loop_2024_kanban_secret`\n\
  \n---\n\n#### 2025-12-27 (초기)\n**완료된 작업:**\n1. `_build/n8n_workflows/project_impact_autofill.json`\
  \ 생성\n   - 10개 노드: Schedule Trigger, Get All Projects, Filter Projects, Is Expected?,\
  \ LLM Expected/Realized Impact, Parse Response x2, Create Pending x2\n   - 8개 연결\
  \ 설정\n\n2. Filter Projects 코드 노드:\n   - expected_impact 없는 프로젝트 (tier=null 또는 'none')\n\
  \   - done 상태 + realized_impact 없는 프로젝트\n\n3. LLM 프롬프트 작성:\n   - Expected Impact:\
  \ tier, magnitude, confidence, contributes 추론\n   - Realized Impact: normalized_delta,\
  \ evidence_strength, attribution_share, learning_value, realized_status 추론\n\n**남은\
  \ 작업:**\n- n8n GUI에서 import 후 테스트\n\n---\n\n## 참고 문서\n\n- [[prj-n8n]]\
  \ - 소속 Project\n- [[tsk-n8n-02]] - 선행 Task (Schema Validator + Pending UI)\n\n---\n\
  \n**Created**: 2025-12-27\n**Assignee**: 김은향\n**Due**: 2025-12-27\n"
---
# Project Impact Score 자동화 n8n 워크플로우

> Task ID: `tsk-n8n-03` | Project: `prj-n8n` | Status: doing

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

- [x] `contributes` → `condition_contributes` 변경 반영
- [x] `track_contributes` 필드 추가
- [x] `validates`, `primary_hypothesis_id` 필드 추가
- [x] `validated_by` 필드 제안하지 않음
- [x] Realized Impact에 window 필드 자동 계산
- [x] LLM 프롬프트에 derived 필드 경고 추가

---

### 작업 로그

#### 2025-12-27 23:30 - Schema v5.2 반영 완료

**개요**: prj-impact-schema-v2 변경사항을 n8n 워크플로우에 반영. entity_validator_autofiller.json v2 → v3 업그레이드.

**변경사항**:

1. **Validate Projects 노드 (Phase 2)**
   - `hypothesis_id` → `primary_hypothesis_id` 변경
   - `validates` 필드 추가 (가설 배열)
   - `validated_by` derived 필드 경고 추가
   - LLM_REQUIRED_ISSUES에 `missing_validates`, `missing_primary_hypothesis_id` 추가

2. **Filter Impact Needed 노드 (Phase 3)**
   - **Expected Impact 프롬프트**:
     - `contributes` → `condition_contributes` 변경
     - `track_contributes` 필드 추가
     - `validates`, `primary_hypothesis_id` 필드 추가
     - 응답 구조: tier, impact_magnitude, confidence가 루트 레벨
   - **Realized Impact 프롬프트**:
     - `window_id` 자동 계산 추가 (YYYY-MM)
     - `time_range` 자동 계산 추가 (YYYY-MM-01..YYYY-MM-{lastDay})
     - `metrics_snapshot` 필드 추가
     - `human_required` 필드로 사람 판단 필수 항목 명시

3. **Meta 정보**
   - templateId: v2 → v3
   - schemaVersion: "5.2" 추가
   - description 업데이트

**파일 변경**:
- `_build/n8n_workflows/entity_validator_autofiller.json` - v3

**검증 기준 충족**:
- [x] `contributes` → `condition_contributes` 변경 반영
- [x] `track_contributes` 필드 추가
- [x] `validates`, `primary_hypothesis_id` 필드 추가
- [x] `validated_by` 필드 제안하지 않음
- [x] Realized Impact에 window 필드 자동 계산
- [x] LLM 프롬프트에 derived 필드 경고 추가

**다음 단계**:
- [ ] n8n GUI에서 v3 워크플로우 import
- [ ] E2E 테스트 실행

---

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

- [[prj-n8n]] - 소속 Project
- [[tsk-n8n-02]] - 선행 Task (Schema Validator + Pending UI)

---

**Created**: 2025-12-27
**Assignee**: 김은향
**Due**: 2025-12-27
