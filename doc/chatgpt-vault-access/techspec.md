# ChatGPT Vault Access - Technical Specification

## 목표
ChatGPT Custom GPT에서 LOOP Obsidian vault에 접근할 수 있게 함

## 배경
- Claude Desktop: stdio 기반 MCP 서버 직접 연결 가능 (이미 설정 완료)
- ChatGPT: HTTP 엔드포인트 필요 (GPT Actions 사용)
- 현재 FastAPI 서버 (port 8081) 존재하나 파일 읽기/검색 기능 없음

## 아키텍처

```
LOOP Vault (NAS/Local)
       ↓
  FastAPI Server (port 8081)
       ↓
  Tailscale Funnel (HTTPS)
       ↓
  ChatGPT Custom GPT (GPT Actions)
```

## 신규 엔드포인트

### 1. 파일 읽기: GET /api/files/{path}
```
GET /api/files/_Graph_Index.md
→ {"path": "_Graph_Index.md", "content": "..."}
```

### 2. 디렉토리 목록: GET /api/files/?path=...
```
GET /api/files/?path=50_Projects
→ {"path": "50_Projects", "items": [{"name": "2025", "type": "dir"}, ...]}
```

### 3. 검색: GET /api/search?q=...
```
GET /api/search?q=ontology&limit=20
→ {"query": "ontology", "count": 5, "results": [...]}
```

## 보안

- Path traversal 방지: vault 외부 접근 차단
- 기존 API 토큰 사용: `x-api-token: loop_2024_kanban_secret`
- 90_Archive, .obsidian 폴더 검색 제외

## 수정 파일

| 파일 | 작업 |
|------|------|
| `api/routers/files.py` | 신규 - 파일 읽기/목록 |
| `api/routers/search.py` | 신규 - 검색 |
| `api/main.py` | router 등록 추가 |

## HTTPS 노출

Tailscale Funnel 사용 (테스트용):
```bash
tailscale funnel 8081
# → https://xxx.ts.net
```

## ChatGPT 연동

1. OpenAPI 스펙 추출: `/openapi.json`
2. Custom GPT 생성 (chat.openai.com/gpts/editor)
3. Actions에 스펙 붙여넣기
4. API Key 인증 설정

---

**Created**: 2025-12-25
**Status**: In Progress
