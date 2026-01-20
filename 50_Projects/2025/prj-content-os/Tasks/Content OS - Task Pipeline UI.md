---
entity_type: Task
entity_id: "tsk-content-os-04"
entity_name: "Content OS - Task Pipeline UI"
created: 2025-12-31
updated: 2026-01-02
status: done
closed: 2026-01-02

# === 계층 ===
parent_id: "prj-content-os"
project_id: "prj-content-os"
aliases: ["tsk-content-os-04"]

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
# === 분류 ===
tags: ["content-os", "ui", "dashboard", "kanban", "pipeline"]
priority_flag: high
---

# Content OS - Task Pipeline UI

> Task ID: `tsk-content-os-04` | Project: `prj-content-os` | Status: done

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

- [x] 칸반 보드 레이아웃
- [x] 드래그 앤 드롭 (dnd-kit 또는 @hello-pangea/dnd)
- [x] 태스크 카드 컴포넌트
- [x] 상태별 컬럼 스타일
- [x] 더미 데이터 15개+ (컬럼별 분산)
- [x] 스크린샷 캡처 → Phase 1 Dashboard 작업 시 통합 진행

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

#### 2026-01-02 03:11
**개요**: Task Pipeline UI 작업 완료 처리. 모든 핵심 기능(칸반 보드, 드래그 앤 드롭, 태스크 카드, 상세 모달) 구현 완료. 스크린샷 캡처는 Phase 1 Dashboard 작업 시 통합 진행 예정.

**결과**: 핵심 기능 구현 완료. 빌드 정상 동작.

**다음 단계**:
- tsk-content-os-05 (Performance Dashboard)에서 통합 스크린샷 캡처

---

#### 2026-01-01 21:00
**개요**: Task Pipeline UI 칸반 보드 구현 완료. 5개 컬럼(Draft/Approved/In Progress/Published/Reviewed)으로 구성된 드래그 앤 드롭 칸반 보드와 상세 모달을 구현했다.

**변경사항**:
- 개발: 칸반 보드 컴포넌트 (pipeline-board.tsx, pipeline-column.tsx, pipeline-card.tsx)
- 개발: 태스크 상세 모달 (task-detail-modal.tsx)
- 개발: 타입 정의 확장 (lib/types/task.ts - PipelineTask, PipelineStatus)
- 개발: 더미 데이터 16개 (app/pipeline/data/dummy-tasks.ts)
- 수정: 메인 레이아웃에 Pipeline 메뉴 연동

**파일 변경**:
- `apps/content-os/app/pipeline/page.tsx` - Pipeline 페이지 진입점
- `apps/content-os/app/pipeline/components/pipeline-board.tsx` - DndContext 기반 칸반 보드
- `apps/content-os/app/pipeline/components/pipeline-column.tsx` - Droppable 컬럼 (5개 상태)
- `apps/content-os/app/pipeline/components/pipeline-card.tsx` - Sortable 태스크 카드 (Format 배지, Score, Due 등)
- `apps/content-os/app/pipeline/components/task-detail-modal.tsx` - 태스크 상세 정보 Dialog
- `apps/content-os/app/pipeline/data/dummy-tasks.ts` - 16개 더미 태스크 (컬럼별 분산)
- `apps/content-os/lib/types/task.ts` - PipelineTask 인터페이스, 상태 상수 정의

**결과**: 빌드 성공. 드래그 앤 드롭으로 상태 변경, 카드 클릭 시 상세 모달 동작 확인.

**다음 단계**:
- 스크린샷 캡처
- API 연동 (현재 로컬 상태만)


---

## 참고 문서

- [[prj-content-os]] - 소속 Project
- [[tsk-content-os-01]] - 선행 Task (초기 세팅)

---

**Created**: 2025-12-31
**Assignee**: 김은향
**Due**:
