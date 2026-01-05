---
entity_type: Task
entity_id: "tsk-vault-gpt-10"
entity_name: "Navigation - vault-navigation API 엔드포인트 구현"
created: 2026-01-05
updated: 2026-01-05
status: doing

# === 계층 ===
parent_id: "prj-vault-gpt"
project_id: "prj-vault-gpt"
aliases: ["tsk-vault-gpt-10"]

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
tags: ["api", "navigation", "mcp", "llm-optimization"]
priority_flag: high
---

# Navigation - vault-navigation API 엔드포인트 구현

> Task ID: `tsk-vault-gpt-10` | Project: `prj-vault-gpt` | Status: doing

## 목표

분산된 navigation 문서들(`_HOME.md`, `_ENTRY_POINT.md`, `_VAULT_REGISTRY.md`, `_Graph_Index.md`)을 대체하는 **단일 API 엔드포인트** 구현.

**완료 조건**:
1. `GET /api/mcp/vault-navigation` 엔드포인트 구현
2. 실시간 vault 구조, 엔티티 통계, 라우팅 가이드 JSON 반환
3. LLM이 한 번의 API 호출로 vault 전체 구조 파악 가능

---

## 상세 내용

### 배경

현재 navigation 관련 문서가 분산되어 있음:
- `public/_HOME.md` - LLM 진입점
- `public/_Graph_Index.md` - 엔티티 인덱스 (자동 생성)
- `public/00_Meta/_VAULT_REGISTRY.md` - cross-vault 라우팅
- `exec/_ENTRY_POINT.md` - exec vault 진입점
- `exec/_HOME.md`, `exec/_Graph_Index.md`

**문제점**:
1. 분산 - 여러 파일에 정보가 흩어져 있음
2. 중복 - 같은 라우팅 정보가 여러 곳에 반복
3. 수동 관리 - 일부 파일은 수동 업데이트 → stale 위험
4. 정적 md - vault 변경 시 자동 반영 안 됨

### 작업 내용

**API 엔드포인트**: `GET /api/mcp/vault-navigation`

**응답 구조**:
```json
{
  "vaults": {
    "public": {
      "description": "Shared vault - Projects, Tasks, Strategy, Ontology",
      "access": "team + c-level",
      "folders": {
        "01_North_Star": { "count": 5, "description": "Vision, MetaHypotheses" },
        "20_Strategy": { "count": 15, "description": "Conditions, Tracks" },
        "50_Projects": { "count": 30, "description": "Projects, Tasks" },
        "60_Hypotheses": { "count": 8, "description": "Hypotheses" }
      },
      "recent_changes": [...]
    },
    "exec": {
      "description": "Executive vault - Runway, Cashflow, Hiring",
      "access": "c-level only",
      "folders": {...}
    }
  },
  "routing_guide": {
    "프로젝트/태스크 상태?": { "vault": "public", "path": "50_Projects/" },
    "런웨이 몇 개월?": { "vault": "exec", "path": "10_Runway/Current_Status.md" },
    "채용 가능?": { "vault": "exec", "path": "40_People/Hiring_Gate.md" }
  },
  "entity_stats": {
    "public": { "Project": 30, "Task": 150, "Hypothesis": 8 },
    "exec": { "Project": 5, "Task": 20, "Candidate": 3 }
  },
  "generated_at": "2026-01-05T10:00:00Z"
}
```

---

## 체크리스트

- [x] `api/routers/mcp_composite.py`에 `/api/mcp/vault-navigation` 엔드포인트 추가
- [x] vault 구조 스캔 로직 구현 (폴더별 엔티티 수 계산)
- [x] 라우팅 가이드 정의 (질문 → vault/path 매핑)
- [x] exec vault 지원 (읽기 전용)
- [x] 응답 캐싱 (vault_cache 연동)
- [x] 테스트 및 문서화

---

## Notes

### PRD (Product Requirements Document)

#### 문제 정의

**현재 상태**:
LLM이 vault 구조를 파악하려면 여러 md 파일을 순차적으로 읽어야 함:
1. `_HOME.md` 또는 `_ENTRY_POINT.md` - 진입점
2. `_VAULT_REGISTRY.md` - cross-vault 라우팅
3. `_Graph_Index.md` - 엔티티 인덱스
4. 각 폴더별 `_INDEX.md` - 폴더 내용

**문제점**:
- 분산: 5+ 개 파일에 정보 흩어짐
- 중복: 같은 라우팅 정보가 여러 문서에 반복
- 수동 관리: 일부 파일은 수동 업데이트 → stale 위험
- 정적 md: vault 변경 시 자동 반영 안 됨

