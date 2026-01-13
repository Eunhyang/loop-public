---
title: "PRD + Tech Spec - Unified Expected Impact Context & Inference Channels"
status: draft
owner: 김은향
created: 2026-01-13
version: 0.1
---

# PRD + Tech Spec - Unified Expected Impact Context & Inference Channels

## 1) 요약

Impact Expected(A) 추론을 위한 **입력 데이터 계약을 단일화**하고, **LLM 추론 채널만 분리**한다.  
ChatGPT.com이든 API 연결 LLM이든 **동일한 컨텍스트/스키마**를 받아 추론하며, 서버는 **동일한 검증·점수 계산 파이프라인**을 적용한다.

---

## 2) 배경과 문제

- 현재 expected impact는 `impact_batch.py`와 `ai.py`가 서로 다른 흐름/스키마로 운영되어 **컨텍스트 드리프트**와 **중복 로직**이 발생한다.
- “LLM이 추론”하는 방식(외부 ChatGPT vs 내부 LLM)만 다를 뿐, **A 점수 산출에 필요한 입력 데이터는 동일해야 한다**.
- SSOT 원칙상 점수 계산은 서버 고정 로직이어야 하고, LLM은 필드 제안만 수행해야 한다.

---

## 3) 목표 / 비목표

### 목표
- A(Expected Score) 생성에 필요한 **컨텍스트 스키마를 단일화**한다.
- LLM 추론 채널을 **외부/내부**로 분리하되, **검증·점수 계산 파이프라인은 동일**하게 유지한다.
- 기존 API 호환성을 최대한 유지하고, **드리프트를 유발하는 중복 로직을 제거**한다.

### 비목표
- UI/대시보드 전면 개편
- B(Realized) 파이프라인 변경
- 새로운 저장소/DB 도입

---

## 4) 핵심 원칙 (SSOT + Clean Architecture)

- **SSOT**: 입력/출력 스키마는 단 하나의 정의만 유지한다.
- **계산은 코드가, 판단은 사람이**: 점수 계산은 서버 로직 고정.
- **LLM은 제안만**: output은 서버 검증 후 승인(예: pending/preview/apply).
- **클린 아키텍처**: Domain → Application → Adapter/Router → Infrastructure 방향 고정.

---

## 5) 사용자 시나리오

### 5.1 외부 LLM (ChatGPT.com)
1. 클라이언트가 컨텍스트 API 호출
2. 동일 컨텍스트로 ChatGPT에서 추론
3. 서버에 결과 제출(suggest/preview/apply)
4. 서버가 동일 검증/점수 계산 후 결과 반환

### 5.2 내부 LLM (API Provider)
1. 서버가 동일 컨텍스트 구성
2. 서버가 LLM 호출
3. 동일 검증/점수 계산 후 결과 반환

---

## 6) 기능 요구사항 (FR)

1. **단일 컨텍스트 스키마** 제공 (ImpactExpectedContext)
2. **단일 출력 스키마** 검증 (ImpactExpectedOutput, v5.3)
3. **공통 검증 파이프라인** (weights, validates, schema rules)
4. **공통 점수 계산** (impact_calculator SSOT)
5. **두 채널 모두 동일 데이터 계약** 사용
6. **기존 API와 역호환** (worklist/suggest-batch 유지)

---

## 7) 비기능 요구사항 (NFR)

- 성능: 컨텍스트 생성은 O(1) 캐시 경로 활용
- 안전성: 검증 실패 시 상세 오류 반환 (FieldValidationError)
- 추적성: run_id 기반 audit log 기록
- 버저닝: schema_version, impact_model_version 응답 포함

---

## 8) 데이터 계약 (SSOT)

### 8.1 ImpactExpectedContext (입력)
```json
{
  "schema_version": "v2",
  "impact_model_version": "1.3.1",
  "project": {
    "entity_id": "prj-023",
    "entity_name": "...",
    "description": "...",
    "conditions_3y": ["cond-e"],
    "track_id": "trk-2",
    "parent_chain": ["trk-2", "cond-e"],
    "existing_expected_impact": { "tier": "...", "impact_magnitude": "...", "confidence": 0.7 }
  },
  "required_output_contract": {
    "must_set": ["tier", "impact_magnitude", "confidence", "summary"],
    "hypothesis_rules": { "strategic_must_validate": true, "weight_sum_max": 1.0 },
    "contributes_rules": { "max_weight_sum": 1.0 }
  },
  "scoring_context": {
    "tier_points": { "strategic": { "high": 10 } },
    "display_rules": { "score_display_mode": "stars_5", "star_thresholds": { "5": [9, 10] } }
  }
}
```

