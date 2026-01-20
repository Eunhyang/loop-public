---
entity_type: Task
entity_id: "tsk-vault-gpt-05"
entity_name: "MCP - 전용 복합 API 엔드포인트 개발"
created: 2025-12-28
updated: 2025-12-28
status: done
closed: 2025-12-28

# === 계층 ===
parent_id: "prj-vault-gpt"
project_id: "prj-vault-gpt"
aliases: ["tsk-vault-gpt-05"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2025-12-28
due: 2025-12-28
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop-api

# === 3Y 전략 연결 (필수) ===
# === 분류 ===
tags: [mcp, api, gpt, composite-api]
priority_flag: high
---

# MCP - 전용 복합 API 엔드포인트 개발

> Task ID: `tsk-vault-gpt-05` | Project: `prj-vault-gpt` | Status: done

## 목표

GPT가 MCP 도구를 호출할 때 권한 요청 횟수를 최소화하기 위한 복합 API 엔드포인트 개발

**완료 조건**:
1. 8개 복합 API 엔드포인트 구현
2. MCP 서버 설명에 Vault 구조 포함
3. GPT에서 1회 호출로 검색+읽기 완료 가능

---

## 상세 내용

### 배경

현재 GPT가 MCP로 LOOP vault 접근 시:
- 검색 1회 + 파일 읽기 N회 = N+1회 호출
- 매 호출마다 권한 확인 팝업 → UX 최악

### 작업 내용

**8개 복합 API 엔드포인트:**

| 도구 | 용도 | 대체하는 호출 |
|------|------|--------------|
| `search_and_read` | 검색+읽기 | search + read×N |
| `get_project_context` | 프로젝트 전체 | project + tasks×N + hyp×M |
| `get_track_context` | Track 전체 | track + projects×N + hyp×M |
| `get_vault_dashboard` | Vault 현황 | tasks + projects + 필터들 |
| `get_entity_graph` | 엔티티 관계 | 여러 엔티티 조회 |
| `get_strategy_overview` | 전략 계층 | 기존 context 개선 |
| `get_schema_info` | 스키마 정보 | 메타 파일 읽기 |
| `read_files_batch` | 다중 파일 읽기 | read×N |

**MCP 서버 설명 개선:**
- Vault 구조 (Entity Hierarchy)
- ID 패턴
- 권장 시작점

---

## 체크리스트

- [x] `get_vault_context` API 구현
- [x] `search_and_read` API 구현
- [x] `get_project_context` API 구현
- [x] `get_track_context` API 구현
- [x] `get_vault_dashboard` API 구현
- [x] `get_entity_graph` API 구현
- [x] `get_strategy_overview` API 개선
- [x] `get_schema_info` API 구현
- [x] MCP 서버 description 업데이트
- [x] Docker 재빌드 및 테스트
- [x] GPT에서 테스트
- [x] `include_operations`로 복합 API만 MCP 노출

---

## Notes

### PRD (Product Requirements Document)

#### 📋 프로젝트 컨텍스트
- **Framework**: FastAPI 0.104+ with Python 3.10+
- **Architecture**: REST API + MCP (Model Context Protocol via fastapi-mcp)
- **Deployment**: Docker on Synology NAS (port 8082→8081)
- **Cache**: VaultCache (in-memory, O(1) lookup)
- **Client**: ChatGPT Developer Mode (MCP protocol)

#### 🎯 문제 정의

**현재 상황**:
GPT가 MCP로 LOOP Vault 접근 시, 단순 작업에도 다수의 함수 호출이 발생하고 매 호출마다 권한 확인 팝업이 표시됨.

```
예: "ontology 문서 찾아서 읽어줘"
1. search_vault(q="ontology")     → 권한 확인
2. read_file("path1.md")          → 권한 확인
3. read_file("path2.md")          → 권한 확인
...
```

**문제점**:
- 매 호출마다 권한 확인 팝업 → UX 최악
- 단순 작업에 10+ 함수 호출 → 비효율
- GPT가 Vault 구조를 모르고 시작 → 탐색에 시간 낭비

#### 🎯 목표

| 작업 유형 | Before | After |
|----------|--------|-------|
| 문서 검색+읽기 | N+1 호출 | **1 호출** |
| 프로젝트 상황 파악 | 5+ 호출 | **1 호출** |
| Vault 현황 파악 | 10+ 호출 | **1 호출** |
| Vault 구조 이해 | 여러 파일 읽기 | **MCP 연결 시 자동** |

### Tech Spec

#### 📁 파일 구조

```
api/
├── main.py                    # MCP description 업데이트
├── routers/
│   ├── mcp_composite.py       # ⭐ 새 파일: 8개 복합 API
│   ├── search.py              # 기존 (변경 없음)
│   ├── files.py               # 기존 (변경 없음)
│   └── strategy.py            # 기존 (변경 없음)
└── cache/
    └── vault_cache.py         # 기존 캐시 활용
```

#### 📝 8개 엔드포인트 상세

**1. GET /api/mcp/vault-context**
- Vault 전체 구조 + 현황 (GPT 첫 호출용)
- Returns: structure, current_state, active_tracks, recommended_next

**2. GET /api/mcp/search-and-read**
- 검색 + 매칭 파일 내용 한 번에 반환
- Params: q, max_files=5, max_chars_per_file=5000

**3. GET /api/mcp/project/{project_id}/context**
- 프로젝트 + 모든 Task + 관련 Hypothesis + 부모 Track
- Params: include_task_body=False

**4. GET /api/mcp/track/{track_id}/context**
- Track + 하위 Projects + Hypotheses 전체
- Params: include_tasks=False

**5. GET /api/mcp/dashboard**
- Vault 전체 현황 요약 (칸반 대시보드 데이터)
- Returns: summary, attention_needed, recent_updates, active_tracks

**6. GET /api/mcp/entity/{entity_id}/graph**
- 엔티티 + 상위/하위/관련 관계 전체
- Returns: entity, hierarchy, relationships

**7. GET /api/mcp/strategy**
- 전체 전략 계층 (NorthStar → MH → Condition → Track)
- Params: depth="summary"|"full"

**8. GET /api/mcp/schema**
- Vault 스키마/상수 정보
- Params: category="all"|"task"|"project"|...

#### MCP 서버 description 업데이트

```python
mcp = FastApiMCP(
    app,
    name="LOOP Vault MCP",
    description="""
LOOP Obsidian Vault - Strategic Execution System

## Entity Hierarchy
NorthStar → MetaHypothesis → Condition → Track → Project → Task
Hypothesis: Project가 validates로 검증

## ID 패턴
- Project: prj-001, Task: tsk-001-01, Hypothesis: hyp-2-01
- Track: trk-1~6, Condition: cond-a~e

## 권장 시작점
1. /api/mcp/vault-context - 구조 + 현황
2. /api/mcp/search-and-read?q=키워드 - 검색+읽기
3. /api/mcp/project/{id}/context - 프로젝트 상세
"""
)
```

### Todo
- [ ] `api/routers/mcp_composite.py` 파일 생성
- [ ] `get_vault_context` API 구현
- [ ] `search_and_read` API 구현
- [ ] `get_project_context` API 구현
- [ ] `get_track_context` API 구현
- [ ] `get_vault_dashboard` API 구현
- [ ] `get_entity_graph` API 구현
- [ ] `get_strategy_overview` API 구현
- [ ] `get_schema_info` API 구현
- [ ] `api/main.py` - MCP description 업데이트
- [ ] `api/main.py` - mcp_composite 라우터 등록
- [ ] Docker 재빌드 (`/mcp-server rebuild`)
- [ ] GPT에서 테스트

### 작업 로그

#### 2025-12-28 17:30

**개요**: GPT가 MCP 도구 호출 시 권한 팝업을 최소화하기 위해 8개 복합 API를 구현하고, `include_operations`로 복합 API만 MCP에 노출되도록 설정 완료.

**변경사항**:
- 개발: `api/routers/mcp_composite.py` 신규 생성 (643 lines, 8개 복합 API 엔드포인트)
- 수정: `api/main.py` - MCP description 업데이트 + `include_operations` 필터링 적용
- 개선: LOOP 철학 4원칙을 MCP description에 포함하여 GPT가 연결 시 바로 인식
- 버그 수정: `datetime.date` vs `str` 비교 오류 3건 수정 (due, updated 필드)

**파일 변경**:
- `api/routers/mcp_composite.py` - 신규 생성 (8개 복합 API)
- `api/main.py` - MCP 설정 수정 (include_operations, description)

**구현된 8개 복합 API**:
| API | 용도 |
|-----|------|
| `vault-context` | Vault 철학+구조+현황 (첫 호출용) |
| `search-and-read` | 검색+파일 읽기 통합 |
| `project-context` | 프로젝트+Tasks+Hypotheses |
| `track-context` | Track+하위 Projects |
| `dashboard` | 전체 현황 요약 |
| `entity-graph` | 엔티티 관계 그래프 |
| `strategy` | 전략 계층 |
| `schema` | 스키마/상수 정보 |

**핵심 해결**:
- `include_tags` → `include_operations`로 변경 (MCP 도구 목록 필터링 정상 동작)
- GPT.com에서 Refresh 후 8개 복합 API만 노출 확인
- 개별 API 37개 완전 숨김 처리

**결과**: ✅ GPT.com에서 `get_vault_context` 1회 호출로 전체 구조 파악 성공

**다음 단계**:
- GPT 사용자 가이드 문서화 (복합 API 사용법)
- 필요 시 추가 복합 API 개발


---

## 참고 문서

- [[prj-vault-gpt]] - 소속 Project
- [[api/main.py]] - FastAPI 앱
- [[api/routers/]] - 기존 라우터들

---

**Created**: 2025-12-28
**Assignee**: 김은향
**Due**: 2025-12-28
