---
name: loop-dev-task
description: LOOP Vault 또는 외부 프로젝트(sosi, kkokkkok)에서 dev Task를 생성하거나, 기존 Task로 개발을 시작합니다. task_id가 전달되면 기존 Task를 사용하고, 없으면 새 Task를 생성합니다.
---

# Loop Dev Task

개발 작업용 Task 워크플로우 스킬. 새 Task 생성 또는 기존 Task로 개발 시작을 통합 관리.

---

## 호출 방법

| 명령어 | 설명 | 예시 |
|--------|------|------|
| `/new-dev-task [name]` | 새 Task 생성 + 개발 시작 | `/new-dev-task 로그인 버그 수정` |
| `/start-dev-task [task_id]` | 기존 Task로 개발 시작 | `/start-dev-task tsk-dashboard-ux-v1-02` |

---

## Step 0: 모드 분기 (FIRST - 항상 먼저 실행)

> **CRITICAL: 먼저 모드를 판단한 후 적절한 Step으로 분기합니다.**

```
┌─────────────────────────────────────────────────────────────┐
│  MODE DETECTION                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  task_id 전달됨? ─────────────────┐                         │
│       │                          │                         │
│       ▼ NO                       ▼ YES                     │
│  ┌──────────────┐         ┌──────────────────┐             │
│  │ 새 Task 모드  │         │ 기존 Task 모드    │             │
│  │ Step 1부터    │         │ Step 0-1부터     │             │
│  └──────────────┘         └──────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Workflow by Mode

**`/new-dev-task` (PRD Preparation - STOP before implementation):**
```
Step 1 → Step 2 → [Step 2-1] → Step 3 (Git Branch) → Step 4 (Task + Sync + Merge)
     → Step 5 (Read Project + PRD + Tech Spec) → Step 5.5 (Codex Feedback) → Step 5.6 (PRD Update)
     → STOP 🛑 → Suggest "/start-dev-task"
```

**`/start-dev-task` (Implementation):**
```
Step 6 (codex-claude-loop) → Step 7 (Validation)
```

**Existing Task Mode (task_id provided to /start-dev-task):**
```
Step 0-1 → Step 0-2 → Step 3 (conditional) → Step 4 (conditional) → Step 5 (conditional) → Step 6 → Step 7
```

> **🛑 CRITICAL: `/new-dev-task` MUST STOP after Step 5.6. Never proceed to Step 6.**
> **🚨 Implementation (Step 6-7) only starts via `/start-dev-task` command.**

### Checklist Pattern (Copy and track progress)

**For `/new-dev-task`:**
```
PRD Preparation Progress:
- [ ] Step 1: Environment detection
- [ ] Step 2: Collect Task info
- [ ] Step 3: Create Git branch
- [ ] Step 4: Create Task + Sync + Merge
- [ ] Step 5-1: Read parent Project file (architecture rules)
- [ ] Step 5-2: Write Tech Spec (following Project rules)
- [ ] Step 5-3: Write Todo
- [ ] Step 5.5: Get Codex PRD feedback
- [ ] Step 5.6: Update PRD with feedback
- [ ] STOP and suggest /start-dev-task
```

**For `/start-dev-task`:**
```
Implementation Progress:
- [ ] Step 6: codex-claude-loop (implementation)
- [ ] Step 7: Validation
```

---

## 기존 Task 모드 전용 Steps

### Step 0-1: Task 존재 확인 + 로드

```bash
# Task 파일 찾기
grep -rl "entity_id: \"$task_id\"" /Volumes/LOOP_CORE/vault/LOOP/50_Projects/

# 또는 ID 패턴으로 검색
find /Volumes/LOOP_CORE/vault/LOOP/50_Projects -name "*.md" -exec grep -l "$task_id" {} \;
```

**확인 사항:**
- Task 파일 존재 여부
- Task의 project_id
- Task의 target_project
- Task의 type (dev 여야 함)

**Task 없으면:**
```
Task를 찾을 수 없습니다: {task_id}
올바른 Task ID인지 확인하세요.
```

### Step 0-2: Check Current State

Read Task file and check:

| Check Item | If Exists | If Missing |
|------------|-----------|------------|
| Notes > Tech Spec | Skip Step 5 | Run Step 5 |
| Notes > Todo | Skip Step 5 | Run Step 5 |
| Git branch | Skip Step 3 | Run Step 3 |

> **Note**: In Existing Task Mode, Step 4-1 (Task creation) is always skipped since Task already exists.
> Step 4-2, 4-3 (Sync + Merge) only needed if Step 3 created new branch.

```bash
# Check if Git branch exists
git branch -a | grep "$task_id"
```

**Output:**
```
Task state check complete

