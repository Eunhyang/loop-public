---
name: loop-entity-creator
description: Create, edit, and delete LOOP vault entities (Task, Project, Hypothesis) while maintaining GraphRAG pattern integrity. Use when user wants to (1) create a new Task, Project, or Hypothesis entity, (2) edit an existing entity's fields, (3) delete an entity and update graph index. CRITICAL - This skill enforces schema compliance, automatic ID generation, parent-child linking, and graph index updates to maintain vault integrity. Supports both public and exec vaults.
---

# LOOP Entity Creator

Manage LOOP vault entities with GraphRAG pattern enforcement.

## Overview

This skill ensures Task, Project, and Hypothesis entities follow strict schema requirements and maintain proper relationships. It prevents orphaned entities by enforcing validation and automatic graph index updates.

## Vault Selection (MANDATORY FIRST STEP)

> **Before creating any entity, determine which vault to use.**

### Decision Tree

```
┌─ Project 생성 시 ─────────────────────────────────────────────────┐
│                                                                    │
│  program_id 지정됨?                                                │
│  ├── YES → Program 파일 읽기 (public/50_Projects/{Program}/_PROGRAM.md) │
│  │   └── exec_rounds_path != null?                                │
│  │       ├── YES → vault: exec (자동 라우팅)                      │
│  │       │   └── exec/50_Projects/ 에 생성                        │
│  │       └── NO → vault: public                                   │
│  └── NO → 민감 정보 포함?                                         │
│      ├── YES → vault: exec                                        │
│      └── NO → vault: public                                       │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

┌─ Task 생성 시 ────────────────────────────────────────────────────┐
│                                                                    │
│  project_id로 Project 파일 찾기                                    │
│  └── Project 경로가 exec/50_Projects/?                            │
│      ├── YES → Task도 exec에 생성 (부모 vault 따름)               │
│      └── NO → Task도 public에 생성                                │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Vault Parameter

| Vault | Base Path | ID Pattern | Use Case |
|-------|-----------|------------|----------|
| `public` (default) | `public/50_Projects/` | `prj-NNN`, `tsk-NNN-NN` | 일반 프로젝트, 공개 태스크 |
| `exec` | `exec/50_Projects/` | **아래 참조** | 민감 정보 (계약, 단가, 평가) |

### Exec Vault ID 규칙 (SSOT: schema_constants.yaml v5.4)

> **⚠️ CRITICAL: exec vault에서 순차 번호(prj-NNN, tsk-NNN-NN) 절대 금지**
>
> public vault와 ID 충돌 방지를 위해 키워드 기반 체계 사용

**1. 민감 단독 프로젝트 (standalone)**

민감한 개인/계약 관련 프로젝트 (채용 후보, 프리랜서 등):

| Entity | Pattern | Example |
|--------|---------|---------|
| Project | `prj-exec-NNN` | `prj-exec-001` (다온 영상편집자) |
| Task | `tsk-exec-NNN` | `tsk-exec-001` (다온 첫 연락) |

**2. Program Round 프로젝트 (program_round)**

상위 Program이 있는 Round 프로젝트 (지원사업 배치, TIPS 등):

| Entity | Pattern | Example |
|--------|---------|---------|
| Project | `prj-{program}-{round}` | `prj-tips-primer`, `prj-grants-jemi` |
| Task | `tsk-{keyword}-NN` | `tsk-primer-01`, `tsk-grants-jemi-02` |

**키워드 결정 방법:**
```yaml
Program: pgm-tips-batch → tips (or tips-batch)
Round:
  - primer      # 프라이머
  - idp         # 아이디어파트너스
  - jemi        # JEMI 디딤돌
  - youth       # 청년창업사관학교
```

**금지 패턴 (충돌 방지):**
- ❌ `prj-017`, `prj-018` - public vault와 충돌
- ❌ `tsk-017-01`, `tsk-019-09` - public vault와 충돌

### Program exec_rounds_path 자동 라우팅 (NEW)

> **Program 설정에 따라 자동으로 vault 결정**

**확인 방법:**
```bash
# Program 파일에서 exec_rounds_path 필드 확인
grep "exec_rounds_path:" public/50_Projects/{Program}/_PROGRAM.md
```

**예시 - Hiring Program:**
```yaml
# public/50_Projects/Hiring/_PROGRAM.md
exec_rounds_path: "exec/50_Projects/Hiring_Rounds"  # 설정됨 → exec vault
```

이 경우, `program_id: pgm-hiring`을 지정하면 자동으로 exec vault에 Project 생성.

### Exec Vault 규칙

1. **Program 참조만**: `program_id: pgm-xxx` (public vault의 Program 참조)
2. **Project/Tasks 전부 exec에**: public vault에 아무것도 생성하지 않음
3. **API 호출 안 함**: exec vault는 로컬 파일 생성만 사용
4. **Validation 스킵**: exec vault는 public vault의 스크립트로 검증하지 않음

> ## ⛔ MANDATORY NAME FORMAT (절대 규칙)
>
> **모든 Task와 Project 이름은 반드시 `주제 - 내용` 형식이어야 함**
>
> - 정규식: `/^.+ - .+$/`
> - 구분자: ` - ` (공백-하이픈-공백, 3글자)
> - 검증 실패 시: **생성 진행 금지, 재입력 요청**
>
> **이 규칙은 스킵할 수 없음. 예외 없음.**
>
> **Hypothesis는 예외**: entity_name에 ` - ` 형식 불필요 (hypothesis_question이 핵심)

**Supported operations-**
- **Create** - Generate new Task, Project, or Hypothesis with auto-assigned ID
- **Edit** - Modify existing entity fields while preserving schema
- **Delete** - Remove entity and update all references

## API Integration (SSOT)

> **CRITICAL: API 우선 + Fallback 패턴**
>
> 이 스킬은 LOOP MCP API를 통해 엔티티를 생성합니다.
> API 서버가 사용 가능할 때 API 호출, 불가능할 때만 로컬 파일 생성.

### API Prerequisites

**환경 변수 확인:**
```bash
# LOOP_API_TOKEN이 설정되어 있어야 함
echo $LOOP_API_TOKEN
```

**API 서버 상태 확인:**
```bash
# Health check (로컬 또는 프로덕션)
curl -s --max-time 5 http://localhost:8081/health 2>/dev/null || \
curl -s --max-time 5 https://mcp.sosilab.synology.me/health
```

**API Base URL:**
- Local: `http://localhost:8081`
- Production: `https://mcp.sosilab.synology.me`

