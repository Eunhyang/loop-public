---
entity_type: Task
entity_id: tsk-mcp-rbac-04
entity_name: MCP - 복합 API exec vault 필터링
created: 2026-01-03
updated: '2026-01-11'
status: doing
parent_id: prj-mcp-dual-vault-rbac
project_id: prj-mcp-dual-vault-rbac
program_id: pgm-vault-system
aliases:
- tsk-mcp-rbac-04
outgoing_relations:
- type: depends_on
  target_id: tsk-mcp-rbac-03
  description: exec vault 라우팅 구현 완료 필요
validates: []
validated_by: []
type: dev
assignee: 김은향
priority: high
due: null
estimate: null
target_project: loop
tags:
- mcp
- rbac
- security
- exec-vault
- api
priority_flag: high
---
# MCP - 복합 API exec vault 필터링

> Task ID: `tsk-mcp-rbac-04` | Project: `prj-mcp-dual-vault-rbac` | Status: doing

---

## 목표

MCP 복합 API(vault-context, vault-full-scan 등)에서 `_vault == 'exec'`인 데이터가 member role에게 노출되지 않도록 필터링

**완료 조건**:
1. vault-context, vault-full-scan, project-context, status-summary 등에서 exec vault 데이터 필터링
2. role=member 사용자가 복합 API 호출 시 exec vault 프로젝트/태스크 미노출
3. role=admin/exec 사용자는 기존처럼 전체 데이터 접근 가능
4. 기존 exec-* 전용 API는 영향 없음

---

## 상세 내용

### 배경

현재 VaultCache가 exec vault 프로젝트/태스크를 통합 로드하여 캐시에 저장:
- `cache.get_all_tasks()`, `cache.get_all_projects()`가 exec vault 데이터 포함
- 복합 API들이 RBAC 체크 없이 캐시 데이터 반환
- 결과: **member role도 exec vault 기본 정보(id, name, status, owner) 조회 가능**

민감 필드(contract, salary, rate, terms, contact)는 VaultCache에서 이미 필터링되지만,
프로젝트/태스크 존재 자체와 메타데이터 노출은 보안 문제.

### 영향받는 API

| API | 현재 상태 | 수정 필요 |
|-----|----------|----------|
| `/api/mcp/vault-context` | exec 포함 | ✅ role 체크 필요 |
| `/api/mcp/vault-full-scan` | exec 포함 | ✅ role 체크 필요 |
| `/api/mcp/project/{id}/context` | exec 포함 | ✅ role 체크 필요 |
| `/api/mcp/track/{id}/context` | exec 포함 | ✅ role 체크 필요 |
| `/api/mcp/status-summary` | exec 포함 | ✅ role 체크 필요 |
| `/api/mcp/entity/{id}/graph` | exec 포함 | ✅ role 체크 필요 |
| `/api/mcp/exec-*` | RBAC 있음 | ❌ 수정 불필요 |

---

## Notes

### PRD (Product Requirements Document)

**문제**: ChatGPT MCP에서 member role 사용자가 exec vault 프로젝트/태스크 메타데이터 조회 가능

**해결책**: 복합 API에서 role 기반 필터링 추가

**아키텍처**:
```
┌─────────────────────────────────────────────────────────────────┐
│              Exec Vault Filtering Architecture                   │
├─────────────────────────────────────────────────────────────────┤
│  Request Layer                                                   │
│  ├── ChatGPT MCP ──→ AuthMiddleware ──→ scope["state"]          │
│  │                       │                  │                    │
│  │                       ↓                  ↓                    │
│  │                  role check         {role, scope}             │
│  │                                                               │
│  MCP Composite API Layer                                         │
│  ├── vault-context ──┐                                           │
│  ├── vault-full-scan ├──→ filter_exec_data(entities, req)       │
│  ├── project-context ├──→     │                                  │
│  ├── track-context ──┤        ↓                                  │
│  ├── status-summary ─┤   role in (admin, exec)?                  │
│  └── entity-graph ───┘        │                                  │
│                          YES  │  NO                              │
│                           ↓   │   ↓                              │
│                       전체반환│ _vault != 'exec' 필터링           │
└─────────────────────────────────────────────────────────────────┘
```

**권장 접근법**: 헬퍼 함수 방식 (코드 중복 최소화, 유지보수 용이)

### Tech Spec

**프로젝트 컨텍스트**:
- Framework: FastAPI + Python 3.x
- Auth: OAuth 2.0 (RS256 JWT + PKCE)
- RBAC: role-based (`member` | `exec` | `admin`)
- Cache: VaultCache (exec vault 데이터 `_vault: exec` 마커)

**구현 상세**:

#### 1. 헬퍼 함수 추가 (`mcp_composite.py:156` 이후)

```python
def filter_exec_data(entities: List[Dict], request: Request) -> List[Dict]:
    """exec vault 데이터 필터링 (role 기반)

    Args:
        entities: 캐시에서 조회한 엔티티 목록
        request: FastAPI Request 객체

    Returns:
        role=admin/exec: 전체 반환
        role=member: _vault != 'exec'인 항목만 반환
    """
    role, _ = get_role_and_scope(request)
    if role in ('admin', 'exec'):
        return entities
    return [e for e in entities if e.get('_vault') != 'exec']
```

#### 2. 수정 대상 API (6개)

| API | Line | 수정 내용 |
|-----|------|----------|
| `get_vault_context()` | 204 | request 추가, all_tasks/all_projects 필터링 |
| `vault_full_scan()` | 947 | request 추가, entities 필터링 |
| `get_project_context()` | 445 | request 추가, exec 프로젝트 접근 시 403, tasks 필터링 |
| `get_track_context()` | 513 | request 추가, track_projects 필터링 |
| `get_status_summary()` | 557 | request 추가, all_tasks/all_projects 필터링 |
| `get_entity_graph()` | 653 | request 추가, exec 엔티티 접근 시 403, children 필터링 |

#### 3. 특수 처리

- `get_project_context()`: exec vault 프로젝트 직접 접근 시 member에게 403
- `get_entity_graph()`: exec vault 엔티티 직접 접근 시 member에게 403

### Todo

- [ ] `filter_exec_data()` 헬퍼 함수 구현
- [ ] `get_vault_context()` 수정
- [ ] `vault_full_scan()` 수정
- [ ] `get_project_context()` 수정
- [ ] `get_track_context()` 수정
- [ ] `get_status_summary()` 수정
- [ ] `get_entity_graph()` 수정
- [ ] curl 테스트 (member/admin 토큰)
- [ ] Docker 재빌드 및 배포
- [ ] ChatGPT MCP 테스트

### 테스트 계획

```bash
# member 토큰으로 vault-context → exec 데이터 미노출
curl -H "Authorization: Bearer $MEMBER_TOKEN" \
  "$LOOP_API_URL/api/mcp/vault-context"

# admin 토큰으로 vault-context → exec 데이터 포함
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$LOOP_API_URL/api/mcp/vault-context"

# member 토큰으로 exec 프로젝트 직접 접근 → 403
curl -H "Authorization: Bearer $MEMBER_TOKEN" \
  "$LOOP_API_URL/api/mcp/project/prj-exec-001/context"
```

---

## 참고 문서

- [[prj-mcp-dual-vault-rbac]] - 소속 Project
- [[tsk-mcp-rbac-03]] - loop_exec Vault 라우팅 (선행 Task)
- `api/routers/mcp_composite.py` - 수정 대상 파일
- `api/cache/vault_cache.py` - VaultCache 구조

---

**Created**: 2026-01-03
**Assignee**: 김은향