Task: {task_id}
Project: {project_id}
Target: {target_project}

Current state:
- Tech Spec: {exists/missing}
- Todo: {exists/missing}
- Git branch: {exists/missing/N/A}
```

---

## 새 Task 모드 Steps

### Step 1: 프로젝트 환경 감지

현재 디렉토리의 Git remote로 프로젝트 타입 판별:

```bash
# 현재 경로로 LOOP Vault 감지
pwd | grep -q "LOOP_CORE/vault/LOOP" && echo "loop"

# Git remote로 외부 프로젝트 감지
git remote get-url origin 2>/dev/null
```

| Remote URL / 경로 패턴 | target_project | Git 브랜치 |
|------------------------|----------------|-----------|
| `LOOP_CORE/vault/LOOP` | loop | 스킵 |
| `sosi` 포함 | sosi | 생성 |
| `kkokkkok` 포함 | kkokkkok | 생성 |
| `loop-api` 포함 | loop-api | 생성 |
| 기타 | 사용자에게 질문 | (선택) |

### Step 2: Task 정보 수집

**AskUserQuestion으로 수집:**
- `entity_name` - Task 이름 (인자로 받았으면 스킵)
- `project_id` - 연결할 Project (기존 선택 또는 새로 생성)

**project_id 수집 분기:**

| target_project | project_id 수집 방법 |
|----------------|---------------------|
| `loop` (Vault) | `50_Projects/Vault_System/Rounds/` 목록에서 선택 **또는 새 Project 생성** |
| `sosi` | 사용자 직접 입력 또는 최근 Project 선택 **또는 새 Project 생성** |
| `kkokkkok` | 사용자 직접 입력 또는 최근 Project 선택 **또는 새 Project 생성** |

**Project 선택 옵션 (AskUserQuestion):**
```
연결할 Project를 선택하세요:
1. [기존 Project 목록...]
2. ➕ 새 Project 생성
```

### Step 2-1: 새 Project 생성 (선택 시)

> **새 Project 생성 선택 시에만 실행**

**loop-entity-creator로 Project 생성:**
```yaml
entity_type: Project
entity_name: {사용자 입력}
owner: "김은향"        # 기본값
parent_id: "trk-2"    # ⭐ Dev Task용 기본값 (Track 2: Data)
conditions_3y: ["cond-b"]  # ⭐ 기본값 (Condition B: Loop Dataset)
```

**사용자에게 확인:**
```
새 Project를 생성합니다:
- 이름: {입력한 이름}
- Track: trk-2 (Data) ← 다른 Track이면 지정
- Condition: cond-b ← 다른 Condition이면 지정
```

**After creation:**
- Use generated `project_id` for Task creation
- Proceed to Step 3 (Git Branch Creation)

**Auto-set (no questions):**
- `type` = "dev" (fixed)
- `target_project` = detected in Step 1
- `assignee` = "김은향" (fixed)

### Step 3: Git Branch Creation (LOOP Vault + External Projects)

> **CRITICAL: Create branches BEFORE Task creation**
> **LOOP Vault (public, exec) always creates branches**
> **External projects also create branches when applicable**
> **Purpose: Prevent conflicts with `/nas-git local-sync` in parallel sessions**

#### Step 3-1: LOOP Vault Branch Creation (always)

```bash
# PUBLIC Vault branch
cd ~/dev/loop/public
git stash --include-untracked -m "auto-stash before branch: {task_id}"
git checkout main
git pull origin main
git checkout -b {task_id}
git stash pop 2>/dev/null || true

# EXEC Vault branch
cd ~/dev/loop/exec
git stash --include-untracked -m "auto-stash before branch: {task_id}"
git checkout main
git pull origin main
git checkout -b {task_id}
git stash pop 2>/dev/null || true
```

#### Step 3-2: External Project Branch Creation (when applicable)

> **Only for target_project: sosi, kkokkkok, loop-api**

```bash
cd {project_full_path}

# Update dev/main branch
git checkout dev 2>/dev/null || git checkout main
git pull origin dev 2>/dev/null || git pull origin main