### API-First Pattern

**Task 생성 시:**
```bash
# 환경 변수 (NAS URL 기본값)
API_URL="${LOOP_API_URL:-https://mcp.sosilab.synology.me}"
: "${LOOP_API_TOKEN:?LOOP_API_TOKEN is required}"

# 1. Health check (pipefail로 curl 실패 감지)
set -o pipefail
if curl -fsS --max-time 5 "$API_URL/health" 2>/dev/null | jq -e '.status == "healthy"' > /dev/null; then
    # 2. API 호출
    curl -fsS -X POST "$API_URL/api/tasks" \
        -H "Authorization: Bearer $LOOP_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "entity_name": "주제 - 내용",
            "project_id": "prj-NNN",
            "assignee": "담당자",
            "status": "todo",
            "priority": "medium"
        }'
else
    # 3. Fallback: 로컬 파일 생성 (기존 방식)
    echo "⚠️ API unavailable, using local file creation"
fi
set +o pipefail
```

**Project 생성 시:**
```bash
# 환경 변수 (NAS URL 기본값)
API_URL="${LOOP_API_URL:-https://mcp.sosilab.synology.me}"
: "${LOOP_API_TOKEN:?LOOP_API_TOKEN is required}"

curl -fsS -X POST "$API_URL/api/projects" \
    -H "Authorization: Bearer $LOOP_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "entity_name": "주제 - 내용",
        "owner": "소유자",
        "conditions_3y": ["cond-a"],
        "priority": "high",
        "autofill_expected_impact": true
    }'
```

### Error Handling

**API 응답 검증:**
```bash
# 환경 변수 가드
: "${LOOP_API_TOKEN:?LOOP_API_TOKEN is required}"
API_URL="${LOOP_API_URL:-http://localhost:8081}"

# curl -w로 HTTP 코드 캡처 (fsS: fail on error, show error, silent progress)
RESPONSE=$(curl -sS -w "\n%{http_code}" -X POST "$API_URL/api/tasks" \
    -H "Authorization: Bearer $LOOP_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"entity_name": "주제 - 내용", ...}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    # 성공: task_id, file_path 추출
    TASK_ID=$(echo "$BODY" | jq -r '.task_id')
    echo "✅ Task created: $TASK_ID"
elif [ "$HTTP_CODE" -eq 400 ]; then
    # Validation error
    ERROR=$(echo "$BODY" | jq -r '.detail')
    echo "❌ Validation error: $ERROR"
elif [ "$HTTP_CODE" -eq 401 ]; then
    # Auth error
    echo "❌ Authentication failed. Check LOOP_API_TOKEN"
else
    # Fallback to local
    echo "⚠️ API error ($HTTP_CODE), falling back to local creation"
fi
```

---

## Creating Entities

### Workflow Decision Tree

**What type of entity?**
- **Task** → Follow "Creating a Task" workflow below
- **Project** → Follow "Creating a Project" workflow below

### Creating a Task

**Step 0: Determine target vault (NEW - MANDATORY)**

> ⚠️ **CRITICAL: Task는 부모 Project의 vault를 따름**

1. `project_id`로 Project 파일 찾기:
   ```bash
   # public vault 검색
   grep -rl "entity_id: \"$PROJECT_ID\"" public/50_Projects/

   # exec vault 검색 (없으면)
   grep -rl "entity_id: \"$PROJECT_ID\"" exec/50_Projects/
   ```

2. Project 경로 확인:
   ```
   경로가 exec/50_Projects/...?
   ├── YES → Task도 exec vault에 생성
   │   └── ID 패턴: tsk-exec-NNN
   │   └── 경로: exec/50_Projects/{Project}/Tasks/
   └── NO → Task도 public vault에 생성
       └── ID 패턴: tsk-NNN-NN
       └── 경로: public/50_Projects/{Project}/Tasks/
   ```

**Step 1: Collect required information**

First, read `00_Meta/members.yaml` to get valid assignee options.

Use AskUserQuestion to collect:

