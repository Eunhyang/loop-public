---
entity_type: Task
entity_id: tsk-n8n-10
entity_name: "Dashboard - Pending Reviews 3단 레이아웃 UX 개선"
created: 2026-01-01
updated: 2026-01-01
status: done

# === 계층 ===
parent_id: prj-n8n
project_id: prj-n8n
aliases:
- tsk-n8n-10

# === 관계 ===
outgoing_relations:
- tsk-n8n-09
validates: []

# === Task 전용 ===
assignee: 김은향
start_date: 2026-01-01
due: 2026-01-02
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===

# === 분류 ===
tags:
- dashboard
- pending-reviews
- ux
priority_flag: high
---

# Dashboard - Pending Reviews 3단 레이아웃 UX 개선

> Task ID: `tsk-n8n-10` | Project: `prj-n8n` | Status: doing

## 목표

**완료 조건**:
1. Pending Reviews를 3단 레이아웃으로 전환 (List | Detail | Entity)
2. 엔티티 ID 클릭 시 오른쪽 패널에 상세 정보 표시
3. 기존 모달 제거, 전체화면 3단 레이아웃 적용
4. 테스트 완료 및 NAS 배포

---

## 상세 내용

### 배경

tsk-n8n-09에서 E2E 테스트 완료 후 요청된 UX 개선 사항.
현재: Side Panel + Modal 방식 → 엔티티 실제 내용 확인 불가

### 현재 상태

```
┌─────────────────────────────────────────────────────────┐
│                      Dashboard                          │
└─────────────────────────────────────────────────────────┘
                             +
┌──────────────────┐   ┌──────────────────────────┐
│  Side Panel      │   │   Modal (overlay)        │
│  (Pending List)  │   │   - suggested_fields     │
│                  │   │   - Approve/Reject       │
└──────────────────┘   └──────────────────────────┘

- 리스트 클릭 → 모달로 상세 보기
- 엔티티 실제 내용 확인 불가
```

### 목표 레이아웃 (3단 분할)

```
┌──────────────┬──────────────────────┬──────────────────────┐
│   1. 왼쪽    │      2. 가운데       │      3. 오른쪽       │
│  Pending     │   Pending Detail     │   Entity Detail      │
│  List        │                      │                      │
├──────────────┼──────────────────────┼──────────────────────┤
│              │                      │                      │
│ • Review 1   │  conditions_3y:      │  ┌─ cond-a ────────┐ │
│ • Review 2 ◀─┼─ [cond-a, cond-e] ──┼─►│ Product-Market   │ │
│ • Review 3   │                      │  │ Fit 검증...     │ │
│              │  assignee: 김은향    │  └──────────────────┘ │
│              │  due: 2026-01-01     │                      │
│              │  priority: medium    │                      │
│              │                      │                      │
│              │  ─────────────────   │                      │
│              │  AI 판단 근거        │                      │
│              │  (reasoning...)      │                      │
│              │                      │                      │
│              │  [Reject] [Approve]  │                      │
└──────────────┴──────────────────────┴──────────────────────┘
```

**동작 흐름**:
1. 왼쪽 - Pending 리스트에서 항목 클릭
2. 가운데 - 해당 Pending의 suggested_fields, reasoning, Approve/Reject 버튼
3. 오른쪽 - 가운데에서 cond-a, trk-2, hyp-001 등 클릭 시 해당 엔티티의 실제 정보 표시

### 구현 방식

| 영역   | 너비   | 내용                                           |
|--------|--------|------------------------------------------------|
| 왼쪽   | ~250px | Pending 리스트 (탭: Pending/Approved/Rejected) |
| 가운데 | flex-1 | 선택된 Pending 상세 (현재 모달 내용)           |
| 오른쪽 | ~350px | 클릭한 엔티티 상세 (API로 조회)                |

- 기존 모달 제거 → 3단 전체화면 레이아웃
- 오른쪽 패널은 엔티티 클릭 전엔 빈 상태 또는 "Select an entity to view details" 표시

---

## 체크리스트

### 레이아웃 구조
- [ ] 3단 컨테이너 HTML 구조 변경
- [ ] CSS Flexbox 레이아웃 적용
- [ ] 기존 모달 코드 제거

### 왼쪽 패널 (Pending List)
- [ ] 탭 UI 구현 (Pending/Approved/Rejected)
- [ ] 리스트 아이템 클릭 이벤트
- [ ] 선택 상태 하이라이트

### 가운데 패널 (Pending Detail)
- [ ] suggested_fields 표시
- [ ] reasoning 섹션 (기본 펼침)
- [ ] Approve/Reject 버튼
- [ ] 엔티티 ID 클릭 가능하게 변경

