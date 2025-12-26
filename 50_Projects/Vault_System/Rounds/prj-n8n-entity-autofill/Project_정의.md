---
entity_type: Project
entity_id: prj-n8n-entity-autofill
entity_name: n8n Entity Auto-filler
created: 2025-12-27
updated: 2025-12-27
status: doing
program_id: pgm-vault-system
cycle: '2025'
owner: 김은향
budget: null
deadline: null
expected_impact:
  tier: none
  impact_magnitude: null
  confidence: null
  contributes: []
realized_impact:
  verdict: null
  outcome: null
  evidence_links: []
  decided: null
hypothesis_id: null
experiments: []
parent_id: trk-6
conditions_3y:
- cond-e
aliases:
- prj-n8n-entity-autofill
- n8n Entity Auto-filler
outgoing_relations: []
validates: []
validated_by: []
tags:
- project
- vault-system
- n8n
- automation
- llm
---

# n8n Entity Auto-filler

> Project ID: `prj-n8n-entity-autofill` | Track: `trk-6` | Status: doing

---

## Project 가설

**"n8n + LLM 파이프라인으로 LOOP vault 엔티티의 빠진 필드를 자동으로 채울 수 있다"**

---

## 목표

### 성공 기준
1. NAS에 n8n Docker 배포 완료
2. LOOP MCP API 연동 워크플로우 동작
3. 빠진 필드 (conditions_3y, due, priority 등) 자동 추론 및 업데이트

### 실패 신호
1. n8n → LOOP API 인증 실패
2. LLM 추론 정확도 50% 미만

---

## 배경

### 왜 이 프로젝트인가?

Task/Project 엔티티에 필수 필드가 누락된 경우가 많음. 수동으로 채우는 것은 비효율적.
n8n의 시각적 워크플로우 + LLM 추론을 결합하여 자동화.

### 선행 조건

- LOOP MCP API 동작 중 (완료)
- NAS Docker 환경 (완료)
- OpenAI API 키 (보유)

---

## 실행 계획

### Phase 1: n8n 배포
- [ ] Docker compose 작성
- [ ] NAS 배포
- [ ] 웹 UI 접근 확인

### Phase 2: 파이프라인 구축
- [ ] LOOP API 인증 설정
- [ ] GET /api/tasks 연동
- [ ] 빠진 필드 필터 로직
- [ ] LLM 추론 노드
- [ ] PUT /api/tasks/{id} 업데이트

---

## Tasks

| ID | Name | Assignee | Status | Due |
|----|------|----------|--------|-----|
| tsk-n8n-01 | n8n Docker 배포 및 파이프라인 구축 | 김은향 | doing | 2025-12-27 |

---

## 관련 가설

- 없음 (Operational task)

---

## Notes

### PRD (Product Requirements Document)
<!-- prompt-enhancer 스킬로 자동 생성 예정 -->

**문제 정의**:
LOOP vault의 Task/Project 엔티티에 빠진 필드가 많아 전략 연결 추적이 어려움.

**목표**:
n8n + LLM으로 빠진 필드 자동 채우기 파이프라인 구축.

**핵심 요구사항**:
1. n8n Docker 컨테이너 NAS 배포
2. LOOP MCP API 연동 (OAuth)
3. LLM 기반 필드 추론 (conditions_3y, due, priority)
4. 자동 업데이트 또는 검토 후 적용

**기술 스펙**:
- n8n (self-hosted Docker)
- LOOP MCP API (FastAPI)
- OpenAI API (GPT-4)

**제약 조건**:
- NAS 리소스 제한 고려
- API rate limit 준수

**성공 지표**:
- 파이프라인 정상 동작
- 필드 추론 정확도 80% 이상

---

## 참고 문서

- [[trk-6]] - 소속 Track
- [[pgm-vault-system]] - 소속 Program
- https://docs.n8n.io/ - n8n 공식 문서

---

**Created**: 2025-12-27
**Owner**: 김은향
