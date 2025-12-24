# Entity Patterns

ID patterns and file placement rules for LOOP vault entities.

## ID Patterns

### Task ID Pattern

**Format**: `tsk-NNN-NN`

**Structure**:
- Prefix: `tsk-`
- Main number: `NNN` (001-999)
- Separator: `-`
- Sub number: `NN` (01-99)

**Examples**:
- `tsk-001-01` - First task
- `tsk-003-15` - 15th task in main group 3
- `tsk-042-03` - 3rd task in main group 42

**Auto-generation logic**:
1. Scan all existing Task files
2. Extract highest ID (e.g., `tsk-015-07`)
3. Convert to combined number: 15 * 100 + 7 = 1507
4. Increment: 1507 + 1 = 1508
5. Convert back: 1508 → 15 main, 08 sub → `tsk-015-08`

### Project ID Pattern

**Format**: `prj-NNN`

**Structure**:
- Prefix: `prj-`
- Number: `NNN` (001-999)

**Examples**:
- `prj-001` - First project
- `prj-015` - 15th project
- `prj-042` - 42nd project

**Auto-generation logic**:
1. Scan all existing Project files
2. Extract highest number (e.g., 15 from `prj-015`)
3. Increment: 15 + 1 = 16
4. Format: `prj-016`

---

## Naming Convention (MANDATORY)

### entity_name Format

**Format**: `[Category] - [Detail]`

**Structure**:
- Category: 대문자 키워드 (LOOPOS, Ontology, API, Dashboard, etc.)
- Separator: ` - ` (공백-하이픈-공백)
- Detail: 구체적인 작업/프로젝트 내용

### Project Naming Examples

| ✅ Good | ❌ Bad |
|---------|--------|
| `LOOPOS - Phase1 MVP` | `Phase1 MVP` |
| `Ontology - v0.2 스키마 확장` | `온톨로지 v0.2` |
| `API - Task CRUD 구현` | `태스크 API 만들기` |
| `Dashboard - Kanban 뷰 개선` | `칸반 대시보드` |

### Task Naming Examples

| ✅ Good | ❌ Bad |
|---------|--------|
| `LOOPOS - 인터페이스 설계` | `인터페이스 설계` |
| `API - 캐시 레이어 추가` | `캐시 추가` |
| `Docs - CLAUDE.md 업데이트` | `문서 업데이트` |
| `Bugfix - 날짜 파싱 오류 수정` | `버그 수정` |

### Common Categories

| Category | 용도 |
|----------|------|
| `LOOPOS` | Inner Loop OS 코어 기능 |
| `Ontology` | 온톨로지 스키마/엔티티 관련 |
| `API` | API 서버 개발 |
| `Dashboard` | 대시보드 UI/UX |
| `Docs` | 문서화 작업 |
| `Infra` | 인프라/배포/스크립트 |
| `Bugfix` | 버그 수정 |
| `Refactor` | 리팩토링 |
| `Test` | 테스트 관련 |

### Validation Rule

스킬 실행 시 entity_name이 ` - ` 구분자를 포함하지 않으면:
1. 사용자에게 카테고리 선택 요청
2. 또는 올바른 형식으로 재입력 요청

```
❌ "프로토타입 개발" → 형식 오류
✅ "LOOPOS - 프로토타입 개발" → 통과
```

---

## File Placement Rules

### Task Files

**Location pattern**:
```
50_Projects/{project_name}/Tasks/{entity_name}.md
```

**Example**:
```
Task: "CoachOS 인터페이스 설계"
Project: "P003_CoachOS_Phase1"
→ File: 50_Projects/P003_CoachOS_Phase1/Tasks/CoachOS_인터페이스_설계.md
```

**How to determine project_name**:
1. User provides `project_id` (e.g., "prj-003")
2. Use Grep to find file with `entity_id: prj-003`
3. Read project file to get project folder name (e.g., "P003_CoachOS_Phase1")
4. Construct task path using that folder name

### Project Files

**Location pattern**:
```
50_Projects/P{project_num}_{entity_name}/Project_정의.md
```

