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

#### 2026-01-06 완료
**개요**: MCP API 첫 호출 시 navigation 데이터를 자동 주입하는 미들웨어 구현

**변경사항**:
- 개발: `api/middleware/navigation_injector.py` - NavigationInjectorMiddleware 클래스
  - 클라이언트 식별 (JWT user_id > X-Forwarded-For > client IP)
  - TTL 1시간 캐시로 navigation 호출 추적
  - JSON 응답에 `_auto_navigation` 필드 자동 주입
- 개발: `api/middleware/__init__.py` - 모듈 초기화
- 수정: `api/main.py`
  - NavigationInjectorMiddleware 등록 (AuthMiddleware 이후 실행)
  - MCP_ALLOWED_OPERATIONS에 vault-navigation 추가
  - MCP description 업데이트 (14개 도구)

**핵심 코드**:
```python
# 클라이언트별 navigation 호출 추적
_navigation_cache: Dict[str, datetime] = {}
NAVIGATION_TTL = timedelta(hours=1)

# 응답에 navigation 자동 주입
data["_auto_navigation"] = _get_navigation_data_compact()
```

**결과**: ✅ 로컬 테스트 성공 (import, 함수 단위 테스트)

**다음 단계**:
- NAS 배포 (`/mcp-server rebuild`)
- ChatGPT 연동 테스트


---

## 참고 문서

- [[prj-vault-gpt]] - 소속 Project
- `public/api/routers/mcp_composite.py` - Navigation API 구현
- `public/api/main.py` - MCP 설정

---

**Created**: 2026-01-05
**Assignee**: 한명학
**Due**: 2026-01-05
