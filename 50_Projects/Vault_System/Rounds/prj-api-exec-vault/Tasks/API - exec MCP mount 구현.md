---
entity_type: Task
entity_id: tsk-018-04
entity_name: API - exec MCP mount 구현
created: 2026-01-06
updated: '2026-01-12'
status: done
closed: 2026-01-06
parent_id: prj-api-exec-vault
project_id: prj-api-exec-vault
aliases:
- tsk-018-04
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
start_date: 2026-01-06
due: '2026-01-11'
priority: high
estimated_hours: null
actual_hours: null
type: dev
target_project: loop-api
tags:
- api
- mcp
- exec-vault
priority_flag: high
notes: "# API - exec MCP mount 구현\n\n> Task ID: `tsk-018-04` | Project: `prj-api-exec-vault`\
  \ | Status: done\n\n## 목표\n\n**완료 조건**:\n\n1. exec/api에 fastapi-mcp 통합\n2. MCP 엔드포인트\
  \ (/mcp) 동작 확인\n3. OAuth scope (mcp:exec) 기반 접근 제어\n\n---\n\n## 상세 내용\n\n### 배경\n\
  \ntsk-018-03에서 shared/ 모듈과 exec/api 기본 구조를 만들었으나, exec/api의 MCP mount는 아직 미구현 상태.\n\
  \n### 작업 내용\n\n1. exec/api/main.py에 FastApiMCP 통합\n2. MCP 도구 정의 (runway, cashflow,\
  \ kpi 등)\n3. mcp:exec scope 검증 추가\n\n---\n\n## 체크리스트\n\n- [x] fastapi-mcp import\
  \ 추가\n\n- [x] MCP 도구 정의\n\n- [x] /mcp 엔드포인트 동작 테스트\n\n- [x] OAuth scope 검증\n\n---\n\
  \n## Notes\n\n### PRD (Product Requirements Document)\n\n**목표**: exec/api에 FastApiMCP를\
  \ 통합하여 MCP 프로토콜로 exec vault 데이터에 접근 가능하게 함\n\n**요구사항**:\n\n1. fastapi-mcp import\
  \ 및 FastApiMCP 인스턴스 생성\n2. MCP 도구 정의 (exec vault 전용: runway, cashflow, kpi 등)\n\
  3. mcp:exec scope 검증 미들웨어\n4. /mcp 엔드포인트 마운트\n\n**비기능 요구사항**:\n\n- OAuth scope 기반\
  \ 접근 제어 (mcp:exec 필수)\n- SSE 스트리밍 지원\n- public/api와 일관된 MCP 도구 노출 패턴\n\n### Tech\
  \ Spec\n\n**아키텍처**:\n\n```\nexec/api/main.py\n├── FastApiMCP 인스턴스 생성\n├── MCP_ALLOWED_OPERATIONS\
  \ 정의\n│   └── exec vault 전용 도구 (kpi_overview, runway_status 등)\n├── MCPScopeMiddleware\
  \ (mcp:exec scope 검증)\n└── /mcp 엔드포인트 마운트\n```\n\n**구현 상세**:\n\n1. **FastApiMCP\
  \ 통합**:\n\n   - `from fastapi_mcp import FastApiMCP`\n   - 조건부 import (MCP_AVAILABLE\
  \ 플래그)\n   - 기존 router와 함께 MCP 도구로 노출\n\n2. **MCP 도구 정의**:\n\n   - `get_kpi_overview_api_kpi_overview_get`\
  \ - KPI 개요\n   - `get_mau_api_kpi_mau_get` - MAU 데이터\n   - `get_conversion_api_kpi_conversion_get`\
  \ - 전환 퍼널\n   - `get_user_journey_api_kpi_user__user_id__get` - 유저 여정\n\n3. **Scope\
  \ 검증**:\n\n   - 기존 KPIScopeMiddleware에 mcp:exec 검증 추가\n   - /mcp 경로에 대해 mcp:exec\
  \ scope 필수\n\n4. **의존성**:\n\n   - fastapi-mcp (public/shared에서 이미 설치됨)\n   - shared.auth.scope_checker\
  \ (check_scope)\n\n### 체크리스트\n\n- [ ] fastapi-mcp import 추가\n\n- [ ] MCP_ALLOWED_OPERATIONS\
  \ 정의\n\n- [ ] mcp:exec scope 검증 추가\n\n- [ ] /mcp 엔드포인트 마운트\n\n- [ ] 테스트 (인증 없이 403,\
  \ 인증 시 동작)\n\n### 작업 로그\n\n2026-01-06 15:00\n\n**개요**: exec/api에 FastApiMCP를 통합하여\
  \ MCP 프로토콜로 KPI 데이터에 접근할 수 있도록 구현했습니다. mcp:exec scope 검증 미들웨어를 추가하여 권한 없는 접근을 차단합니다.\n\
  \n**변경사항**:\n\n- 개발: FastApiMCP 인스턴스 생성 및 /mcp 엔드포인트 마운트\n- 개발: ExecScopeMiddleware\
  \ (mcp:exec scope 검증)\n- 개발: MCP_ALLOWED_OPERATIONS 정의 (KPI 엔드포인트 5개)\n\n**파일 변경**:\n\
  \n- `exec/api/main.py` - FastApiMCP 통합, 미들웨어 추가\n\n**MCP 도구**:\n\n- `get_kpi_overview_api_kpi_overview_get`\n\
  - `get_mau_api_kpi_mau_get`\n- `get_conversion_api_kpi_conversion_get`\n- `get_user_journey_api_kpi_user__user_id__get`\n\
  - `analyze_refunds_api_kpi_refund_analysis_post`\n\n**결과**: ✅ 코드 리뷰 통과, MCP 엔드포인트\
  \ 마운트 완료\n\n**다음 단계**:\n\n- 없음 (완료)\n\n---\n\n**2026-01-06 (상세)**:\n\n- exec/api/main.py에\
  \ FastApiMCP 통합 완료\n- ExecScopeMiddleware 구현 (/mcp에 mcp:exec scope 검증)\n- MCP_ALLOWED_OPERATIONS\
  \ 정의 (KPI 엔드포인트 5개)\n- /mcp 엔드포인트 마운트 완료\n- SSE 스트리밍 지원 (sse_prefixes에 /mcp 추가)\n\
  \n**변경 파일**:\n\n- `/Users/gim-eunhyang/dev/loop/exec/api/main.py`\n\n---\n\n## 참고\
  \ 문서\n\n- \\[\\[prj-api-exec-vault\\]\\] - 소속 Project\n- \\[\\[tsk-018-03\\]\\]\
  \ - 선행 작업 (shared/ 모듈)\n\n---\n\n**Created**: 2026-01-06 **Assignee**: 김은향 **Due**:\
  \ 2026-01-06"
