---
entity_type: Task
entity_id: "tsk-vault-gpt-11"
entity_name: "Navigation - _INDEX.md API 이전"
created: 2026-01-05
updated: 2026-01-05
status: doing

# === 계층 ===
parent_id: "prj-vault-gpt"
project_id: "prj-vault-gpt"
aliases: ["tsk-vault-gpt-11"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "한명학"
start_date: 2026-01-05
due: 2026-01-05
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop-api

# === 분류 ===
tags: ["api", "navigation", "ssot", "index"]
priority_flag: high
---

# Navigation - _INDEX.md API 이전

> Task ID: `tsk-vault-gpt-11` | Project: `prj-vault-gpt` | Status: doing

## 목표

폴더별 `_INDEX.md` 파일들을 API로 완전히 대체하여 **SSOT 원칙 완성**.

**완료 조건**:
1. `/api/mcp/folder-contents` 엔드포인트 구현
2. 기존 `_INDEX.md` 파일들 삭제
3. LLM이 API로 폴더 내용 조회 가능

---

## 상세 내용

### 배경

`tsk-vault-gpt-10`에서 navigation 문서들을 `/api/mcp/vault-navigation`으로 통합했으나, 폴더별 `_INDEX.md` 파일들은 여전히 존재:

- `50_Projects/{project}/_INDEX.md` - 프로젝트 내 Task 목록
- `20_Strategy/12M_Tracks/_INDEX.md` - Track 목록
- `60_Hypotheses/_INDEX.md` - 가설 목록
- `exec/20_Cashflow/_INDEX.md` - 월별 리포트 링크

**문제점**:
- SSOT 위반 (API + md 파일 중복)
- 수동 업데이트 필요 → stale 위험
- LLM이 어디서 정보를 가져올지 혼란

### 작업 내용

**Option A 선택**: 전부 API 이전 (완전 SSOT)

1. **새 API 엔드포인트**: `/api/mcp/folder-contents`
   ```
   GET /api/mcp/folder-contents?path=50_Projects/P018_CoachOS
   ```

2. **응답 구조**:
   ```json
   {
     "path": "50_Projects/P018_CoachOS",
     "entities": [
       {"id": "tsk-018-01", "name": "...", "status": "doing"},
       {"id": "tsk-018-02", "name": "...", "status": "done"}
     ],
     "subfolders": ["Tasks", "Results"],
     "files": ["Project_정의.md", "_INDEX.md"]
   }
   ```

3. **_INDEX.md 삭제 대상**:
   - `50_Projects/*/_INDEX.md`
   - `20_Strategy/**/_INDEX.md`
   - `60_Hypotheses/_INDEX.md`
   - `exec/**/_INDEX.md`

---

## 체크리스트

- [ ] `/api/mcp/folder-contents` 엔드포인트 구현
- [ ] 엔티티 파싱 로직 (frontmatter에서 id, name, status 추출)
- [ ] exec vault 지원 (권한 체크)
- [ ] `build_graph_index.py`에서 `_INDEX.md` 생성 로직 제거
  - [ ] `FOLDER_INDEX_CONFIG` 제거
  - [ ] `generate_folder_indexes()` 함수 제거
  - [ ] main 함수에서 호출 제거
- [ ] _INDEX.md 파일 삭제 (public 8개 + exec 8개)
- [ ] CLAUDE.md 업데이트 (새 엔드포인트 문서화)
- [ ] 테스트 및 코드 리뷰

---

## Notes

### PRD (Product Requirements Document)

#### 문제 정의

**현재 상태**:
- 폴더별 `_INDEX.md` 파일 16개 존재 (public 8개 + exec 8개)
- `build_graph_index.py`가 일부 _INDEX.md 자동 생성
- 나머지는 수동 관리 → stale 위험
- `/api/mcp/vault-navigation`과 정보 중복 (SSOT 위반)

**문제점**:
1. API + md 파일 중복 → LLM 혼란
2. 수동 업데이트 필요 → stale 위험
3. 빌드 스크립트 유지보수 부담

#### 목표

| Before | After |
|--------|-------|
| _INDEX.md 16개 파일 | **0개** (완전 삭제) |
| build_graph_index.py가 생성 | **API만 제공** |
| 수동 + 자동 혼재 | **실시간 API** |

#### 핵심 요구사항

**1. 새 API 엔드포인트**:
```
GET /api/mcp/folder-contents?path={folder_path}
```

**2. 요청 파라미터**:
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| path | string | 폴더 경로 (예: `50_Projects/P018_CoachOS`) |
| include_files | bool | 파일 목록 포함 여부 (기본: true) |
| entity_only | bool | 엔티티만 반환 (기본: false) |

**3. 응답 구조**:
```json
{
  "path": "50_Projects",
  "description": "Projects and Tasks",
  "entities": [
    {"id": "prj-018", "name": "CoachOS - MVP 개발", "type": "Project", "status": "doing"},
    {"id": "prj-019", "name": "Dashboard - UX 개선", "type": "Project", "status": "done"}
  ],
  "subfolders": ["P018_CoachOS", "P019_Dashboard", "Vault_System"],
  "files": ["_INDEX.md"],
  "stats": {
    "total_entities": 32,
    "by_status": {"doing": 15, "done": 10, "todo": 7}
  }
}
```

**4. 기존 API 활용**:
- 엔티티 목록: VaultCache 활용 (O(1))
- 폴더 탐색: `vault_dir / path`로 직접 접근

**5. build_graph_index.py 수정**:
```python
# 제거 대상:
# - FOLDER_INDEX_CONFIG
# - generate_folder_indexes() 함수
# - main()에서 generate_folder_indexes 호출

# 유지:
# - _Graph_Index.md 생성 (엔티티 관계 인덱스)
# - _build/graph.json 생성
```

#### 성공 기준

- [ ] `/api/mcp/folder-contents` 단일 호출로 폴더 내용 조회
- [ ] 기존 _INDEX.md 16개 파일 삭제 완료
- [ ] build_graph_index.py에서 _INDEX.md 생성 로직 제거
- [ ] CLAUDE.md에 새 엔드포인트 문서화

### 작업 로그



---

## 참고 문서

- [[prj-vault-gpt]] - 소속 Project
- [[tsk-vault-gpt-10_Navigation_API]] - 선행 Task (vault-navigation API)
- `api/routers/mcp_composite.py` - MCP composite 엔드포인트

---

**Created**: 2026-01-05
**Assignee**: 한명학
**Due**: 2026-01-05
