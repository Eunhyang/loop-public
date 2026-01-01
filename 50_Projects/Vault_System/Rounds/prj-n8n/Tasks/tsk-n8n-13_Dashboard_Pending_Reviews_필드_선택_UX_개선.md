---
entity_type: Task
entity_id: tsk-n8n-13
entity_name: "Dashboard - Pending Reviews 필드 선택 UX 개선"
created: 2026-01-01
updated: 2026-01-01
status: doing

# === 계층 ===
parent_id: prj-n8n
project_id: prj-n8n
aliases:
- tsk-n8n-13

# === 관계 ===
outgoing_relations:
- tsk-n8n-10
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
conditions_3y:
- cond-e

# === 분류 ===
tags:
- dashboard
- pending-reviews
- ux
priority_flag: high
---

# Dashboard - Pending Reviews 필드 선택 UX 개선

> Task ID: `tsk-n8n-13` | Project: `prj-n8n` | Status: doing

## 목표

**완료 조건**:
1. Pending Detail에서 각 필드별 선택 가능한 옵션들이 표시됨
2. 옵션 클릭 시 Entity Preview에 해당 엔티티 상세 정보 표시
3. "Use this value" 확정 버튼으로 값 변경 가능
4. 테스트 완료 및 NAS 배포

---

## 상세 내용

### 배경

tsk-n8n-10에서 3단 레이아웃(List | Detail | Entity Preview) 구현 완료.
현재: AI 제안값만 표시됨 → 사용자가 다른 값으로 변경하기 어려움

### 목표 레이아웃

```
┌──────────────┬──────────────────────┬──────────────────────┐
│  Pending     │   Pending Detail     │   Entity Preview     │
│  List        │   (선택 옵션 표시)   │   (상세 + 확정 버튼) │
├──────────────┼──────────────────────┼──────────────────────┤
│              │                      │                      │
│ • Review 1   │  conditions_3y:      │                      │
│ • Review 2   │  ┌────────────────┐  │                      │
│              │  │ cond-a         │──┼─→ 클릭 시 오른쪽에  │
│              │  │ cond-b         │  │   해당 엔티티 표시  │
│              │  │ cond-c         │  │                      │
│              │  │ cond-d  ←클릭  │──┼─→┌─ cond-d ────────┐│
│              │  │ cond-e (현재)  │  │  │ Team            ││
│              │  └────────────────┘  │  │ 팀 역량 확보... ││
│              │                      │  └──────────────────┘│
│              │  assignee:           │                      │
│              │  ┌────────────────┐  │  [Use this value]    │
│              │  │ 김은향         │  │  ↑ 확정 버튼        │
│              │  │ 한명학  ←클릭  │──┼─→ 한명학 프로필    │
│              │  └────────────────┘  │                      │
│              │                      │                      │
└──────────────┴──────────────────────┴──────────────────────┘
```

**동작 흐름**:
1. Pending Detail (가운데): 각 필드별로 선택 가능한 옵션들이 나열됨
2. 옵션 중 하나 클릭 → Entity Preview (오른쪽): 해당 엔티티 상세 정보 표시
3. Entity Preview 하단: "Use this value" 확정 버튼
4. 확정 버튼 클릭 → 해당 값으로 제안값 변경
5. 최종 Approve 시 변경된 값으로 적용

### 적용 필드

| 필드 | 선택 옵션 |
|------|-----------|
| `conditions_3y` | cond-a ~ cond-e (엔티티 상세 표시) |
| `assignee` / `owner` | 김은향, 한명학 (프로필 표시) |
| `parent_id` | trk-1 ~ trk-6 (Track 상세 표시) |
| `priority` | critical, high, medium, low (설명 표시) |

---

## 체크리스트

- [ ] Pending Detail에서 필드별 선택 옵션 UI 구현
- [ ] 옵션 클릭 → Entity Preview 연동
- [ ] "Use this value" 버튼 및 값 변경 로직
- [ ] 로컬 테스트
- [ ] NAS 동기화 및 Docker 재배포

---

## Notes

### PRD (Product Requirements Document)

#### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| Task ID | tsk-n8n-13 |
| Task Name | Dashboard - Pending Reviews 필드 선택 UX 개선 |
| Project | LOOP Vault Dashboard |
| 목표 | Pending Review에서 사용자가 AI 제안값을 다른 값으로 쉽게 변경할 수 있도록 UX 개선 |

#### 1.2 문제 정의

**현재 상태:**
- AI 제안값만 표시되고, 변경하려면 input/textarea 직접 수정 필요
- `conditions_3y`, `parent_id`, `assignee`, `priority` 같은 제한된 옵션 필드에서 불편

**사용자 Pain Point:**
1. 어떤 옵션이 선택 가능한지 모름
2. 옵션의 의미를 확인할 수 없음 (예: cond-a가 무엇인지)
3. 수동 입력 시 오타 위험

#### 1.3 기능 상세