Required fields:
- `entity_name` - Task name in **'주제 - 내용'** format (e.g., "CoachOS - 프로토타입 개발")
- `project_id` - Parent project ID (must exist, e.g., "prj-003")
- `assignee` - Person responsible (MUST be from `00_Meta/members.yaml`)

**Step 1.5: MANDATORY Name Format Validation (반드시 실행)**

> ⚠️ **CRITICAL: 이 단계를 스킵하면 안 됨. 형식 검증 실패 시 생성 진행 금지.**

**검증 규칙:**
- 정규식: `/^.+ - .+$/` (반드시 ' - ' 공백-하이픈-공백 포함)
- 최소 구조: `{주제} - {내용}` (양쪽 모두 1자 이상)

**검증 로직:**
```
IF entity_name does NOT contain ' - ' (space-hyphen-space):
    → REJECT and re-ask with error message
    → NEVER proceed to Step 2
```

**형식 규칙:**
- 주제: 프로젝트/기능/영역 (짧게, 1-3단어)
- 내용: 구체적 작업 설명 (명확하게)
- 구분자: 반드시 ` - ` (공백 + 하이픈 + 공백)

**❌ REJECT (절대 허용 금지):**
| 잘못된 입력 | 문제점 |
|------------|--------|
| "프로토타입 개발" | ' - ' 없음 |
| "CoachOS프로토타입" | ' - ' 없음 |
| "CoachOS-개발" | 공백 없음 (하이픈만) |
| "CoachOS -개발" | 뒤 공백 없음 |
| "CoachOS- 개발" | 앞 공백 없음 |
| " - 개발" | 주제 없음 |
| "CoachOS - " | 내용 없음 |

**✅ ACCEPT (허용):**
| 올바른 입력 | 구조 |
|------------|------|
| "CoachOS - 프로토타입 개발" | 주제 - 내용 |
| "Dashboard - 필터 기능 추가" | 주제 - 내용 |
| "API - OAuth 2.0 구현" | 주제 - 내용 |
| "버그 - 로그인 실패 수정" | 주제 - 내용 |

**검증 실패 시 응답:**
```
❌ 이름 형식이 올바르지 않습니다.

입력: "{user_input}"
문제: ' - ' (공백-하이픈-공백) 구분자가 없습니다.

올바른 형식: "{주제} - {내용}"
예시: "CoachOS - 프로토타입 개발"

다시 입력해 주세요.
```

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

**Step 2: Create Task via API (MANDATORY - NO FALLBACK)**

> ## ⛔ CRITICAL: API-ONLY TASK CREATION
>
> **Local file creation is FORBIDDEN.** All Tasks MUST be created through the API.
>
> - API generates Hash+Epoch ID (e.g., `tsk-a7k9m2-1736412652123`)
> - API creates file on NAS vault
> - API commits and pushes to GitHub
> - Local syncs via git pull
>
> **This ensures SSOT (Single Source of Truth) and prevents ID collisions.**
>
> **FORBIDDEN behaviors:**
> - ❌ Generating Task ID locally (sequential or any format)
> - ❌ Creating Task file with Write tool
> - ❌ Falling back to local creation when API fails
> - ❌ Using legacy sequential IDs (tsk-NNN-NN)

**2a. Verify environment variables**

```bash
# REQUIRED - will fail if not set
: "${LOOP_API_TOKEN:?ERROR: LOOP_API_TOKEN is not set}"
API_URL="${LOOP_API_URL:-https://mcp.sosilab.synology.me}"
```

**2b. Call API to create Task**

```bash
RESPONSE=$(curl -fsS -X POST "$API_URL/api/tasks" \
    -H "Authorization: Bearer $LOOP_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "entity_name": "{entity_name}",
        "project_id": "{project_id}",
        "assignee": "{assignee}",
        "status": "{status}",
        "priority": "{priority}",
        "type": "{type}",
        "target_project": "{target_project}"
    }')
```

**2c. Parse API response**

```bash
# Extract task_id (Hash+Epoch format)
TASK_ID=$(echo "$RESPONSE" | jq -r '.task_id')
FILE_PATH=$(echo "$RESPONSE" | jq -r '.file_path')

# Verify ID format (MUST be Hash+Epoch, NOT sequential)
if [[ ! "$TASK_ID" =~ ^tsk-[a-z0-9]{6}-[0-9]{13}$ ]]; then
    echo "❌ ERROR: Invalid Task ID format: $TASK_ID"
    echo "Expected: tsk-{hash6}-{epoch13} (e.g., tsk-a7k9m2-1736412652123)"
    exit 1
fi

echo "✅ Task created: $TASK_ID"
echo "📁 File: $FILE_PATH"
```

**2d. Handle API errors (NO FALLBACK)**

If API call fails:
1. Display error message to user
2. Ask user to check:
   - Network connectivity
   - API server status (`curl $API_URL/health`)
   - Token validity (`echo $LOOP_API_TOKEN`)
3. **DO NOT create file locally**
4. **DO NOT generate ID locally**

```bash
# If API fails
echo "❌ API call failed. Task creation aborted."
echo ""
echo "Troubleshooting:"
echo "  1. Check API health: curl -s $API_URL/health"
echo "  2. Check token: echo \$LOOP_API_TOKEN | head -c 10"
echo "  3. Check network: ping mcp.sosilab.synology.me"
echo ""
echo "DO NOT create Task file manually. Fix the issue and retry."
```

