---
entity_type: Task
entity_id: "tsk-017-09"
entity_name: "Dual-Vault - Program-Round 조인 API"
created: 2026-01-02
updated: 2026-01-02
status: doing

# === 계층 ===
parent_id: "prj-019"
project_id: "prj-019"
aliases: ["tsk-017-09"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-02
due: 2026-01-02
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop-api

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-b"]

# === 분류 ===
tags: ["api", "dual-vault", "admin", "composite"]
priority_flag: high
---

# Dual-Vault - Program-Round 조인 API

> Task ID: `tsk-017-09` | Project: `prj-019` | Status: doing

## 목표

**완료 조건**:
1. GET `/api/admin/programs/{pgm-id}/rounds` 엔드포인트 구현
2. LOOP vault에서 Program 정보 조회 기능
3. exec vault에서 program_id 일치하는 Project(Round) 스캔 기능
4. Admin 권한 검증 (role=admin 필수)
5. 에러 처리 (404, 403, 500)
6. API 응답 시간 < 500ms

---

## 상세 내용

### 배경

Dual-Vault 구조에서 Program과 Round(Project) 정보를 조인하여 조회하는 API가 필요합니다.
- LOOP vault: Program 정보 보유
- exec vault: Round(Project) 정보 보유 (민감 데이터 포함)

Admin 권한이 있는 사용자만 이 API를 호출할 수 있어야 하며, 민감 필드(salary, contract_terms)는 응답에서 제외해야 합니다.

### 작업 내용

1. **라우터 확장**: `api/routers/mcp_composite.py`에 새 엔드포인트 추가
2. **권한 검증**: `require_exec_access()` 사용하여 Admin 권한 확인
3. **데이터 조인**:
   - LOOP vault에서 Program 정보 조회
   - exec vault에서 해당 program_id를 가진 Project 스캔
4. **응답 모델**: RoundSummary 목록 + Program 전체 정보

---

## 체크리스트

- [ ] 엔드포인트 라우터 추가
- [ ] Admin 권한 검증 구현
- [ ] Program 정보 조회 함수
- [ ] Round(Project) 스캔 함수
- [ ] 민감 필드 필터링
- [ ] 에러 처리 (404, 403, 500)
- [ ] 단위 테스트 작성
- [ ] API 문서 업데이트

---

## Notes

### Tech Spec
- **프레임워크**: FastAPI
- **라우터**: `api/routers/mcp_composite.py`
- **권한**: `require_exec_access()` 데코레이터
- **응답 모델**:
  ```python
  class RoundSummary(BaseModel):
      project_id: str
      entity_name: str
      status: str
      owner: str
      cycle: Optional[str]
      # 민감 필드 제외: salary, contract_terms

  class ProgramRoundsResponse(BaseModel):
      program: Program  # 전체 Program 정보
      rounds: List[RoundSummary]
      total_count: int
  ```
- **에러 코드**:
  - 404: Program not found
  - 403: Unauthorized (not admin)
  - 500: Internal server error

### Todo
- [ ] mcp_composite.py에 `/api/admin/programs/{pgm_id}/rounds` 엔드포인트 추가
- [ ] require_exec_access() 권한 검증 적용
- [ ] VaultCache에서 Program 조회 로직 구현
- [ ] exec vault 스캔하여 program_id 일치 Project 필터링
- [ ] RoundSummary, ProgramRoundsResponse Pydantic 모델 정의
- [ ] 민감 필드 필터링 로직 (salary, contract_terms 제외)
- [ ] 에러 핸들링 (HTTPException 404, 403, 500)
- [ ] 테스트 코드 작성
- [ ] 빌드 확인

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

- [[prj-019]] - 소속 Project (Dual-Vault - 정비)
- [[pgm-vault-system]] - 상위 Program
- `api/routers/mcp_composite.py` - 확장 대상 라우터

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**: 2026-01-02
