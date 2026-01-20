---
entity_type: Project
entity_id: prj-n8n
entity_name: n8n Vault 자동화
created: 2025-12-27
updated: '2026-01-20'
status: planning
program_id: pgm-vault-system
cycle: '2025'
owner: 김은향
budget: null
start_date: null
deadline: null
expected_impact:
  tier: enabling
  impact_magnitude: mid
  confidence: 0.7
  contributes:
  - to: cond-e
    weight: 0.3
    description: Vault 운영 효율화를 통한 조직 역량 강화
realized_impact:
  verdict: null
  outcome: null
  evidence_links: []
  decided: null
hypothesis_id: null
experiments: []
parent_id: trk-2
conditions_3y:
- cond-e
aliases:
- prj-n8n
- prj-n8n-entity-autofill
- n8n Vault 자동화
outgoing_relations: []
validates: []
validated_by: []
tags:
- project
- vault-system
- n8n
- automation
- llm
priority_flag: medium
track_contributes: []
---
# n8n Vault 자동화

> Project ID: `prj-n8n` | Program: `pgm-vault-system` | Status: active

---

## Project 목적

n8n 워크플로우 엔진을 활용하여 LOOP Vault의 다양한 자동화 작업을 수행.

---

## 범위

이 프로젝트에서 다루는 n8n 자동화 워크플로우:

1. **Entity Auto-filler**: 빠진 필드 자동 추론 및 채우기
2. **Schema Validator**: 스키마 검증 자동화
3. **Notification**: 마감일 알림, 상태 변경 알림
4. **외부 연동**: (향후) 외부 서비스 연동

---

## 워크플로우 JSON 위치

> `_build/n8n_workflows/` - 모든 n8n 워크플로우 JSON 파일

```
_build/n8n_workflows/
├── entity_validator_autofiller.json   # Entity 스키마 검증 + LLM 추론
├── workflow_c_impact_rebuild.json     # Impact Score 재계산
├── workflow_d_hypothesis_seeder.json  # Hypothesis 초안 생성
├── youtube_weekly_round_creator.json  # YouTube Weekly Round 자동 생성
└── _archive/                          # 이전 버전 백업
```

---

## 현재 워크플로우

| 워크플로우 | 파일명 | 설명 | 상태 |
| --- | --- | --- | --- |
| Entity Validator/Autofiller | `entity_validator_autofiller.json` | Task/Project 빠진 필드 LLM 추론 | 운영 중 |
| Impact Rebuild | `workflow_c_impact_rebuild.json` | Decision 기반 Impact Score 재계산 | 운영 중 |
| Hypothesis Seeder | `workflow_d_hypothesis_seeder.json` | Project에서 Hypothesis 초안 생성 | 운영 중 |
| YouTube Weekly | `youtube_weekly_round_creator.json` | 매주 금요일 09:00 Round 자동 생성 | 운영 중 |

---

## LOOP API 엔드포인트 (n8n용)

> **Base URL**: `https://mcp.sosilab.synology.me`

| 엔드포인트 | Method | 용도 | 사용 워크플로우 |
| --- | --- | --- | --- |
| `/api/tasks` | GET | Task 목록 조회 | Entity Validator |
| `/api/projects` | GET | Project 목록 조회 | Entity Validator, Hypothesis Seeder |
| `/api/projects/{id}` | GET | 단일 Project 조회 | Entity Validator |
| `/api/strategy/context` | GET | 전략 컨텍스트 조회 | Entity Validator |
| `/api/pending` | POST | Pending Review 생성 | Entity Validator |
| `/api/ai/infer/task_schema` | POST | Task 스키마 LLM 추론 | Entity Validator |
| `/api/ai/infer/project_schema` | POST | Project 스키마 LLM 추론 | Entity Validator |
| `/api/ai/infer/project_impact` | POST | Expected Impact LLM 추론 | Entity Validator |
| `/api/ai/infer/evidence` | POST | Evidence LLM 추론 | Entity Validator |
| `/api/ai/infer/hypothesis_draft` | POST | Hypothesis 초안 생성 | Hypothesis Seeder |
| `/api/audit/decisions` | GET | Decision 로그 조회 | Impact Rebuild |
| `/api/build/impact` | POST | Impact Score 재계산 | Impact Rebuild |
| `/api/youtube-weekly/create-round` | POST | YouTube Round 생성 | YouTube Weekly |

---

## 인프라

- **n8n**: NAS Docker 배포 (port 5678)
- **LOOP API**: `https://mcp.sosilab.synology.me`
- **LLM**: OpenAI GPT-4

---

## CLI 명령어 (`/n8n`)

> Claude Code에서 n8n 관련 작업을 수행하는 슬래시 명령어

### 로그 확인

| 명령 | 설명 |
| --- | --- |
| `/n8n pending` | 최근 pending reviews 10개 (source_workflow 포함) |
| `/n8n pending --workflow entity-validator` | 특정 워크플로우 필터 |
| `/n8n pending --count` | 개수만 표시 |
| `/n8n audit` | 최근 audit decisions 확인 |

