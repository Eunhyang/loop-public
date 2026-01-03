---
entity_type: Task
entity_id: tsk-dashboard-ux-v1-01
entity_name: 뷰 전환 단축키 (1/2/3)
created: 2025-12-26
updated: '2026-01-03'
status: done
parent_id: prj-dashboard-ux-v1
project_id: prj-dashboard-ux-v1
aliases:
- tsk-dashboard-ux-v1-01
- 뷰 전환 단축키
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
due: null
priority: high
estimated_hours: 1
actual_hours: null
type: dev
target_project: loop-api
tags:
- dashboard
- ux
- keyboard
- shortcut
priority_flag: high
notes: "# 뷰 전환 단축키 (1/2/3)\n\n> Task ID: `tsk-dashboard-ux-v1-01` | Project: [[prj-dashboard-ux-v1]]\
  \ | Status: planning\n\n## 목표\n\n**완료 조건**:\n1. 숫자키 1 → Kanban 뷰 전환\n2. 숫자키 2 →\
  \ Calendar 뷰 전환\n3. 숫자키 3 → Graph 뷰 전환\n4. input/textarea에서는 단축키 비활성화\n\n---\n\n\
  ## 상세 내용\n\n### 배경\n\n대시보드에서 뷰 전환 시 마우스 클릭 필요. 키보드 단축키로 빠른 전환 지원.\n\n### 작업 내용\n\
  \n`_dashboard/js/app.js`에 전역 keydown 이벤트 추가:\n\n```javascript\ndocument.addEventListener('keydown',\
  \ (e) => {\n    // input/textarea에서는 무시\n    if (e.target.tagName === 'INPUT' ||\
  \ e.target.tagName === 'TEXTAREA') return;\n    // 모달 열려있으면 무시\n    if (document.querySelector('.modal.active'))\
  \ return;\n\n    if (e.key === '1') switchView('kanban');\n    if (e.key === '2')\
  \ switchView('calendar');\n    if (e.key === '3') switchView('graph');\n});\n```\n\
  \n---\n\n## 체크리스트\n\n- [ ] app.js에 keydown 이벤트 리스너 추가\n- [ ] input/textarea 예외 처리\n\
  - [ ] 모달 열림 상태 예외 처리\n- [ ] 로컬 테스트\n- [ ] NAS 배포 확인\n\n---\n\n## 참고 문서\n\n- [[prj-dashboard-ux-v1]]\
  \ - 소속 Project\n- 기존 단축키 참고: `_dashboard/js/components/quick-search.js`\n\n---\n\
  \n**Created**: 2025-12-26\n**Assignee**: 한명학\n"
---
# 뷰 전환 단축키 (1/2/3)

> Task ID: `tsk-dashboard-ux-v1-01` | Project: [[prj-dashboard-ux-v1]] | Status: planning

## 목표

**완료 조건**:
1. 숫자키 1 → Kanban 뷰 전환
2. 숫자키 2 → Calendar 뷰 전환
3. 숫자키 3 → Graph 뷰 전환
4. input/textarea에서는 단축키 비활성화

---

## 상세 내용

### 배경

대시보드에서 뷰 전환 시 마우스 클릭 필요. 키보드 단축키로 빠른 전환 지원.

### 작업 내용

`_dashboard/js/app.js`에 전역 keydown 이벤트 추가:

```javascript
document.addEventListener('keydown', (e) => {
    // input/textarea에서는 무시
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    // 모달 열려있으면 무시
    if (document.querySelector('.modal.active')) return;

    if (e.key === '1') switchView('kanban');
    if (e.key === '2') switchView('calendar');
    if (e.key === '3') switchView('graph');
});
```

---

## 체크리스트

- [ ] app.js에 keydown 이벤트 리스너 추가
- [ ] input/textarea 예외 처리
- [ ] 모달 열림 상태 예외 처리
- [ ] 로컬 테스트
- [ ] NAS 배포 확인

---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- 기존 단축키 참고: `_dashboard/js/components/quick-search.js`

---

**Created**: 2025-12-26
**Assignee**: 한명학
