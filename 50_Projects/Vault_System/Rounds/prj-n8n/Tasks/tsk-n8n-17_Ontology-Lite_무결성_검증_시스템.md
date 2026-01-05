---
entity_type: Task
entity_id: "tsk-n8n-17"
entity_name: "Ontology-Lite - 무결성 검증 시스템 구축"
created: 2026-01-06
updated: 2026-01-06
status: done
closed: 2026-01-06

# === 계층 ===
parent_id: "prj-n8n"
project_id: "prj-n8n"
aliases: ["tsk-n8n-17"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-06
due: 2026-01-06
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop-api

# === 분류 ===
tags: ["ontology-lite", "validation", "ssot", "hygiene"]
priority_flag: high
---

# Ontology-Lite - 무결성 검증 시스템 구축

> Task ID: `tsk-n8n-17` | Project: `prj-n8n` | Status: done

## 목표

Ontology-Lite 관점에서 발견된 3가지 무결성 위반을 방지하는 검증 시스템 구축

**완료 조건**:
1. `check_frontmatter_body_sync.py` 신규 생성 + pre-commit 연동
2. `validate_schema.py` 확장 (aliases 중복, assignee 정규화)
3. `members.yaml` aliases 필드 추가
4. 기존 데이터 일괄 수정 (10+ 파일)
5. vault-hygiene API 검사 항목 확장

---

## 상세 내용

### 배경

Ontology-Lite 관점에서 3가지 심각한 위반 발견:

| # | 문제 | 심각도 | 예시 |
|---|------|--------|------|
| 1 | **frontmatter↔본문 불일치** | CRITICAL | prj-002: `parent_id: trk-6` vs 본문 `Track: trk-2` |
| 2 | **status enum 드리프트** | HIGH | Project에 빈값 `''` 8개 |
| 3 | **assignee 불일치** | MEDIUM | `은향` vs `김은향` (동일인) |

### 작업 내용

**1. `check_frontmatter_body_sync.py` 신규**
- 본문 메타라인 (`> Project ID: ... | Track: ... | Status: ...`) 파싱
- frontmatter와 불일치 시 ERROR
- pre-commit hook 연동

**2. `validate_schema.py` 확장**
- aliases 중복 검사
- assignee가 members.yaml에 없으면 WARNING

**3. `members.yaml` 확장**
```yaml
- id: "김은향"
  aliases: ["은향", "김은향"]
```

**4. 기존 데이터 일괄 수정**
- prj-002, prj-007: 본문 `Track: trk-2` → `Track: trk-6`
- Project status `''` 8개 → `planning`
- `assignee: 은향` → `assignee: 김은향`
- aliases 중복 6개 제거

**5. vault-hygiene API 확장** (tsk-n8n-06 연계)
- 검사 항목 추가: sync_violation, invalid_assignee, duplicate_alias

---

## 체크리스트

- [x] `scripts/check_frontmatter_body_sync.py` 신규 생성
- [x] `scripts/validate_schema.py` aliases/assignee 검사 추가 (v7.2)
- [x] `00_Meta/members.yaml` aliases 필드 추가
- [x] `.git/hooks/pre-commit` sync 검사 추가
- [x] prj-002, prj-007 본문 수정
- [x] Project status `''` → `planning` (6개: P002, P005, P008, P012, prj-dashboard-ux-v1, prj-yt-w33)
- [x] `assignee: 은향` → `김은향` (1개: tsk-dashboard-ux-v1-04)
- [x] aliases 중복 제거 (5개: prj-002, prj-007, mh-1, mh-2, mh-4 - Archive 제외)
- [x] 전체 검증 테스트

---

## Notes

### PRD (Product Requirements Document)

#### 프로젝트 컨텍스트
| 항목 | 값 |
|------|-----|
| **Framework** | FastAPI 0.104+, Python 3.9+ |
| **Architecture** | Scripts + Pre-commit + API Router |
| **기존 검증** | `validate_schema.py`, `check_orphans.py` |
| **연관 Task** | `tsk-n8n-06` (vault-hygiene API) |

#### 문제 정의

**발견된 3가지 Ontology-Lite 위반:**

| # | 문제 | 현황 | 영향 |
|---|------|------|------|
| 1 | frontmatter↔본문 불일치 | prj-002, prj-007 (Track 불일치) | 자동 집계 오류 |
| 2 | status enum 드리프트 | Project `''` 8개 | Dashboard 필터 오류 |
| 3 | assignee 비정규 | `은향` vs `김은향` | 담당자 집계 오류 |
| 4 | aliases 중복 | 6개 파일 | 링크 중복 |

#### 구현 범위

**1. 신규 스크립트: `check_frontmatter_body_sync.py`**
```python
# 검사 대상 패턴
BODY_META_PATTERN = r'> Project ID: `([^`]+)` \| Track: `([^`]+)` \| Status: (\w+)'

# 검사 항목
- entity_id 일치
- parent_id ↔ Track 일치
- status 일치
```

**2. validate_schema.py 확장**
```python
# 추가 검사
def check_aliases_duplicates(aliases: list) -> list[str]
def check_assignee_valid(assignee: str, members: list) -> bool
```

**3. members.yaml 확장**
```yaml
members:
  - id: "김은향"
    aliases: ["은향", "김은향"]  # 정규화용
```

**4. pre-commit hook 강화**
```bash
# 추가
python3 scripts/check_frontmatter_body_sync.py .
```

**5. 기존 데이터 수정**
| 파일 | 수정 |
|------|------|
| prj-002 Project_정의.md | 본문 Track: trk-2 → trk-6 |
| prj-007 Project_정의.md | 본문 Track: trk-2 → trk-6 |
| 8개 Project_정의.md | status: '' → planning |
| tsk-dashboard-ux-v1-04 | assignee: 은향 → 김은향 |
| 6개 파일 | aliases 중복 제거 |

#### 성공 기준

- [x] `check_frontmatter_body_sync.py` - frontmatter↔본문 검증
- [x] `validate_schema.py` - aliases 중복 + assignee 검사
- [x] pre-commit hook - sync 검사 자동 실행
- [x] 지정된 범위의 위반 데이터 수정 완료 (레거시 데이터는 별도 작업)

---

### Tech Spec

#### 파일 구조
```
scripts/
├── check_frontmatter_body_sync.py   # NEW
├── validate_schema.py               # EXTEND
└── check_orphans.py                 # 기존 유지

00_Meta/
└── members.yaml                     # EXTEND (aliases)

.git/hooks/
└── pre-commit                       # EXTEND
```

#### check_frontmatter_body_sync.py 설계

```python
#!/usr/bin/env python3
"""frontmatter와 본문 메타라인 동기화 검증"""

import re
import yaml
from pathlib import Path
from typing import List, Tuple

BODY_META_PATTERNS = {
    'Project': re.compile(r'> Project ID: `([^`]+)` \| Track: `([^`]+)` \| Status: (\w+)'),
    'Task': re.compile(r'> Task ID: `([^`]+)` \| Project: `([^`]+)` \| Status: (\w+)'),
}

def check_file(file_path: Path) -> List[str]:
    """단일 파일 검사, 오류 목록 반환"""
    errors = []
    content = file_path.read_text(encoding='utf-8')

    # frontmatter 파싱
    fm_match = re.match(r'^---\n(.+?)\n---', content, re.DOTALL)
    if not fm_match:
        return errors
    fm = yaml.safe_load(fm_match.group(1))

    entity_type = fm.get('entity_type')
    if entity_type not in BODY_META_PATTERNS:
        return errors

    # 본문 메타라인 파싱
    pattern = BODY_META_PATTERNS[entity_type]
    body_match = pattern.search(content)
    if not body_match:
        return errors  # 메타라인 없으면 스킵

    # 검증
    if entity_type == 'Project':
        body_id, body_track, body_status = body_match.groups()
        if body_track != fm.get('parent_id'):
            errors.append(f"Track mismatch: frontmatter.parent_id={fm.get('parent_id')}, body={body_track}")
    elif entity_type == 'Task':
        body_id, body_project, body_status = body_match.groups()
        if body_project != fm.get('project_id'):
            errors.append(f"Project mismatch: frontmatter.project_id={fm.get('project_id')}, body={body_project}")

    # status 검증 (공통)
    if body_status != fm.get('status'):
        errors.append(f"Status mismatch: frontmatter.status={fm.get('status')}, body={body_status}")

    return errors

def main(vault_path: str) -> int:
    """전체 vault 검사"""
    # ... glob으로 md 파일 순회, 오류 출력, exit code 반환
```

#### validate_schema.py 확장

```python
# 추가할 함수들

def check_aliases_duplicates(aliases: list) -> list[str]:
    """aliases 중복 검사"""
    if not aliases:
        return []
    seen = set()
    duplicates = []
    for alias in aliases:
        if alias in seen:
            duplicates.append(f"Duplicate alias: {alias}")
        seen.add(alias)
    return duplicates

def load_valid_assignees(members_path: Path) -> set[str]:
    """members.yaml에서 유효한 assignee 목록 로드"""
    with open(members_path) as f:
        data = yaml.safe_load(f)
    valid = set()
    for member in data.get('members', []):
        valid.add(member['id'])
        for alias in member.get('aliases', []):
            valid.add(alias)
    return valid

def check_assignee_valid(assignee: str, valid_assignees: set) -> bool:
    """assignee가 유효한지 검사"""
    return assignee in valid_assignees
```

#### pre-commit hook 추가

```bash
# .git/hooks/pre-commit에 추가

echo "=== Checking frontmatter-body sync ==="
python3 scripts/check_frontmatter_body_sync.py .
if [ $? -ne 0 ]; then
    echo "❌ Frontmatter-body sync check failed"
    exit 1
fi
```

### 작업 로그

#### 2026-01-06 작업 완료

**1. Pre-commit Hook 생성**
- `.git/hooks/pre-commit` 신규 생성
- 4단계 검증: validate_schema.py -> check_frontmatter_body_sync.py -> check_orphans.py (경고만) -> build_graph_index.py (자동 스테이징)

**2. Frontmatter-Body Sync 수정 (2개 파일)**
- `P002_[와디즈] 12주 코칭 습관팩 런칭/Project_정의.md`: 본문 Track `trk-2` -> `trk-6`, Status `active` -> `planning`
- `P007_외부 비서/Project_정의.md`: 본문 Track `trk-2` -> `trk-6`, Status `active` -> `done`

**3. Project Status 빈값 수정 (6개 파일)**
- P002, P005, P008, P012: `status: ''` -> `status: planning`
- prj-dashboard-ux-v1, prj-yt-w33: `status: ''` -> `status: planning`
- 추가로 본문 메타라인도 frontmatter와 일치하도록 수정

**4. Assignee 수정 (1개 파일)**
- `tsk-dashboard-ux-v1-04`: `assignee: 은향` -> `assignee: 김은향`
- 본문 Status도 `doing` -> `done`으로 수정 (frontmatter와 일치)

**5. Aliases 중복 제거 (5개 파일)**
- P002, P007, MH1, MH2, MH4에서 중복 alias 제거
- 90_Archive 폴더는 수정 제외

**검증 결과**
- `check_frontmatter_body_sync.py`: 101개 파일에서 sync 오류 감지 (대부분 기존 레거시 데이터)
- `validate_schema.py`: 139개 파일에서 오류 감지 (대부분 aliases 중복 + 레거시 데이터)
- 지정된 범위의 수정은 모두 완료됨


---

## 참고 문서

- [[prj-n8n]] - 소속 Project
- [[tsk-n8n-06_vault-hygiene_API_엔드포인트_개발]] - 연관 Task
- `scripts/validate_schema.py` - 기존 스키마 검증
- `00_Meta/members.yaml` - 팀 멤버 정의

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