### 오른쪽 패널 (Entity Detail)
- [ ] API 조회 함수 구현
- [ ] 엔티티 상세 렌더링
- [ ] 빈 상태 UI

### 테스트 및 배포
- [ ] 로컬 테스트
- [ ] NAS 동기화
- [ ] Docker 재배포

---

## Notes

### PRD (Product Requirements Document)

#### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| Task ID | tsk-n8n-10 |
| Task Name | Dashboard - Pending Reviews 3단 레이아웃 UX 개선 |
| Project | LOOP Vault Dashboard |
| 목표 | Pending Review 승인/거부 UX를 3단 레이아웃으로 개선하여 엔티티 상세 정보 확인 후 판단할 수 있도록 개선 |

#### 1.2 문제 정의

**현재 상태:**
- Dashboard의 Pending Reviews는 Side Panel + Modal 방식으로 동작
- 리스트에서 항목 클릭 시 Modal이 열리며 상세 정보 표시
- Modal에서 `cond-a`, `hyp-001`, `trk-2` 등의 entity ID만 표시되고, 실제 엔티티 내용 확인 불가
- 사용자가 승인/거부 판단을 위해 해당 엔티티가 무엇인지 별도로 확인해야 하는 번거로움

**사용자 Pain Point:**
1. `suggested_fields`에 `conditions_3y: ["cond-a", "cond-b"]`가 제안되어도 해당 Condition이 무엇인지 모름
2. Impact의 `contributes.to: "trk-2"`를 보고도 Track 내용 확인 불가
3. 판단을 위해 Obsidian이나 별도 창에서 엔티티를 찾아봐야 함

#### 1.3 목표 및 성공 기준

**성공 기준:**
- [ ] 3단 레이아웃이 정상 렌더링됨
- [ ] 왼쪽 패널: Pending 리스트 표시 및 선택 가능
- [ ] 가운데 패널: 선택된 Pending의 suggested_fields, reasoning, Approve/Reject 버튼 표시
- [ ] 오른쪽 패널: 가운데에서 클릭한 entity ID의 상세 정보 표시
- [ ] 기존 Approve/Reject 기능 정상 동작
- [ ] ESC 또는 오버레이 클릭 시 전체 패널 닫힘

#### 1.4 기능 상세

**왼쪽 패널 (Pending List):**
- 너비: 250px 고정
- 탭 필터: Pending / Approved / Rejected
- 카드 컴포넌트: 기존 `pending-review-card` 재사용
- 선택된 카드 하이라이트 표시

**가운데 패널 (Pending Detail):**
- 너비: flex-1 (나머지 공간)
- Entity Info 섹션: ID, Type, Created 날짜
- Suggested Changes 섹션: 각 필드별 현재값/제안값, **Entity ID 클릭 가능**
- AI 판단 근거(reasoning) 기본 펼침
- 액션 버튼: Reject / Approve

**오른쪽 패널 (Entity Detail):**
- 너비: 350px 고정
- Track / Condition / Hypothesis 타입별 렌더링
- 초기 상태: "Select an entity" 메시지

---

### Tech Spec

#### 2.1 수정 대상 파일

| 파일 | 수정 범위 |
|------|-----------|
| `_dashboard/js/components/pending-panel.js` | 주요 수정: 3단 레이아웃 구현 |
| `_dashboard/css/panel.css` | CSS 추가: 3-pane 레이아웃 스타일 |
| `_dashboard/js/api.js` | 신규 메서드 추가: getCondition, getTrack, getHypothesis |

#### 2.2 API 엔드포인트

**기존 사용:**
- `GET /api/pending` - Pending 목록 조회
- `POST /api/pending/{id}/approve` - 승인
- `POST /api/pending/{id}/reject` - 거부

**신규 사용 (Entity Detail 로드):**
- `GET /api/conditions/{condition_id}` - Condition 상세
- `GET /api/tracks/{track_id}` - Track 상세
- `GET /api/hypotheses/{hypothesis_id}` - Hypothesis 상세

#### 2.3 HTML 구조 (3단 레이아웃)

```html
<div id="pendingPanel" class="pending-3pane-container">
  <!-- 1. 왼쪽: Pending List -->
  <div class="pending-list-pane">...</div>
  <!-- 2. 가운데: Pending Detail -->
  <div class="pending-detail-pane">...</div>
  <!-- 3. 오른쪽: Entity Preview -->
  <div class="pending-entity-pane">...</div>
</div>
```

#### 2.4 CSS 구조

