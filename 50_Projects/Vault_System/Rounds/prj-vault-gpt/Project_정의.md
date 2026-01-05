---
entity_type: Project
entity_id: prj-vault-gpt
entity_name: ChatGPT Vault MCP 연결
created: 2025-12-25
updated: 2025-12-25
status: doing

# === 소속 Program ===
program_id: pgm-vault-system
cycle: "2025"

# === 프로젝트 정보 ===
owner: 한명학
budget: null
deadline: null

# === Impact 판정 ===
expected_impact:
  statement: "ChatGPT에서 LOOP vault를 직접 탐색/검색할 수 있게 함"
  metric: "MCP 연결 성공 여부"
  target: "ChatGPT에서 vault 파일 읽기 가능"

realized_impact:
  verdict: null
  outcome: null
  evidence_links: []
  decided: null

# === 가설 연결 ===
hypothesis_id: null
experiments: []

# === 계층 (전략 연결) ===
parent_id: trk-2
conditions_3y: ["cond-b"]
aliases:
  - prj-vault-gpt
  - ChatGPT Vault MCP 연결
  - GPT MCP

outgoing_relations: []
validates: []
validated_by: []
tags: ["project", "vault-system", "mcp", "chatgpt", "infrastructure"]
priority_flag: high
---

# ChatGPT Vault MCP 연결

> Project ID: `prj-vault-gpt` | Program: [[pgm-vault-system]] | Status: in_progress

## 프로젝트 개요

ChatGPT (gpt.com)에서 LOOP Obsidian vault를 MCP로 직접 접근할 수 있도록 연결하는 프로젝트.

**목표**: ChatGPT가 vault 파일을 자율적으로 탐색/검색/읽기 가능한 상태

---

## 아키텍처 발전 로드맵

| 버전 | 구조 | 상태 |
|------|------|------|
| v1 | 로컬 MCP + mcp-proxy + Tailscale Funnel | 진행중 |
| v2 | NAS Docker + FastAPI 검색 레이어 | 계획 |
| v3 | 인덱싱/캐싱 고도화 | 미정 |

---

## Expected Impact

| 항목 | 값 |
|------|-----|
| Statement | ChatGPT에서 LOOP vault를 직접 탐색/검색할 수 있게 함 |
| Metric | MCP 연결 성공 여부 |
| Target | ChatGPT에서 vault 파일 읽기 가능 |

---

## Tasks

| Task ID | Task Name | Assignee | Status |
|---------|-----------|----------|--------|
| tsk-vault-gpt-01 | v1 HTTP MCP 설정 | 한명학 | in_progress |
| tsk-vault-gpt-10 | Navigation - vault-navigation API 엔드포인트 구현 | 한명학 | done |
| tsk-vault-gpt-11 | Navigation - _INDEX.md API 이전 | 한명학 | doing |

---

## 현재 진행 상황

### 완료
- [x] GitHub MCP 시도 (실패 - AttributeError)
- [x] 로컬 MCP Server 설치 (`@modelcontextprotocol/server-filesystem`)
- [x] Claude Desktop 설정 완료 (loop_vault, loop_exec)

### 진행중
- [ ] ChatGPT용 HTTP 래퍼 설정 (mcp-proxy)
- [ ] HTTPS 노출 (Tailscale Funnel)
- [ ] ChatGPT MCP 연결 테스트

---

## 참조

- **Program**: [[_PROGRAM|Vault 시스템 체계화]]
- **ChatGPT 대화 로그**: (별도 보관)

---

## Notes

### PRD (Product Requirements Document)

#### 📋 프로젝트 컨텍스트
- **Framework**: FastAPI (Python 3.11)
- **Architecture**: REST API + MCP (Model Context Protocol)
- **Deployment**: Docker on Synology NAS
- **Client**: ChatGPT Developer Mode

#### 🎯 문제 정의

**현재 상황**:
ChatGPT가 MCP로 LOOP Vault에 연결 시, 간단한 폴더 탐색 요청에도 과도한 함수 호출 발생

```
사용자: "exec/ 폴더 확인해봐"
ChatGPT 동작:
1. list_files("") → 권한 확인 팝업
2. list_files("exec") → 권한 확인 팝업
3. list_files("exec/00_Meta") → 권한 확인 팝업
... (10회 이상 반복)
```

**문제점**:
- 매 호출마다 권한 확인 팝업 → UX 최악
- 단순 작업에 10+ 함수 호출 → 비효율

#### 🎯 목표

| 작업 유형 | Before | After |
|----------|--------|-------|
| 폴더 구조 확인 | 10+ 호출 | **1 호출** |
| 여러 파일 읽기 | N 호출 | **1 호출** |

#### 📝 핵심 요구사항

**1. Tree API** (`GET /api/tree/{path}`)
- 재귀적으로 전체 폴더 구조 반환
- `exclude` 파라미터: `.git`, `__pycache__` 등 제외
- `max_depth` 파라미터: 깊이 제한 (선택)
- 반환 형식: JSON 트리 구조

**2. Batch Read API** (`GET /api/files/batch`)
- 여러 파일 경로를 한 번에 받아 내용 반환
- `paths` 파라미터: 쉼표 구분 파일 경로 목록
- 반환 형식: `{path: content}` 맵

#### 🔧 기술 스펙

```python
# Tree API
@app.get("/api/tree/{path:path}")
def get_tree(
    path: str = "",
    exclude: str = ".git,__pycache__",
    max_depth: int = 10
) -> dict:
    """재귀 폴더 구조 반환"""

# Batch Read API
@app.get("/api/files/batch")
def get_files_batch(
    paths: str  # 쉼표 구분
) -> dict[str, str]:
    """여러 파일 한 번에 읽기"""
```

#### ✅ 성공 기준
- [ ] Tree API: 한 번 호출로 전체 폴더 구조 반환
- [ ] Batch API: 한 번 호출로 여러 파일 내용 반환
- [ ] MCP 도구로 자동 노출 (fastapi-mcp)
- [ ] ChatGPT에서 테스트 성공

#### 📚 참조
- [GitHub MCP Server](https://github.com/github/github-mcp-server) - `get_repository_tree`
- [Filesystem MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem) - `directory_tree`

---

**Created**: 2025-12-25
**Owner**: 한명학
