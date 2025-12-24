---
entity_type: PolicyDocument
entity_id: meta:archive-policy
entity_name: Archive Operation Policy
created: 2025-12-22
updated: 2025-12-22
version: "1.0"
tags: ["meta", "policy", "archive", "automation"]
---

# Archive Operation Policy v1.0

> 90_Archive 운영 규칙 및 자동화 스펙 정의

---

## 1. 핵심 원칙

### 1.1 카탈로그 = 생성물

| 파일 | 역할 | 편집 |
|------|------|------|
| `90_Archive/tasks/**/*.md` | 원문 (Source of Truth) | 수동 가능 |
| `90_Archive/00_Catalog/*` | 인덱스 (생성물) | **수동 편집 금지** |

- `catalog.jsonl`, `by_project/*.md`, `by_time/*.md`는 항상 재생성 가능해야 함
- 스크립트가 덮어쓰기로 생성

### 1.2 아카이브 여부 = 위치로 판단

- `status`에 `archived` 값 **없음**
- 아카이브 여부는 "90_Archive에 있는지"로 판단
- `status`는 업무 상태, archive는 스토리지 레이어

---

## 2. 스키마 확장 (Task)

### 2.1 추가 필드

```yaml
# === 완료/아카이브 관련 ===
closed: date | null              # 실제 완료/종료일 (사람이 기록)
archived_at: date | null         # 아카이브 이동일 (스크립트 자동)
closed_inferred: string | null   # closed 추정 출처 (backfill 시)
```

### 2.2 closed_inferred 값

| 값 | 의미 |
|----|------|
| `null` | 사람이 직접 기록 (정확) |
| `updated` | updated 필드에서 복사 |
| `git_commit_date` | git 마지막 커밋 날짜 |
| `today` | 아카이브 시점 (추정) |

### 2.3 검증 규칙

```yaml
# Task 아카이브 조건
- status IN (done, failed, learning)
- closed: 없으면 스크립트가 채움 (우선순위 적용)
- archived_at: 스크립트가 자동 기록
```

---

## 3. 아카이브 트리거

### 3.1 대상 조건

```
entity_type: task
AND status IN (done, failed, learning)
AND (
    소속 프로젝트 status = done
    OR 소속 프로젝트에 program_id 있음 (Program-Round 구조)
)
```

### 3.2 프로젝트 유형별 규칙

| 프로젝트 유형 | 프로젝트 상태 | 태스크 상태 | 아카이브? |
|--------------|--------------|------------|----------|
| 일반 (program_id 없음) | active | done | ❌ |
| 일반 (program_id 없음) | done | done | ✅ |
| Program-Round (program_id 있음) | active | done | ✅ |
| Program-Round (program_id 있음) | active | active | ❌ |

**이유**:
- 일반 프로젝트: 프로젝트 진행 중에는 완료된 태스크도 참조할 일이 많음
- Program-Round: Program은 상시 운영 (절대 done 안 됨)이므로 태스크 완료 시 바로 아카이브

### 3.3 운영 정책 (권장)

- `closed` 후 7일 경과 시 아카이브 대상
- 또는 수동으로 `archive_task.py` 실행

---

## 4. closed 채움 우선순위

`archive_task.py`가 closed 없는 태스크를 처리할 때:

| 순위 | 조건 | closed 값 | closed_inferred |
|------|------|-----------|-----------------|
| 1 | frontmatter에 완료 날짜 있음 | 해당 날짜 | `null` |
| 2 | updated 있음 | updated 값 | `updated` |
| 3 | git 커밋 기록 있음 | `git log -1 --format=%cs` | `git_commit_date` |
| 4 | 아무것도 없음 | today | `today` |

---

## 5. 폴더 구조 및 경로 규칙

### 5.1 아카이브 원문

```
90_Archive/tasks/{project_id}/{YYYY}/{MM}/{task_id}.md
```

- `{YYYY}/{MM}`은 `closed` 날짜 기준
- 예: `90_Archive/tasks/prj-003/2025/12/tsk-003-01.md`

### 5.2 Stub 파일

```
50_Projects/{year}/{prj-folder}/_task_stubs/{task_id}.md
```

- 핫 폴더 깔끔 유지를 위해 원래 자리에 stub 남기지 않음
- 프로젝트별 `_task_stubs/` 폴더에 모음

### 5.3 첨부파일

```
90_Archive/artifacts/{task_id}/파일명.확장자
```

- **처음부터** 이 위치에 저장 (핫 영역에 두지 않음)
- 아카이브 이동 시 첨부 이동 불필요
- 링크 리라이트 없음

---

## 6. Stub 파일 포맷

```yaml
---
task_id: tsk-003-01
project_id: prj-003
status: done
closed: 2025-12-20
archived_at: 2025-12-22
archive_path: 90_Archive/tasks/prj-003/2025/12/tsk-003-01.md
---

# tsk-003-01: 태스크 제목

1~2줄 요약

## Links
- [[prj-003]]
- [[cond-b]]
```

---

## 7. 카탈로그/인덱스 스펙

### 7.1 catalog.jsonl

