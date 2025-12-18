---
entity_type: View
entity_id: "view:kanban-prj001"
entity_name: "P001 Ontology Kanban"
created: 2025-12-18
updated: 2025-12-18
status: active

# === 메타 ===
view_type: kanban
project_id: "prj:001"
auto_generated: false
tags: ["view", "kanban", "readonly"]
---

# P001 Ontology v0.1 - Kanban Board

> 이 뷰는 **읽기 전용**입니다. Task 상태를 변경하려면 해당 Task 파일의 frontmatter를 직접 수정하세요.

---

## 사용법

1. 자신에게 할당된 Task 파일을 엽니다 (예: `tsk-prj001-001.md`)
2. frontmatter의 `status` 필드를 변경합니다:
   - `todo` → 시작 전
   - `doing` → 진행 중
   - `done` → 완료
   - `blocked` → 차단됨
3. 파일 저장 후 Git commit & push
4. 이 Kanban 뷰가 자동으로 업데이트됩니다

---

## Kanban Board

```dataviewjs
const tasks = dv.pages('"50_Projects/2025/P001_Ontology/Tasks"')
  .where(t => t.entity_type === "Task");

// Status별 그룹핑
const statusGroups = {
  "📋 Todo": tasks.where(t => t.status === "todo").array(),
  "⚡ Doing": tasks.where(t => t.status === "doing").array(),
  "✅ Done": tasks.where(t => t.status === "done").array(),
  "🚫 Blocked": tasks.where(t => t.status === "blocked").array()
};

// 카드 렌더링 함수
function renderCard(task) {
  const priority = task.priority || "medium";
  const priorityEmoji = priority === "high" ? "🔴" : priority === "medium" ? "🟡" : "🟢";
  const assignee = task.assignee || "unassigned";
  const due = task.due ? `📅 ${task.due}` : "";

  return `
**${task.entity_name || task.file.name}** ${priorityEmoji}
- 담당: \`${assignee}\`
- ID: \`${task.entity_id}\`
${due ? `- ${due}` : ""}
[[${task.file.path}|상세보기 →]]

---`;
}

// 칸반 컬럼 렌더링
for (const [status, taskList] of Object.entries(statusGroups)) {
  dv.header(3, `${status} (${taskList.length})`);

  if (taskList.length === 0) {
    dv.paragraph("*없음*");
  } else {
    for (const task of taskList) {
      dv.paragraph(renderCard(task));
    }
  }
  dv.paragraph("---");
}
```

---

## 팀원별 현황

```dataviewjs
const tasks = dv.pages('"50_Projects/2025/P001_Ontology/Tasks"')
  .where(t => t.entity_type === "Task");

const byAssignee = tasks.groupBy(t => t.assignee || "unassigned");

dv.table(
  ["담당자", "Todo", "Doing", "Done", "Total"],
  byAssignee.map(g => [
    g.key,
    g.rows.filter(t => t.status === "todo").length,
    g.rows.filter(t => t.status === "doing").length,
    g.rows.filter(t => t.status === "done").length,
    g.rows.length
  ])
);
```

---

## 전체 Task 목록

```dataview
TABLE
  status as "Status",
  assignee as "담당자",
  priority as "우선순위",
  due as "마감일"
FROM "50_Projects/2025/P001_Ontology/Tasks"
WHERE entity_type = "Task"
SORT priority DESC, due ASC
```

---

## Git 충돌 방지 규칙

| 규칙 | 설명 |
|------|------|
| ✅ 자기 Task만 수정 | `assignee`가 본인인 파일만 수정 |
| ✅ 수정 전 Pull | 항상 최신 상태에서 시작 |
| ✅ 작은 단위 Commit | 한 Task씩 커밋 |
| ❌ 이 파일 수정 금지 | `_Kanban_View.md`는 읽기 전용 |

---

**View Created**: 2025-12-18
**Project**: [[prj:001]] Ontology v0.1
