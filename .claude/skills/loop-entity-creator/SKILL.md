---
name: loop-entity-creator
description: Create, edit, and delete LOOP vault entities (Task, Project) while maintaining GraphRAG pattern integrity. Use when user wants to (1) create a new Task or Project entity, (2) edit an existing entity's fields, (3) delete an entity and update graph index. CRITICAL - This skill enforces schema compliance, automatic ID generation, parent-child linking, and graph index updates to maintain vault integrity.
---

# LOOP Entity Creator

Manage LOOP vault entities with GraphRAG pattern enforcement.

## Overview

This skill ensures Task and Project entities follow strict schema requirements and maintain proper relationships. It prevents orphaned entities by enforcing validation and automatic graph index updates.

**Supported operations-**
- **Create** - Generate new Task or Project with auto-assigned ID
- **Edit** - Modify existing entity fields while preserving schema
- **Delete** - Remove entity and update all references

## Creating Entities

### Workflow Decision Tree

**What type of entity?**
- **Task** → Follow "Creating a Task" workflow below
- **Project** → Follow "Creating a Project" workflow below

### Creating a Task

**Step 1: Collect required information**

First, read `00_Meta/members.yaml` to get valid assignee options.

Use AskUserQuestion to collect:

Required fields:
- `entity_name` - Task name (e.g., "CoachOS 프로토타입 개발")
- `project_id` - Parent project ID (must exist, e.g., "prj-003")
- `assignee` - Person responsible (MUST be from `00_Meta/members.yaml`)

Default fields (자동 설정):
- `status` - 기본값: "todo" (유효값: → `00_Meta/schema_constants.yaml` > `task.status` 참조)
  - 일반 Task: "todo"
  - Dev Task (type=dev): "doing" (바로 시작)
- `start_date` - 기본값: 오늘 날짜 (YYYY-MM-DD)
- `due` - 기본값: 오늘 날짜 (YYYY-MM-DD)

Optional fields:
- `parent_id` - Parent task ID if this is a subtask
- `priority_flag` - → `00_Meta/schema_constants.yaml` > `priority.values` 참조
- `type` - Task 유형: → `00_Meta/schema_constants.yaml` > `task.types` 참조
- `target_project` - type=dev일 때만: → `00_Meta/schema_constants.yaml` > `task.target_projects` 참조
- `status` - 기본값 오버라이드 시: → `00_Meta/schema_constants.yaml` > `task.status` 참조

**FORBIDDEN (역할 분리):**
- ❌ `validates` - Task는 전략 판단에 개입하지 않음. validates는 Project만 가능.

**Step 2: Generate next Task ID**

1. Use Glob to find all Task files:
   ```
   pattern: 50_Projects/**/Tasks/*.md
   ```

2. Use Read to scan each file's frontmatter for `entity_id: tsk-*`

3. Find the highest ID (e.g., `tsk-003-01`)

4. Increment by 1:
   - Extract main number and sub number (003-01 → 3, 1)
   - Combined = 3 * 100 + 1 = 301
   - Next = 301 + 1 = 302
   - Format = 302 → 3 main, 2 sub → `tsk-003-02`

5. If no existing Tasks found, start with `tsk-001-01`

**Step 3: Load and populate template**

1. Read template:
   ```
   path: 00_Meta/_TEMPLATES/template_task.md
   ```

2. Replace {{PLACEHOLDERS}}:
   - `{{entity_id}}` → generated ID (e.g., `tsk-003-02`)
   - `{{entity_name}}` → user-provided name
   - `{{project_id}}` → user-provided project ID
   - `{{assignee}}` → user-provided assignee
   - `{{parent_id}}` → user-provided parent ID (if any)
   - `{{priority_flag}}` → user-provided priority (if any)
   - `{{TYPE}}` → user-provided type (dev | strategy | research | ops | null)
   - `{{TARGET_PROJECT}}` → user-provided target_project (sosi | kkokkkok | loop-api | null)
   - `{{DATE}}` → current date (YYYY-MM-DD format)
   - Note: `aliases` will automatically include entity_id for Obsidian linking

**Step 4: Determine file path**

Get project name from project_id:
1. Use Grep to find project file with `entity_id: {project_id}`
2. Read the project file to get `entity_name`
3. Construct path:
   ```
   50_Projects/{project_name}/Tasks/{entity_name}.md
   ```

**Step 5: Create file**

Use Write to save the populated template to the determined path.

**Step 6: Validate and index**

Run validation (see "Validation Workflow" section below).

### Creating a Project

**Step 1: Collect required information**

First, read `00_Meta/members.yaml` to get valid owner options.

Use AskUserQuestion to collect:

Required fields:
- `entity_name` - Project name (e.g., "Ontology_v0.2")
- `owner` - Project owner (MUST be from `00_Meta/members.yaml`)
- `parent_id` - Parent Track ID (e.g., "trk-2") - **필수, Program 하위 Project도 반드시 Track 연결 필요**
- `conditions_3y` - 기여하는 3년 Condition 목록 (→ `00_Meta/schema_constants.yaml` > `condition_ids` 참조) - **필수**