**Step 3: Sync via /nas-git local-sync (MANDATORY)**

> ## ⛔ CRITICAL: MUST USE /nas-git local-sync
>
> **Direct git pull is FORBIDDEN.** Use `/nas-git local-sync` command only.
>
> This command performs bidirectional sync:
> 1. NAS commit + push (API-created file → GitHub)
> 2. Local commit (preserve local changes)
> 3. Local pull --rebase (get API-created file)
> 4. Local push (sync local changes)
> 5. NAS pull (complete sync)
> 6. API cache refresh
>
> **FORBIDDEN behaviors:**
> - ❌ Using `git pull` directly
> - ❌ Using `git fetch` + `git merge`
> - ❌ Skipping sync step
> - ❌ Using `/nas-git nas-to-local` (loses local changes)

**3a. Execute /nas-git local-sync**

```bash
# MANDATORY: Use /nas-git local-sync command
# This is a Claude Code slash command, invoke via Skill tool:
Skill(skill: "nas-git", args: "local-sync")
```

**3b. Verify sync completion**

After `/nas-git local-sync` completes, verify:

```bash
# Check file exists locally
FILE_PATH="/Users/gim-eunhyang/dev/loop/public/50_Projects/{project}/Tasks/{task_id}.md"

if [ -f "$FILE_PATH" ]; then
    echo "✅ Task synced to local: $FILE_PATH"
else
    echo "❌ Sync failed. File not found: $FILE_PATH"
    exit 1
fi

# Verify Task ID matches
LOCAL_ID=$(grep "entity_id:" "$FILE_PATH" | awk '{print $2}')
if [ "$LOCAL_ID" = "$TASK_ID" ]; then
    echo "✅ Task ID verified: $TASK_ID"
else
    echo "❌ ID mismatch! Expected: $TASK_ID, Found: $LOCAL_ID"
    exit 1
fi
```

**3c. MANDATORY VERIFICATION CHECKLIST**

> **⛔ STOP if any check fails. Do NOT proceed to Step 4.**

| Check | Requirement | Status |
|-------|-------------|--------|
| Command used | `/nas-git local-sync` was executed (NOT git pull) | [ ] |
| Sync completed | Command finished without errors | [ ] |
| File exists | Task file exists at expected local path | [ ] |
| ID matches | Local file entity_id matches API response | [ ] |

**Step 4: Post-creation (Validation already done by API)**

API handles:
- ✅ Schema validation
- ✅ ID generation (Hash+Epoch)
- ✅ File creation on NAS vault

`/nas-git local-sync` handles:
- ✅ NAS → GitHub push
- ✅ Local ← GitHub pull
- ✅ Bidirectional sync (preserves local changes)
- ✅ API cache refresh

Local only needs to:
- Verify file exists after sync
- Proceed with development work

**Task ID Format (SSOT: schema_constants.yaml)**

| Format | Pattern | Example | Status |
|--------|---------|---------|--------|
| Hash+Epoch | `tsk-{hash6}-{epoch13}` | `tsk-a7k9m2-1736412652123` | **CURRENT** |
| Legacy Sequential | `tsk-{prj}-{seq}` | `tsk-023-37` | **DEPRECATED** |

**Filename Convention**

- Pattern: `{task_id}.md`
- Example: `tsk-a7k9m2-1736412652123.md`
- Location: `50_Projects/{project}/Tasks/`

### Creating a Project

**Step 0: Determine target vault (NEW - MANDATORY)**

> ⚠️ **CRITICAL: program_id가 있으면 Program의 exec_rounds_path 확인**

1. `program_id` 지정됨?
   - YES → Step 0a (Program 확인)
   - NO → Step 0b (수동 결정)

**Step 0a: Program exec_rounds_path 확인**
```bash
# Program 파일 읽기
PROGRAM_FILE="public/50_Projects/{Program}/_PROGRAM.md"

# exec_rounds_path 필드 확인
EXEC_PATH=$(grep "exec_rounds_path:" "$PROGRAM_FILE" | awk '{print $2}')

if [ "$EXEC_PATH" != "null" ] && [ -n "$EXEC_PATH" ]; then
    # exec vault에 생성
    VAULT="exec"
    BASE_PATH="exec/50_Projects/"
    ID_PATTERN="prj-exec-NNN"
    echo "📍 Program exec_rounds_path 설정됨 → exec vault"
else
    # public vault에 생성
    VAULT="public"
    BASE_PATH="public/50_Projects/"
    ID_PATTERN="prj-NNN"
fi
```

**Step 0b: 수동 결정 (program_id 없을 때)**
```
민감 정보 포함? (단가, 계약, 평가, 급여 등)
├── YES → vault: exec
└── NO → vault: public
```

**Step 1: Collect required information**

First, read `00_Meta/members.yaml` to get valid owner options.

Use AskUserQuestion to collect:

Required fields:
- `entity_name` - Project name in **'주제 - 내용'** format (e.g., "Ontology - v0.2 스키마 설계")
- `owner` - Project owner (MUST be from `00_Meta/members.yaml`)
- `parent_id` - Parent Track ID (e.g., "trk-2") - **필수, Program 하위 Project도 반드시 Track 연결 필요**
- `conditions_3y` - 기여하는 3년 Condition 목록 (→ `00_Meta/schema_constants.yaml` > `condition_ids` 참조) - **필수**