**Project directory structure**:
```
50_Projects/P{project_num}_{entity_name}/
├── Project_정의.md         # Main project document
├── Tasks/                  # Task files go here
└── Results/                # Project results
```

**Example**:
```
Project: "Ontology_v0.2"
ID: prj-008
→ Folder: 50_Projects/P008_Ontology_v0.2/
→ File: 50_Projects/P008_Ontology_v0.2/Project_정의.md
```

**How to extract project_num**:
- From `prj-008` → extract `008`
- Use as folder prefix: `P008_`

## Template Placeholders

### Task Template Placeholders

Templates use `{{PLACEHOLDER}}` format. Replace with actual values:

| Placeholder | Source | Example |
|-------------|--------|---------|
| `{{entity_id}}` | Auto-generated | "tsk-005-03" |
| `{{entity_name}}` | User input | "코치OS 프로토타입 개발" |
| `{{project_id}}` | User input | "prj-003" |
| `{{assignee}}` | User input | "김코치" |
| `{{parent_id}}` | User input (optional) | "tsk-002-01" or "" |
| `{{priority_flag}}` | User input (optional) | "high" or "medium" |
| `{{DATE}}` | Current date | "2025-12-18" |

### Project Template Placeholders

| Placeholder | Source | Example |
|-------------|--------|---------|
| `{{entity_id}}` | Auto-generated | "prj-008" |
| `{{entity_name}}` | User input | "Ontology_v0.2" |
| `{{owner}}` | User input | "김개발" |
| `{{parent_id}}` | User input | "trk-2" or "hyp-005" |
| `{{priority_flag}}` | User input (optional) | "critical" |
| `{{project_num}}` | Extracted from entity_id | "008" |
| `{{DATE}}` | Current date | "2025-12-18" |

## Frontmatter Structure

### Task Frontmatter Example

```yaml
---
entity_type: Task
entity_id: tsk-005-03
entity_name: CoachOS_프로토타입_개발
created: 2025-12-18
updated: 2025-12-18
status: planning

# Hierarchy
parent_id: null
project_id: prj-003

# Assignment
assignee: 김코치

# Classification
tags: [task, coachos]
priority_flag: high
---
```

### Project Frontmatter Example (일반 Project)

```yaml
---
entity_type: Project
entity_id: prj-008
entity_name: Ontology_v0.2
created: 2025-12-18
updated: 2025-12-18
status: planning

# Hierarchy
parent_id: trk-2                    # 필수: Track 연결
conditions_3y: ["cond-a", "cond-b"] # 필수: Condition 연결

# 가설 연결
hypothesis_id: hyp-2-01             # 선택: 검증 대상 가설

# Assignment
owner: 김개발

# Classification
tags: [project, ontology]
priority_flag: critical
---
```

### Project Frontmatter Example (Program Round Project)

```yaml
---
entity_type: Project
entity_id: prj-yt-w33
entity_name: YouTube W33 영상 제작
created: 2025-12-18
updated: 2025-12-18
status: in_progress

# Hierarchy (CRITICAL: Program 하위도 전략 연결 필수!)
parent_id: trk-3                    # 필수: Track 연결 (Content Track)
conditions_3y: ["cond-c"]           # 필수: Condition 연결

# Program 연결
program_id: pgm-youtube             # Program ID
cycle: W33                          # 사이클/라운드

# Assignment
owner: 김은향

# Classification
tags: [project, youtube, weekly]
priority_flag: medium
---
```

**CRITICAL**: Program 하위 Project라도 반드시 `parent_id`(Track)와 `conditions_3y` 연결 필요.
이 연결이 없으면 전략 계층에서 고아(orphan) 프로젝트가 됨.

## Schema Validation Rules

The validation script (`scripts/validate_schema.py`) checks:

1. **Required fields present**: All required fields exist in frontmatter
2. **ID format valid**: Matches the pattern for entity type
3. **Status valid**: One of the allowed status values
4. **Date format valid**: YYYY-MM-DD format

The orphan check script (`scripts/check_orphans.py`) checks:

1. **parent_id exists**: Referenced parent entity file exists
2. **project_id exists**: Referenced project entity file exists
3. **Link symmetry**: If A references B, B should acknowledge A