### 워크플로우 트리거

| 명령 | 설명 |
| --- | --- |
| `/n8n trigger entity-validator --project prj-xxx` | Entity Validator 실행 |
| `/n8n trigger impact-rebuild` | Impact Score 재계산 |
| `/n8n trigger youtube-weekly` | YouTube Weekly 라운드 생성 |
| `/n8n trigger hypothesis-seeder --project prj-xxx` | Hypothesis 초안 생성 |

### 사용 예시

```bash
# pending reviews 확인 (source_workflow 포함 여부 체크)
/n8n pending

# entity-validator 워크플로우만 필터
/n8n pending --workflow entity-validator

# audit 로그 확인
/n8n audit

# 특정 프로젝트 Impact 자동 채움
/n8n trigger entity-validator --project prj-dashboard-ux-v1
```

---

## n8n Credential 설정 (CRITICAL)

> **모든 LOOP API 호출 워크플로우는 반드시 아래 Credential 연결 필요**

| Credential 이름 | 타입 | 헤더 | 용도 |
| --- | --- | --- | --- |
| `LOOP API Token` | Header Auth | `x-api-token` | LOOP API 인증 |

### 워크플로우 설정 방법

1. **HTTP Request 노드** 열기
2. **Authentication**: `Predefined Credential Type` 선택
3. **Credential Type**: `Header Auth`
4. **Header Auth**: `LOOP API Token` 선택
5. 저장

### 주의사항

- 워크플로우 JSON import 시 Credential은 자동 연결되지 않음
- 반드시 import 후 수동으로 Credential 연결 필요
- `{{ $env.LOOP_API_TOKEN }}`은 n8n 환경변수로, Credential과 다름

---

## 워크플로우 개발 가이드

### 새 워크플로우 추가 절차

1. **JSON 파일 생성**

   ```
   _build/n8n_workflows/{workflow_name}.json
   ```

2. **필수 설정**

   - HTTP Request 노드: `authentication: predefinedCredentialType`
   - `nodeCredentialType: httpHeaderAuth`
   - `onError: continueRegularOutput` (에러 시에도 워크플로우 계속)

3. **n8n에서 import**

   - n8n UI → Import from file
   - `LOOP API Token` credential 수동 연결
   - 활성화 및 테스트

4. **문서 업데이트**

   - 이 파일의 "현재 워크플로우" 테이블에 추가
   - 사용하는 API 엔드포인트 기록

### HTTP Request 노드 템플릿

```json
{
  "parameters": {
    "method": "POST",
    "url": "https://mcp.sosilab.synology.me/api/...",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "httpHeaderAuth",
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ JSON.stringify($json.body) }}",
    "options": {
      "timeout": 30000
    }
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "onError": "continueRegularOutput"
}
```

### 네이밍 컨벤션

| 구분 | 형식 | 예시 |
| --- | --- | --- |
| 워크플로우 파일 | `{기능명}.json` | `youtube_weekly_round_creator.json` |
| 워크플로우 이름 | `{기능}-{동작}` | `youtube-weekly-round-creator` |
| 노드 ID | `{타입}-{용도}` | `http-create-round`, `code-success-msg` |

---

## Tasks

| ID | Name | Status |
| --- | --- | --- |
| tsk-n8n-01 | n8n Docker 배포 파이프라인 | done |
| tsk-n8n-02 | 자동화 워크플로우 구축 | done |
| tsk-n8n-03 | Project Impact Score 자동화 | doing |
| tsk-n8n-04 | LLM 프롬프트 템플릿 개선 | todo |
| tsk-n8n-05 | API 비즈니스 로직 통합 | todo |
| tsk-n8n-17 | Ontology-Lite - 무결성 검증 시스템 구축 | done |
| tsk-n8n-18 | Dashboard - Pending Reviews 워크플로우 필터링 및 일괄 삭제 | doing |
| tsk-n8n-19 | n8n - 워크플로우 source_workflow 필드 추가 | done |
| tsk-n8n-20 | Dashboard - Pending Panel Entity Preview UX 개선 | doing |
| tsk-n8n-21 | Pending Review - 새로고침 기능 | doing |
| tsk-n8n-22 | Retro Synth - B Score 계산 fallback 시스템 | doing |
| tsk-n8n-23 | n8n - Entity Validator Auto-Apply 기능 | todo |
| tsk-n8n-24 | n8n - YouTube Performance Collector | done |
| tsk-000n8n-1768057225620 | n8n - Entity Validator Auto-Apply 기능 | todo |
| tsk-000n8n-1768410727494 | n8n - ac-batch-daily-digest Save Snapshot 502 에러 수정 | doing |

---

## 참고 문서

- \[\[pgm-vault-system\]\] - 소속 Program
- \[\[trk-2\]\] - 소속 Track
- https://docs.n8n.io/ - n8n 공식 문서

---

**Created**: 2025-12-27 **Owner**: 김은향