**Step 1.5: MANDATORY Name Format Validation (반드시 실행)**

> ⚠️ **CRITICAL: 이 단계를 스킵하면 안 됨. 형식 검증 실패 시 생성 진행 금지.**

**검증 규칙:**
- 정규식: `/^.+ - .+$/` (반드시 ' - ' 공백-하이픈-공백 포함)
- 최소 구조: `{주제} - {내용}` (양쪽 모두 1자 이상)

**검증 로직:**
```
IF entity_name does NOT contain ' - ' (space-hyphen-space):
    → REJECT and re-ask with error message
    → NEVER proceed to Step 2
```

**형식 규칙:**
- 주제: 프로젝트/제품/영역 (짧게, 1-3단어)
- 내용: 구체적 목표/버전 설명 (명확하게)
- 구분자: 반드시 ` - ` (공백 + 하이픈 + 공백)

**❌ REJECT (절대 허용 금지):**
| 잘못된 입력 | 문제점 |
|------------|--------|
| "Ontology_v0.2" | ' - ' 없음 |
| "온톨로지스키마" | ' - ' 없음 |
| "Ontology-설계" | 공백 없음 (하이픈만) |
| "Dashboard -UX개선" | 뒤 공백 없음 |
| "Dashboard- UX 개선" | 앞 공백 없음 |
| " - UX 개선" | 주제 없음 |
| "Dashboard - " | 내용 없음 |

**✅ ACCEPT (허용):**
| 올바른 입력 | 구조 |
|------------|------|
| "Ontology - v0.2 스키마 설계" | 주제 - 내용 |
| "Dashboard - UX 개선" | 주제 - 내용 |
| "CoachOS - MVP 개발" | 주제 - 내용 |
| "Impact - Schema v2 도입" | 주제 - 내용 |

**검증 실패 시 응답:**
```
❌ 프로젝트 이름 형식이 올바르지 않습니다.

입력: "{user_input}"
문제: ' - ' (공백-하이픈-공백) 구분자가 없습니다.

올바른 형식: "{주제} - {내용}"
예시: "Dashboard - UX 개선"

다시 입력해 주세요.
```

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

**Step 1.6: Expected Impact 설정**

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

**Step 2: Create Project via API (MANDATORY - NO FALLBACK)**

> ## ⛔ CRITICAL: API-ONLY PROJECT CREATION
>
> **Local file creation is FORBIDDEN.** All Projects MUST be created through the API.
>
> - API generates Hash-based ID (e.g., `prj-a7k9m2`)
> - API creates directory structure on NAS vault
> - API commits and pushes to GitHub
> - Local syncs via git pull
>
> **This ensures SSOT (Single Source of Truth) and prevents ID collisions.**
>
> **FORBIDDEN behaviors:**
> - ❌ Generating Project ID locally (sequential or any format)
> - ❌ Creating Project directory with Bash mkdir
> - ❌ Creating project.md with Write tool
> - ❌ Falling back to local creation when API fails
> - ❌ Using legacy sequential IDs (prj-NNN)

**2a. Verify environment variables**

```bash
# REQUIRED - will fail if not set
: "${LOOP_API_TOKEN:?ERROR: LOOP_API_TOKEN is not set}"
API_URL="${LOOP_API_URL:-https://mcp.sosilab.synology.me}"
```

**2b. Call API to create Project**

```bash
RESPONSE=$(curl -fsS -X POST "$API_URL/api/projects" \
    -H "Authorization: Bearer $LOOP_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "entity_name": "{entity_name}",
        "owner": "{owner}",
        "parent_id": "{parent_id}",
        "conditions_3y": {conditions_3y},
        "program_id": "{program_id}",
        "cycle": "{cycle}",
        "priority": "{priority}",
        "autofill_expected_impact": {true|false}
    }')
```

**2c. Parse API response**

```bash
# Extract project_id (Hash format)
PROJECT_ID=$(echo "$RESPONSE" | jq -r '.project_id')
DIR_PATH=$(echo "$RESPONSE" | jq -r '.directory')
EXP_SCORE=$(echo "$RESPONSE" | jq -r '.expected_score // "N/A"')

# Verify ID format (MUST be Hash, NOT sequential)
if [[ ! "$PROJECT_ID" =~ ^prj-[a-z0-9]{6}$ ]]; then
    echo "❌ ERROR: Invalid Project ID format: $PROJECT_ID"
    echo "Expected: prj-{hash6} (e.g., prj-a7k9m2)"
    exit 1
fi

echo "✅ Project created: $PROJECT_ID"
echo "📁 Directory: $DIR_PATH"
[ "$EXP_SCORE" != "N/A" ] && echo "📊 Expected Score: $EXP_SCORE"
```

**2d. Handle API errors (NO FALLBACK)**

If API call fails:
1. Display error message to user
2. Ask user to check:
   - Network connectivity
   - API server status (`curl $API_URL/health`)
   - Token validity (`echo $LOOP_API_TOKEN`)
3. **DO NOT create directory locally**
4. **DO NOT generate ID locally**

