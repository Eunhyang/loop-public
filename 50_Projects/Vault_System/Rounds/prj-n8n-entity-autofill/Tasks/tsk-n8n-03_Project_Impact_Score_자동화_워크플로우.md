---
entity_type: Task
entity_id: tsk-n8n-03
entity_name: Project Impact Score 자동화 n8n 워크플로우
created: 2025-12-27
updated: 2025-12-27
status: doing

# === 계층 ===
parent_id: prj-n8n-entity-autofill
project_id: prj-n8n-entity-autofill
aliases:
- tsk-n8n-03

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: 김은향
start_date: 2025-12-27
due: 2025-12-27
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
- [ ] projects API 응답 확인
- [ ] 워크플로우 JSON 설계
- [ ] LLM 프롬프트 작성

### 작업 로그

#### 2025-12-27
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
