---
entity_type: Task
entity_id: tsk-vault-gpt-06
entity_name: MCP - vault-full-scan API 개발
created: 2026-01-02
updated: '2026-01-03'
status: done
parent_id: prj-vault-gpt
project_id: prj-vault-gpt
aliases:
- tsk-vault-gpt-06
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
start_date: '2026-01-02'
due: '2026-01-02'
priority: high
estimated_hours: 2
actual_hours: null
type: dev
target_project: loop-api
tags:
- mcp
- api
- gpt
- composite-api
- full-scan
priority_flag: high
notes: "# MCP - vault-full-scan API 개발\n\n> Task ID: `tsk-vault-gpt-06` | Project:\
  \ `prj-vault-gpt` | Status: doing\n\n## 목표\n\nChatGPT가 **한 번의 allow**로 Vault 전체\
  \ 구조를 파악할 수 있는 슈퍼 복합 API 개발\n\n**완료 조건**:\n1. `GET /api/mcp/vault-full-scan` 엔드포인트\
  \ 구현\n2. 한 번 호출로 타입 목록 + 스키마 + 샘플 엔티티 + 속성 분포 반환\n3. depth 파라미터로 응답 크기 조절 가능\n4.\
  \ MCP 도구로 노출 및 ChatGPT 테스트 성공\n\n---\n\n## 상세 내용\n\n### 배경\n\n현재 상황:\n- ChatGPT가\
  \ Vault 구조를 파악하려면 여러 API 호출 필요\n- 매 호출마다 allow 팝업 → UX 저하\n- 필요한 정보가 여러 API에 분산되어\
  \ 있음\n\nChatGPT가 요청한 5가지 기능:\n1. `vault.get_overview()` - vault 메타 정보\n2. `vault.list_entity_types()`\
  \ - 타입 정의 목록\n3. `vault.get_schema(type)` - 타입별 필드 정의\n4. `vault.list_entities(type)`\
  \ - 타입별 엔티티 목록\n5. `vault.get_entity(id)` - 특정 엔티티 상세\n\n### 작업 내용\n\n**단일 슈퍼 복합\
  \ API로 통합:**\n\n```\nGET /api/mcp/vault-full-scan?depth=summary|full&types=Task,Project\n\
  ```\n\n**응답 구조:**\n```json\n{\n  \"vault_meta\": {\n    \"name\": \"LOOP Vault\"\
  ,\n    \"philosophy\": \"...\",\n    \"hierarchy\": \"NorthStar → ... → Task\"\n\
  \  },\n  \"entity_types\": {\n    \"Task\": {\n      \"count\": 123,\n      \"fields\"\
  : [\"entity_id\", \"status\", \"assignee\", ...],\n      \"field_values\": {\n \
  \       \"status\": [\"todo\", \"doing\", \"done\"],\n        \"assignee\": [\"\
  김은향\", \"한명학\"],\n        \"type\": [\"dev\", \"strategy\", \"ops\"]\n      },\n\
  \      \"sample\": [...] // depth=full 시에만\n    },\n    \"Project\": { ... },\n\
  \    \"Track\": { ... }\n  },\n  \"active_summary\": {\n    \"doing_tasks\": 15,\n\
  \    \"doing_projects\": 10,\n    \"attention_needed\": [...]\n  }\n}\n```\n\n**파라미터:**\n\
  | 파라미터 | 설명 | 기본값 |\n|---------|------|-------|\n| `depth` | summary(가벼움) / full(샘플\
  \ 포함) | summary |\n| `types` | 특정 타입만 조회 (쉼표 구분) | 전체 |\n| `sample_size` | 타입당 샘플\
  \ 엔티티 수 | 3 |\n\n---\n\n## 체크리스트\n\n- [ ] `vault-full-scan` 엔드포인트 구현\n- [ ] entity_types\
  \ 별 필드 정의 추출\n- [ ] field_values 분포 계산 (status, assignee, type 등)\n- [ ] depth=summary/full\
  \ 분기 처리\n- [ ] types 필터링 구현\n- [ ] MCP_ALLOWED_OPERATIONS에 추가\n- [ ] Docker 재빌드\
  \ (`/mcp-server rebuild`)\n- [ ] ChatGPT에서 테스트\n\n---\n\n## Notes\n\n### PRD (Product\
  \ Requirements Document)\n\n#### \U0001F4CA 아키텍처 도식\n\n```\n┌─────────────────────────────────────────────────────────────────┐\n\
  │                   vault-full-scan API Architecture               │\n├─────────────────────────────────────────────────────────────────┤\n\
  │  Request Layer                                                   │\n│  GET /api/mcp/vault-full-scan?depth=summary|full&types=...\
  \     │\n│       ↓                                                          │\n\
  │  Router Layer (routers/mcp_composite.py)                         │\n│  vault_full_scan()\
  \ ──→ VaultFullScanResponse                    │\n│       ├──→ _build_vault_meta()\
  \                                  │\n│       ├──→ _build_entity_types_info()  \
  \                         │\n│       └──→ _build_active_summary()              \
  \                │\n│       ↓                                                  \
  \        │\n│  Cache Layer (VaultCache) + Constants (schema_constants.yaml)   │\n\
  │       ↓                                                          │\n│  MCP_ALLOWED_OPERATIONS\
  \ += vault_full_scan                       │\n└─────────────────────────────────────────────────────────────────┘\n\
  ```\n\n#### \U0001F4CB 프로젝트 컨텍스트\n\n- **Framework**: FastAPI (Python 3.11+)\n- **Architecture**:\
  \ Router-Cache-Constants 패턴\n- **State Management**: VaultCache (In-memory, mtime\
  \ 기반 자동 갱신)\n- **MCP Integration**: fastapi-mcp 라이브러리\n- **Schema Source**: `00_Meta/schema_constants.yaml`\
  \ (SSOT)\n\n#### \U0001F3AF 문제 정의\n\n**현재 상황**: ChatGPT가 LOOP Vault를 탐색할 때 4+ 번의\
  \ allow 권한 요청 발생\n- vault-context → schema → dashboard → 각 타입별 조회\n\n**해결책**: 한\
  \ 번의 API 호출로 Vault 전체를 이해할 수 있는 슈퍼 복합 API\n\n#### \U0001F4DD 상세 요구사항\n\n**엔드포인트**:\
  \ `GET /api/mcp/vault-full-scan`\n\n**Query Parameters**:\n| Parameter | Type |\
  \ Default | Description |\n|-----------|------|---------|-------------|\n| `depth`\
  \ | string | \"summary\" | summary: 필드+분포만, full: 샘플 포함 |\n| `types` | string |\
  \ null | 조회할 타입들 (쉼표 구분) |\n| `sample_count` | int | 2 | depth=full 시 타입당 샘플 개수\
  \ |\n\n**Response 구조**:\n```json\n{\n  \"vault_meta\": {\n    \"name\": \"LOOP Vault\"\
  ,\n    \"philosophy\": \"...\",\n    \"hierarchy\": \"NorthStar → MetaHypothesis\
  \ → Condition → Track → Project → Task\",\n    \"id_patterns\": {...},\n    \"schema_version\"\
  : \"5.3\"\n  },\n  \"entity_types\": {\n    \"Task\": {\n      \"count\": 123,\n\
  \      \"required_fields\": [...],\n      \"known_fields\": [...],\n      \"field_values\"\
  : {\"status\": {\"todo\": 45, \"doing\": 30}, ...},\n      \"samples\": [...]  //\
  \ depth=full 시\n    },\n    ...\n  },\n  \"active_summary\": {...},\n  \"query_guide\"\
  : {...}\n}\n```\n\n#### ✅ 성공 기준\n\n- [ ] `GET /api/mcp/vault-full-scan` 정상 작동\n\
  - [ ] depth=summary 응답 크기 < 50KB\n- [ ] depth=full 응답 크기 < 200KB\n- [ ] MCP 도구로\
  \ 정상 노출\n- [ ] 캐시 기반 O(1) 응답 시간\n\n### Tech Spec\n\n#### \U0001F4C1 파일 변경\n\n```\n\
  api/routers/mcp_composite.py   # + VaultFullScanResponse, vault_full_scan()\napi/main.py\
  \                    # + MCP_ALLOWED_OPERATIONS 업데이트\n```\n\n#### \U0001F4DD 구현\
  \ 순서\n\n1. Pydantic 모델 정의 (VaultMeta, EntityTypeInfo, VaultFullScanResponse)\n2.\
  \ Helper 함수 구현 (_build_vault_meta, _calculate_field_distribution, _select_samples)\n\
  3. 엔드포인트 구현 (vault_full_scan)\n4. MCP 등록 (main.py MCP_ALLOWED_OPERATIONS 추가)\n5.\
  \ 테스트 (curl로 depth=summary/full 확인)\n6. Docker 재배포 (/mcp-server rebuild)\n\n###\
  \ Todo\n- [ ] Pydantic 모델 정의\n- [ ] Helper 함수 구현\n- [ ] vault_full_scan 엔드포인트 구현\n\
  - [ ] MCP_ALLOWED_OPERATIONS 추가\n- [ ] curl 테스트\n- [ ] Docker 재빌드\n\n### 작업 로그\n\
  <!--\n작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)\n\n#### YYYY-MM-DD HH:MM\n**개요**:\
  \ 2-3문장 요약\n\n**변경사항**:\n- 개발:\n- 수정:\n- 개선:\n\n**핵심 코드**: (필요시)\n\n**결과**: ✅ 빌드\
  \ 성공 / ❌ 실패\n\n**다음 단계**:\n-->\n\n\n---\n\n## 참고 문서\n\n- [[prj-vault-gpt]] - 소속\
  \ Project\n- [[tsk-vault-gpt-05]] - 이전 복합 API 개발 Task\n- [[api/routers/mcp_composite.py]]\
  \ - 복합 API 라우터\n\n---\n\n**Created**: 2026-01-02\n**Assignee**: 김은향\n**Due**: 2026-01-02\n"
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