**위치**: `90_Archive/00_Catalog/catalog.jsonl`

**포맷** (1줄 = 1 태스크):
```json
{"vault":"loop_obsidian","entity_type":"task","task_id":"tsk-003-01","project_id":"prj-003","created":"2025-09-12","closed":"2025-12-20","status":"done","title":"태스크 제목","summary":"1줄 요약","path":"90_Archive/tasks/prj-003/2025/12/tsk-003-01.md","tags":["tag1","tag2"]}
```

**정렬**: `closed DESC`, `task_id ASC`

### 7.2 by_project/{prj-id}.md

**위치**: `90_Archive/00_Catalog/by_project/{prj-id}.md`

**포맷**:
```markdown
# Project Archive Index: {prj-id}

## Quick Stats
| Metric | Value |
|--------|-------|
| Total Archived | N |
| Date Range | YYYY-MM ~ YYYY-MM |
| Last Updated | YYYY-MM-DD |

## Archived Tasks

| ID | Title | Closed | Summary |
|----|-------|--------|---------|
| tsk-xxx-xx | 제목 | 2025-12-20 | 1줄 요약 |
```

**정렬**: `closed DESC`

### 7.3 by_time/{YYYY-MM}.md

**위치**: `90_Archive/00_Catalog/by_time/{YYYY-MM}.md`

**포맷**:
```markdown
# Monthly Archive Index: {YYYY-MM}

## Quick Stats
| Metric | Value |
|--------|-------|
| Total Archived | N |
| Projects | prj-001, prj-003 |
| Last Updated | YYYY-MM-DD |

## Archived This Month

| ID | Project | Title | Closed |
|----|---------|-------|--------|
| tsk-xxx-xx | prj-xxx | 제목 | 2025-12-20 |
```

**정렬**: `task_id ASC`

---

## 8. 스크립트 스펙

### 8.1 archive_task.py

**용도**: 단일 태스크 아카이브

**입력**:
- 태스크 파일 경로 또는 task_id

**동작**:
1. frontmatter 파싱
2. 검증:
   - `task_id`, `project_id`, `status` 필수
   - `status IN (done, failed, learning)`
   - 중복 `task_id` 체크 (archive에 이미 있으면 실패)
3. `closed` 없으면 우선순위에 따라 채우고 md 업데이트
4. `archived_at` = today 기록
5. 경로 계산: `90_Archive/tasks/{project_id}/{YYYY}/{MM}/{task_id}.md`
6. `git mv`로 이동
7. stub 생성 → `50_Projects/{prj}/_task_stubs/{task_id}.md`

**옵션**:
- `--dry-run`: 실제 이동 없이 미리보기
- `--no-stub`: stub 생성 안 함

### 8.2 build_archive_catalog.py

**용도**: 카탈로그/인덱스 전체 재생성

**동작**:
1. `90_Archive/tasks/**/*.md` 전체 스캔
2. frontmatter 파싱
3. 정렬 규칙 적용
4. 덮어쓰기 생성:
   - `catalog.jsonl`
   - `by_project/{prj-id}.md`
   - `by_time/{YYYY-MM}.md`

**정렬 규칙**:
- `catalog.jsonl`: `closed DESC`, `task_id ASC`
- `by_project/*.md`: `closed DESC`
- `by_time/*.md`: `task_id ASC`

---

## 9. 강제 장치

### 9.1 pre-commit hook

```bash
# 인덱스 재생성
python3 scripts/build_archive_catalog.py .

# 변경 있으면 staging
git add 90_Archive/00_Catalog/
```

### 9.2 GitHub Actions

```yaml
- name: Verify archive catalog
  run: |
    python3 scripts/build_archive_catalog.py .
    if ! git diff --quiet 90_Archive/00_Catalog/; then
      echo "Archive catalog not up to date"
      exit 1
    fi
```

---

## 10. Backfill 규칙 (기존 done 태스크)

### 10.1 대상

- `status IN (done, failed, learning)`
- `closed` 필드 없음

### 10.2 처리

1. `closed` 채움 (우선순위 적용)
2. `closed_inferred` 기록 (출처 표시)
3. 아카이브 이동은 선택 (일괄 또는 점진적)

### 10.3 품질 원칙

- 과거는 "추정치"로 관리
- 앞으로는 정확히 기록

---

## 11. 프로젝트 아카이브

- 현재는 `closed` 필드 **안 넣음**
- Decision 로그(완료/피벗/중단)만 강제
- 필요 시 나중에 추가

---

## 참고 문서

- [[_ARCHIVE_ENTRY]] - 아카이브 접근 규칙 (LLM용)
- [[schema_registry]] - 전체 스키마 정의
- [[build_config]] - 자동화 설정

---

**Version**: 1.1
**Last Updated**: 2025-12-23
**Author**: Claude Code

**Changes (v1.1)**:
- 프로젝트 상태 체크 규칙 추가 (일반 vs Program-Round)
- 일반 프로젝트: 프로젝트 done 시에만 태스크 아카이브 가능
- Program-Round 프로젝트: 태스크 done 시 바로 아카이브 가능
