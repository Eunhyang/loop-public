---
entity_type: Project
entity_id: prj-n8n
entity_name: n8n Vault 자동화
created: 2025-12-27
updated: '2025-12-28'
status: active
program_id: pgm-vault-system
cycle: '2025'
owner: 김은향
budget: null
deadline: null
expected_impact:
  tier: enabling
  impact_magnitude: mid
  confidence: 0.7
  contributes:
    - to: cond-e
      weight: 0.3
      description: "Vault 운영 효율화를 통한 조직 역량 강화"
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

## 현재 워크플로우

| 워크플로우 | 설명 | 상태 |
|-----------|------|------|
| Entity Validator/Autofiller | Task/Project 빠진 필드 LLM 추론 | 개발 중 |
| Impact Score Calculator | Project A/B Score 계산 | 계획 |

---

## 인프라

- **n8n**: NAS Docker 배포 (port 5678)
- **LOOP API**: `https://mcp.sosilab.synology.me`
- **LLM**: OpenAI GPT-4

---

## n8n Credential 설정 (CRITICAL)

> **모든 LOOP API 호출 워크플로우는 반드시 아래 Credential 연결 필요**

| Credential 이름 | 타입 | 헤더 | 용도 |
|----------------|------|------|------|
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

## Tasks

| ID | Name | Status |
|----|------|--------|
| tsk-n8n-01 | n8n Docker 배포 파이프라인 | done |
| tsk-n8n-02 | 자동화 워크플로우 구축 | done |
| tsk-n8n-03 | Project Impact Score 자동화 | doing |
| tsk-n8n-04 | LLM 프롬프트 템플릿 개선 | todo |
| tsk-n8n-05 | API 비즈니스 로직 통합 | todo |

---

## 참고 문서

- [[pgm-vault-system]] - 소속 Program
- [[trk-2]] - 소속 Track
- https://docs.n8n.io/ - n8n 공식 문서

---

**Created**: 2025-12-27
**Owner**: 김은향