```bash
# If API fails
echo "❌ API call failed. Project creation aborted."
echo ""
echo "Troubleshooting:"
echo "  1. Check API health: curl -s $API_URL/health"
echo "  2. Check token: echo \$LOOP_API_TOKEN | head -c 10"
echo "  3. Check network: ping mcp.sosilab.synology.me"
echo ""
echo "DO NOT create Project directory manually. Fix the issue and retry."
```

**Step 3: Sync via /nas-git local-sync (MANDATORY)**

> ## ⛔ CRITICAL: MUST USE /nas-git local-sync
>
> **Direct git pull is FORBIDDEN.** Use `/nas-git local-sync` command only.
>
> This command performs bidirectional sync:
> 1. NAS commit + push (API-created directory → GitHub)
> 2. Local commit (preserve local changes)
> 3. Local pull --rebase (get API-created directory)
> 4. Local push (sync local changes)
> 5. NAS pull (complete sync)
> 6. API cache refresh
>
> **FORBIDDEN behaviors:**
> - ❌ Using `git pull` directly
> - ❌ Using `git fetch` + `git merge`
> - ❌ Skipping sync step
> - ❌ Using `/nas-git nas-to-local` (loses local changes)

**3a. Execute /nas-git local-sync**

```bash
# MANDATORY: Use /nas-git local-sync command
# This is a Claude Code slash command, invoke via Skill tool:
Skill(skill: "nas-git", args: "local-sync")
```

**3b. Verify sync completion**

After `/nas-git local-sync` completes, verify:

```bash
# Check directory exists locally
DIR_PATH="/Users/gim-eunhyang/dev/loop/public/50_Projects/{project_dir}"

if [ -d "$DIR_PATH" ]; then
    echo "✅ Project synced to local: $DIR_PATH"
else
    echo "❌ Sync failed. Directory not found: $DIR_PATH"
    exit 1
fi

# Verify Project ID matches
PROJECT_FILE="$DIR_PATH/project.md"
LOCAL_ID=$(grep "entity_id:" "$PROJECT_FILE" | awk '{print $2}')
if [ "$LOCAL_ID" = "$PROJECT_ID" ]; then
    echo "✅ Project ID verified: $PROJECT_ID"
else
    echo "❌ ID mismatch! Expected: $PROJECT_ID, Found: $LOCAL_ID"
    exit 1
fi
```

**3c. MANDATORY VERIFICATION CHECKLIST**

> **⛔ STOP if any check fails. Do NOT proceed to Step 4.**

| Check | Requirement | Status |
|-------|-------------|--------|
| Command used | `/nas-git local-sync` was executed (NOT git pull) | [ ] |
| Sync completed | Command finished without errors | [ ] |
| Directory exists | Project directory exists at expected local path | [ ] |
| ID matches | Local project.md entity_id matches API response | [ ] |

**Step 4: Post-creation (Validation already done by API)**

API handles:
- ✅ Schema validation
- ✅ ID generation (Hash-based)
- ✅ Directory creation on NAS vault (project.md, Tasks/, Results/)
- ✅ Expected Impact autofill (if requested)

`/nas-git local-sync` handles:
- ✅ NAS → GitHub push
- ✅ Local ← GitHub pull
- ✅ Bidirectional sync (preserves local changes)
- ✅ API cache refresh

Local only needs to:
- Verify directory exists after sync
- Proceed with project work

**Project ID Format (SSOT: schema_constants.yaml)**

| Format | Pattern | Example | Status |
|--------|---------|---------|--------|
| Hash | `prj-{hash6}` | `prj-a7k9m2` | **CURRENT** |
| Legacy Sequential | `prj-NNN` | `prj-023` | **DEPRECATED** |

**Directory Convention**

- Pattern: `P{hash}_{entity_name}/`
- Example: `Pa7k9m2_Dashboard_UX_개선/`
- Contains: `project.md`, `Tasks/`, `Results/`

---

## Exec Vault Entity Creation (vault: exec)

> **민감 정보 프로젝트/태스크는 이 워크플로우 사용**

### Creating an Exec Project

**Step 0: Vault 확인**
```
vault: exec 확인
→ API 호출 없음, 로컬 파일 생성만
→ Validation 스킵
```

**Step 1: Collect required information**

Required fields:
- `entity_name` - Project name in **'주제 - 내용'** format
- `program_id` - public vault의 Program ID (예: "pgm-hiring")
- `owner` - 담당자

Optional fields:
- `contract` - 계약 정보 (type, rate, terms)
- `status` - 기본값: "doing"

**Step 2: Generate next Exec Project ID**

> **SSOT 참조: `00_Meta/schema_constants.yaml` > `cross_vault.exec_id_patterns`**

**Case A: Standalone (program_id 없음)**
1. Use Grep to find existing `prj-exec-*` IDs:
   ```bash
   grep -rh "entity_id: prj-exec-" exec/50_Projects/
   ```
2. Find the highest number (e.g., `prj-exec-001`)
3. Increment by 1: `prj-exec-002`

**Case B: Program Round (program_id 있음)**
1. Program 키워드 추출:
   ```
   pgm-tips-batch → tips
   pgm-grants → grants
   ```
2. Round 키워드 결정 (entity_name에서 추출):
   ```
   "프라이머 배치" → primer
   "JEMI 디딤돌" → jemi
   ```
3. 조합: `prj-{program}-{round}` → `prj-tips-primer`

