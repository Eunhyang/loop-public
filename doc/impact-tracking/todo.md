# Impact Tracking 구현 Todo

> techspec.md 기반 구현 체크리스트

## Phase 1: 스키마/템플릿 (Day 1)

### 1.1 템플릿 확장

- [ ] `template_task.md`에 Impact 필드 추가
  - `impact_magnitude`: small | mid | large
  - `confidence`: 0.0 ~ 1.0
  - `contributes[]`: to, weight, mechanism
  - `realized_status`: unknown | positive | neutral | negative
  - `evidence[]`: Evidence ID 배열

- [ ] `template_condition.md`에 롤업 필드 추가
  - `weight_to_northstar`: 0.0 ~ 1.0
  - `northstar[]`: NS ID 배열

- [ ] `template_evidence.md` 신설
  - 4층 구조: output_done, outcome_summary, impact_metric, metric_delta
  - evidence_strength, attribution_share, realized_score

### 1.2 모델 설정 파일

- [ ] `00_Meta/impact_model_config.yml` 생성
  - MagnitudePoints 초기값
  - EvidenceStrength 계수
  - Metric 정규화 범위
  - Attribution 규칙

---

## Phase 2: 검증/게이트 (Day 2)

### 2.1 validate_schema.py 확장

- [ ] Task 필수 필드 검증
  - `impact_magnitude` 존재 확인
  - `confidence` 범위 검증 (0~1)
  - `contributes` 최소 1개 존재
  - `contributes.weight` 합계 == 1.0 (경고)

- [ ] Condition 필수 필드 검증
  - `weight_to_northstar` 범위 검증 (0~1)
  - `northstar` 존재 확인

- [ ] Evidence 필수 필드 검증
  - `evidence_strength` enum 검증
  - `attribution_share` 범위 검증 (0~1)

### 2.2 check_orphans.py 확장

- [ ] Task orphan 규칙 추가
  - `contributes` 비어있으면 orphan
  - `contributes.to`가 존재하지 않는 Condition ID면 orphan

---

## Phase 3: 대시보드/롤업 (Day 3)

### 3.1 build_graph_index.py 확장

- [ ] 노드에 `expected_score`, `realized_score` 추가
- [ ] 엣지에 `weight` 추가 (contributes.weight)
- [ ] `_build/graph.json` 출력 형식 확장

### 3.2 build_dashboard.py 확장

- [ ] Task Impact Table 추가
  - ExpectedScore 계산 및 표시
  - RealizedScore 계산 및 표시
  - Condition/NorthStar 링크

- [ ] Condition Roll-up 섹션 추가
  - ExpectedSum, RealizedSum per Condition
  - Top tasks by realized/expected

- [ ] NorthStar Roll-up 섹션 추가
  - 전체 ExpectedSum, RealizedSum
  - Condition 기여도 순위

### 3.3 (선택) build_impact.py 신설

- [ ] impact_model_config.yml 로딩
- [ ] 전체 Task 스캔 및 점수 계산
- [ ] `_build/impact.json` 생성
- [ ] Condition/NorthStar 롤업 계산

---

## Phase 4: API 확장 (Day 4)

### 4.1 Task API

- [ ] GET /api/tasks에 expected_score, realized_score 포함
- [ ] POST /api/tasks에 contributes 검증
- [ ] PUT /api/tasks에 realized_status 업데이트 지원

### 4.2 Evidence API (신규)

- [ ] GET /api/evidence - Evidence 목록
- [ ] POST /api/evidence - Evidence 생성
- [ ] PUT /api/evidence/{id} - Evidence 수정
- [ ] DELETE /api/evidence/{id} - Evidence 삭제

### 4.3 Roll-up API (신규)

- [ ] GET /api/rollup/conditions - Condition별 점수 합계
- [ ] GET /api/rollup/northstar - NorthStar별 점수 합계

---

## Phase 5: 프론트엔드 (Day 5)

### 5.1 칸반 카드 확장

- [ ] ExpectedScore 표시
- [ ] RealizedScore 표시 (done 상태일 때)
- [ ] Condition 배지 표시

### 5.2 Condition Dashboard

- [ ] Condition별 탭 추가
- [ ] ExpectedSum / RealizedSum 차트
- [ ] Top tasks 목록

### 5.3 Evidence 관리 UI

- [ ] Task 상세에서 Evidence 목록 표시
- [ ] Evidence 생성/수정 모달
- [ ] realized_status 업데이트 버튼

---

## Phase 6: Strategy Change Protocol (Day 6)

> techspec.md Section 13 기반

### 6.1 Condition 스키마 확장 (변경 관리 필드)

- [ ] `template_condition.md`에 변경 관리 필드 추가
  - `version`: 버전 번호
  - `status`: active | deprecated | replaced
  - `valid_from` / `valid_to`: 유효 기간
  - `supersedes[]`: 내가 대체한 조건
  - `superseded_by[]`: 나를 대체한 조건
  - `aliases[]`: 과거 이름

### 6.2 Task/Evidence 스냅샷 필드

- [ ] `template_task.md`에 스냅샷 필드 추가
  - `impact_model_version`: 생성 당시 모델 버전
  - `expected_score_snapshot`: 생성 당시 점수

- [ ] `template_evidence.md`에 스냅샷 필드 추가
  - `impact_model_version`: 평가 당시 모델 버전
  - `realized_score_snapshot`: 평가 당시 점수

### 6.3 검증 규칙 확장

- [ ] `validate_schema.py`에 변경 관리 검증 추가
  - `status`가 `replaced`면 `superseded_by` 필수
  - `superseded_by`가 가리키는 ID 존재 확인

- [ ] `check_orphans.py`에 deprecated 링크 경고
  - `contributes.to`가 deprecated/replaced Condition이면 경고

### 6.4 Migration 스크립트

- [ ] `migrate_condition.py` 신설
  - 기존 Condition → 새 Condition 이관
  - 영향받는 Task 목록 출력
  - contributes.to 일괄 업데이트
  - 변경 전/후 비교 리포트

### 6.5 Impact Model 버전 관리

- [ ] `00_Meta/impact_model_config.yml`에 버전 필드 추가
- [ ] `00_Meta/impact_model_changelog.md` 신설
  - 버전별 변경 이유 기록
  - 레버 변경 히스토리

### 6.6 대시보드 확장

- [ ] Current View / Historical View 토글
- [ ] Deprecated Condition 표시 (회색 처리)
- [ ] Migration 영향 분석 섹션

---

## 운영 문서

- [ ] `00_Meta/TEAM_GUIDE_Impact_Tracking.md` 작성
  - 점수 모델 설명
  - 운영 규칙
  - Calibration 프로세스
  - **Strategy Change Protocol** (Minor/Major change 구분)

- [ ] Query Recipes 추가 (`00_Meta/query_recipes.md`)
  - Expected vs Realized 오차 분석
  - Condition별 기여도 조회
  - Strong evidence만 필터
  - **Deprecated Condition에 연결된 Task 목록**
  - **Migration 영향 분석 쿼리**

---

## 완료 기준

- [ ] 모든 Task가 최소 1개 Condition에 연결됨
- [ ] validate_schema.py 통과
- [ ] check_orphans.py 통과
- [ ] Dashboard에서 ExpectedScore/RealizedScore 확인 가능
- [ ] Calibration 프로세스 1회 실행
- [ ] **Condition 변경 시 Migration 스크립트 동작 확인**
- [ ] **Current/Historical View 전환 동작 확인**

---

**Status**: Planning
**Created**: 2025-12-19
**Updated**: 2025-12-19 (v0.2 - Strategy Change Protocol 추가)