```css
.pending-3pane-container { display: flex; max-width: 1200px; }
.pending-list-pane { width: 250px; }
.pending-detail-pane { flex: 1; min-width: 350px; }
.pending-entity-pane { width: 350px; }
.clickable-entity-id { color: #3b82f6; cursor: pointer; text-decoration: underline; }
```

#### 2.5 주요 함수

- `createPanelHTML()` - 3단 레이아웃 HTML 생성
- `renderDetail(review)` - 가운데 패널 렌더링
- `loadEntityPreview(entityId)` - 오른쪽 패널 Entity 로드
- `fetchEntity(type, id)` - API 호출
- `renderEntityPreview(type, entity)` - Entity 상세 렌더링

---

### Todo

| # | 상태 | 작업 내용 |
|---|------|----------|
| 1 | ✅ done | `pending-panel.js`의 `createPanelHTML()` 수정 - 3단 레이아웃 HTML 구조로 변경 |
| 2 | ✅ done | `panel.css`에 3-pane 레이아웃 스타일 추가 |
| 3 | ✅ done | `renderReviews()` 수정 - 왼쪽 패널에 렌더링되도록 변경 |
| 4 | ✅ done | 신규 함수 `renderDetail()` 구현 - 가운데 패널 렌더링 |
| 5 | ✅ done | Suggested Fields에서 Entity ID를 클릭 가능하게 변경 |
| 6 | ✅ done | 신규 함수 `loadEntityPreview()` 구현 - 오른쪽 패널 Entity 로드 |
| 7 | ✅ done | `api.js`에 `getCondition()`, `getTrack()`, `getHypothesis()` 메서드 추가 |
| 8 | ✅ done | Entity Preview 렌더러 구현 (Track, Condition, Hypothesis, Project, Task 타입별) |
| 9 | ✅ done | 이벤트 리스너 설정 (카드 클릭, Entity ID 클릭, Approve/Reject) |
| 10 | ⏳ pending | 반응형 CSS 추가 (1024px, 768px 브레이크포인트) - 향후 개선 |
| 11 | ✅ done | 기존 Modal 코드 정리 |
| 12 | ✅ done | 로컬 테스트 및 엣지 케이스 검증 |
| 13 | ✅ done | NAS 동기화 및 Docker 재배포 |

---

### 작업 로그

#### 2026-01-01 18:00
**개요**: Pending Reviews 패널을 3단 레이아웃(List | Detail | Entity Preview)으로 전환 완료. Entity Preview 패널에서 기존 Dashboard 컴포넌트 스타일을 재사용하여 Track, Condition, Hypothesis, Project, Task 타입별 렌더링 구현. Approve/Reject 버튼 고정 위치 CSS 수정.

**변경사항**:
- 개발: 3단 레이아웃 HTML 구조 (`pending-3pane-container`)
- 개발: Entity Preview 타입별 렌더러 (`renderTrackPreview`, `renderConditionPreview`, `renderHypothesisPreview`, `renderProjectPreview`, `renderTaskPreview`)
- 개발: Entity ID 클릭 → API 조회 → Preview 렌더링 연동
- 수정: `panel.css` - 3-pane 레이아웃 스타일, footer 고정 위치
- 수정: Entity ID 정규식 패턴 (`hyp-001` 형식 지원 추가)
- 삭제: 기존 crude `renderEntityFields()`, `formatEntityFieldValue()` (JSON.stringify 방식)

**파일 변경**:
- `_dashboard/js/components/pending-panel.js` - 3단 레이아웃 + 타입별 Preview 렌더러
- `_dashboard/css/panel.css` - 3-pane CSS, footer 고정
- `_dashboard/js/api.js` - `getCondition()`, `getTrack()`, `getHypothesis()` 메서드 추가

**핵심 코드**:
```javascript
// Entity ID 패턴 매칭
if (entityId.match(/^cond-/)) entityType = 'condition';
if (entityId.match(/^trk-/)) entityType = 'track';
if (entityId.match(/^hyp-\d+-\d+$/) || entityId.match(/^hyp-\d+$/)) entityType = 'hypothesis';
if (entityId.match(/^prj-/)) entityType = 'project';
if (entityId.match(/^tsk-/)) entityType = 'task';
```

**결과**: ✅ 빌드 성공, NAS 동기화 완료

**다음 단계**:
- Dashboard 새로고침 후 최종 확인
- Task 상태 done으로 변경 (필요시)

---

## 참고 문서

- [[prj-n8n]] - 소속 Project
- [[tsk-n8n-09]] - 선행 Task (Phase 1/2 AI Router 통합)

---

**Created**: 2026-01-01
**Assignee**: 김은향
**Due**: 2026-01-02