**Step 3: Create folder structure**

```bash
mkdir -p "exec/50_Projects/P{num}_{entity_name}/Tasks"
```

**Step 4: Create _INDEX.md**

```yaml
---
entity_type: Project
entity_id: prj-exec-001
entity_name: 다온 - 영상 편집자 협업
created: 2026-01-02
updated: 2026-01-02

# === Program 연결 ===
program_id: pgm-hiring
program_path: "[[public/50_Projects/Hiring/_PROGRAM.md]]"

# === Exec 전용 ===
vault: exec
owner: 김은향
status: doing

# === 계약 정보 ===
contract:
  type: freelance
  rate: "7만원/건"
  terms: "1시간→15분 또는 40분→10분"
---

# {entity_name}

> Exec Project | Program: [[pgm-hiring]]

## 계약 조건
- 단가: {rate}
- 조건: {terms}

## Tasks
| ID | 이름 | 상태 |
|----|------|------|
| | | |
```

**Step 5: Skip validation** (exec vault는 검증 불필요)

---

### Creating an Exec Task

**Step 1: Collect required information**

Required fields:
- `entity_name` - Task name in **'주제 - 내용'** format
- `project_id` - Exec Project ID (예: "prj-exec-001")
- `assignee` - 담당자

**Step 2: Generate next Exec Task ID**

> **SSOT 참조: `00_Meta/schema_constants.yaml` > `cross_vault.exec_id_patterns`**

**Case A: Standalone Project (prj-exec-NNN)**
1. Use Grep to find existing `tsk-exec-*` IDs:
   ```bash
   grep -rh "entity_id: tsk-exec-" exec/50_Projects/
   ```
2. Find the highest number
3. Increment by 1: `tsk-exec-002`

**Case B: Program Round Project (prj-{program}-{round})**
1. Project 키워드 추출:
   ```
   prj-tips-primer → primer
   prj-grants-jemi → jemi (또는 grants-jemi)
   ```
2. 기존 Task 번호 확인:
   ```bash
   grep -rh "entity_id: tsk-primer-" exec/50_Projects/
   ```
3. Increment by 1: `tsk-primer-08`

**Step 3: Create Task file**

Path: `exec/50_Projects/P{num}_{project_name}/Tasks/{entity_name}.md`

```yaml
---
entity_type: Task
entity_id: tsk-exec-001
entity_name: 다온 - 카톡 오픈채팅 연락
created: 2026-01-02
updated: 2026-01-02

# === 연결 ===
project_id: prj-exec-001
vault: exec

# === 실행 ===
assignee: 김은향
status: todo
due: 2026-01-03
---

# {entity_name}

## 작업 내용
- [ ] 카카오톡 오픈채팅 "인스타 다온" 검색
- [ ] 연락 및 조건 확정
```

**Step 4: Update Project _INDEX.md**

Tasks 테이블에 새 Task 추가

---

### Creating a Hypothesis

**Step 1: Collect required information**

Use AskUserQuestion to collect:

Required fields:
- `entity_name` - 가설 이름 (` - ` 형식 불필요)
- `parent_id` - Track ID (필수, 예: "trk-3")
- `hypothesis_question` - 질문 형태 (반드시 `?`로 끝나야 함)
- `success_criteria` - 성공 판정 기준 (구체적이고 측정 가능해야 함)
- `failure_criteria` - 실패 판정 기준 (구체적이고 측정 가능해야 함)
- `measurement` - 측정 방법 (어디서/무엇을/어떻게)

Optional fields:
- `horizon` - 검증 목표 연도 (기본값: 2026)
- `confidence` - 신뢰도 (0.0~1.0, 기본값: 0.0)
- `evidence_status` - 상태 (assumed, supported, rejected, inconclusive)
- `project_ids` - 연결할 프로젝트 IDs (validates에 추가됨)
- `auto_validate` - 생성 후 AI 검증 실행 여부

**Step 1.5: MANDATORY Question Format Validation (반드시 실행)**

> ⚠️ **CRITICAL: hypothesis_question이 `?`로 끝나지 않으면 생성 진행 금지**

**검증 로직:**
```
IF hypothesis_question does NOT end with '?':
    → REJECT and re-ask with error message
    → NEVER proceed to Step 2
```

**✅ ACCEPT:**
- "Content OS를 구축하면 콘텐츠 기획 시간이 50% 감소하는가?"
- "코치가 라벨러 역할로 전환하여 고품질 데이터를 생성할 수 있는가?"

**❌ REJECT:**
- "Content OS를 구축하면 기획 시간이 감소한다" (질문 아님)
- "기획 시간 50% 감소" (문장 아님)

**Step 2: API 호출**

```bash
API_URL="${LOOP_API_URL:-https://mcp.sosilab.synology.me}"
: "${LOOP_API_TOKEN:?LOOP_API_TOKEN is required}"

curl -fsS -X POST "$API_URL/api/hypotheses" \
    -H "Authorization: Bearer $LOOP_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "entity_name": "가설 이름",
        "parent_id": "trk-3",
        "hypothesis_question": "...인가?",
        "success_criteria": "성공 기준",
        "failure_criteria": "실패 기준",
        "measurement": "측정 방법",
        "horizon": "2026",
        "confidence": 0.7,
        "project_ids": ["prj-018"],
        "auto_validate": true
    }'
```

