---
entity_type: Project
entity_id: "prj-015"
entity_name: "주니어 개발자 채용"
created: 2025-12-25
updated: 2025-12-25
status: in_progress

# === 계층 ===
parent_id: "trk-6"
aliases: ["prj-015", "주니어 개발자 채용"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Project 전용 ===
owner: "한명학"
budget: null
deadline: null
hypothesis_text: "주니어 개발자를 채용하여 제품 개발 속도를 높일 수 있다"
experiments: []

# === Expected Impact (A) ===
expected_impact:
  tier: enabling
  impact_magnitude: high
  confidence: 0.7
  contributes:
    - condition_id: "cond-d"
      weight: 0.3

# === Realized Impact (B) ===
realized_impact:
  verdict: null
  outcome: null
  evidence_links: []
  decided: null

# === 3Y 전략 연결 ===
conditions_3y: ["cond-d"]

# === 분류 ===
tags: ["hiring", "developer"]
priority_flag: high
---

# 주니어 개발자 채용

> Project ID: `prj-015` | Track: `trk-6` | Status: in_progress

---

## Project 가설

**"주니어 개발자를 채용하여 제품 개발 속도를 높일 수 있다"**

---

## 목표

### 성공 기준
1. 기술 과제 통과한 주니어 개발자 1명 채용
2. 온보딩 완료 후 첫 PR 머지

### 실패 신호
1. 기술 과제 통과자 없음
2. 온보딩 중 이탈

---

## 배경

### 왜 이 프로젝트인가?
- 현재 개발 리소스 부족
- 제품 개발 속도 향상 필요

### 선행 조건
- 채용 프로세스 정립
- 기술 과제 설계

---

## 실행 계획

### Phase 1: 채용
- [x] 커피챗 대상자 확정
- [x] 커피챗 진행
- [ ] 기술 과제 평가
- [ ] 1:1 면접

### Phase 2: 온보딩
- [ ] Day1 Onboarding
- [ ] 개발 환경 세팅
- [ ] 파일럿 프로젝트

---

## Tasks

| ID | Name | Assignee | Status | Due |
|----|------|----------|--------|-----|
| tsk-015-01 | 커피챗 대상자 확정 및 연락 | 한명학 | done | |
| tsk-015-02 | 커피챗 일정 조율 & 진행 | 한명학 | done | |
| tsk-015-03 | 주니어 개발자 커피챗 진행 | 한명학 | done | |
| tsk-015-04 | 주니어 개발자 기술 과제 설계 초안 작성 | 한명학 | done | |
| tsk-015-05 | 단님에게 실전 과제 제안 및 안내 발송 | 한명학 | todo | |
| tsk-015-06 | 실전 과제 평가기준 작성 | 한명학 | todo | |
| tsk-015-07 | 주니어 개발자 과제 제출물 기술 평가 | 한명학 | todo | |
| tsk-015-08 | 1차 기술 평가(Flutter + Firebase) | 한명학 | todo | |
| tsk-015-09 | 주니어 개발자 기술 리뷰 1:1 면접 진행 | 한명학 | todo | |
| tsk-015-10 | 파일럿 프로젝트 계약서 작성 | 한명학 | todo | |
| tsk-015-11 | 개발자 온보딩 문서 v1 작성 | 한명학 | todo | |
| tsk-015-12 | 개발 환경 세팅 문서 | 한명학 | todo | |
| tsk-015-13 | Day1 Onboarding 진행 | 한명학 | todo | |

---

## 참고 문서

- [[trk-6]] - 소속 Track
- [[prj-006]] - 코치 채용 프로젝트 (유사)

---

**Created**: 2025-12-25
**Owner**: 한명학
