---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-30"
entity_name: "대시보드 - 코어멤버만 기본 표시"
created: 2026-01-06
updated: 2026-01-06
status: doing

# === 계층 ===
parent_id: null
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-30"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-06
due: 2026-01-06
priority: medium
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 분류 ===
tags: []
priority_flag: medium
---

# 대시보드 - 코어멤버만 기본 표시

> Task ID: `tsk-dashboard-ux-v1-30` | Project: `prj-dashboard-ux-v1` | Status: doing

## 목표

**완료 조건**:
1. State.filters에 showNonCoreMembers: false 추가
2. FilterPanel에 "Show non-core members" 토글 추가 (Shift+F로 열림)
3. State.getActiveMembers() 수정하여 role 필터링 추가
4. 초기 로드 시 코어멤버(Founder, Cofounder)만 표시

---

## 상세 내용

### 배경

현재 대시보드 상단 멤버 탭에 모든 멤버가 표시되고 있어, 화면이 복잡하고 핵심 멤버(Founder, Cofounder)에 집중하기 어려움.

### 작업 내용

**영향 받는 파일:**
- `public/_dashboard/js/state.js` - State.filters에 showNonCoreMembers 플래그 추가, getActiveMembers() 로직 수정
- `public/_dashboard/js/components/filter-panel.js` - "Show non-core members" 토글 UI 추가
- `public/_dashboard/js/components/tabs.js` - 확인용 (멤버 탭 렌더링 로직)

**구현 사항:**
1. State.filters에 `showNonCoreMembers: false` 기본값 추가
2. State.getActiveMembers()에서 showNonCoreMembers false일 때 role="Founder" 또는 "Cofounder"만 필터링
3. FilterPanel에 토글 버튼 추가 (Shift+F 단축키로 열기)
4. 토글 변경 시 멤버 탭 자동 갱신

---

## 체크리스트

- [ ] State.filters에 showNonCoreMembers 필드 추가
- [ ] State.getActiveMembers() role 필터링 로직 추가
- [ ] FilterPanel에 토글 UI 추가
- [ ] 초기 로드 테스트 (코어멤버만 표시 확인)
- [ ] 토글 on/off 동작 테스트

---

## Notes

### Todo
- [ ] state.js 수정
- [ ] filter-panel.js 수정
- [ ] tabs.js 동작 확인
- [ ] 브라우저 테스트

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)

#### YYYY-MM-DD HH:MM
**개요**: 2-3문장 요약

**변경사항**:
- 개발:
- 수정:
- 개선:

**핵심 코드**: (필요시)

**결과**: ✅ 빌드 성공 / ❌ 실패

**다음 단계**:
-->


---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
