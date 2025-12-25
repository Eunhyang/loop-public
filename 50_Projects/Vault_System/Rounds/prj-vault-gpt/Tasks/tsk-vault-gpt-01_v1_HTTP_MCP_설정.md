---
entity_type: Task
entity_id: tsk-vault-gpt-01
entity_name: v1 HTTP MCP 설정
created: 2025-12-25
updated: '2025-12-26'
status: done
project_id: prj-vault-gpt
assignee: 김은향
start_date: '2025-12-25'
due: null
priority: high
estimated_hours: null
actual_hours: null
closed: null
archived_at: null
closed_inferred: null
parent_id: prj-vault-gpt
aliases:
- tsk-vault-gpt-01
- v1 HTTP MCP 설정
- HTTP MCP 설정
outgoing_relations: []
tags:
- task
- vault-system
- mcp
- chatgpt
- v1
priority_flag: high
---
# v1 HTTP MCP 설정

> Task ID: `tsk-vault-gpt-01` | Project: [[prj-vault-gpt]] | Status: doing

## 목표

ChatGPT에서 LOOP vault를 MCP로 읽을 수 있도록 HTTP 엔드포인트 설정

## 아키텍처 (v1)

```
[Obsidian Vault: /Volumes/LOOP_CORE/vault/LOOP]
      ↓
MCP Server (stdio 기반, @modelcontextprotocol/server-filesystem)
      ↓
mcp-proxy (stdio → HTTP 변환)
      ↓
Tailscale Funnel (HTTPS 노출)
      ↓
ChatGPT (MCP Client)
```

---

## 진행 상황

### 완료
- [x] Node.js 설치 확인 (v24.1.0)
- [x] `@modelcontextprotocol/server-filesystem` 설치
- [x] Claude Desktop 설정 완료
  - loop_vault: `/Volumes/LOOP_CORE/vault/LOOP`
  - loop_exec: `/Volumes/LOOP_CLevel/vault/loop_exec`

### 진행중
- [ ] mcp-proxy 설치 (`@anthropic-ai/mcp-proxy` 또는 대안)
- [ ] HTTP 서버 실행 테스트
- [ ] Tailscale Funnel 설정 (HTTPS 노출)
- [ ] ChatGPT에서 MCP Server 연결
- [ ] vault 파일 읽기 테스트

---

## 명령어 참고

### mcp-proxy 설치
```bash
npm install -g @anthropic-ai/mcp-proxy
```

### Tailscale Funnel
```bash
tailscale funnel 3333
```

### ChatGPT 설정
- Settings → Connectors → Add MCP Server
- Server URL: `https://xxxx.ts.net`

---

## 참조

- **Project**: [[Project_정의|ChatGPT Vault MCP 연결]]
- **Program**: [[_PROGRAM|Vault 시스템 체계화]]

---

**Created**: 2025-12-25
**Assignee**: 한명학