# Create Task branch
git checkout -b {task_id}
```

**Project Path Mapping:**
```yaml
sosi: /Users/gim-eunhyang/dev/flutter/sosi
kkokkkok: /Users/gim-eunhyang/dev/flutter/kkokkkokfit_web
loop-api: /Volumes/LOOP_CORE/vault/LOOP
```

**Output:**
```
Git branches created:
- public vault: {task_id}
- exec vault: {task_id}
- {target_project}: {task_id} (if applicable)
```

---

## Common Steps (Both Modes)

### Step 4: Task File Creation + Worktree Sync

> **MUST: Task creation via `loop-entity-creator` skill**
> **CRITICAL: After Task API creates file on NAS main, sync and merge to worktree**

#### Step 4-1: Create Task (loop-entity-creator)

**Pass to loop-entity-creator:**
```yaml
entity_type: Task
entity_name: {collected name}
project_id: {collected project_id}
assignee: "김은향"      # fixed
type: "dev"            # fixed
target_project: {detected value}
```

#### Step 4-2: NAS Sync

> **CRITICAL: Task API creates file on NAS main branch. Must sync before editing.**

```bash
# Sync NAS → GitHub → Local main
/nas-git local-sync

# Wait for sync completion (approx 10-15 seconds)
```

#### Step 4-3: Merge main into worktree branches

> **CRITICAL: Bring Task file from main into worktree branches**

```bash
# Merge main into public vault branch
cd ~/dev/loop/public
git merge main --no-edit

# Merge main into exec vault branch
cd ~/dev/loop/exec
git merge main --no-edit

# For external projects (if applicable)
cd {project_full_path}
git merge main --no-edit 2>/dev/null || git merge dev --no-edit 2>/dev/null || true
```

**Output:**
```
Task file synced to worktree:
- Task ID: {task_id}
- Task file now available in branch for editing
```

### Step 5: prompt-enhancer 호출 (Notes 비어있으면)

> **CRITICAL: Notes 섹션(Tech Spec, Todo)이 비어있으면 반드시 실행**
> **기존 Task 모드에서 이미 채워져 있으면 스킵 가능**

#### 5-1. Project 파일에서 PRD 확인/추가

Project 파일의 `## Notes > ### PRD` 섹션에 Task 내용 추가:

```markdown
#### {task_id}: {task_name}
- **문제 정의**: [이 Task가 해결하려는 문제]
- **목표**: [달성하려는 결과]
- **핵심 요구사항**:
  - [요구사항 1]
  - [요구사항 2]
  - [요구사항 3]
```

#### 5-2. Task 파일 Notes 섹션 채우기

```markdown
## Notes

### Tech Spec
- **프레임워크/라이브러리**: [사용할 기술 스택]
- **아키텍처 패턴**: [적용할 패턴 - Clean Architecture, MVVM 등]
- **파일 구조**:
  ```
  lib/
  ├─ presentation/
  │   └─ [feature]/
  ├─ domain/
  │   ├─ entities/
  │   └─ usecases/
  └─ data/
      ├─ models/
      └─ repositories/
  ```
- **API 엔드포인트**: [필요 시]
- **데이터 모델**: [필요 시]
- **상태 관리**: [Riverpod/Bloc 등]
- **의존성**: [필요한 패키지]

### Todo
- [ ] [구체적인 작업 항목 1]
- [ ] [구체적인 작업 항목 2]
- [ ] [구체적인 작업 항목 3]
- [ ] [구체적인 작업 항목 4]
- [ ] 테스트 작성
- [ ] 빌드 확인

### 작업 로그
<!-- workthrough 스킬로 자동 기록 -->
```

### Step 6: codex-claude-loop 호출 (MANDATORY - 스킵 불가)

> **🚨 MANDATORY: 이 Step은 절대 스킵할 수 없습니다**
> **🚨 CRITICAL: 모든 코드 구현은 반드시 이 스킬을 통해 진행**
> **🚨 NEVER: codex-claude-loop 없이 직접 코드 작성 절대 금지**

#### 호출 방법 (MUST USE)

```
반드시 Skill tool을 사용하여 codex-claude-loop 스킬을 호출하세요:

Skill tool 호출:
  skill: "codex-claude-loop"
  args: "{task_id}"
```

#### Pre-call Checklist

- [ ] Git branch created or skipped (Step 3)
- [ ] Task file created + synced to worktree (Step 4)
- [ ] Notes section (Tech Spec, Todo) filled (Step 5)
- [ ] **Call codex-claude-loop after all above completed**

#### codex-claude-loop이 수행하는 작업

**Phase 1: 계획 수립 (Claude)**
- Tech Spec, Todo 기반 구현 계획
- 단계별 구현 순서
- 예상 이슈/리스크 문서화

**Phase 2: 계획 검증 (Codex)**
```bash
codex exec -m gpt-5-codex -s read-only -C /Users/gim-eunhyang/dev/loop/public -- <<'EOF'
Review this implementation plan and identify any issues:
[Claude's plan]

Check for:
- Logic errors
- Missing edge cases
- Architecture flaws
- Security concerns
EOF
```