Default fields (자동 설정):
- `status` - 기본값: "doing" (유효값: → `00_Meta/schema_constants.yaml` > `project.status` 참조)
  - 프로젝트는 생성 시 바로 진행 상태로 시작

Optional fields:
- `program_id` - 소속 Program ID (e.g., "pgm-youtube") - Program 하위 Round Project인 경우
- `cycle` - 사이클/라운드 (e.g., "W33", "2026Q1") - program_id가 있을 경우 권장
- `hypothesis_id` - 검증 대상 가설 ID (e.g., "hyp-2-01")
- `priority_flag` - "critical", "high", "medium", or "low"

**CRITICAL: Program 하위 Project도 전략 연결 필수**
Program에 속한 Project라도 반드시:
- `parent_id` → Track 연결 (어떤 전략 방향의 실행인가?)
- `conditions_3y` → Condition 연결 (어떤 3년 조건에 기여하는가?)

이 연결이 없으면 전략 계층에서 고아(orphan) 프로젝트가 됨.

**Step 1.5: Expected Impact 설정**

Use AskUserQuestion to ask:

```
이 프로젝트의 Expected Impact를 어떻게 설정할까요?

1. 자동 채우기 (auto-fill-project-impact 스킬 호출)
   → LLM이 컨텍스트 분석 후 tier/magnitude/confidence 제안

2. None으로 설정 (Impact 계산 불필요)
   → Operational task, 단순 실행 프로젝트에 적합
   → tier: "none", 나머지 필드: null

3. 나중에 채우기 (일단 null로 생성)
   → 생성 후 /auto-fill-project-impact 별도 실행
```

**Option별 처리:**

| 선택 | expected_impact 값 |
|------|---------------------|
| 자동 채우기 | `auto-fill-project-impact` 스킬 호출 후 결과 적용 |
| None | `tier: "none"`, `impact_magnitude: null`, `confidence: null`, `contributes: []` |
| 나중에 | `tier: null`, `impact_magnitude: null`, `confidence: null`, `contributes: []` |

**Step 2: Generate next Project ID**

1. Use Glob to find all Project files:
   ```
   pattern: 50_Projects/P**/Project_정의.md
   ```

2. Use Read to scan each file's frontmatter for `entity_id: prj-*`

3. Find the highest number (e.g., `prj-003`)

4. Increment by 1:
   - Extract number (003 → 3)
   - Next = 3 + 1 = 4
   - Format = `prj-004`

5. If no existing Projects found, start with `prj-001`

**Step 3: Load and populate template**

1. Read template:
   ```
   path: 00_Meta/_TEMPLATES/template_project.md
   ```

2. Replace {{PLACEHOLDERS}}:
   - `{{entity_id}}` → generated ID (e.g., `prj-004`)
   - `{{entity_name}}` → user-provided name
   - `{{owner}}` → user-provided owner
   - `{{parent_id}}` → user-provided Track ID (e.g., `trk-2`)
   - `{{conditions_3y}}` → user-provided conditions (e.g., `["cond-a", "cond-b"]`)
   - `{{program_id}}` → user-provided program ID (if any, e.g., `pgm-youtube`)
   - `{{cycle}}` → user-provided cycle (if any, e.g., `W33`)
   - `{{hypothesis_id}}` → user-provided hypothesis ID (if any)
   - `{{priority_flag}}` → user-provided priority (if any)
   - `{{DATE}}` → current date
   - `{{project_num}}` → extracted from ID (004)
   - Note: `aliases` will automatically include entity_id for Obsidian linking

   Expected Impact 플레이스홀더 (Step 1.5 선택에 따라):
   - `{{IMPACT_TIER}}` → "strategic" | "enabling" | "operational" | "none" | null
   - `{{IMPACT_MAG}}` → "high" | "mid" | "low" | null
   - `{{CONFIDENCE}}` → 0.0-1.0 | null
   - `{{COND_ID}}` → "cond-a" 등 | 빈 값
   - `{{WEIGHT}}` → 0.0-1.0 | 빈 값

**Step 4: Create project directory structure**

1. Create folder:
   ```
   50_Projects/P{project_num}_{entity_name}/
   ```

2. Create subfolders:
   ```
   50_Projects/P{project_num}_{entity_name}/Tasks/
   50_Projects/P{project_num}_{entity_name}/Results/
   ```

3. Save Project_정의.md:
   ```
   50_Projects/P{project_num}_{entity_name}/Project_정의.md
   ```

**Step 5: Validate and index**

Run validation (see "Validation Workflow" section below).

## Editing Entities

**Step 1: Find the entity**

Ask user which entity to edit (name or ID).

Use Glob to find:
```
pattern: **/{entity_name}.md
or search by entity_id using Grep
```

**Step 2: Show current values**

Read the file and display current frontmatter fields.

**Step 3: Collect changes**

Use AskUserQuestion with current values as defaults:
- Show each field with current value
- User can press Enter to keep current value
- Or type new value to change

