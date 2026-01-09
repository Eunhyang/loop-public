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
| Backend Maintenance | - | Ops | doing | [[prj-w5kz77]] |

---

## Track 연결

| Track | 관계 | 설명 |
|-------|------|------|
| trk-1 (Product) | supports | 앱 안정성 → PMF 기여 |
| trk-4 (Coaching) | supports | 앱 업데이트 → 코칭 운영 효율 |

---

# KkokKkok 버그/이슈/핫픽스 운영 구조 가이드 (Program · Project · Task)

> 목적: 꼭꼭앱에서 발생하는 **버그/이슈/핫픽스**를 Vault에 **일관되게 기록·실행·회고**하기 위한 운영 규칙을 정리한다.
> 적용 범위: `pgm-kkokkkok-app-release` (앱스토어/앱 배포 중심) + (선택) `pgm-kkokkkok-backend-release` (Firebase Functions/서버 배포 중심)

---

## 0) 핵심 원칙(SSOT)

### 0.1 Project vs Task의 역할 분리
- **Project = 판정 단위(릴리즈/배포 결과를 평가하는 단위)**
  - 버전/핫픽스/배포 배치 단위로 묶어서 "결과"를 남긴다.
- **Task = 실행 단위(재현→원인→수정→검증→배포/모니터링 등)**
  - 버그/기능/운영 작업은 대부분 Task로 처리한다.
  - Task는 "점수/판정(validates)"의 단위가 아니다.

### 0.2 이름 규칙(필수)
- Project/Task `entity_name`은 **반드시 `주제 - 내용` 형식**을 사용한다.
  - 예시(Project): `KkokKkok App v1.0.29 - Release`
  - 예시(Project): `KkokKkok App v1.0.29 - Hotfix 01`
  - 예시(Task): `Bug - 캘린더 월뷰에서 2026년 표시 오류`
  - 예시(Task): `Functions - 알림 트리거 중복 발송 수정`

---

## 1) 권장 구조 한눈에 보기

### 1.1 App Release Train (기본)
- Program: `pgm-kkokkkok-app-release`
  - Project: `KkokKkok App vX.Y.Z - Release` (**버전 단위**)
    - Task: 기능/버그/QA/스토어 제출/릴리즈 노트 등 (**실행 단위**)

### 1.2 Backend Release Train (선택)
- Program: `pgm-kkokkkok-backend-release` (신규 추천)
  - Project(선택지 A): `Functions - 2026-W02 배포 배치` (**주간/격주 배치형**)
  - Project(선택지 B): `Functions - Notification 개선 묶음` (**도메인 묶음형**)
    - Task: 함수 수정/배포/모니터링/롤백 등

> 운영 팁: 백엔드 배포가 월 1~3건 정도로 적다면 Program까지 만들지 않고, **단일 Project 하나로 시작**해도 된다.
> 예: `KkokKkok Backend - Maintenance` (Project) 아래 Task로만 관리

---

## 2) 버그/이슈는 기본적으로 "Task"로 처리한다

### 2.1 일반 버그(대부분)
- **다음 버전에 포함 가능**하면:
  - `현재 진행 중인 Release Project` 아래에 **Bug Task 추가**
  - 우선순위만 `high/critical`로 올려서 처리

예시:
- Project: `KkokKkok App v1.0.29 - Release`
  - Task: `Bug - 로그인 후 홈 화면 무한 로딩`
  - Task: `Bug - 캘린더 월뷰 날짜 정렬 깨짐`

### 2.2 "현상만 들어온 상태(아직 분석 전)"도 Task로 만든다
- 상태: `todo`
- 노트에 재현/로그 링크부터 쌓는다(아래 템플릿 참고)

---

## 3) 핫픽스가 갑자기 들어올 때: 1개의 기준으로 결정

### 3.1 단 하나의 기준
> **"지금 운영 중인 프로덕션(앱/서버)에 즉시 손을 대야 하는가?"**

이 기준만 확정하면, Project를 새로 만들지/Task로 넣을지 자동으로 결정된다.

---

## 4) 의사결정 트리 (3분 내 결정용)[버그/이슈 발생]
|
v
(1) Kill Switch/서버 차단으로 즉시 완화 가능?
|–––––––––– YES ––––––––––|
|                                             |
v                                             v
(2) 앱스토어 배포 없이 해결 가능한가?          (3) 앱스토어 배포가 필요한가?
|                                             |
YES                                           YES
|                                             |
v                                             v
[Backend Hotfix/배치로 처리]                    [App Hotfix Project 생성]
|
NO
|
v
[App Release Project 내 Bug Task로 처리]---

## 5) 케이스별 처리 규칙 (표)

| 상황 | 사용자 영향/긴급도 | 권장 구조 | 생성 단위 |
|---|---|---|---|
| 일반 버그 | 영향 제한 / 우회 가능 | 해당 버전 Release Project에 버그 Task 추가 | Task |
| 다음 버전에 태우면 됨 | 즉시 배포 불필요 | 진행 중 Release Project에 버그 Task 추가 | Task |
| 치명적(크래시/로그인 불가/결제 불가/데이터 유실) | 즉시 대응 필요 | **Hotfix Project 생성** + 하위 Task | Project + Task |
| 서버(Firebase Functions)만 바꾸면 즉시 막힘 | 앱스토어 무관 | **Backend Hotfix/배치 Project** + 하위 Task | Project + Task |
| 단순 리포트(현상만) | 불확실 | 우선 Task로 기록하고 분석 | Task |
| 큰 리팩토링/기술부채(릴리즈 미정) | 배포 리듬 다름 | 별도 Project(또는 별도 Program)로 분리 | Project + Task |

