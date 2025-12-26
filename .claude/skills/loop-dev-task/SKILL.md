---
name: loop-dev-task
description: LOOP Vault 또는 외부 프로젝트(sosi, kkokkkok)에서 dev Task를 생성합니다. 외부 프로젝트는 Task ID와 동일한 Git 브랜치 자동 생성, LOOP Vault는 Git 브랜치 스킵. Task Notes에 Todo 템플릿 포함, Project Notes에 PRD 없으면 prompt-enhancer로 생성.
---

# Loop Dev Task

개발 작업용 Task 생성 스킬. Todo 관리와 PRD 자동 생성을 통합.

## Overview

이 스킬은 `/new-dev-task` 명령어에서 호출됩니다.

**핵심 기능:**
1. dev Task 생성 (type=dev)
2. 외부 프로젝트 감지 시 Git 브랜치 자동 생성
3. Task Notes에 Todo 체크리스트 템플릿 포함
4. Project PRD 없으면 prompt-enhancer로 자동 생성

## Workflow

### Step 1: 프로젝트 환경 감지

현재 디렉토리의 Git remote로 프로젝트 타입 판별:

```bash
git remote get-url origin 2>/dev/null
```

| Remote URL 패턴 | target_project | Git 브랜치 |
|----------------|----------------|-----------|
| `sosi` 포함 | sosi | 생성 |
| `kkokkkok` 포함 | kkokkkok | 생성 |
| `loop-api` 포함 | loop-api | 생성 |
| LOOP vault 또는 없음 | null | 스킵 |

### Step 2: Task 정보 수집

사용자에게 Task 이름 확인 (인자로 받았으면 스킵):

```
Task 이름: [사용자 입력 또는 인자]
```

**자동 설정되는 필드:**
- `type`: dev
- `target_project`: Step 1에서 감지
- `assignee`: 기본값 "김은향" (또는 members.yaml에서 선택)

### Step 3: Project 확인 및 PRD 체크

1. target_project에 해당하는 Project 찾기:
   - sosi → `50_Projects/*/Project_정의.md` 중 관련 프로젝트
   - kkokkkok → 동일
   - null (LOOP) → 사용자에게 project_id 질문

2. Project 파일의 Notes 섹션 확인:
   ```bash
   grep -A 20 "## Notes" {project_file}
   ```

3. PRD 내용이 비어있으면:
   - prompt-enhancer 스킬 호출
   - Task 이름과 Project 컨텍스트로 PRD 생성
   - Project 파일의 Notes 섹션 업데이트

### Step 4: Task 생성

`loop-entity-creator` 스킬의 Task 생성 로직 활용:

1. 다음 Task ID 생성 (e.g., `tsk-015-04`)
2. 템플릿 로드 (`00_Meta/_TEMPLATES/template_task.md`)
3. 플레이스홀더 치환:
   - `{{TYPE}}` → `dev`
   - `{{TARGET_PROJECT}}` → 감지된 값
   - Notes 섹션에 Todo 템플릿 포함됨 (템플릿에 이미 있음)

4. 파일 생성

### Step 5: Git 브랜치 생성 (외부 프로젝트만)

target_project가 null이 아니면:

```bash
# 현재 브랜치 확인
git branch --show-current

# dev 브랜치에서 분기
git checkout dev 2>/dev/null || git checkout main
git pull
git checkout -b {task_id}
```

출력:
```
Git 브랜치 생성 완료: {task_id}
현재 브랜치: {task_id}
```

### Step 6: Validation

```bash
python3 scripts/validate_schema.py .
python3 scripts/build_graph_index.py .
```

## PRD 자동 생성 (prompt-enhancer 연동)

Project Notes에 PRD가 비어있을 때:

1. 컨텍스트 수집:
   - Project 이름, 가설, 목표
   - Task 이름
   - 관련 Track/Condition

2. prompt-enhancer 호출:
   ```
   prompt-enhancer를 사용해 다음 프로젝트의 PRD를 생성해주세요:

   프로젝트: {project_name}
   Task: {task_name}
   가설: {hypothesis_text}
   ```

3. 생성된 PRD를 Project 파일 Notes 섹션에 삽입

## 완료 메시지 형식

```
Task 생성 완료

Task ID: tsk-015-04
Task: {task_name}
Project: prj-015
Type: dev
Target: {target_project}

파일 위치: 50_Projects/P015_.../Tasks/{task_name}.md

{Git 브랜치 정보 - 외부 프로젝트인 경우}

작업이 끝나면 /done-dev-task를 실행하세요.
```

## 관련 명령어

- `/done-dev-task` - Task 완료 및 브랜치 병합
- `/new-task` - 일반 Task 생성 (LOOP Vault 전용)
- `/new-project` - Project 생성

## Quick Examples

**외부 프로젝트 (sosi):**
```
pwd: /Users/.../sosi
/new-dev-task 로그인 버그 수정

→ Git remote 감지: sosi
→ Task 생성: tsk-005-03 (type=dev, target=sosi)
→ Git checkout -b tsk-005-03
→ 완료
```

**LOOP Vault:**
```
pwd: /Volumes/LOOP_CORE/vault/LOOP
/new-dev-task API 캐시 구현

→ Git remote: LOOP vault (브랜치 스킵)
→ project_id 질문
→ Task 생성: tsk-008-01 (type=dev, target=loop-api)
→ 완료 (브랜치 없음)
```

**PRD 자동 생성:**
```
/new-dev-task 음식 편향 테스트 기능

→ Project 확인: prj-008
→ PRD 비어있음 감지
→ prompt-enhancer 호출
→ PRD 자동 생성 및 삽입
→ Task 생성
→ 완료
```
