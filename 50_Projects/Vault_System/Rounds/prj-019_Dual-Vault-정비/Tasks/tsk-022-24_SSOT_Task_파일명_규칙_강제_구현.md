---
entity_type: Task
entity_id: "tsk-022-24"
entity_name: "SSOT - Task 파일명 규칙 강제 구현"
created: 2026-01-07
updated: 2026-01-07
closed: 2026-01-07
status: done

# === 계층 ===
parent_id: "prj-019"
project_id: "prj-019"
aliases: ["tsk-022-24"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-07
due: 2026-01-07
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 분류 ===
tags: ["ssot", "task-filename", "phase-1"]
priority_flag: high
---

# SSOT - Task 파일명 규칙 강제 구현

> Task ID: `tsk-022-24` | Project: `prj-019` | Status: done

## 목표

**완료 조건**:
1. Task 파일명 패턴 조사 완료 (현황 파악)
2. SSOT_CONTRACT.md v1.2 업데이트 (마이그레이션 플랜 포함)
3. Phase 1 구현 완료 (신규 Task 생성 시 tsk-{id}.md 강제)
4. 신규 Task 10개 생성 테스트 통과

---

## 상세 내용

### 배경

SSOT_CONTRACT.md v1.1에서 Task 파일명 규칙 (`tsk-{id}.md`)을 정의했으나, 실제 구현에는 반영되지 않음.
- API: `sanitize_filename(entity_name) + ".md"` 사용 (content-based)
- loop-entity-creator 스킬: `{entity_name}.md` 경로 생성

결과: 현재 ~85% Task 파일이 content-based 이름 (예: "CoachOS_프로토타입_개발.md")

### 작업 내용

**1. Task 파일명 패턴 조사**
- 전체 Task 파일 통계 생성
- tsk-{id} vs content-based 분포 파악
- 결과를 SSOT_CONTRACT v1.2에 반영

**2. SSOT_CONTRACT v1.2 업데이트**
- 현재 상태 통계 추가
- Phase 1/2/3 마이그레이션 플랜 추가
- 각 Phase별 기한, 책임자, 성공 기준 명시

**3. Phase 1 구현 (신규 생성 강제)**
- `api/routers/tasks.py:117` 수정: `filename = f"{task_id}.md"`
- `.claude/skills/loop-entity-creator/SKILL.md` Step 4 수정
- 검증: 신규 Task 10개 테스트

---

## 체크리스트

- [x] Task 파일명 패턴 조사 스크립트 작성 및 실행
- [x] SSOT_CONTRACT.md Section 4.2 v1.2 업데이트
- [x] api/routers/tasks.py 파일명 생성 로직 수정
- [x] loop-entity-creator 스킬 문서 업데이트
- [x] 신규 Task 10개 생성 테스트
- [x] validate_schema.py 실행 (에러 없음)
- [x] Git commit 완료

---

## Notes

### PRD (Product Requirements Document)

#### 📊 아키텍처 도식

```
┌────────────────────────────────────────────────────────────────────────────┐
│              Task Filename Standardization Architecture                    │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Entry Points Layer                                                    │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │  /new-task ──→ loop-entity-creator ──→ API /api/tasks (POST)        │  │
│  │      │                                        │                      │  │
│  │      ↓                                        ↓                      │  │
│  │  entity_name input                   TaskCreate schema              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│       │                                                                     │
│       ↓                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Filename Generation Layer (CRITICAL FIX)                              │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │  ❌ BEFORE: sanitize_filename(entity_name) + ".md"                  │  │
│  │             → "CoachOS_프로토타입_개발.md" (content-based)            │  │
│  │                                                                      │  │
│  │  ✅ AFTER: f"{task_id}.md"                                           │  │
│  │            → "tsk-022-24.md" (ID-based, SSOT compliant)             │  │
│  │                                                                      │  │
│  │  Implementation location:                                           │  │
│  │    - api/routers/tasks.py:117                                        │  │
│  │    - .claude/skills/loop-entity-creator/SKILL.md:Step 4             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│       │                                                                     │
│       ↓                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ File Creation Layer                                                   │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │  tasks_dir / filename                                                 │  │
│  │       │                                                               │  │
│  │       ↓                                                               │  │
│  │  50_Projects/{project}/Tasks/tsk-{id}.md                             │  │
│  │       │                                                               │  │
│  │       ↓                                                               │  │
│  │  Frontmatter (SSOT):                                                 │  │
│  │    entity_id: tsk-022-24                                              │  │
│  │    entity_name: "SSOT - Task 파일명 규칙 강제 구현"                     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│       │                                                                     │
│       ↓                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Migration Layer (Phase 2)                                             │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │  scripts/rename_task_files.py                                         │  │
│  │       │                                                               │  │
│  │       ├──→ Glob: 50_Projects/**/Tasks/*.md                           │  │
│  │       │                                                               │  │
│  │       ├──→ For each file:                                            │  │
│  │       │     - Read frontmatter                                        │  │
│  │       │     - Extract entity_id                                       │  │
│  │       │     - Rename: old_name.md → tsk-{id}.md                      │  │
│  │       │     - Update Git tracking                                     │  │
│  │       │                                                               │  │
│  │       └──→ Validation: All files follow tsk-{id}.md                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 📋 프로젝트 컨텍스트

- **Framework**: FastAPI (Python 3.10+) + Claude Code Skills
- **Architecture**: API-First Pattern with Fallback
- **SSOT**: Markdown Frontmatter (entity_id)
- **Key Files**:
  - API: `api/routers/tasks.py`
  - Skill: `.claude/skills/loop-entity-creator/SKILL.md`
  - Contract: `00_Meta/SSOT_CONTRACT.md`
- **Current Status**: ~85% content-based filenames, ~15% tsk-{id} pattern

#### 🎯 구현 범위

**주요 기능**:
1. **Task 파일명 패턴 조사**: 현재 상태 파악 및 통계 생성
2. **SSOT_CONTRACT v1.2 업데이트**: 마이그레이션 플랜 추가
3. **Phase 1 구현**: 신규 Task 생성 시 `tsk-{id}.md` 강제

**파일 구조**:
```
public/
├── api/
│   └── routers/
│       └── tasks.py                         # 수정: L117 filename 생성 로직
├── .claude/
│   └── skills/
│       └── loop-entity-creator/
│           └── SKILL.md                      # 수정: Step 4 경로 생성
├── 00_Meta/
│   └── SSOT_CONTRACT.md                      # 업데이트: v1.1 → v1.2
└── scripts/
    └── rename_task_files.py                  # 신규: Phase 2 마이그레이션
```

#### 📝 상세 구현 요구사항

**1. Task 파일명 패턴 조사 및 현황 파악**

분석 스크립트:
```python
import re
from pathlib import Path
from collections import Counter

def analyze_task_filenames(vault_path):
    """Analyze Task filename patterns in LOOP Vault"""
    patterns = {
        'tsk_id_only': re.compile(r'^tsk-[\w-]+\.md$'),
        'tsk_id_desc': re.compile(r'^tsk-[\w-]+_.+\.md$'),
        'content_based': r'.*'
    }

    results = Counter()
    task_files = Path(vault_path).rglob('50_Projects/**/Tasks/*.md')

    for file in task_files:
        filename = file.name
        if patterns['tsk_id_only'].match(filename):
            results['tsk_id_only'] += 1
        elif patterns['tsk_id_desc'].match(filename):
            results['tsk_id_desc'] += 1
        else:
            results['content_based'] += 1

    return results
```

**2. SSOT_CONTRACT v1.2 업데이트**

Section 4.2에 추가할 내용:
```markdown
**현재 상태 (2026-01-07 조사)**:
- Total Tasks: [조사 결과]
- tsk-{id}.md 패턴: [개수] ([%])
- Content-based: [개수] ([%])

**목표 상태**: 100% tsk-{id}.md 통일

**마이그레이션 플랜**:

**Phase 1 (2026-01 W2)**: 신규 생성 강제
- 기한: 2026-01-14
- 작업:
  1. api/routers/tasks.py:117 수정
  2. loop-entity-creator 스킬 Step 4 수정
  3. 검증: 신규 Task 10개 테스트
- 성공 기준: 이후 생성되는 모든 Task가 tsk-{id}.md

**Phase 2 (2026-01 W3)**: 기존 파일 자동 rename
- 기한: 2026-01-21
- 작업: scripts/rename_task_files.py 실행
- 성공 기준: 100% 파일명 통일

**Phase 3 (2026-01 W4)**: 통일 완료 검증
- 기한: 2026-01-28
- 작업: SSOT_CONTRACT v2.0 승격
```

**3. Phase 1 구현**

**A. api/routers/tasks.py:117 수정**

BEFORE:
```python
filename = sanitize_filename(task.entity_name) + ".md"
task_file = tasks_dir / filename

if task_file.exists():
    base_name = sanitize_filename(task.entity_name)
    counter = 1
    while task_file.exists():
        filename = f"{base_name}_{counter}.md"
        task_file = tasks_dir / filename
        counter += 1
```

AFTER:
```python
# SSOT: tsk-{id}.md 강제
filename = f"{task_id}.md"
task_file = tasks_dir / filename

# entity_id는 유일하므로 충돌 불가
if task_file.exists():
    raise HTTPException(
        status_code=500,
        detail=f"Task file already exists: {filename}"
    )
```

**B. loop-entity-creator 스킬 Step 4 수정**

BEFORE:
```markdown
50_Projects/{project_name}/Tasks/{entity_name}.md
```

AFTER:
```markdown
50_Projects/{project_name}/Tasks/{task_id}.md

**CRITICAL**: File name MUST be `{task_id}.md`, NOT `{entity_name}.md`
- ✅ CORRECT: `tsk-022-24.md`
- ❌ WRONG: `SSOT_Task_파일명_규칙_강제_구현.md`
```

#### ✅ 성공 기준

**Phase 1 (신규 생성 강제)**:
- [ ] api/routers/tasks.py:117 수정 완료
- [ ] loop-entity-creator 스킬 Step 4 업데이트 완료
- [ ] 신규 Task 10개 생성 테스트 (모두 tsk-{id}.md)
- [ ] API 응답 file_path 필드 정확성 확인

**SSOT_CONTRACT v1.2**:
- [ ] Section 4.2 마이그레이션 플랜 추가
- [ ] 현재 상태 통계 반영
- [ ] Phase별 기한/책임자/성공 기준 명시
- [ ] Changelog 업데이트

**전체 검증**:
- [ ] validate_schema.py 실행 (에러 없음)
- [ ] check_orphans.py 실행 (경고 없음)
- [ ] Git commit 완료

### Todo
- [ ] Task 파일명 패턴 조사 스크립트 작성
- [ ] 조사 실행 및 통계 생성
- [ ] SSOT_CONTRACT.md Section 4.2 업데이트
- [ ] api/routers/tasks.py L117 수정
- [ ] loop-entity-creator 스킬 Step 4 수정
- [ ] 신규 Task 10개 생성 테스트
- [ ] 전체 검증 실행

### 작업 로그

#### 2026-01-07 22:30
**개요**: Task 파일명 규칙 `tsk-{id}.md` 강제 구현 완료. Phase 1 (신규 생성 강제) 구현 완료.

**변경사항**:
- 개발:
  - `scripts/analyze_task_filenames.py`: Task 파일명 패턴 조사 스크립트 신규 작성
- 수정:
  - `api/routers/tasks.py:117`: `filename = f"{task_id}.md"` 로 변경 (SSOT 준수)
  - `api/routers/youtube_weekly.py`: YouTube Weekly Task 생성 시 tsk-{id}.md 사용
  - `scripts/csv_to_loop_entities.py`: CSV importer Task 생성 시 tsk-{id}.md 사용
  - `.claude/skills/loop-entity-creator/SKILL.md:402`: Task 경로를 `{task_id}.md`로 명시
- 개선:
  - `00_Meta/SSOT_CONTRACT.md`: v1.2 업데이트, 3-phase 마이그레이션 플랜 추가

**핵심 변경**:
```python
# BEFORE: Content-based filename
filename = sanitize_filename(task.entity_name) + ".md"

# AFTER: ID-based filename (SSOT)
filename = f"{task_id}.md"
```

**결과**: ✅ 검증 통과 (validate_schema.py)

**다음 단계**:
- Phase 2 (2026-01 W3): 기존 파일 자동 rename (`scripts/rename_task_files.py` 실행)
- Phase 3 (2026-01 W4): 100% 통일 검증 및 SSOT_CONTRACT v2.0 승격


---

## 참고 문서

- [[prj-019]] - 소속 Project
- [[00_Meta/SSOT_CONTRACT.md]] - SSOT 계약서
- [[tsk-022-21]] - 선행 Task (Gap 분석)

---

**Created**: 2026-01-07
**Assignee**: 김은향
**Due**: 2026-01-07
