---
entity_type: Task
entity_id: tsk-content-os-02
entity_name: Content OS - Opportunity 대시보드 UI
created: 2025-12-31
updated: '2026-01-05'
status: todo
parent_id: prj-content-os
project_id: prj-content-os
aliases:
- tsk-content-os-02
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
start_date: '2026-01-16'
due: '2026-01-16'
priority: high
estimated_hours: 6
actual_hours: null
type: dev
target_project: loop
tags:
- content-os
- ui
- dashboard
- opportunity
priority_flag: high
---
# Content OS - Opportunity 대시보드 UI

> Task ID: `tsk-content-os-02` | Project: `prj-content-os` | Status: todo

## 목표

**완료 조건**:
1. Opportunity 카드 레이아웃 완성
2. 필터 UI (목적 타입 / 타겟 루프 / 포맷 / 기간)
3. 더미 데이터로 동작 확인
4. 사용자 승인용 MVP 스크린샷

---

## 상세 내용

### 배경

시장 신호(키워드/영상)를 기반으로 콘텐츠 기회를 발견하는 대시보드. "왜 지금 이 콘텐츠를 해야 하는가?"를 한눈에 보여줌.

### 작업 내용

1. **필터 섹션**
   - 목적 타입: worldview | problem | reframe | protocol | case | product | authority
   - 타겟 루프: emotional | eating | habit | reward | autonomic
   - 포맷: shorts | longform | community
   - 기간: 7일 | 14일 | 30일

2. **Opportunity 카드**
   ```
   ┌─────────────────────────────────────┐
   │ [키워드] 야식 충동 멈추는 법          │
   │                                     │
   │ FinalScore: 8.7/10                  │
   │ Market: 9.2 | Fit: 8.5 | Sat: 0.15  │
   │                                     │
   │ "왜 지금?": 최근 7일 검색량 +42%     │
   │                                     │
   │ 추천 번들:                           │
   │ - Shorts x2                         │
   │ - Longform x1                       │
   │                                     │
   │ [Draft 생성] [제외] [즐겨찾기]        │
   └─────────────────────────────────────┘
   ```

3. **액션 버튼**
   - "Draft 태스크 생성": 클릭 시 Draft Task 생성 (MVP: 토스트만)
   - "제외": 목록에서 숨김
   - "즐겨찾기": 상단 고정

---

## 체크리스트

- [ ] 필터 컴포넌트 구현
- [ ] Opportunity 카드 컴포넌트
- [ ] 그리드 레이아웃 (반응형)
- [ ] 더미 데이터 10개+
- [ ] 액션 버튼 (토스트 피드백)
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

- [[prj-content-os]] - 소속 Project
- [[tsk-content-os-01]] - 선행 Task (초기 세팅)

---

**Created**: 2025-12-31
**Assignee**: 김은향
**Due**:
