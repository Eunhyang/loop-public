---
entity_type: Task
entity_id: "tsk-vault-gpt-06"
entity_name: "MCP - vault-full-scan API 개발"
created: 2026-01-02
updated: 2026-01-02
status: doing

# === 계층 ===
parent_id: "prj-vault-gpt"
project_id: "prj-vault-gpt"
aliases: ["tsk-vault-gpt-06"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-02
due: 2026-01-02
priority: high
estimated_hours: 2
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop-api

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-b"]

# === 분류 ===
tags: [mcp, api, gpt, composite-api, full-scan]
priority_flag: high
---

# MCP - vault-full-scan API 개발

> Task ID: `tsk-vault-gpt-06` | Project: `prj-vault-gpt` | Status: doing

## 목표

ChatGPT가 **한 번의 allow**로 Vault 전체 구조를 파악할 수 있는 슈퍼 복합 API 개발

**완료 조건**:
1. `GET /api/mcp/vault-full-scan` 엔드포인트 구현
2. 한 번 호출로 타입 목록 + 스키마 + 샘플 엔티티 + 속성 분포 반환
3. depth 파라미터로 응답 크기 조절 가능
4. MCP 도구로 노출 및 ChatGPT 테스트 성공

---

## 상세 내용

### 배경

현재 상황:
- ChatGPT가 Vault 구조를 파악하려면 여러 API 호출 필요
- 매 호출마다 allow 팝업 → UX 저하
- 필요한 정보가 여러 API에 분산되어 있음

ChatGPT가 요청한 5가지 기능:
1. `vault.get_overview()` - vault 메타 정보
2. `vault.list_entity_types()` - 타입 정의 목록
3. `vault.get_schema(type)` - 타입별 필드 정의
4. `vault.list_entities(type)` - 타입별 엔티티 목록
5. `vault.get_entity(id)` - 특정 엔티티 상세

### 작업 내용

**단일 슈퍼 복합 API로 통합:**

```
GET /api/mcp/vault-full-scan?depth=summary|full&types=Task,Project
```

**응답 구조:**
```json
{
  "vault_meta": {
    "name": "LOOP Vault",
    "philosophy": "...",
    "hierarchy": "NorthStar → ... → Task"
  },
  "entity_types": {
    "Task": {
      "count": 123,
      "fields": ["entity_id", "status", "assignee", ...],
      "field_values": {
        "status": ["todo", "doing", "done"],
        "assignee": ["김은향", "한명학"],
        "type": ["dev", "strategy", "ops"]
      },
      "sample": [...] // depth=full 시에만
    },
    "Project": { ... },
    "Track": { ... }
  },
  "active_summary": {
    "doing_tasks": 15,
    "doing_projects": 10,
    "attention_needed": [...]
  }
}
```

**파라미터:**
| 파라미터 | 설명 | 기본값 |
|---------|------|-------|
| `depth` | summary(가벼움) / full(샘플 포함) | summary |
| `types` | 특정 타입만 조회 (쉼표 구분) | 전체 |
| `sample_size` | 타입당 샘플 엔티티 수 | 3 |

---

## 체크리스트

- [ ] `vault-full-scan` 엔드포인트 구현
- [ ] entity_types 별 필드 정의 추출
- [ ] field_values 분포 계산 (status, assignee, type 등)
- [ ] depth=summary/full 분기 처리
- [ ] types 필터링 구현
- [ ] MCP_ALLOWED_OPERATIONS에 추가
- [ ] Docker 재빌드 (`/mcp-server rebuild`)
- [ ] ChatGPT에서 테스트

---

## Notes

### PRD (Product Requirements Document)

#### 📊 아키텍처 도식

```
┌─────────────────────────────────────────────────────────────────┐
│                   vault-full-scan API Architecture               │
├─────────────────────────────────────────────────────────────────┤
│  Request Layer                                                   │
│  GET /api/mcp/vault-full-scan?depth=summary|full&types=...     │
│       ↓                                                          │
│  Router Layer (routers/mcp_composite.py)                         │
│  vault_full_scan() ──→ VaultFullScanResponse                    │
│       ├──→ _build_vault_meta()                                  │
│       ├──→ _build_entity_types_info()                           │
│       └──→ _build_active_summary()                              │
│       ↓                                                          │
│  Cache Layer (VaultCache) + Constants (schema_constants.yaml)   │
│       ↓                                                          │
│  MCP_ALLOWED_OPERATIONS += vault_full_scan                       │
└─────────────────────────────────────────────────────────────────┘
```

#### 📋 프로젝트 컨텍스트

- **Framework**: FastAPI (Python 3.11+)
- **Architecture**: Router-Cache-Constants 패턴
- **State Management**: VaultCache (In-memory, mtime 기반 자동 갱신)
- **MCP Integration**: fastapi-mcp 라이브러리
- **Schema Source**: `00_Meta/schema_constants.yaml` (SSOT)

#### 🎯 문제 정의

**현재 상황**: ChatGPT가 LOOP Vault를 탐색할 때 4+ 번의 allow 권한 요청 발생
- vault-context → schema → dashboard → 각 타입별 조회

**해결책**: 한 번의 API 호출로 Vault 전체를 이해할 수 있는 슈퍼 복합 API

#### 📝 상세 요구사항

**엔드포인트**: `GET /api/mcp/vault-full-scan`

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `depth` | string | "summary" | summary: 필드+분포만, full: 샘플 포함 |
| `types` | string | null | 조회할 타입들 (쉼표 구분) |
| `sample_count` | int | 2 | depth=full 시 타입당 샘플 개수 |

**Response 구조**:
```json
{
  "vault_meta": {
    "name": "LOOP Vault",
    "philosophy": "...",
    "hierarchy": "NorthStar → MetaHypothesis → Condition → Track → Project → Task",
    "id_patterns": {...},
    "schema_version": "5.3"
  },
  "entity_types": {
    "Task": {
      "count": 123,
      "required_fields": [...],
      "known_fields": [...],
      "field_values": {"status": {"todo": 45, "doing": 30}, ...},
      "samples": [...]  // depth=full 시
    },
    ...
  },
  "active_summary": {...},
  "query_guide": {...}
}
```

#### ✅ 성공 기준

- [ ] `GET /api/mcp/vault-full-scan` 정상 작동
- [ ] depth=summary 응답 크기 < 50KB
- [ ] depth=full 응답 크기 < 200KB
- [ ] MCP 도구로 정상 노출
- [ ] 캐시 기반 O(1) 응답 시간

### Tech Spec

#### 📁 파일 변경

```
api/routers/mcp_composite.py   # + VaultFullScanResponse, vault_full_scan()
api/main.py                    # + MCP_ALLOWED_OPERATIONS 업데이트
```

#### 📝 구현 순서

1. Pydantic 모델 정의 (VaultMeta, EntityTypeInfo, VaultFullScanResponse)
2. Helper 함수 구현 (_build_vault_meta, _calculate_field_distribution, _select_samples)
3. 엔드포인트 구현 (vault_full_scan)
4. MCP 등록 (main.py MCP_ALLOWED_OPERATIONS 추가)
5. 테스트 (curl로 depth=summary/full 확인)
6. Docker 재배포 (/mcp-server rebuild)

### Todo
- [ ] Pydantic 모델 정의
- [ ] Helper 함수 구현
- [ ] vault_full_scan 엔드포인트 구현
- [ ] MCP_ALLOWED_OPERATIONS 추가
- [ ] curl 테스트
- [ ] Docker 재빌드

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)

#### YYYY-MM-DD HH:MM
**개요**: 2-3문장 요약

**변경사항**:
- 개발:
- 수정:
- 개선:

**핵심 코드**: (필요시)

**결과**: ✅ 빌드 성공 / ❌ 실패

**다음 단계**:
-->


---

## 참고 문서

- [[prj-vault-gpt]] - 소속 Project
- [[tsk-vault-gpt-05]] - 이전 복합 API 개발 Task
- [[api/routers/mcp_composite.py]] - 복합 API 라우터

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**: 2026-01-02
