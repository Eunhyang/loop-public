---
entity_type: View
entity_id: "view:dashboard"
entity_name: "LOOP Strategy Dashboard"
created: 2025-12-18
updated: 2025-12-18
status: active

# === 메타 ===
view_type: dashboard
auto_generated: false
tags: ["view", "dashboard", "readonly", "navigation"]
---

# LOOP Strategy Dashboard

> 읽기 전용 대시보드 | 클릭하면 해당 파일로 이동 | 마지막 업데이트: `$= dv.current().updated`

---

## 1. 전략 계층 트리

```dataviewjs
// === 전략 계층 트리 ===
const container = dv.container;

// 스타일 정의
const styles = `
<style>
.tree-node { margin-left: 20px; padding: 8px 0; }
.tree-root { margin-left: 0; }
.node-card {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 8px;
  margin: 4px 0;
  text-decoration: none;
  color: inherit;
}
.node-northstar { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
.node-mh { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; }
.node-condition { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; }
.node-track { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: #333; }
.node-project { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: #333; }
.node-task { background: #f5f5f5; border: 1px solid #ddd; color: #333; }
.status-badge {
  font-size: 0.75em;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
}
.status-active, .status-validating, .status-in_progress, .status-doing { background: #4CAF50; color: white; }
.status-fixed { background: #9C27B0; color: white; }
.status-pending, .status-todo { background: #FF9800; color: white; }
.status-done { background: #2196F3; color: white; }
.status-blocked { background: #f44336; color: white; }
.tree-connector { color: #888; font-size: 1.2em; }
.risk-high { border-left: 4px solid #f44336; }
.risk-medium { border-left: 4px solid #FF9800; }
.risk-low { border-left: 4px solid #4CAF50; }
</style>
`;

dv.paragraph(styles);

// 데이터 수집
const northStar = dv.pages('"01_North_Star"').where(p => p.entity_type === "NorthStar").first();
const metaHypotheses = dv.pages('"01_North_Star"').where(p => p.entity_type === "MetaHypothesis").array();
const conditions = dv.pages('"20_Strategy/3Y_Conditions"').where(p => p.entity_type === "Condition").array();
const tracks = dv.pages('"20_Strategy/12M_Tracks"').where(p => p.entity_type === "Track").array();
const projects = dv.pages('"50_Projects"').where(p => p.entity_type === "Project").array();
const tasks = dv.pages('"50_Projects"').where(p => p.entity_type === "Task").array();

// 상태 배지 생성
function statusBadge(status) {
  if (!status) return '';
  return `<span class="status-badge status-${status}">${status}</span>`;
}

// 노드 카드 생성
function nodeCard(page, type) {
  const name = page.entity_name || page.file.name;
  const id = page.entity_id || '';
  const status = page.status;
  const risk = page.risk_level;

  let riskClass = '';
  if (risk === 'high') riskClass = 'risk-high';
  else if (risk === 'medium') riskClass = 'risk-medium';
  else if (risk === 'low') riskClass = 'risk-low';

  return `<a href="${page.file.path}" class="node-card node-${type} ${riskClass}">
    <strong>${name}</strong>
    <br><code style="font-size:0.8em">${id}</code>
    ${statusBadge(status)}
  </a>`;
}

// 트리 렌더링
let html = '<div class="tree-root">';

// North Star
if (northStar) {
  html += `<div class="tree-node">${nodeCard(northStar, 'northstar')}</div>`;

  // Meta Hypotheses
  if (metaHypotheses.length > 0) {
    html += '<div class="tree-node"><span class="tree-connector">└─</span> Meta Hypotheses';
    for (const mh of metaHypotheses.sort((a,b) => (a.entity_id || '').localeCompare(b.entity_id || ''))) {
      html += `<div class="tree-node">${nodeCard(mh, 'mh')}</div>`;

      // Conditions under this MH
      const relatedConds = conditions.filter(c => c.parent_id === mh.entity_id);
      for (const cond of relatedConds) {
        html += `<div class="tree-node"><span class="tree-connector">└─</span> ${nodeCard(cond, 'condition')}</div>`;

        // Tracks under this Condition
        const relatedTracks = tracks.filter(t => t.parent_id === cond.entity_id);
        for (const track of relatedTracks) {
          html += `<div class="tree-node"><span class="tree-connector">└─</span> ${nodeCard(track, 'track')}</div>`;
        }
      }
    }
    html += '</div>';
  }
}

// All Tracks (if not nested under conditions)
html += '<div class="tree-node"><span class="tree-connector">├─</span> <strong>All Tracks</strong>';
for (const track of tracks.sort((a,b) => (a.entity_id || '').localeCompare(b.entity_id || ''))) {
  html += `<div class="tree-node">${nodeCard(track, 'track')}</div>`;
}
html += '</div>';

html += '</div>';

dv.paragraph(html);
```

---

## 2. 프로젝트별 현황

```dataviewjs
const projects = dv.pages('"50_Projects"').where(p => p.entity_type === "Project").array();
const tasks = dv.pages('"50_Projects"').where(p => p.entity_type === "Task").array();

const styles = `
<style>
.project-section {
  margin: 16px 0;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 12px;
  border-left: 4px solid #667eea;
}
.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.project-title {
  font-size: 1.2em;
  font-weight: bold;
  color: #333;
}
.project-meta {
  font-size: 0.85em;
  color: #666;
}
.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-top: 12px;
}
.task-card {
  background: white;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: box-shadow 0.2s;
}
.task-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.task-name { font-weight: bold; margin-bottom: 8px; }
.task-meta { font-size: 0.85em; color: #666; }
.task-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  margin-right: 8px;
}
.task-status-todo { background: #FFF3E0; color: #E65100; }
.task-status-doing { background: #E3F2FD; color: #1565C0; }
.task-status-done { background: #E8F5E9; color: #2E7D32; }
.task-status-blocked { background: #FFEBEE; color: #C62828; }
.priority-high { color: #D32F2F; font-weight: bold; }
.priority-medium { color: #F57C00; }
.priority-low { color: #388E3C; }
.progress-bar {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  margin-top: 8px;
}
.progress-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
}
</style>
`;

dv.paragraph(styles);

for (const project of projects) {
  const projectTasks = tasks.filter(t => t.project_id === project.entity_id);
  const doneCount = projectTasks.filter(t => t.status === 'done').length;
  const totalCount = projectTasks.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  let html = `
  <div class="project-section">
    <div class="project-header">
      <div>
        <span class="project-title">
          <a href="${project.file.path}">${project.entity_name || project.file.name}</a>
        </span>
        <span class="project-meta"> | <code>${project.entity_id}</code> | Track: ${project.track_id || 'N/A'}</span>
      </div>
      <div class="project-meta">
        Tasks: ${doneCount}/${totalCount} (${progress}%)
      </div>
    </div>
    <div class="progress-bar"><div class="progress-fill" style="width: ${progress}%"></div></div>
    <div class="task-grid">
  `;

  for (const task of projectTasks.sort((a,b) => {
    const statusOrder = {doing: 0, todo: 1, blocked: 2, done: 3};
    return (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);
  })) {
    const priorityClass = task.priority === 'high' ? 'priority-high' :
                          task.priority === 'medium' ? 'priority-medium' : 'priority-low';
    const statusClass = `task-status-${task.status}`;

    html += `
      <div class="task-card">
        <div class="task-name">
          <a href="${task.file.path}">${task.entity_name || task.file.name}</a>
        </div>
        <div class="task-meta">
          <span class="task-status ${statusClass}">${task.status || 'unknown'}</span>
          <span class="${priorityClass}">${task.priority || 'medium'}</span>
        </div>
        <div class="task-meta">
          담당: <strong>${task.assignee || 'unassigned'}</strong>
          ${task.due ? ` | 마감: ${task.due}` : ''}
        </div>
      </div>
    `;
  }

  html += '</div></div>';
  dv.paragraph(html);
}

if (projects.length === 0) {
  dv.paragraph('*프로젝트가 없습니다.*');
}
```

---

## 3. 가설 검증 관계

```dataviewjs
// 어떤 Project/Task가 어떤 MH를 검증하는지 시각화

const styles = `
<style>
.validation-table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}
.validation-table th, .validation-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}
.validation-table th {
  background: #f5f5f5;
  font-weight: bold;
}
.validation-table tr:hover {
  background: #fafafa;
}
.validation-target {
  display: inline-block;
  padding: 4px 8px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border-radius: 4px;
  font-size: 0.85em;
  margin: 2px;
}
.validation-source {
  display: inline-block;
  padding: 4px 8px;
  background: #e3f2fd;
  color: #1565c0;
  border-radius: 4px;
  font-size: 0.85em;
  margin: 2px;
}
</style>
`;

dv.paragraph(styles);

// 모든 엔티티 수집
const allPages = dv.pages().where(p => p.entity_type && p.entity_id).array();

// validates 관계 추출
let validationRows = [];

for (const page of allPages) {
  if (page.validates && Array.isArray(page.validates) && page.validates.length > 0) {
    for (const target of page.validates) {
      const targetPage = allPages.find(p => p.entity_id === target);
      validationRows.push({
        source: page,
        targetId: target,
        targetPage: targetPage
      });
    }
  }

  // outgoing_relations에서 validates 타입 추출
  if (page.outgoing_relations && Array.isArray(page.outgoing_relations)) {
    for (const rel of page.outgoing_relations) {
      if (rel.type === 'validates') {
        const targetPage = allPages.find(p => p.entity_id === rel.target_id);
        validationRows.push({
          source: page,
          targetId: rel.target_id,
          targetPage: targetPage,
          description: rel.description
        });
      }
    }
  }
}

// 중복 제거
const uniqueRows = [];
const seen = new Set();
for (const row of validationRows) {
  const key = `${row.source.entity_id}->${row.targetId}`;
  if (!seen.has(key)) {
    seen.add(key);
    uniqueRows.push(row);
  }
}

if (uniqueRows.length > 0) {
  let html = `
  <table class="validation-table">
    <thead>
      <tr>
        <th>검증 주체</th>
        <th>검증 대상</th>
        <th>설명</th>
      </tr>
    </thead>
    <tbody>
  `;

  for (const row of uniqueRows) {
    const sourceName = row.source.entity_name || row.source.file.name;
    const targetName = row.targetPage ? (row.targetPage.entity_name || row.targetPage.file.name) : row.targetId;

    html += `
      <tr>
        <td>
          <a href="${row.source.file.path}" class="validation-source">
            ${sourceName}
          </a>
          <br><code style="font-size:0.8em">${row.source.entity_id}</code>
        </td>
        <td>
          ${row.targetPage
            ? `<a href="${row.targetPage.file.path}" class="validation-target">${targetName}</a>`
            : `<span class="validation-target">${row.targetId}</span>`}
        </td>
        <td>${row.description || '-'}</td>
      </tr>
    `;
  }

  html += '</tbody></table>';
  dv.paragraph(html);
} else {
  dv.paragraph('*검증 관계가 없습니다.*');
}
```

---

## 4. 빠른 네비게이션

```dataviewjs
const styles = `
<style>
.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin: 16px 0;
}
.nav-card {
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}
.nav-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}
.nav-card-northstar { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
.nav-card-mh { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; }
.nav-card-condition { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; }
.nav-card-track { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: #333; }
.nav-card-ontology { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: #333; }
.nav-card-project { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333; }
.nav-icon { font-size: 2em; margin-bottom: 8px; }
.nav-title { font-weight: bold; font-size: 1.1em; }
.nav-count { font-size: 0.85em; opacity: 0.8; margin-top: 4px; }
</style>
`;

dv.paragraph(styles);

// 카운트 계산
const northStarCount = dv.pages('"01_North_Star"').where(p => p.entity_type === "NorthStar").length;
const mhCount = dv.pages('"01_North_Star"').where(p => p.entity_type === "MetaHypothesis").length;
const condCount = dv.pages('"20_Strategy/3Y_Conditions"').where(p => p.entity_type === "Condition").length;
const trackCount = dv.pages('"20_Strategy/12M_Tracks"').where(p => p.entity_type === "Track").length;
const projectCount = dv.pages('"50_Projects"').where(p => p.entity_type === "Project").length;
const taskCount = dv.pages('"50_Projects"').where(p => p.entity_type === "Task").length;

const html = `
<div class="nav-grid">
  <a href="01_North_Star/10년 비전.md" class="nav-card nav-card-northstar">
    <div class="nav-icon">🎯</div>
    <div class="nav-title">North Star</div>
    <div class="nav-count">${northStarCount}개 문서</div>
  </a>
  <a href="01_North_Star/MH3_데이터_모델링_가능.md" class="nav-card nav-card-mh">
    <div class="nav-icon">🔬</div>
    <div class="nav-title">Meta Hypotheses</div>
    <div class="nav-count">${mhCount}개 문서 (4개 예정)</div>
  </a>
  <a href="20_Strategy/3Y_Conditions/Condition_B_Loop_Dataset.md" class="nav-card nav-card-condition">
    <div class="nav-icon">📋</div>
    <div class="nav-title">Conditions</div>
    <div class="nav-count">${condCount}개 문서 (5개 예정)</div>
  </a>
  <a href="20_Strategy/12M_Tracks/" class="nav-card nav-card-track">
    <div class="nav-icon">🛤️</div>
    <div class="nav-title">Tracks</div>
    <div class="nav-count">${trackCount}개 문서</div>
  </a>
  <a href="30_Ontology/_MOC 온톨로지 개발.md" class="nav-card nav-card-ontology">
    <div class="nav-icon">🧬</div>
    <div class="nav-title">Ontology</div>
    <div class="nav-count">스키마 v0.1</div>
  </a>
  <a href="50_Projects/_INDEX.md" class="nav-card nav-card-project">
    <div class="nav-icon">📁</div>
    <div class="nav-title">Projects & Tasks</div>
    <div class="nav-count">${projectCount}개 프로젝트, ${taskCount}개 태스크</div>
  </a>
</div>
`;

dv.paragraph(html);
```

---

## 5. Track 전체 현황

```dataviewjs
const tracks = dv.pages('"20_Strategy/12M_Tracks"').where(p => p.entity_type === "Track").array();

const styles = `
<style>
.track-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin: 16px 0;
}
.track-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e0e0e0;
  transition: box-shadow 0.2s;
}
.track-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}
.track-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.track-name {
  font-size: 1.1em;
  font-weight: bold;
}
.track-id {
  font-size: 0.85em;
  color: #666;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
}
.track-hypothesis {
  font-style: italic;
  color: #666;
  margin-bottom: 12px;
  padding: 8px;
  background: #fafafa;
  border-radius: 6px;
  font-size: 0.9em;
}
.track-progress {
  margin-top: 12px;
}
.track-progress-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}
.track-progress-fill {
  height: 100%;
  border-radius: 4px;
}
.progress-green { background: #4CAF50; }
.progress-yellow { background: #FF9800; }
.progress-red { background: #f44336; }
.track-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85em;
}
.status-active { background: #E8F5E9; color: #2E7D32; }
.status-planning { background: #FFF3E0; color: #E65100; }
.status-paused { background: #FFEBEE; color: #C62828; }
</style>
`;

dv.paragraph(styles);

let html = '<div class="track-grid">';

for (const track of tracks.sort((a,b) => (a.entity_id || '').localeCompare(b.entity_id || ''))) {
  const progress = Math.round((track.progress || 0) * 100);
  let progressClass = 'progress-green';
  if (progress < 30) progressClass = 'progress-red';
  else if (progress < 70) progressClass = 'progress-yellow';

  const statusClass = track.status === 'active' ? 'status-active' :
                      track.status === 'planning' ? 'status-planning' : 'status-paused';

  html += `
    <div class="track-card">
      <div class="track-header">
        <a href="${track.file.path}" class="track-name">${track.entity_name || track.file.name}</a>
        <span class="track-id">${track.entity_id}</span>
      </div>
      <div class="track-hypothesis">"${track.hypothesis || 'N/A'}"</div>
      <span class="track-status ${statusClass}">${track.status || 'unknown'}</span>
      <span style="margin-left: 8px; color: #666;">Risk: ${track.risk_level || 'N/A'}</span>
      <div class="track-progress">
        <div style="display: flex; justify-content: space-between; font-size: 0.85em; margin-bottom: 4px;">
          <span>진행률</span>
          <span>${progress}%</span>
        </div>
        <div class="track-progress-bar">
          <div class="track-progress-fill ${progressClass}" style="width: ${progress}%"></div>
        </div>
      </div>
    </div>
  `;
}

html += '</div>';
dv.paragraph(html);
```

---

## 6. 최근 업데이트

```dataview
TABLE
  entity_type as "Type",
  entity_id as "ID",
  status as "Status",
  updated as "Updated"
FROM ""
WHERE entity_type != null AND entity_id != null
SORT updated DESC
LIMIT 10
```

---

## 사용법

| 기능 | 설명 |
|------|------|
| **클릭** | 해당 문서로 바로 이동 |
| **계층 트리** | 전략 구조 한눈에 파악 |
| **프로젝트 현황** | Task 진행률 확인 |
| **가설 검증** | 어떤 Project가 어떤 MH를 검증하는지 |
| **빠른 네비게이션** | 주요 섹션 바로가기 |

---

**View Created**: 2025-12-18
**Required Plugin**: Dataview (Enable JavaScript Queries)
