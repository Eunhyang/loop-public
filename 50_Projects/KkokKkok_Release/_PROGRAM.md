---
entity_type: Program
entity_id: pgm-kkokkkok-app-release
entity_name: 꼭꼭앱 Release Train
created: 2026-01-02
updated: 2026-01-02
status: doing

# === Program 정의 ===
program_type: launch
owner: 은향

# === 원칙/프로세스 ===
principles:
  - "버전 = Project (유일한 판정 단위)"
  - "Task는 실행 단위 - validates/점수 판정 금지"
  - "A(Expected) → B(Realized) 자동 롤업/학습 루프"

process_steps:
  - "Scope Lock: planning → active 시 A Score 확정"
  - "개발: Task 단위로 이슈 추적"
  - "릴리즈: 앱스토어 배포"
  - "측정: D+7/D+14 윈도우에서 B Score 계산"
  - "Evidence: 근거 문서화 → 다음 예측(A) 개선"

templates: []

# === 운영 KPI ===
kpis:
  - name: "Crash-free Rate"
    description: "앱 안정성 지표"
  - name: "Session Drop-off (First 30s)"
    description: "첫 30초 이탈률"
  - name: "Timer Start Rate"
    description: "타이머 시작률 (주 3회+)"

# === Cross-Vault ===
exec_rounds_path: null

# === 계층 ===
parent_id: null
aliases:
  - pgm-kkokkkok-app-release
  - 꼭꼭앱 Release Train
  - KkokKkok Release

outgoing_relations:
  - type: supports
    target_id: trk-1
    description: Product Track에 앱 안정성 기여
  - type: supports
    target_id: trk-4
    description: Coaching Track에 코칭 운영 효율 기여

validates: []
validated_by: []
tags: ["program", "launch", "kkokkkok", "app-release"]
priority_flag: high
---

# 꼭꼭앱 Release Train

> Program ID: `pgm-kkokkkok-app-release` | Type: launch | Status: doing

## 프로그램 개요

꼭꼭앱(KkokKkok App)의 버전별 릴리즈를 관리하는 Release Train 프로그램.

**목표**: 버전 단위로 A(Expected) → B(Realized) 학습 루프 운영

---

## 운영 원칙

1. **버전 = Project (판정 단위)**: 각 버전이 하나의 Project로, A/B Score 측정 단위
2. **Task = 실행 단위**: 개발 이슈(버그/기능)는 Task로, validates/점수 판정 금지
3. **A/B 롤업**: Project → Track → Condition 자동 집계

---

## A/B 점수화 규칙

### A Score (Expected Impact)
- **확정 시점**: Scope Lock (planning → active)
- **범위 변경 시**: 새 Project로 분리하거나 다음 버전으로 이월

### B Score (Realized Impact)
- **측정 시점**: 릴리즈 후 D+7 또는 D+14 윈도우
- **구성 요소**:
  - 핵심 지표 변화 (Crash-free, Session Drop-off, Timer Start Rate)
  - 측정 신뢰도로 가중치 조정
- **Evidence 필수**: B Score 근거 문서화

---

## 프로세스

```
Scope Lock → 개발 → 릴리즈 → 측정(D+7/14) → Evidence → 롤업
```

| 단계 | 주요 활동 |
|------|----------|
| Scope Lock | A Score 확정, planning → active |
| 개발 | Task 단위 이슈 추적 (type: dev/bug) |
| 릴리즈 | 앱스토어 배포 |
| 측정 | D+7/D+14 윈도우에서 KPI 측정 |
| Evidence | B Score 근거 문서화 |
| 롤업 | Track/Condition으로 자동 집계 |

---

## 범위

이 Program에 속하는 작업 유형:
- 정규 릴리즈 (Release)
- 핫픽스 (Hotfix)
- 긴급 패치 (Patch)

---

## Rounds (버전별 릴리즈)

| Round | Version | Type | Status | Link |
|-------|---------|------|--------|------|
| v1.0.28 | 1.0.28 | Hotfix | done | [[prj-kkokkkok-v1028]] |

---

## Track 연결

| Track | 관계 | 설명 |
|-------|------|------|
| trk-1 (Product) | supports | 앱 안정성 → PMF 기여 |
| trk-4 (Coaching) | supports | 앱 업데이트 → 코칭 운영 효율 |

---

**Created**: 2026-01-02
**Owner**: 은향
