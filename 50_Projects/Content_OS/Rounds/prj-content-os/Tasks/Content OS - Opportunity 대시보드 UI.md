---
entity_type: Task
entity_id: tsk-content-os-02
entity_name: Content OS - Opportunity 대시보드 UI
created: 2025-12-31
updated: '2026-01-14'
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
notes: "# Content OS - Opportunity 대시보드 UI\n\n> Task ID: `tsk-content-os-02` | Project:\
  \ `prj-content-os` | Status: todo\n\n## 목표\n\n**완료 조건**:\n\n1. Opportunity 카드 레이아웃\
  \ 완성\n2. 필터 UI (목적 타입 / 타겟 루프 / 포맷 / 기간)\n3. 더미 데이터로 동작 확인\n4. 사용자 승인용 MVP 스크린샷\n\
  \n---\n\n## 상세 내용\n\n### 배경\n\n시장 신호(키워드/영상)를 기반으로 콘텐츠 기회를 발견하는 대시보드. \"왜 지금 이 콘텐츠를\
  \ 해야 하는가?\"를 한눈에 보여줌.\n\n### 작업 내용\n\n1. **필터 섹션**\n\n   - 목적 타입: worldview | problem\
  \ | reframe | protocol | case | product | authority\n   - 타겟 루프: emotional | eating\
  \ | habit | reward | autonomic\n   - 포맷: shorts | longform | community\n   - 기간:\
  \ 7일 | 14일 | 30일\n\n2. **Opportunity 카드**\n\n   ```\n   ┌─────────────────────────────────────┐\n\
  \   │ [키워드] 야식 충동 멈추는 법          │\n   │                                     │\n\
  \   │ FinalScore: 8.7/10                  │\n   │ Market: 9.2 | Fit: 8.5 | Sat:\
  \ 0.15  │\n   │                                     │\n   │ \"왜 지금?\": 최근 7일 검색량\
  \ +42%     │\n   │                                     │\n   │ 추천 번들:          \
  \                 │\n   │ - Shorts x2                         │\n   │ - Longform\
  \ x1                       │\n   │                                     │\n   │ [Draft\
  \ 생성] [제외] [즐겨찾기]        │\n   └─────────────────────────────────────┘\n   ```\n\
  \n3. **액션 버튼**\n\n   - \"Draft 태스크 생성\": 클릭 시 Draft Task 생성 (MVP: 토스트만)\n   - \"\
  제외\": 목록에서 숨김\n   - \"즐겨찾기\": 상단 고정\n\n---\n\n## 체크리스트\n\n- [ ] 필터 컴포넌트 구현\n\n-\
  \ [ ] Opportunity 카드 컴포넌트\n\n- [ ] 그리드 레이아웃 (반응형)\n\n- [ ] 더미 데이터 10개+\n\n- [ ]\
  \ 액션 버튼 (토스트 피드백)\n\n- [ ] 스크린샷 캡처\n\n---\n\n## Notes\n\n### PRD (Product Requirements\
  \ Document)\n\n### Tech Spec\n\n### Todo\n\n### 작업 로그\n\n---\n\n## 참고 문서\n\n- \\\
  [\\[prj-content-os\\]\\] - 소속 Project\n- \\[\\[tsk-content-os-01\\]\\] - 선행 Task\
  \ (초기 세팅)\n\n---\n\n**Created**: 2025-12-31 **Assignee**: 김은향 **Due**:"
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
