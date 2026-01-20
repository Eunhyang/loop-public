---
entity_type: PRD
entity_id: prd:graph-view-mvp
entity_name: PRD - Graph View MVP (Context + Path to NorthStar)
created: 2026-01-18
updated: 2026-01-18
owner: 한명학
status: draft
tags:
  - prd
  - graph
  - strategy
  - execution
  - context
---

# PRD: Graph View MVP — Context + Path to NorthStar

## 1) 목적 (Why)
Vault의 전략-실행 계층이 이미 연결돼 있음에도, 실행 중인 사람이 **"내가 지금 하는 일이 전체 목표에서 어디에 걸려있는지"** 를 즉시 파악하기 어렵다.

이 PRD의 목표는:
- **전체 그래프 뷰**에서 전략→실행 구조를 한눈에 보여주고
- **프로젝트 클릭 시** 해당 프로젝트가 **NorthStar까지 어떤 경로로 이어지는지**를 자동으로 확장/강조 표시하며
- 경로 상 핵심 노드(특히 Condition)의 **확률/신뢰도(예: 20%)**를 함께 보여줘서 의사결정 맥락을 즉시 복원한다.

> MVP 기준: “맥락 복원(Why Ladder) + 확률 표시”까지 되면 충분. Evidence/Experiment는 Phase 2로 미룬다.

---

## 2) 성공 기준 (Success Criteria)
### 정성
- 실행자가 Project/Task를 클릭했을 때 5초 내에
  - (1) 상위 목적 경로가 시각적으로 드러나고
  - (2) 각 상위 노드가 의미하는 바(특히 Condition/MH)가 한 줄로 이해되고
  - (3) 현재 이 베팅의 크기/위험을 대략 감으로 잡을 수 있어야 한다.

### 정량
- 프로젝트 클릭 후 **1초 이내**에 경로 하이라이트(로컬 그래프 기준)
- 전체 그래프 초기 로드 **3초 이내**(일반 노트북/사내망 기준)
- 사용자 피드백(내부): “맥락 파악이 어렵다” 코멘트 빈도 **50% 이상 감소**

---

## 3) 범위
### In Scope (MVP)
1. **Global Graph View (전체 그래프 뷰)**
   - 다음 노드/엣지를 시각화
     - Strategy ladder: NorthStar → MetaHypothesis → Condition → Track → Project → Task
     - Failure branch: Condition/MH/Track의 if_broken/hard_trigger를 ‘대응 노드’로 연결
   - 그래프 탐색: pan/zoom, 검색(엔티티 ID/이름), 필터(노드 타입/상태)

2. **Project Focus Mode (프로젝트 클릭 시 경로 확장/강조)**
   - 프로젝트 노드 클릭하면:
     - NorthStar까지의 상위 경로를 자동으로 확장/강조(Why Ladder)
     - 경로의 주요 노드에 확률/신뢰도 표시(예: cond-x 20%)
     - 우측 패널에 “경로 카드(Context Card)” 표시

3. **확률/신뢰도 표시(간단 규칙)**
   - 노드에 `confidence` 또는 `progress` 값이 있으면 이를 %로 표시
   - 없으면 상태/리스크만 표시하고 %는 생략

### Out of Scope (이번 MVP에서 제외)
- Evidence/Experiment 노드의 기본 표시(토글 레이어로도 이번엔 제외)
- 프로젝트 실패 시 대체 베팅 추천(자동 생성)
- 조건/트랙의 정량 모델(정교한 확률 계산, 베이즈 업데이트)

---

## 4) 사용자 / 사용 시나리오
### Primary user
- Founder/운영자/리드(전략-실행을 동시에 보는 사람)

### 핵심 시나리오
1) “지금 하는 프로젝트가 뭘 위한 건지”
- 그래프에서 프로젝트 선택 → Why Ladder가 NorthStar까지 자동으로 보임

2) “이 프로젝트가 전체 목표에 얼마나 큰 영향이 있지?”
- 경로 카드에서: Track/Condition의 확률(신뢰도), risk_level, priority_flag, tier/impact_magnitude(있을 경우)를 동시에 확인

---

## 5) 정보 구조 / 개념 모델
### 노드 타입 (MVP)
- NorthStar (ns-*)
- MetaHypothesis (mh-*)
- Condition (cond-*)
- Track (trk-*)
- Project (prj-*)
- Task (tsk-*)
- FailureBranch (action:*, 또는 if_broken 텍스트를 노드로 승격한 가상 노드)

### 엣지 타입 (MVP)
- parent: 상위 계층 연결 (NS→MH→C→T→P→K)
- validates: Track→Condition, (MVP에서는 Project→Hypothesis는 제외)
- failure: if_broken/hard_trigger → FailureBranch
- depends_on: Track 간 의존(선택 표시, 기본은 숨김)

---

## 6) 데이터 소스 / API
### 필수 API
- `/api/mcp/entity/{entity_id}/graph` (Get Entity Graph)
  - 클릭한 엔티티의 parents/children/related를 빠르게 가져와 “포커스 모드”를 만든다.
- `/api/mcp/strategy?depth=summary|full` (Get Strategy Overview)
  - 초기 로딩 또는 전략 노드 메타(상위 구조) 보강.
- (선택) `_build/graph.json` 직접 로드(웹앱이 vault를 직접 읽을 수 있는 경우)

### 필드 사용 규칙(표시용)
- `entity_name`, `entity_id`, `status`, `priority_flag`, `owner/assignee`
- 확률/신뢰도(%):
  1) 노드에 `confidence` 있으면 `confidence*100`
  2) 노드에 `progress` 있으면 `progress*100`
  3) 둘 다 없으면 % 미표시

> MVP는 “% 표기 일관성”이 목적이지 “확률의 정교함”이 목적이 아님.

---

## 7) UX 요구사항

## 7.1 전체 그래프 뷰 (Global)
### 핵심 요구
- Pan/zoom
- 검색: ID/이름 입력 → 해당 노드로 이동 및 강조
- 필터:
  - 노드 타입 필터(Strategy only, Execution only, Failure only)
  - 상태 필터(doing/todo/planning/done/hold)

### 기본 레이아웃/축
- X축(권장): 왼쪽=실행(Task/Project), 오른쪽=전략(NorthStar)
- 계층이 오른쪽으로 갈수록 추상도가 높아지도록 배치

## 7.2 프로젝트 클릭 시 (Project Focus Mode)
### 동작
- 프로젝트 노드 클릭 시:
  1) 해당 프로젝트의 **상위 경로(Why Ladder)** 를 자동 확장
  2) 경로 노드/엣지를 굵게/밝게 하이라이트
  3) 나머지 노드는 흐리게(dim)

### 우측 패널: Context Card (필수)
프로젝트 클릭 시 우측 패널에 아래를 항상 표시:
- 프로젝트명/ID
- 상위 경로 breadcrumb: `prj → trk → cond → mh → ns`
- 각 경로 노드의 핵심 속성:
  - Condition: confidence 또는 status, if_broken 요약(한 줄)
  - Track: progress, risk_level, objectives(요약)
  - MetaHypothesis: confidence, if_broken(한 줄)
- 확률 표시 규칙:
  - 예: `cond-d 70%` 또는 `trk-6 35%` (progress 기반)

### 확률 표기 UX
- 노드 라벨에 `이름 + (XX%)` 형태로 표시
- %가 없으면 표시하지 않고 상태 배지로 대체

## 7.3 Failure Branch (MVP 최소)
- Condition/MH/Track 문서에 `if_broken`이 있으면
  - 해당 텍스트를 **FailureBranch 노드**로 생성
  - dotted edge로 연결
- Track의 Hard Trigger는(문서에 명시된 경우)
  - FailureBranch 노드에 “Hard Trigger” 배지 표시(텍스트 그대로)

> MVP에서는 ‘게이지/거리’는 구현하지 않고, **텍스트 기반 브랜치 시각화**까지만. (게이지는 Phase 2)

---

## 8) 비기능 요구사항
- 성능: 그래프 노드 600개 규모에서 부드러운 pan/zoom
- 초기 로딩: 요약 데이터만 로드 → 클릭 시 상세 로드(점진 로딩)
- 장애 허용:
  - 일부 노드에 confidence/progress 누락돼도 UI가 깨지지 않아야 함

---

## 9) MVP 제외 항목을 Phase 2로 확장하는 설계 여지
- Proof Layer 토글:
  - Hypothesis/Evidence/Experiment 노드를 토글로 표시
  - Project→Hypothesis(validates) 연결을 활성화
- Failure Gate 게이지:
  - Runway/Revenue/Investment 게이트를 progress bar/marker로 표시

---

## 10) 오픈 이슈 / 결정 필요
1) Project의 “베팅 단위”를 명시하는 최소 필드가 필요한가?
   - 옵션 A: 기존 필드만 사용(conditions_3y + parent_id)
   - 옵션 B: `tier`, `impact_magnitude`, `confidence`를 프로젝트에 표준화(권장)

2) 확률 표기 소스 우선순위 확정
   - Condition/MH는 confidence 기반
   - Track은 progress 기반
   - Project는 (있으면) confidence/impact 기반, 없으면 미표시

---

## 11) 구현 체크리스트 (MVP)
- [ ] 그래프 데이터 로더(전체 요약 + 클릭 시 상세)
- [ ] 노드 타입별 렌더러(라벨/배지/색상/아이콘)
- [ ] 검색/필터/줌
- [ ] 프로젝트 클릭 → Why Ladder 하이라이트 + Context Card
- [ ] if_broken → FailureBranch 생성 및 dotted 연결

