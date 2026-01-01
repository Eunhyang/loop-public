---
entity_type: Task
entity_id: "tsk-n8n-12"
entity_name: "Evidence 자동화 - 운영 완성 (Workflow C + Server Skip)"
created: 2026-01-01
updated: 2026-01-01
status: doing

# === 계층 ===
parent_id: "prj-n8n"
project_id: "prj-n8n"
aliases: ["tsk-n8n-12"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-01
due: 2026-01-01
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop-api

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-a"]

# === 분류 ===
tags: ["evidence", "automation", "n8n", "workflow"]
priority_flag: high
---

# Evidence 자동화 - 운영 완성 (Workflow C + Server Skip)

> Task ID: `tsk-n8n-12` | Project: `prj-n8n` | Status: doing

## 목표

Evidence 자동화의 "운영 완성"을 위한 마지막 10~20% 작업 수행.

**완료 조건**:
1. Workflow C 추가: 승인 감지 → build_impact 트리거
2. Evidence 중복 생성 방지: Server skip 로직 구현
3. n8n 워크플로우 Import 및 테스트

---

## 상세 내용

### 배경

Evidence 자동화의 핵심 뼈대(80~90%)는 이미 구현됨:
- Evidence 생성 추론 호출 (`POST /api/ai/infer/evidence`)
- run_id n8n 생성 및 전달
- pending 생성은 서버 책임
- Evidence 품질 메타(v5.3) 서버 채움

**남은 작업 (운영 완성 10~20%)**:
1. **Workflow C**: 승인 감지 → build_impact 트리거 워크플로우
2. **Server Skip**: `/api/ai/infer/evidence` 내부에서 이미 Evidence 존재 시 skip 처리

### 작업 내용

#### 1. POST /api/build/impact 엔드포인트 추가
- FastAPI에 build 트리거 엔드포인트 구현
- 락 파일 또는 단일 실행 guard 적용 (중복 실행 방지)
- 응답: `{ok, build_id, started_at, ended_at, impact_path}`

#### 2. Workflow C (n8n 워크플로우)
- 15분마다 `/api/audit/decisions` 폴링
- pending_approved 이벤트 감지
- build_impact 1회만 트리거
- cursor를 staticData에 저장 (중복 실행 방지)

#### 3. Server Skip 로직
- `/api/ai/infer/evidence` 내부에서 Evidence 존재 여부 체크
- 있으면: `{ok: true, skipped: true, skip_reason: "evidence_exists"}`
- 없으면: 기존 로직대로 진행

---

## 체크리스트

- [ ] POST /api/build/impact 엔드포인트 구현
- [ ] Server skip 로직 구현 (_build/evidence_index.json 또는 캐시 활용)
- [ ] n8n Workflow C JSON Import
- [ ] E2E 테스트: 승인 → build_impact 트리거 확인

---

## Notes

### Todo
- [ ] api/routers/build.py 생성
- [ ] ai.py infer_evidence에 skip 로직 추가
- [ ] n8n 워크플로우 Import 및 테스트

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)

#### YYYY-MM-DD HH:MM
**개요**: 2-3문장 요약

**변경사항**:
- 개발:
- 수정:
- 개선:

**핵심 코드**: (필요시)

**결과**: ✅ 빌드 성공 / ❌ 실패

**다음 단계**:
-->


---

## 참고 문서

- [[prj-n8n]] - 소속 Project
- [[tsk-n8n-07]] - AI Router Evidence 추론 엔드포인트 구현
- [[tsk-n8n-08]] - Workflow v4 구현 및 E2E 테스트

---

**Created**: 2026-01-01
**Assignee**: 김은향
**Due**: 2026-01-01
