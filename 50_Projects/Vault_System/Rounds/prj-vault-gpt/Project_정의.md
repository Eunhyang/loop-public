---
entity_type: Project
entity_id: prj-vault-gpt
entity_name: ChatGPT Vault MCP 연결
created: 2025-12-25
updated: 2025-12-25
status: active

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

**Created**: 2025-12-25
**Owner**: 한명학
