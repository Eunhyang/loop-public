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

### 모드별 워크플로우

**새 Task 모드 (task_id 없음):**
```
Step 1 → Step 2 → [Step 2-1 새 Project 생성 (선택 시)] → Step 3 → Step 4 → Step 5 → Step 6
```

**기존 Task 모드 (task_id 있음):**
```
Step 0-1 → Step 0-2 → Step 3 (조건부) → Step 4 (조건부) → Step 5 → Step 6
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

### Step 0-2: 현재 상태 파악

Task 파일 읽고 다음 확인:

| 확인 항목 | 있으면 | 없으면 |
|----------|--------|--------|
| Notes > Tech Spec | Step 4 스킵 | Step 4 실행 |
| Notes > Todo | Step 4 스킵 | Step 4 실행 |
| Git 브랜치 (외부 프로젝트) | Step 3 스킵 | Step 3 실행 |

```bash
# Git 브랜치 존재 확인
git branch -a | grep "$task_id"
```

**출력:**
```
Task 상태 확인 완료

Task: {task_id}
Project: {project_id}
Target: {target_project}

현재 상태:
- Tech Spec: {있음/없음}
- Todo: {있음/없음}
- Git 브랜치: {있음/없음/해당없음}
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

**생성 완료 후:**
- 생성된 `project_id`를 Task 생성에 사용
- Step 3로 진행

**자동 설정 (질문 없이):**
- `type` = "dev" (고정)
- `target_project` = Step 1에서 감지된 값
- `assignee` = "김은향" (고정)

### Step 3: Task 파일 생성

> **MUST: Task 생성은 반드시 `loop-entity-creator` 스킬을 통해 수행**

**loop-entity-creator에 전달:**
```yaml
entity_type: Task
entity_name: {수집한 이름}
project_id: {수집한 project_id}
assignee: "김은향"      # 고정
type: "dev"            # 고정
target_project: {감지값}
```

---

## 공통 Steps (두 모드 모두)

### Step 4: Git 브랜치 생성 (외부 프로젝트만, 없으면)

> **LOOP Vault (target_project=loop)인 경우 스킵**
> **기존 Task 모드에서 브랜치가 이미 있으면 스킵**

```bash
# 현재 외부 프로젝트 경로로 이동
cd {project_full_path}

# dev 브랜치 최신화
git checkout dev 2>/dev/null || git checkout main
git pull origin dev 2>/dev/null || git pull origin main

# Task ID로 브랜치 생성
git checkout -b {task_id}
```

**Project 경로 매핑:**
```yaml
sosi: /Users/gim-eunhyang/dev/flutter/sosi
kkokkkok: /Users/gim-eunhyang/dev/flutter/kkokkkokfit_web
loop-api: /Volumes/LOOP_CORE/vault/LOOP
```

**출력:**
```
Git 브랜치 생성 완료: {task_id}
현재 브랜치: {task_id}
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

### Step 6: codex-claude-loop 호출 (MUST - 항상 실행)

> **CRITICAL: 모든 코드 구현은 이 스킬을 통해 진행**
> **NEVER: codex-claude-loop 없이 직접 코드 작성 금지**

**Phase 1: 계획 수립 (Claude)**
- Tech Spec, Todo 기반 구현 계획
- 단계별 구현 순서
- 예상 이슈/리스크 문서화

**Phase 2: 계획 검증 (Codex)**
```bash
echo "Review this implementation plan and identify any issues:
[Claude's plan]

Check for:
- Logic errors
- Missing edge cases
- Architecture flaws
- Security concerns" | codex exec -m gpt-5-codex --config model_reasoning_effort="medium" --sandbox read-only
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
- codex-claude-loop 없이 직접 코드 작성
- 기존 Task 모드에서 새 Task 생성
- task_id 검증 없이 진행

## ALWAYS DO (필수 실행)

- Step 0에서 모드 판단 먼저
- 각 Step 완료 확인 후 다음 진행
- Notes 섹션 (Tech Spec, Todo) 채우기
- codex-claude-loop으로 구현 진행
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
    skip_git_branch: true

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