**Field Option Pills (Center Pane):**
- `conditions_3y`, `parent_id`, `assignee`, `priority` 필드에 선택 가능한 옵션 pill 표시
- AI 제안값은 `.suggested` 클래스로 하이라이트 (노란색 + ★)
- 사용자 선택값은 `.selected` 클래스로 하이라이트 (파란색)
- 다중 선택 필드(`conditions_3y`)는 체크박스 형태

**Entity Preview 연동:**
- 옵션 클릭 시 해당 엔티티 상세 정보를 오른쪽 패널에 표시
- Condition, Track은 API 조회하여 상세 표시
- assignee, priority는 단순 값이므로 바로 적용

**"Use this value" 버튼:**
- Entity Preview 하단에 확정 버튼 표시
- 클릭 시 해당 값으로 제안값 변경
- Center Pane의 input/textarea도 동기화

#### 1.4 대상 필드

| 필드 | 옵션 소스 | Entity Preview |
|------|----------|----------------|
| `conditions_3y` | cond-a ~ cond-e | Condition 상세 |
| `parent_id` | trk-1 ~ trk-6 | Track 상세 |
| `assignee` / `owner` | 김은향, 한명학 | N/A |
| `priority` | critical, high, medium, low | N/A |

#### 1.5 성공 기준

- [ ] 모든 대상 필드에 옵션 pill 표시
- [ ] 옵션 클릭 시 Entity Preview 로드
- [ ] AI 제안값 vs 사용자 선택값 시각적 구분
- [ ] "Use this value" 버튼으로 값 변경 가능
- [ ] Approve 시 변경된 값이 API로 전달

---

### Tech Spec

#### 2.1 수정 대상 파일

| 파일 | 수정 범위 |
|------|-----------|
| `_dashboard/js/components/pending-panel.js` | 주요 수정: 옵션 렌더링, 클릭 핸들러, 상태 관리 |
| `_dashboard/css/panel.css` | CSS 추가: 옵션 pill, Entity Preview footer |

#### 2.2 내부 상태 확장

```javascript
const PendingPanel = {
    // 기존 상태
    currentReview: null,
    selectedReviewId: null,
    currentEntityId: null,

    // 신규 상태
    previewingForField: null,     // 현재 미리보기 중인 필드명
    previewingValue: null,        // 미리보기 중인 값
    pendingFieldValues: {},       // 사용자가 수정한 필드값

    // 필드별 옵션 정의
    FIELD_OPTIONS: {
        conditions_3y: { type: 'multi', hasPreview: true, entityType: 'condition' },
        parent_id: { type: 'single', hasPreview: true, entityType: 'track' },
        assignee: { type: 'single', hasPreview: false },
        owner: { type: 'single', hasPreview: false },
        priority: { type: 'single', hasPreview: false }
    }
};
```

#### 2.3 주요 함수

| 함수 | 역할 |
|------|------|
| `renderFieldOptions(field, currentValue, suggestedValue)` | 필드별 옵션 pill 렌더링 |
| `setupOptionClickHandlers(container)` | 옵션 pill 클릭 이벤트 핸들러 |
| `toggleFieldValue(field, value)` | 다중 선택 필드 값 토글 |
| `setFieldValue(field, value)` | 단일 선택 필드 값 설정 |
| `updateOptionPills(field)` | 옵션 pill UI 업데이트 |
| `applyPreviewedValue()` | 미리보기 값을 필드에 적용 |

#### 2.4 CSS 클래스

```css
.field-options          /* 옵션 컨테이너 */
.option-pill            /* 기본 옵션 버튼 */
.option-pill.suggested  /* AI 제안값 (노란색) */
.option-pill.selected   /* 사용자 선택값 (파란색) */
.entity-preview-footer  /* Entity Preview 하단 영역 */
.btn-use-value          /* 확정 버튼 */
```

---

### Todo

1. [ ] PendingPanel에 FIELD_OPTIONS 상수 및 상태 변수 추가
2. [ ] renderFieldOptions() 메서드 구현
3. [ ] renderDetail() 수정 - 필드 아래에 옵션 렌더링 추가
4. [ ] setupOptionClickHandlers() 메서드 구현
5. [ ] toggleFieldValue() / setFieldValue() 구현
6. [ ] renderEntityPreview() 수정 - footer + "Use this value" 버튼
7. [ ] applyPreviewedValue() 메서드 구현
8. [ ] approveReview() 수정 - pendingFieldValues 병합
9. [ ] panel.css에 스타일 추가
10. [ ] 로컬 테스트 (모든 대상 필드)
11. [ ] NAS 동기화 및 Docker 재배포

### 작업 로그

---

## 참고 문서

- [[prj-n8n]] - 소속 Project
- [[tsk-n8n-10]] - 선행 Task (3단 레이아웃)

---

**Created**: 2026-01-01
**Assignee**: 김은향
**Due**: 2026-01-02