---
# API - exec MCP mount 구현

> Task ID: `tsk-018-04` | Project: `prj-api-exec-vault` | Status: done

## 목표

**완료 조건**:
1. exec/api에 fastapi-mcp 통합
2. MCP 엔드포인트 (/mcp) 동작 확인
3. OAuth scope (mcp:exec) 기반 접근 제어

---

## 상세 내용

### 배경

tsk-018-03에서 shared/ 모듈과 exec/api 기본 구조를 만들었으나,
exec/api의 MCP mount는 아직 미구현 상태.

### 작업 내용

1. exec/api/main.py에 FastApiMCP 통합
2. MCP 도구 정의 (runway, cashflow, kpi 등)
3. mcp:exec scope 검증 추가

---

## 체크리스트

- [x] fastapi-mcp import 추가
- [x] MCP 도구 정의
- [x] /mcp 엔드포인트 동작 테스트
- [x] OAuth scope 검증

---

## Notes

### PRD (Product Requirements Document)

**목표**: exec/api에 FastApiMCP를 통합하여 MCP 프로토콜로 exec vault 데이터에 접근 가능하게 함

**요구사항**:
1. fastapi-mcp import 및 FastApiMCP 인스턴스 생성
2. MCP 도구 정의 (exec vault 전용: runway, cashflow, kpi 등)
3. mcp:exec scope 검증 미들웨어
4. /mcp 엔드포인트 마운트

