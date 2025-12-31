---
entity_type: Task
entity_id: "tsk-018-03"
entity_name: "Content OS - Video Explorer UI"
created: 2025-12-31
updated: 2025-12-31
status: todo

# === 계층 ===
parent_id: "prj-018"
project_id: "prj-018"
aliases: ["tsk-018-03"]

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
tags: ["content-os", "ui", "dashboard", "video-explorer"]
priority_flag: high
---

# Content OS - Video Explorer UI

> Task ID: `tsk-018-03` | Project: `prj-018` | Status: todo

## 목표

**완료 조건**:
1. Video 테이블 UI 완성 (Viewtrap 유사)
2. 정렬/필터링 기능
3. 체크박스 선택 → 번들 생성 액션
4. 더미 데이터로 동작 확인

---

## 상세 내용

### 배경

유사 채널/성과 상위 영상을 탐색하는 테이블 뷰. 참고할 영상을 발견하고 번들 태스크로 변환.

### 작업 내용

1. **테이블 컬럼**
   | 컬럼 | 설명 |
   |------|------|
   | 체크박스 | 다중 선택 |
   | 썸네일 | 영상 미리보기 |
   | 제목 | 클릭 시 YouTube 링크 |
   | 채널 | 채널명 + 구독자 수 |
   | 게시일 | YYYY-MM-DD |
   | 조회수 | 숫자 + 포맷 |
   | MarketScore | 0-10 점수 |
   | Velocity | 시간당 조회수 |

2. **필터/정렬**
   - 정렬: MarketScore | Velocity | 조회수 | 게시일
   - 필터: 기간 | 채널 | 최소 조회수

3. **액션**
   - 선택된 영상들로 "번들 태스크 생성"
   - 개별 영상 "참고 저장"

4. **테이블 레이아웃**
   ```
   ┌────┬──────────┬─────────────────────┬──────────┬────────┬─────────┬───────┬──────────┐
   │ ☐  │ 썸네일   │ 제목                │ 채널      │ 게시일  │ 조회수   │ Score │ Velocity │
   ├────┼──────────┼─────────────────────┼──────────┼────────┼─────────┼───────┼──────────┤
   │ ☐  │ [img]    │ 야식 끊는 법 5가지  │ 건강채널  │ 12-28  │ 125K    │ 8.7   │ 2.1K/h   │
   │ ☑  │ [img]    │ 식욕 조절 루틴      │ 다이어트TV│ 12-25  │ 89K     │ 7.9   │ 1.5K/h   │
   └────┴──────────┴─────────────────────┴──────────┴────────┴─────────┴───────┴──────────┘

   [2개 선택됨] [번들 태스크 생성]
   ```

---

## 체크리스트

- [ ] DataTable 컴포넌트 (ShadCN)
- [ ] 컬럼 정의 및 정렬
- [ ] 필터 드롭다운
- [ ] 체크박스 다중 선택
- [ ] 번들 생성 액션 버튼
- [ ] 더미 데이터 20개+
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
