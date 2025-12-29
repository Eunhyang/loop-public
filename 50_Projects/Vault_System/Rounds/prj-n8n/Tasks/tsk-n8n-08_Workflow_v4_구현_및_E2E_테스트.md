---
entity_type: Task
entity_id: tsk-n8n-08
entity_name: "n8n - Workflow v4 구현 및 E2E 테스트"
created: 2025-12-29
updated: 2025-12-29
status: done
closed: '2025-12-29'

# === 계층 ===
parent_id: prj-n8n
project_id: prj-n8n
aliases:
- tsk-n8n-08

# === 관계 ===
outgoing_relations:
- tsk-n8n-03
validates: []

# === Task 전용 ===
assignee: 김은향
start_date: 2025-12-29
due: 2025-12-29
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===
conditions_3y:
- cond-e

# === 분류 ===
tags:
- n8n
- automation
- impact
- v4
priority_flag: high
---

# n8n - Workflow v4 구현 및 E2E 테스트

> Task ID: `tsk-n8n-08` | Project: `prj-n8n` | Status: doing

## 목표

**완료 조건**:
1. entity_validator_autofiller.json v4 구현 (tsk-n8n-03 설계 기반)
2. n8n GUI에서 import 성공
3. E2E 테스트 통과 (pending 생성, audit_ref, run_id 검증)

---

## 상세 내용

### 배경

tsk-n8n-03에서 완료된 설계:
- Phase 3 ai router 통합 (OpenAI 직접 → API 호출)
- run_id 생성 로직 (`run-YYYYMMDD-HHMMSS-xxxxxx`)
- meta_* 키 아이템 매칭 (`.first()` 문제 해결)
- HTTP Request "Include Input Data" 옵션

### 작업 내용

1. **v4 JSON 구현**
   - Filter Impact Needed: run_id 생성 + meta_* 키 추가
   - Route by Phase: Expected/Realized 분기
   - Call AI Router (Expected/Evidence): HTTP Request + Include Input Data
   - Parse Impact Response: meta_* 기반 파싱

2. **E2E 테스트**
   - Manual 실행
   - pending 생성 확인
   - audit_ref, run_id 포맷 검증
   - decision_log / audit/runs 조회

---

## 체크리스트

- [x] Filter Impact Needed 노드 수정 (run_id + meta_*)
- [x] Route by Phase 노드 추가
- [x] Call AI Router (Expected) 노드 추가
- [x] Call AI Router (Evidence) 노드 추가
- [x] HTTP Request "Include Input Data" 설정
- [x] Parse Impact Response 수정 (meta_* 기반)
- [ ] n8n GUI import (→ tsk-n8n-09)
- [ ] E2E 테스트: pending 생성 확인 (→ tsk-n8n-09)
- [ ] E2E 테스트: run_id 포맷 확인 (→ tsk-n8n-09)
- [ ] E2E 테스트: audit_ref 확인 (→ tsk-n8n-09)

---

## Notes

### PRD (Product Requirements Document)

**Task ID**: tsk-n8n-08
**Project**: prj-n8n (LOOP Vault)

#### 1. 배경 및 목적

**현재 상태**: `entity_validator_autofiller.json` v3가 배포됨. Phase 3에서 ai router API를 호출하도록 설계되었으나 문제 발견:

1. **run_id 포맷 불일치**: n8n 생성 run_id가 `validate_run_id` 패턴과 불일치
2. **meta_* 키 누락**: HTTP Request로 전달되는 컨텍스트 정보 누락
3. **Parse Impact Response 참조 오류**: `$input.first()` 사용 시 meta_* 정보 손실
4. **HTTP Request 설정 미비**: "Include Input Data" 옵션 미활성화

**목표**: v3 → v4 업그레이드로 ai router 통합 완성 + E2E 테스트 검증

#### 2. 요구사항

| # | 항목 | 상세 내용 | 우선순위 |
|---|------|----------|---------|
| FR-01 | run_id 포맷 정규화 | `run-YYYYMMDD-HHMMSS-xxxxxx` | P0 |
| FR-02 | Filter Impact Needed 수정 | meta_* 키 추가 | P0 |
| FR-03 | HTTP Request 설정 | "Include Input Data" 옵션 | P0 |
| FR-04 | Parse Impact Response 수정 | meta_* 기반 파싱 | P0 |
| FR-05 | E2E 테스트 | Manual 트리거로 전체 흐름 검증 | P0 |

#### 3. 성공 기준 (E2E 테스트)

- [ ] Manual 실행
- [ ] 프로젝트 2~3개가 Expected/Realized 분기 타는지
- [ ] pending 생성 확인
- [ ] audit_ref 출력 확인
- [ ] run_id가 `run-YYYYMMDD-HHMMSS-xxxxxx` 포맷인지
- [ ] pending-panel에서 approve/reject
- [ ] decision_log에서 run_id 조회
- [ ] run_log에서 run_id 조회

#### 4. 검증 패턴

```python
# api/routers/ai.py validate_run_id
pattern = r'^run-\d{8}-\d{6}-[a-z0-9]{6}$'
```

---

### Tech Spec

#### 1. 아키텍처 (Phase 3 변경)

```
Filter Impact Needed (v4: meta_* 추가)
    ↓
Impact Need LLM?
    ↓
Route by Phase
    ├─ Expected → Call AI Router (Expected)
    └─ Realized → Call AI Router (Evidence)
    ↓
Parse Impact Response (v4: meta_* 참조)
```

#### 2. run_id 생성 코드

```javascript
const iso = new Date().toISOString();
const datePart = iso.slice(0, 10).replace(/-/g, '');  // YYYYMMDD
const timePart = iso.slice(11, 19).replace(/:/g, ''); // HHMMSS
const rand = Math.random().toString(36).slice(2, 8);   // 6자리
const run_id = `run-${datePart}-${timePart}-${rand}`;
```

#### 3. Filter Impact Needed 수정

```javascript
results.push({
  json: {
    meta_entity_id: project.entity_id,
    meta_entity_name: project.entity_name,
    meta_phase: 'expected_impact',
    meta_run_id: run_id,

    api_request: {
      project_id: project.entity_id,
      run_id: run_id,
      mode: 'pending',
      provider: 'openai',
      actor: 'n8n',
      create_pending: true,
      schema_version: '5.3'
    }
  }
});
```

#### 4. HTTP Request 설정

```json
{
  "options": {
    "response": {
      "response": {
        "includeInputData": true
      }
    }
  }
}
```

#### 5. Parse Impact Response 수정

```javascript
const input = $input.first().json;

const entity_id = input.meta_entity_id;
const entity_name = input.meta_entity_name;
const phase = input.meta_phase;
const run_id = input.meta_run_id;

if (!input.ok) {
  return [{
    json: {
      entity_id,
      entity_type: 'Project',
      entity_name,
      phase,
      success: false,
      error: input.error || 'AI router call failed',
      run_id: run_id || input.run_id
    }
  }];
}

return [{
  json: {
    entity_id,
    entity_type: 'Project',
    entity_name,
    phase,
    success: true,
    run_id: run_id || input.run_id,
    patch: input.patch,
    scores: input.scores,
    pending: input.pending,
    audit_ref: input.audit_ref
  }
}];
```

#### 6. 수정 대상 파일

- `_build/n8n_workflows/entity_validator_autofiller.json`

---

### Todo

1. [ ] v3 백업 생성 (`*.v3.bak`)
2. [ ] Filter Impact Needed 노드 수정 (run_id + meta_*)
3. [ ] HTTP Request 노드 설정 (includeInputData: true)
4. [ ] Parse Impact Response 노드 수정
5. [ ] meta.updated 갱신 → "2025-12-29"
6. [ ] n8n GUI에서 Import
7. [ ] E2E 테스트 실행
8. [ ] 테스트 결과 검증
9. [ ] 결과 문서화

---

### 작업 로그

#### 2025-12-29 16:00
**개요**: entity_validator_autofiller.json v3 → v4.1 업그레이드 구현. tsk-n8n-03 설계 기반으로 Phase 3 ai router 통합 완료.

**변경사항**:
- 개발: `generateRunId()` 함수 추가 (Filter Impact Needed 노드)
- 수정: Filter Impact Needed - meta_* 키 추가 (meta_entity_id, meta_entity_name, meta_phase, meta_run_id)
- 수정: HTTP Request 노드 - `includeInputData: true` 옵션 추가
- 수정: Parse Impact Response - meta_* 기반 파싱 + 다중 fallback 경로

**파일 변경**:
- `_build/n8n_workflows/entity_validator_autofiller.json` - v4.1 업그레이드
- `_build/n8n_workflows/entity_validator_autofiller.json.v3.bak` - 백업 생성

**결과**: ✅ JSON 구현 완료. E2E 테스트는 tsk-n8n-09에서 진행 예정.

**다음 단계**:
- n8n GUI import 후 E2E 테스트 (tsk-n8n-09에서)
- Phase 1/2 AI Router 통합 (task_schema, project_schema 엔드포인트)

---

## 참고 문서

- [[prj-n8n]] - 소속 Project
- [[tsk-n8n-03]] - 선행 Task (설계 문서)
- [[tsk-n8n-07]] - AI Router Evidence 엔드포인트

---

**Created**: 2025-12-29
**Assignee**: 김은향
**Due**: 2025-12-29