### 8.2 ImpactExpectedOutput (LLM 출력)
```json
{
  "tier": "strategic|enabling|operational",
  "impact_magnitude": "high|mid|low",
  "confidence": 0.0,
  "summary": "요약",
  "validates": ["hyp-001"],
  "primary_hypothesis_id": "hyp-001",
  "condition_contributes": [{ "condition_id": "cond-e", "weight": 0.5 }],
  "track_contributes": [{ "track_id": "trk-2", "weight": 0.4 }],
  "assumptions": [],
  "evidence_refs": [],
  "linking_reason": "..."
}
```

---

## 9) 아키텍처 설계 (모듈 분류)

### 9.1 Domain
- **impact_expected_domain.py**
  - 스키마/검증 규칙(순수 함수)
  - weight 합산, hypothesis rule 검증

### 9.2 Application
- **impact_expected_service.py**
  - `build_expected_context(project_id)`
  - `normalize_llm_output(output)`
  - `build_calculated_fields(output)`
  - `validate_expected_output(output)`

### 9.3 Adapter / Router
- **impact_batch.py**
  - worklist/suggest/preview/apply → service 사용
- **ai.py**
  - infer/project_impact → 동일 service 사용

### 9.4 Infrastructure
- **llm_service.py**
  - internal LLM 호출만 담당
- **impact_calculator.py**
  - 점수 계산 SSOT

---

## 10) API 설계

### 10.1 Context 제공 (공통)
`POST /api/mcp/impact/expected/context`
- body: `{ "project_ids": ["prj-023"] }`
- response: `ImpactExpectedContext[]`

> 기존 `worklist`는 내부적으로 동일 함수 호출 (alias)

### 10.2 외부 LLM 결과 제출
`POST /api/mcp/impact/expected/suggest`
- body: `{ "project_id": "...", "llm_output": ImpactExpectedOutput }`
- response: `apply_patch`, `calculated_fields`, `warnings`

### 10.3 내부 LLM 실행
`POST /api/mcp/impact/expected/infer`
- body: `{ "project_id": "...", "provider": "openai|anthropic" }`
- response: 동일 구조 (suggest와 동일)

### 10.4 Preview / Apply (기존 유지)
- `/api/mcp/impact/expected/preview`
- `/api/mcp/impact/expected/apply-batch`

---

## 11) 검증 규칙

- weight 합 <= 1.0
- strategic tier일 경우 validates 최소 1개
- hypothesis/condition/track 존재 검증
- 필수 필드 누락 시 FieldValidationError 반환

---

## 12) 기존 코드 매핑

- `public/api/routers/impact_batch.py`: suggest/preview/apply는 공통 service 호출
- `public/api/routers/ai.py`: infer/project_impact는 동일 service 사용
- `public/api/utils/impact_calculator.py`: 점수 계산 SSOT 유지
- `public/impact_model_config.yml`: scoring + display rules SSOT

---

## 13) 구현 단계 (MVP)

1. 공통 컨텍스트 생성 함수 분리
2. LLM 출력 정규화/검증 함수 분리
3. impact_batch/ai 라우터에 적용
4. context/suggest/infer 엔드포인트 추가
5. 테스트 추가 (unit + integration)

---

## 14) 테스트 계획

- Unit
  - normalize_llm_output()
  - validate_expected_output()
  - calculate_expected_fields()
- Integration
  - context → suggest → preview → apply 흐름
  - external vs internal channel 동일 입력/동일 결과

---

## 15) 롤아웃

1. 기존 worklist/suggest-batch 유지 (deprecated 라벨 부여)
2. 새 context/suggest/infer 제공
3. 문서/클라이언트 이관 후 기존 엔드포인트 제거 검토

---

## 16) 수용 기준 (Acceptance Criteria)

- 동일한 ImpactExpectedContext 입력에 대해 외부/내부 LLM 채널이 동일 파이프라인으로 처리됨
- 점수 계산은 서버 로직으로만 이루어짐
- v5.3 스키마 준수 및 검증 오류 구조화 제공
- 기존 클라이언트 깨지지 않음