**Step 4: Update file**

Use Edit to update the frontmatter fields:
- Replace old values with new values
- Update `updated` field to current date

**Step 5: Validate and index**

Run validation (see "Validation Workflow" section below).

## Deleting Entities

**Step 1: Find the entity**

Ask user which entity to delete (name or ID).

Use Glob/Grep to find the file.

**Step 2: Check for dependencies**

1. Read the file to get `entity_id`

2. Use Grep to search for references to this ID:
   ```
   pattern: parent_id.*{entity_id}
   pattern: project_id.*{entity_id}
   ```

3. If dependencies found:
   - List all dependent entities
   - Warn user that deletion will create orphans
   - Ask for confirmation

**Step 3: Confirm deletion**

Use AskUserQuestion to confirm:
```
Are you sure you want to delete {entity_name} ({entity_id})?
This action cannot be undone.
```

**Step 4: Delete file**

Use Bash to remove the file:
```bash
rm "path/to/entity.md"
```

For Projects, also remove the entire directory:
```bash
rm -r "50_Projects/P{num}_{name}/"
```

**Step 5: Update graph index**

Run only the graph index update (skip validation):
```bash
python3 scripts/build_graph_index.py .
```

## Validation Workflow

After any create or edit operation, always run these three steps-

**Step 1: Schema validation**

```bash
python3 scripts/validate_schema.py .
```

If errors found:
- Display error messages
- File is still created/edited
- User can fix manually or re-run creation

**Step 2: Orphan check**

```bash
python3 scripts/check_orphans.py .
```

If warnings found:
- Display warnings about missing parent/project references
- File is still created/edited
- User should create missing entities or update links

**Step 3: Graph index update**

```bash
python3 scripts/build_graph_index.py .
```

This regenerates `_Graph_Index.md` with latest entity relationships.

## Schema Reference

All schema definitions are maintained in authoritative sources:

### Single Source of Truth (상수 값)

```
00_Meta/schema_constants.yaml
```

**이 파일에서 로드하는 값들:**
- `task.status`, `project.status` - 상태 유효값
- `task.types` - Task 유형 (dev, strategy, research, ops)
- `task.target_projects` - 외부 프로젝트 (sosi, kkokkkok, loop-api, loop)
- `priority.values` - 우선순위 (critical, high, medium, low)
- `condition_ids` - 3년 조건 ID (cond-a ~ cond-e)
- `id_patterns` - 엔티티별 ID 정규식
- `required_fields` - 엔티티별 필수 필드

### Schema Documentation

```
00_Meta/schema_registry.md
```

**Before creating/editing entities, read these files to ensure:**
- Correct field requirements per entity type
- Valid ID patterns and formats
- File placement rules
- Current schema version

**Key sections in schema_registry.md:**
- Section 1: ID 형식 규칙 - ID patterns
- Section 2: 공통 스키마 - Common fields
- Section 3: 엔티티별 확장 스키마 - Entity-specific fields
- Section 4: 검증 규칙 - Validation rules
- Section 5: 파일 위치 규칙 - File location rules

## Quick Examples

**Create a Task:**
```
User: "코치OS 인터페이스 설계 태스크 만들어줘"
→ Collect: project_id, assignee
→ Generate: tsk-005-03
→ Create: 50_Projects/CoachOS_Phase1/Tasks/코치OS_인터페이스_설계.md
→ Validate and index
```

**Create a Dev Task (외부 프로젝트 연동):**
```
User: "sosi 로그인 버그 수정 dev task 만들어줘"
→ Collect: project_id, assignee, type=dev, target_project=sosi
→ Generate: tsk-005-04
→ Create: 50_Projects/.../Tasks/로그인_버그_수정.md
→ Output: "Git 브랜치 생성: git checkout -b tsk-005-04"
→ Validate and index
```

**Create a Project (with Impact auto-fill):**
```
User: "패턴 발견 v2 프로젝트 만들어줘"
→ Collect: owner, parent_id, conditions_3y
→ Ask: Impact 설정 방법? → "자동 채우기" 선택
→ Generate: prj-008
→ Call auto-fill-project-impact 스킬
→ Create: 50_Projects/P008_Pattern_Discovery_v2/
→ Validate and index
```

**Create a Project (Impact = None):**
```
User: "회의록 정리 프로젝트 만들어줘"
→ Collect: owner, parent_id, conditions_3y
→ Ask: Impact 설정 방법? → "None으로 설정" 선택
→ Generate: prj-009
→ Set: tier="none", magnitude=null, confidence=null
→ Create: 50_Projects/P009_회의록_정리/
→ Validate and index
```

**Edit a Task:**
```
User: "tsk-003-01 담당자를 한명학으로 바꿔줘"
→ Find file
→ Read current values
→ Update assignee field (must be from members.yaml)
→ Validate and index
```

**Delete a Project:**
```
User: "prj-005 프로젝트 삭제해줘"
→ Find project
→ Check dependencies (any Tasks?)
→ Confirm with user
→ Delete directory
→ Update graph index
```