**비기능 요구사항**:
- OAuth scope 기반 접근 제어 (mcp:exec 필수)
- SSE 스트리밍 지원
- public/api와 일관된 MCP 도구 노출 패턴

### Tech Spec

**아키텍처**:
```
exec/api/main.py
├── FastApiMCP 인스턴스 생성
├── MCP_ALLOWED_OPERATIONS 정의
│   └── exec vault 전용 도구 (kpi_overview, runway_status 등)
├── MCPScopeMiddleware (mcp:exec scope 검증)
└── /mcp 엔드포인트 마운트
```

**구현 상세**:

1. **FastApiMCP 통합**:
   - `from fastapi_mcp import FastApiMCP`
   - 조건부 import (MCP_AVAILABLE 플래그)
   - 기존 router와 함께 MCP 도구로 노출

2. **MCP 도구 정의**:
   - `get_kpi_overview_api_kpi_overview_get` - KPI 개요
   - `get_mau_api_kpi_mau_get` - MAU 데이터
   - `get_conversion_api_kpi_conversion_get` - 전환 퍼널
   - `get_user_journey_api_kpi_user__user_id__get` - 유저 여정

3. **Scope 검증**:
   - 기존 KPIScopeMiddleware에 mcp:exec 검증 추가
   - /mcp 경로에 대해 mcp:exec scope 필수

4. **의존성**:
   - fastapi-mcp (public/shared에서 이미 설치됨)
   - shared.auth.scope_checker (check_scope)

### 체크리스트

- [ ] fastapi-mcp import 추가
- [ ] MCP_ALLOWED_OPERATIONS 정의
- [ ] mcp:exec scope 검증 추가
- [ ] /mcp 엔드포인트 마운트
- [ ] 테스트 (인증 없이 403, 인증 시 동작)

### 작업 로그

#### 2026-01-06 15:00
**개요**: exec/api에 FastApiMCP를 통합하여 MCP 프로토콜로 KPI 데이터에 접근할 수 있도록 구현했습니다. mcp:exec scope 검증 미들웨어를 추가하여 권한 없는 접근을 차단합니다.

**변경사항**:
- 개발: FastApiMCP 인스턴스 생성 및 /mcp 엔드포인트 마운트
- 개발: ExecScopeMiddleware (mcp:exec scope 검증)
- 개발: MCP_ALLOWED_OPERATIONS 정의 (KPI 엔드포인트 5개)

**파일 변경**:
- `exec/api/main.py` - FastApiMCP 통합, 미들웨어 추가

**MCP 도구**:
- `get_kpi_overview_api_kpi_overview_get`
- `get_mau_api_kpi_mau_get`
- `get_conversion_api_kpi_conversion_get`
- `get_user_journey_api_kpi_user__user_id__get`
- `analyze_refunds_api_kpi_refund_analysis_post`

**결과**: ✅ 코드 리뷰 통과, MCP 엔드포인트 마운트 완료

**다음 단계**:
- 없음 (완료)

---

**2026-01-06 (상세)**:
- exec/api/main.py에 FastApiMCP 통합 완료
- ExecScopeMiddleware 구현 (/mcp에 mcp:exec scope 검증)
- MCP_ALLOWED_OPERATIONS 정의 (KPI 엔드포인트 5개)
- /mcp 엔드포인트 마운트 완료
- SSE 스트리밍 지원 (sse_prefixes에 /mcp 추가)

**변경 파일**:
- `/Users/gim-eunhyang/dev/loop/exec/api/main.py`

---

## 참고 문서

- [[prj-api-exec-vault]] - 소속 Project
- [[tsk-018-03]] - 선행 작업 (shared/ 모듈)

---

**Created**: 2026-01-06
**Assignee**: 김은향
**Due**: 2026-01-06
