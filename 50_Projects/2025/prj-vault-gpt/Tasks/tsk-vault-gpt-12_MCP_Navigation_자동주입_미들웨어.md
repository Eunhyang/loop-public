---
entity_type: Task
entity_id: "tsk-vault-gpt-12"
entity_name: "MCP - Navigation 자동 주입 미들웨어"
created: 2026-01-05
updated: 2026-01-06
status: done
closed: 2026-01-06

# === 계층 ===
parent_id: "prj-vault-gpt"
project_id: "prj-vault-gpt"
aliases: ["tsk-vault-gpt-12"]

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
tags: ["mcp", "middleware", "navigation", "api"]
priority_flag: high
---

# MCP - Navigation 자동 주입 미들웨어

> Task ID: `tsk-vault-gpt-12` | Project: `prj-vault-gpt` | Status: doing

## 목표

**완료 조건**:
1. MCP API 호출 시 navigation을 호출하지 않은 클라이언트에게 자동으로 navigation 데이터 주입
2. vault-navigation API가 MCP_ALLOWED_OPERATIONS에 포함
3. ChatGPT에서 테스트 성공

---

## 상세 내용

### 배경

ChatGPT가 MCP로 LOOP Vault 연결 시, vault 구조를 먼저 파악해야 효율적인 탐색이 가능함.
현재는 사용자가 먼저 vault-navigation을 호출해야 하는데, 이를 자동화하여 UX 개선.

### 작업 내용

1. **Navigation 호출 추적 캐시** - 클라이언트별 navigation 호출 여부 추적 (TTL 1시간)
2. **미들웨어 구현** - /api/mcp/* 경로에 응답 후처리로 navigation 자동 주입
3. **MCP 설정 업데이트** - vault-navigation을 MCP_ALLOWED_OPERATIONS에 추가

---

## 체크리스트

- [x] Navigation 호출 추적 캐시 구현
- [x] 미들웨어 클래스 구현 (NavigationInjectorMiddleware)
- [x] main.py에 미들웨어 등록
- [x] MCP_ALLOWED_OPERATIONS에 vault-navigation 추가
- [x] 로컬 테스트
- [ ] ChatGPT 연동 테스트 (배포 후 진행)

---

## Notes

### Todo
- [x] 클라이언트 식별 로직 (JWT sub 또는 IP)
- [x] TTL 기반 캐시 만료 처리
- [x] 응답 크기 최적화 (navigation 데이터가 너무 크면 hint만)

### 작업 로그

#### 2026-01-06 16:30 - Workthrough 완료

**개요**: MCP API 첫 호출 시 vault-navigation 데이터를 자동으로 응답에 주입하는 ASGI 미들웨어 구현. ChatGPT가 MCP로 연결 시 vault 구조를 자동으로 파악할 수 있게 함.

**Context**:
- 문제: ChatGPT가 MCP 연결 시 vault 구조를 모르면 비효율적인 탐색 발생
- 해결: 첫 API 호출 시 navigation 데이터 자동 주입 → UX 개선
- 접근: ASGI 미들웨어로 응답 후처리, TTL 캐시로 중복 주입 방지

**파일 변경**:

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `api/middleware/__init__.py` | 신규 | 모듈 초기화, NavigationInjectorMiddleware export |
| `api/middleware/navigation_injector.py` | 신규 | 핵심 미들웨어 구현 (230줄) |
| `api/main.py` | 수정 | 미들웨어 등록 + MCP 설정 업데이트 |

**아키텍처**:
```
Request → AuthMiddleware → NavigationInjectorMiddleware → Router
                                      │
                                      ▼
                          클라이언트 식별 (JWT/IP)
                                      │
                                      ▼
                          navigation 호출 이력 확인
                                      │
                          ┌───────────┴───────────┐
                          ▼                       ▼
                    미호출 시                  호출 완료
                          │                       │
                          ▼                       ▼
              _auto_navigation 주입          원본 응답
```

**핵심 코드**:
```python
# api/middleware/navigation_injector.py

# 클라이언트별 navigation 호출 추적 (TTL 1시간)
_navigation_cache: Dict[str, datetime] = {}
NAVIGATION_TTL = timedelta(hours=1)

def get_client_id(scope: Scope) -> str:
    """JWT user_id > X-Forwarded-For > client IP 순으로 식별"""
    state = scope.get("state", {})
    if isinstance(state, dict) and state.get("user_id"):
        return f"user:{state['user_id']}"
    # ... IP fallback

class NavigationInjectorMiddleware:
    async def __call__(self, scope, receive, send):
        # /api/mcp/* 경로만 처리
        if not path.startswith("/api/mcp/"):
            await self.app(scope, receive, send)
            return
        # navigation 호출 시 기록
        if path == "/api/mcp/vault-navigation":
            mark_navigation_called(client_id)
        # 미호출 클라이언트에게 자동 주입
        elif needs_navigation(client_id):
            await self._inject_navigation(...)
```

**자동 주입 데이터 구조**:
```json
{
  "... 원래 응답 ...",
  "_auto_navigation": {
    "hint": "Auto-injected navigation...",
    "vault_structure": { "hierarchy": "...", "dual_vault": {...} },
    "entity_stats": { "Project": 33, "Task": 196, ... },
    "quick_start": { "search": "...", "file_read": "...", ... },
    "routing_hints": [...]
  },
  "_navigation_hint": "Navigation data auto-injected..."
}
```

**검증 결과**:
```bash
$ python3 -c "from api.middleware import NavigationInjectorMiddleware; print('OK')"
✅ Import successful

$ python3 -c "from api.middleware.navigation_injector import *; ..."
✅ Client ID: user:test-user
✅ Needs navigation (before): True
✅ Needs navigation (after): False
✅ Navigation data keys: ['hint', 'vault_structure', 'entity_stats', 'quick_start', 'routing_hints']
✅ Entity stats: {'Project': 33, 'Task': 196, 'Hypothesis': 46, 'Track': 6}
```

**MCP 설정 변경**:
- `MCP_ALLOWED_OPERATIONS`에 `get_vault_navigation_api_mcp_vault_navigation_get` 추가
- MCP description 업데이트 (12개 → 14개 도구)

**결과**: ✅ 로컬 테스트 성공

**다음 단계**:
- [ ] NAS 배포: `/mcp-server rebuild`
- [ ] ChatGPT 연동 테스트: 첫 API 호출 시 `_auto_navigation` 확인


---

## 참고 문서

- [[prj-vault-gpt]] - 소속 Project
- `public/api/routers/mcp_composite.py` - Navigation API 구현
- `public/api/main.py` - MCP 설정

---

**Created**: 2026-01-05
**Assignee**: 한명학
**Due**: 2026-01-05
