# Archive Entry Point

> **LLM 필수 확인**: 이 파일은 90_Archive 접근의 진입점입니다.
> 아카이브 탐색 전 반드시 이 규칙을 따르세요.

## Archive Access Rules (MANDATORY)

### 1. When to Access Archive

Archive는 다음 경우에**만** 접근합니다:
- 사용자가 **명시적으로 과거 근거/원문**을 요청할 때
- **특정 ID**(task_id, project_id)가 주어질 때
- **특정 기간**(예: "2025년 9월")이 명시될 때

**기본 동작**: 아카이브는 접근하지 않음. Hot 영역(50_Projects, 20_Strategy)만 탐색.

### 2. Access Sequence (CRITICAL)

```
Step 1: catalog.jsonl 검색 (필수 선행)
        → task_id, project_id, 키워드로 경로 확정

Step 2: 확정된 원문 파일 1~2개만 Read
        → 절대로 tasks/ 전체 스캔 금지

Step 3: 추가 필요 시 by_project/ 또는 by_time/ 인덱스 참조
        → 관련 파일 1~2개 추가 확인
```

### 3. Catalog Files (Priority Order)

| File | Purpose | When to Use |
|------|---------|-------------|
| `catalog.jsonl` | 전체 인덱스 (1줄=1엔티티) | ID/키워드 검색 |
| `by_project/{prj-id}.md` | 프로젝트별 태스크 목록 | 특정 프로젝트 히스토리 |
| `by_time/{YYYY-MM}.md` | 월별 아카이브 목록 | 기간 기반 검색 |
| `by_type/{type}.md` | 타입별 목록 (task/experiment) | 특정 엔티티 타입 검색 |

### 4. Prohibited Actions

- `90_Archive/tasks/` 전체 glob/grep 스캔
- catalog 없이 원문 직접 접근
- 10개 이상 파일 동시 열기
- 아카이브 내용 기반 의사결정 (hot 영역 우선)

---

## Folder Structure

```
90_Archive/
├── 00_Catalog/
│   ├── _ARCHIVE_ENTRY.md      ← 현재 파일 (진입점)
│   ├── catalog.jsonl          ← LLM 검색용 전체 인덱스
│   ├── by_project/
│   │   └── {prj-id}.md        ← 프로젝트별 인덱스
│   ├── by_time/
│   │   └── {YYYY-MM}.md       ← 월별 인덱스
│   └── by_type/
│       └── {type}.md          ← 타입별 인덱스
├── tasks/
│   └── {prj-id}/{YYYY}/{MM}/  ← 원문 저장 (계층 구조)
└── artifacts/                  ← 첨부파일, 참고자료
```

---

## catalog.jsonl Schema

각 라인은 하나의 아카이브 엔티티:

```json
{"vault":"loop_obsidian","entity_type":"task","task_id":"tsk-003-01","project_id":"prj-003","created":"2025-09-12","closed":"2025-09-20","status":"archived","title":"MVP 기능 정의","summary":"코어 기능 3개 정의 완료","path":"90_Archive/tasks/prj-003/2025/09/tsk-003-01.md","tags":["mvp","feature"]}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `vault` | string | "loop_obsidian" or "loop_exec" |
| `entity_type` | string | "task", "experiment", "hypothesis" |
| `task_id` | string | 엔티티 고유 ID |
| `project_id` | string | 상위 프로젝트 ID |
| `created` | date | 생성일 (YYYY-MM-DD) |
| `closed` | date | 종료일 (YYYY-MM-DD) |
| `status` | string | "archived" |
| `title` | string | 제목 |
| `summary` | string | 1~2줄 요약 |
| `path` | string | 원문 파일 경로 |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `tags` | array | 태그 목록 |
| `links` | array | 관련 엔티티 ID 목록 |
| `key_terms` | array | 검색 키워드 |

---

## Archive Workflow Examples

### Example 1: ID로 특정 태스크 찾기

```
User: "tsk-003-01 태스크 내용 확인해줘"

1. catalog.jsonl에서 "tsk-003-01" 검색
2. path 확인: "90_Archive/tasks/prj-003/2025/09/tsk-003-01.md"
3. 해당 파일만 Read
```

### Example 2: 프로젝트 과거 태스크 조회

```
User: "P003 프로젝트에서 완료된 태스크들 보여줘"

1. by_project/prj-003.md 열기 (인덱스)
2. 필요한 태스크 1~2개만 원문 확인
```

### Example 3: 기간 기반 검색

```
User: "2025년 9월에 뭘 했는지 확인"

1. by_time/2025-09.md 열기 (인덱스)
2. 요약 정보로 응답 (원문 열 필요 없으면 안 엶)
```

---

## Archiving Process

태스크/실험 아카이빙 시:

1. 원문을 `90_Archive/tasks/{prj-id}/{YYYY}/{MM}/` 이동
2. `catalog.jsonl`에 라인 추가
3. `by_project/{prj-id}.md` 업데이트
4. `by_time/{YYYY-MM}.md` 업데이트
5. 원본 위치에서 파일 삭제

---

**Last updated**: 2025-12-22
