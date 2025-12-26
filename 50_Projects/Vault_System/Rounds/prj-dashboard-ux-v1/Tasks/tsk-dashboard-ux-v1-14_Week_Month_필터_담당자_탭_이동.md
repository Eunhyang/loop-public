---
entity_type: Task
entity_id: "tsk-dashboard-ux-v1-14"
entity_name: "Week/Month 필터 담당자 탭 이동"
created: 2025-12-27
updated: 2025-12-27
status: doing

# === 계층 ===
parent_id: "prj-dashboard-ux-v1"
project_id: "prj-dashboard-ux-v1"
aliases: ["tsk-dashboard-ux-v1-14"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2025-12-27
due: 2025-12-27
priority: medium
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-e"]

# === 분류 ===
tags: ["dashboard", "ux", "filter"]
priority_flag: medium
---

# Week/Month 필터 담당자 탭 이동

> Task ID: `tsk-dashboard-ux-v1-14` | Project: `prj-dashboard-ux-v1` | Status: doing

## 목표

**완료 조건**:
1. Filter Panel에 있던 Week/Month 필터가 담당자 탭 옆으로 이동됨
2. [W][M] 토글 버튼으로 둘 중 하나 선택 시 오른쪽에 하위 필터 표시
3. Filter Panel에서 해당 섹션 제거

---

## 상세 내용

### 배경

현재 Week/Month 필터가 Filter Panel (우측 사이드 패널) 안에 있어서 접근성이 떨어짐.
담당자 탭 옆에 배치하여 빠른 날짜 필터링 가능하도록 개선.

### 작업 내용

**UI 구조:**
```
[전체|김은향|한명학]        [W][M]  [W-2][W-1][W0][W+1][W+2]
                            ↑       ↑
                        토글 버튼  오른쪽에 하위 필터 표시
```

**동작:**
1. `[W]` `[M]` 버튼이 담당자 탭 옆에 위치
2. **둘 중 하나만** 선택 가능 (라디오 버튼처럼)
3. 선택하면 **오른쪽에** 해당 하위 필터 버튼들이 나타남
4. 다시 클릭하면 해제 (하위 필터 숨김)
5. Filter Panel에서 해당 섹션 제거

---

## 체크리스트

- [ ] index.html: 담당자 탭 영역에 [W][M] 버튼 및 하위 필터 컨테이너 추가
- [ ] filter-panel.js: Quick Date Filter 관련 로직 분리/이동
- [ ] 새 컴포넌트 또는 Tabs 확장: [W][M] 토글 및 하위 필터 렌더링
- [ ] CSS: 담당자 탭 옆 스타일링
- [ ] Filter Panel에서 Quick Date Filter 섹션 제거
- [ ] 기존 필터 기능 (week/month 선택) 유지 확인

---

## Notes

### Todo
- [ ]
- [ ]
- [ ]

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
- `_dashboard/index.html` - 메인 HTML
- `_dashboard/js/components/filter-panel.js` - 현재 Week/Month 필터 위치
- `_dashboard/js/state.js` - 필터 상태 관리

---

**Created**: 2025-12-27
**Assignee**: 김은향
**Due**: 2025-12-27