**Step 3: API 응답 확인**

API 응답 필드:
- `hypothesis_id`: 생성된 ID (예: hyp-3-01)
- `file_path`: 파일 경로 (60_Hypotheses/2026/hyp-3-01_xxx.md)
- `linked_projects`: validates에 연결된 프로젝트 IDs
- `validation`: auto_validate=True 시 검증 결과
  - `quality_score`: 품질 점수 (0.0~1.0)
  - `evidence_readiness`: Evidence 운영 가능성

**Step 4: Auto-validate 결과 처리**

`auto_validate=True`로 호출 시:

1. **품질 검증 (quality_score)**
   - 1.0: 모든 기준 충족, 즉시 검증 가능
   - 0.8+: 대부분 충족, 약간의 개선 필요
   - 0.6~0.8: 상당한 개선 필요 → pending review 생성
   - <0.6: 재작성 권장

2. **Evidence 운영 가능성 (evidence_readiness)**
   - `normalized_delta_method`: B Score 계산 방법
   - `suggested_sample_size`: 권장 샘플 크기
   - `counterfactual_type`: 대조 유형 (none/before_after/controlled)
   - `confounders`: 식별된 교란 변수

3. **pending review 생성 조건**
   - `quality_score < 0.8` 또는
   - `suggested_fields`가 비어있지 않음

**A/B 모델 검증 체크리스트 (CRITICAL)**

Hypothesis 생성 시 다음을 확인:

**A. 구조 검증**
- [ ] ID 패턴: `hyp-{track}-{seq}` 유일한가?
- [ ] parent_id가 Track ID (`trk-N`) 형식인가?
- [ ] horizon이 4자리 연도인가?

**B. 품질 검증**
- [ ] hypothesis_question이 `?`로 끝나는가?
- [ ] success_criteria가 구체적이고 측정 가능한가?
- [ ] failure_criteria가 구체적이고 측정 가능한가?
- [ ] measurement가 어디서/무엇을/어떻게를 포함하는가?

**C. Project 연결 검증**
- [ ] project_ids로 전달된 프로젝트에 validates 연결되었는가?
- [ ] Hypothesis.validated_by는 저장하지 않는가? (Derived 금지)

**D. Evidence 운영 가능성**
- [ ] normalized_delta 계산 방법이 정의 가능한가?
- [ ] sample_size가 명시 가능한가?
- [ ] counterfactual(대조군) 설정이 가능한가?

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
→ Ask entity_name: "CoachOS - 인터페이스 설계" (형식 확인)
→ Collect: project_id, assignee
→ Generate: tsk-005-03
→ Create: 50_Projects/CoachOS_Phase1/Tasks/CoachOS - 인터페이스 설계.md
→ Validate and index
```

**Create a Dev Task (외부 프로젝트 연동):**
```
User: "sosi 로그인 버그 수정 dev task 만들어줘"
→ Ask entity_name: "SoSi - 로그인 버그 수정" (형식 확인)
→ Collect: project_id, assignee, type=dev, target_project=sosi
→ Generate: tsk-005-04
→ Create: 50_Projects/.../Tasks/SoSi - 로그인 버그 수정.md
→ Output: "Git 브랜치 생성: git checkout -b tsk-005-04"
→ Validate and index
```

**Create a Project (with Impact auto-fill):**
```
User: "패턴 발견 v2 프로젝트 만들어줘"
→ Ask entity_name: "Pattern - Discovery v2 개발" (형식 확인)
→ Collect: owner, parent_id, conditions_3y
→ Ask: Impact 설정 방법? → "자동 채우기" 선택
→ Generate: prj-008
→ Call auto-fill-project-impact 스킬
→ Create: 50_Projects/P008_Pattern - Discovery v2 개발/
→ Validate and index
```

**Create a Project (Impact = None):**
```
User: "회의록 정리 프로젝트 만들어줘"
→ Ask entity_name: "Ops - 회의록 정리" (형식 확인)
→ Collect: owner, parent_id, conditions_3y
→ Ask: Impact 설정 방법? → "None으로 설정" 선택
→ Generate: prj-009
→ Set: tier="none", magnitude=null, confidence=null
→ Create: 50_Projects/P009_Ops - 회의록 정리/
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

**Create a Hypothesis (with Project linking):**
```
User: "Content OS 기획시간 50% 감소 가설 만들어줘"
→ Collect: entity_name, parent_id (trk-N), hypothesis_question (? 필수)
→ Collect: success_criteria, failure_criteria, measurement
→ Ask: 연결할 프로젝트? → ["prj-018"] 선택
→ Generate: hyp-3-01
→ Create: 60_Hypotheses/2026/hyp-3-01_Content_OS_기획시간_단축.md
→ Link: prj-018.validates에 hyp-3-01 추가
→ Auto-validate (optional): 품질 점수 + Evidence 운영 가능성 검증
```

**Create a Hypothesis (with auto_validate):**
```
User: "코칭 효과 가설 만들어줘, 검증도 해줘"
→ Collect all fields
→ Generate: hyp-4-01
→ Create file
→ auto_validate=True → LLM 품질 검증
→ 품질 점수 < 0.8이면 pending review 생성
→ Evidence 운영 가능성 (normalized_delta 계산법, counterfactual) 제안
```