**Phase 3: 구현 (Claude)**
- 검증된 계획에 따라 코드 작성
- Edit/Write/Read 도구 사용

**Phase 4: 코드 리뷰 (Codex)**
- 버그 탐지
- 성능 이슈 검토
- 베스트 프랙티스 검증

**Phase 5: 반복**
- Codex 피드백 기반 수정
- 품질 기준 충족까지 반복

#### Step 6 완료 조건

> **codex-claude-loop 스킬이 완료될 때까지 Step 7로 진행 금지**

### Step 7: Validation

```bash
python3 scripts/validate_schema.py .
python3 scripts/build_graph_index.py .
```

---

## 완료 메시지 형식

### 새 Task 모드

```
Dev Task 생성 완료

Task ID: {task_id}
Task: {task_name}
Project: {project_id}
Type: dev
Target: {target_project}

파일 위치: {task_file_path}

{Git 브랜치 정보 - 외부 프로젝트인 경우}

Task Notes:
- Tech Spec: 작성 완료
- Todo: 작성 완료

구현:
- codex-claude-loop 진행 중...

작업 완료 시: /done-dev-task
```

### 기존 Task 모드

```
기존 Task로 개발 시작

Task ID: {task_id}
Task: {task_name}
Project: {project_id}
Type: {type}
Target: {target_project}

파일 위치: {task_file_path}

스킵된 단계:
- Task 생성 (기존 Task 사용)
- {Git 브랜치 - 이미 존재/해당없음}
- {Tech Spec/Todo - 이미 작성됨}

구현:
- codex-claude-loop 진행 중...

작업 완료 시: /done-dev-task
```

---

## NEVER DO (절대 금지)

- Step 스킵 (조건부 스킵 제외)
- prompt-enhancer 없이 Notes 비워두고 진행
- **🚨 codex-claude-loop 없이 직접 코드 작성 (가장 중요)**
  - Edit/Write 도구로 코드 직접 작성 금지
  - 반드시 `Skill tool`로 `codex-claude-loop` 호출 후 구현
  - codex-claude-loop 스킵 시 워크플로우 실패로 간주
- 기존 Task 모드에서 새 Task 생성
- task_id 검증 없이 진행
- Step 6 완료 전 Step 7 진행

## ALWAYS DO (필수 실행)

- Step 0에서 모드 판단 먼저
- 각 Step 완료 확인 후 다음 진행
- Notes 섹션 (Tech Spec, Todo) 채우기
- **🚨 Step 6에서 반드시 `Skill tool`로 `codex-claude-loop` 호출**
  - 호출 없이 직접 구현 시 워크플로우 위반
  - codex-claude-loop 완료 후에만 Step 7 진행
- 완료 메시지 출력

---

## Error Handling

| 상황 | 처리 |
|------|------|
| task_id 못찾음 | "Task를 찾을 수 없습니다" 메시지 |
| LOOP Vault 마운트 안됨 | "LOOP Vault 마운트 필요" 메시지 |
| 프로젝트 감지 실패 | AskUserQuestion으로 target_project 질문 |
| Git 브랜치 이미 존재 | 해당 브랜치로 checkout |
| codex 명령 실패 | Claude만으로 진행 (사용자 확인) |

---

## Project Mapping

```yaml
projects:
  loop:
    path_pattern: "/Volumes/LOOP_CORE/vault/LOOP"
    remote_pattern: null
    full_path: "/Volumes/LOOP_CORE/vault/LOOP"
    skip_git_branch: false  # LOOP Vault도 브랜치 생성 (병렬 sync 충돌 방지)

  sosi:
    path_pattern: "/sosi"
    remote_pattern: "sosi"
    full_path: "/Users/gim-eunhyang/dev/flutter/sosi"
    skip_git_branch: false

  kkokkkok:
    path_pattern: "/kkokkkokfit"
    remote_pattern: "kkokkkokfit"
    full_path: "/Users/gim-eunhyang/dev/flutter/kkokkkokfit_web"
    skip_git_branch: false

vault:
  path: "/Volumes/LOOP_CORE/vault/LOOP"
  template: "00_Meta/_TEMPLATES/template_task.md"
  projects_dir: "50_Projects"
```

---

## Related

- `/done-dev-task` - Task 완료 및 PR 생성
- `/new-task` - 일반 Task 생성 (LOOP Vault 전용)
- `loop-entity-creator` - LOOP Vault 엔티티 생성 스킬
- `codex-claude-loop` - 듀얼 AI 구현 루프 스킬