---

## 6) "App Hotfix"는 왜 Project로 만드는가?

핫픽스는 단순 작업이 아니라 **작은 릴리즈**다.
- 배포/검증/릴리즈노트/롤백/모니터링이 따라붙고
- "결과"가 남아야 하므로 **Project(판정 단위)**가 맞다.

### 6.1 Hotfix Project 작명 예시
- `KkokKkok App v1.0.29 - Hotfix 01`
- `KkokKkok App v1.0.29 - Hotfix 02`

### 6.2 Hotfix Project에 들어갈 최소 Task(권장 5개)
- `Bug - 현상 재현 및 범위 확정`
- `Bug - 원인 분석`
- `Fix - 패치 적용`
- `QA - 회귀 테스트`
- `Release - 배포 및 모니터링`

---

## 7) "Backend(Firebase Functions)" 작업을 어디에 둘까?

### 7.1 App 버전과 강하게 커플링(동시 QA/동시 출시 필요)
- 예: 앱 1.0.29 기능이 Functions 없으면 동작 불가
- 처리: **해당 버전 Release Project** 아래 Task로 넣는다.

예시:
- Project: `KkokKkok App v1.0.29 - Release`
  - Task: `Functions - 인증 토큰 검증 로직 수정`
  - Task: `Functions - 알림 트리거 누락 수정`

### 7.2 App 버전과 무관한 수시 배포(운영/정책/비용/로그/차단/핫패치)
- 처리: `prj-w5kz77` ([[KkokKkok Backend - Maintenance]])에서 진행한다.
- 이유: 앱 버전 성과/학습(판정)이 백엔드 수시 배포로 오염되는 것을 막는다.

---

## 8) Bug Task 작성 템플릿(필수 필드)

버그 Task는 "메모"가 아니라 "완결 가능한 실행 단위"가 되어야 한다.
아래 6가지는 반드시 채운다.

### 8.1 버그 Task 템플릿(본문)
- **현상 요약(1줄)**
- **재현 Steps**
- **Expected / Actual**
- **환경**
  - iOS/Android, 앱 버전, 디바이스, 사용자 조건(로그인 여부/구독 여부 등)
- **근거 링크**
  - Crashlytics, 로그, 스크린샷/영상, 사용자 리포트 등
- **Fix 완료 조건**
  - 재현 불가 + 회귀 테스트 항목 + 모니터링 기간

---

## 9) "갑자기 들어온 핫픽스" 운영 플로우 (실무 체크리스트)

### 9.1 3분 결정 체크
- [ ] Kill switch(서버 차단/토글)로 즉시 완화 가능한가?
- [ ] 데이터 유실 위험이 있는가? (있으면 **무조건 핫픽스 Project**)
- [ ] 앱스토어 배포가 필요한가?
- [ ] 우회 가능/영향 제한인가? (가능하면 Release Project 내 Task)

### 9.2 실행 체크(Hotfix인 경우)
- [ ] Hotfix Project 생성: `KkokKkok App vX.Y.Z - Hotfix NN`
- [ ] 최소 Task 5개 생성(재현/원인/패치/QA/배포·모니터링)
- [ ] 배포 후 모니터링: Crash-free / 에러율 / CS 유입
- [ ] 회고 5줄: 원인/탐지/완화/재발방지/다음 액션

---

## 10) 실제 예시 시나리오

### 10.1 일반 버그(다음 버전에 포함)
- 현상: 캘린더 월뷰에서 일부 기기 날짜 정렬 오류
- 처리:
  - Project: `KkokKkok App v1.0.29 - Release`
    - Task: `Bug - 캘린더 월뷰 날짜 정렬 오류`

### 10.2 치명적 버그(즉시 핫픽스)
- 현상: 로그인 후 크래시 급증(Crashlytics spike)
- 처리:
  - Project: `KkokKkok App v1.0.29 - Hotfix 01`
    - Task: `Bug - 크래시 재현 및 범위 확정`
    - Task: `Bug - 원인 분석`
    - Task: `Fix - 패치 적용`
    - Task: `QA - 회귀 테스트`
    - Task: `Release - 배포 및 모니터링`

### 10.3 Functions만 고치면 즉시 완화(서버 핫픽스)
- 현상: 알림 중복 발송(서버 트리거 문제)
- 처리:
  - Project: `prj-w5kz77` ([[KkokKkok Backend - Maintenance]])에서 진행
    - Task: `Functions - 알림 중복 발송 트리거 수정`
    - Task: `Ops - 배포 및 모니터링`

---

## 11) 운영 권장값(초기 기본값)

- 일반 버그 Task priority: `high`
- 치명적/즉시 대응 Task priority: `critical`
- 버그 Task type: `bug` (가능하면)
- 서버 배포 Task type: `ops` 또는 `dev` (팀 기준으로 통일)

---

## 12) 결론(한 줄 규칙)

- **버그는 기본적으로 Task**
- **운영 중 프로덕션을 즉시 건드려야 하면 Hotfix Project**
- **Firebase Functions 등 백엔드 수시 배포는 App Release와 분리(Program/Project 분리)**

---

**Created**: 2026-01-02
**Owner**: 은향
