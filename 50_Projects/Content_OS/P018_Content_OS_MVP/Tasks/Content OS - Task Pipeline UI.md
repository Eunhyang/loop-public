---
entity_type: Task
entity_id: "tsk-018-04"
entity_name: "Content OS - Task Pipeline UI"
created: 2025-12-31
updated: 2025-12-31
status: todo

# === 계층 ===
parent_id: "prj-018"
project_id: "prj-018"
aliases: ["tsk-018-04"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2025-12-31
due: null
priority: high
estimated_hours: 6
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-a"]

# === 분류 ===
tags: ["content-os", "ui", "dashboard", "kanban", "pipeline"]
priority_flag: high
---

# Content OS - Task Pipeline UI

> Task ID: `tsk-018-04` | Project: `prj-018` | Status: todo

## 목표

**완료 조건**:
1. 칸반 보드 UI 완성 (5개 컬럼)
2. 드래그 앤 드롭 상태 변경
3. 태스크 카드 상세 정보
4. 더미 데이터로 동작 확인

---

## 상세 내용

### 배경

콘텐츠 태스크의 라이프사이클을 관리하는 칸반 보드. Draft에서 시작해 Reviewed까지의 흐름을 시각화.

### 작업 내용

1. **칸반 컬럼 (5개)**
   ```
   Draft → Approved → In Progress → Published → Reviewed
   ```

2. **태스크 카드**
   ```
   ┌─────────────────────────────┐
   │ [Shorts] 야식 충동 멈추기    │
   │                             │
   │ 목적: problem               │
   │ 타겟: emotional-eating      │
   │                             │
   │ 담당: 김은향                 │
   │ Due: 2025-01-05             │
   │                             │
   │ Score: 8.7                  │
   │ 참고: 3개 영상              │
   └─────────────────────────────┘
   ```

3. **드래그 앤 드롭**
   - 컬럼 간 이동
   - 이동 시 상태 자동 변경 (MVP: 로컬 상태만)
   - 애니메이션 피드백

4. **카드 액션**
   - 클릭: 상세 모달
   - 더보기: 편집/삭제/Vault 연동

---

## 체크리스트

- [ ] 칸반 보드 레이아웃
- [ ] 드래그 앤 드롭 (dnd-kit 또는 @hello-pangea/dnd)
- [ ] 태스크 카드 컴포넌트
- [ ] 상태별 컬럼 스타일
- [ ] 더미 데이터 15개+ (컬럼별 분산)
- [ ] 스크린샷 캡처

---

## Notes

### PRD (Product Requirements Document)
<!-- prompt-enhancer로 자동 생성 예정 -->

### Tech Spec
<!-- prompt-enhancer로 자동 생성 예정 -->

### Todo
<!-- prompt-enhancer로 자동 생성 예정 -->

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)
-->


---

## 참고 문서

- [[prj-018]] - 소속 Project
- [[tsk-018-01]] - 선행 Task (초기 세팅)

---

**Created**: 2025-12-31
**Assignee**: 김은향
**Due**:
