---
entity_type: BuildConfig
entity_id: meta:build
entity_name: LOOP Vault Build Configuration v3.2
created: 2025-12-18
updated: 2025-12-18
version: "3.2"
tags: ["meta", "build", "automation"]
---

# LOOP Vault Build Configuration v3.2

> 자동화 스크립트 설정 및 Git Hook 구성

---

## 1. 빌드 스크립트 목록

### scripts/validate_schema.py
- **목적**: 모든 파일의 스키마 검증
- **실행 시점**: pre-commit hook
- **동작**:
  1. 모든 `.md` 파일의 frontmatter 파싱
  2. `schema_registry.md`의 검증 규칙 적용
  3. 오류 시 커밋 차단 + 오류 목록 출력

### scripts/build_graph_index.py
- **목적**: `_Graph_Index.md` 자동 생성
- **실행 시점**: pre-commit hook, 수동 실행
- **동작**:
  1. 모든 파일에서 관계 정보 추출
  2. `incoming_relations` 자동 파생
  3. `children_ids` 자동 파생
  4. 그래프 인덱스 재생성

### scripts/check_orphans.py
- **목적**: 고아 엔티티 검사
- **실행 시점**: pre-commit hook
- **동작**:
  1. `parent_id` 유효성 검사
  2. `validates`, `validated_by` 대칭성 검사
  3. 끊어진 링크 검출

---

## 2. Git Hook 설정

### .git/hooks/pre-commit
```bash
#!/bin/bash
set -e

VAULT_DIR="/Users/gim-eunhyang/Library/Mobile Documents/iCloud~md~obsidian/Documents/LOOP"
SCRIPTS_DIR="$VAULT_DIR/scripts"

echo "=== LOOP Vault Pre-commit Hook ==="

# 1. 스키마 검증
echo "[1/3] Validating schema..."
python3 "$SCRIPTS_DIR/validate_schema.py" "$VAULT_DIR"
if [ $? -ne 0 ]; then
    echo "Schema validation failed. Commit aborted."
    exit 1
fi

# 2. 고아 엔티티 검사
echo "[2/3] Checking orphans..."
python3 "$SCRIPTS_DIR/check_orphans.py" "$VAULT_DIR"
if [ $? -ne 0 ]; then
    echo "Orphan check failed. Commit aborted."
    exit 1
fi

# 3. 그래프 인덱스 재생성
echo "[3/3] Building graph index..."
python3 "$SCRIPTS_DIR/build_graph_index.py" "$VAULT_DIR"
git add "$VAULT_DIR/_Graph_Index.md"

echo "=== Pre-commit passed ==="
```

---

## 3. 스캔 설정

### 포함 경로
```yaml
include_paths:
  - "01_North_Star/"
  - "20_Strategy/"
  - "50_Projects/"
  - "60_Hypotheses/"
  - "70_Experiments/"
```

### 제외 경로
```yaml
exclude_paths:
  - "00_Meta/_TEMPLATES/"
  - "10_Study/"
  - "30_Ontology/"
  - "40_LOOP_OS/"
  - "90_Archive/"
  - "00_Inbox/"
```

### 제외 파일
```yaml
exclude_files:
  - "_INDEX.md"
  - "_ENTRY_POINT.md"
  - "CLAUDE.md"
  - "README.md"
```

---

## 4. 그래프 인덱스 생성 설정

### _Graph_Index.md 구조
```yaml
graph_index:
  sections-
    - name: "Strategy Layer"
      entity_types: [NorthStar, MetaHypothesis, Condition, Track]
    - name: "Project Layer"
      entity_types: [Project, Task]
    - name: "Hypothesis Layer"
      entity_types: [Hypothesis, Experiment]

  include_tables:
    - "Entity Summary"
    - "Relation Matrix"
    - "Critical Paths"
    - "Status Overview"
```

---

## 5. 검증 규칙 설정

### 필수 필드 검증
```yaml
required_fields:
  all: [entity_type, entity_id, entity_name, created, updated, status]
  Track: [owner, horizon]
  Project: [owner, parent_id]
  Task: [assignee, project_id, parent_id]
  Experiment: [hypothesis_id, metrics]
```

### ID 패턴 검증
```yaml
id_patterns-
  ns- "^ns-\\d{3}$"
  mh- "^mh-[1-4]$"
  cond- "^cond-[a-e]$"
  trk- "^trk-[1-6]$"
  prj- "^prj-\\d{3}$"
  tsk- "^tsk-\\d{3}-\\d{2}$"
  hyp- "^hyp-\\d{3}$"
  exp- "^exp-\\d{3}$"
```

### 관계 검증
```yaml
relation_validation:
  check_target_exists: true
  check_symmetric_links: true
  warn_on_orphan_hypothesis: true
```

---

## 6. 마이그레이션 설정

### 현재 Phase
```yaml
migration:
  current_phase: 1
  phases:
    1:
      name: "Alias Addition"
      description: "기존 파일에 aliases 추가"
      deadline: "2025-01-15"
    2:
      name: "Link Conversion"
      description: "새 ID로 링크 점진적 변환"
      deadline: "2025-02-15"
    3:
      name: "Alias Removal"
      description: "aliases 제거"
      deadline: "2025-03-15"
```

---

## 7. 수동 실행 명령어

```bash
# 스키마 검증만
python3 scripts/validate_schema.py .

# 고아 검사만
python3 scripts/check_orphans.py .

# 그래프 인덱스 재생성만
python3 scripts/build_graph_index.py .

# 전체 빌드
python3 scripts/build_all.py .
```

---

## 참고 문서

- [[schema_registry]] - 스키마 정의
- [[relation_types]] - 관계 타입 정의
- [[_ENTRY_POINT]] - LLM 진입점

---

**Version**: 3.2
**Last Updated**: 2025-12-18