#### 목표

| Before | After |
|--------|-------|
| 5+ 파일 순차 읽기 | **1 API 호출** |
| 수동 업데이트 문서 | **실시간 캐시 기반** |
| 분산된 정보 | **통합 JSON 응답** |

#### 핵심 요구사항

**1. 엔드포인트**
```
GET /api/mcp/vault-navigation
```

**2. 응답 구조**
```json
{
  "dual_vault": {
    "public": {
      "description": "Shared vault - Projects, Tasks, Strategy",
      "access": "team + c-level",
      "folders": {
        "01_North_Star": { "count": 5, "purpose": "Vision, MH1-4" },
        "20_Strategy": { "count": 25, "purpose": "Conditions, Tracks" },
        "50_Projects": { "count": 45, "purpose": "Projects, Tasks" },
        "60_Hypotheses": { "count": 8, "purpose": "Hypothesis validation" }
      }
    },
    "exec": {
      "description": "Executive vault - Runway, Budget, People",
      "access": "c-level only (requires mcp:exec scope)",
      "folders": {
        "10_Runway": { "purpose": "Runway status, triggers" },
        "20_Cashflow": { "purpose": "Monthly income/expense" },
        "40_People": { "purpose": "Team, hiring, contracts" }
      }
    }
  },
  "routing_guide": [
    { "question": "프로젝트/태스크 상태?", "vault": "public", "path": "50_Projects/", "api": "/api/tasks" },
    { "question": "런웨이 몇 개월?", "vault": "exec", "path": "10_Runway/Current_Status.md", "api": "/api/mcp/exec-read" },
    { "question": "채용 가능?", "vault": "exec", "path": "40_People/Hiring_Gate.md" }
  ],
  "entity_stats": {
    "public": { "Project": 30, "Task": 150, "Hypothesis": 8, "Track": 6, "Condition": 5 },
    "exec": { "Project": 5, "Task": 20, "Candidate": 3 }
  },
  "quick_links": {
    "search": "/api/mcp/search-and-read?q={keyword}",
    "file_read": "/api/mcp/file-read?paths={path}",
    "project_detail": "/api/mcp/project/{id}/context",
    "exec_access": "/api/mcp/exec-context (requires mcp:exec)"
  },
  "generated_at": "2026-01-05T10:00:00Z"
}
```

**3. 기술 스펙**
- VaultCache 활용하여 실시간 엔티티 수 계산
- exec vault 폴더 구조는 정적 정의 (민감 데이터 보호)
- 라우팅 가이드는 `_VAULT_REGISTRY.md` 내용 기반 정적 정의

#### 성공 기준
- [ ] 한 번의 API 호출로 dual-vault 전체 구조 파악
- [ ] 질문별 vault/path 라우팅 가이드 제공
- [ ] 실시간 엔티티 통계 (VaultCache 기반)
- [ ] exec vault 접근 가이드 포함

### 작업 로그

#### 2026-01-05 13:40
**개요**: vault-navigation API 엔드포인트 구현 완료

**변경사항**:
- 개발: `api/routers/mcp_composite.py`에 `/api/mcp/vault-navigation` 엔드포인트 추가
- 개발: Response 모델 추가 (VaultFolderInfo, VaultInfo, RoutingGuideItem, VaultNavigationResponse)
- 개발: 정적 라우팅 가이드 (ROUTING_GUIDE) 및 exec vault 폴더 정보 (EXEC_VAULT_FOLDERS) 정의
- 개발: `_count_folder_entities()` 헬퍼 함수 구현

**핵심 코드**:
- 라인 1110-1251: vault-navigation 엔드포인트 및 관련 상수/함수

**결과**: 로컬 테스트 성공
- dual_vault: public + exec 구조 정상
- routing_guide: 9개 질문-경로 매핑
- entity_stats: public 엔티티 통계 (Project: 31, Task: 192, Hypothesis: 46 등)
- quick_links: 8개 빠른 접근 링크

**다음 단계**:
- NAS 배포 후 프로덕션 테스트
- CLAUDE.md에 새 엔드포인트 문서화

---

## 참고 문서

- [[prj-vault-gpt]] - 소속 Project
- `public/00_Meta/_VAULT_REGISTRY.md` - 기존 라우팅 문서
- `api/routers/mcp_composite.py` - MCP composite 엔드포인트

---

**Created**: 2026-01-05
**Assignee**: 한명학
**Due**: 2026-01-05
