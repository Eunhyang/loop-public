# Entity Type Archive Index: {TYPE}

> 이 파일은 특정 엔티티 타입의 아카이브 인덱스입니다.
> 파일명: `by_type/{type}.md` (예: `by_type/task.md`, `by_type/experiment.md`)

## Available Type Indexes

| Type | File | Description |
|------|------|-------------|
| Task | `task.md` | 완료된 태스크 |
| Experiment | `experiment.md` | 완료된 실험 |
| Hypothesis | `hypothesis.md` | 검증 완료된 가설 |

---

## Index Format

### For task.md

| ID | Project | Title | Closed | Path |
|----|---------|-------|--------|------|
| `tsk-XXX-01` | prj-XXX | 제목 | 2025-XX-XX | [[path]] |

### For experiment.md

| ID | Project | Title | Closed | Result | Path |
|----|---------|-------|--------|--------|------|
| `exp-XXX` | prj-XXX | 제목 | 2025-XX-XX | success/fail | [[path]] |

### For hypothesis.md

| ID | Project | Title | Closed | Verdict | Path |
|----|---------|-------|--------|---------|------|
| `hyp-XXX` | prj-XXX | 제목 | 2025-XX-XX | validated/falsified | [[path]] |

---

## Notes

- 타입별 전체 목록이 필요할 때 사용
- 대부분의 경우 by_project/ 또는 by_time/이 더 효율적
- catalog.jsonl의 entity_type 필드로 필터링 가능
