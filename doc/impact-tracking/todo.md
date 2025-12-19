# Impact Tracking - Implementation Checklist

**Project**: LOOP Dashboard Impact Tracking
**Version**: 1.0.0
**Last Updated**: 2025-12-19

---

## Phase 0: 인프라 준비

- [ ] `impact_model_config.yml` 생성
  - [ ] magnitude_points 테이블
  - [ ] strength_mult 테이블
  - [ ] tier 정의 (strategic/enabling/operational)
- [ ] `scripts/build_index.py` 구현
  - [ ] 전체 vault 문서 스캔
  - [ ] LLM용 요약 레코드 생성
  - [ ] `_build/index.json` 출력
- [ ] `scripts/build_impact.py` 구현
  - [ ] Project frontmatter 파싱
  - [ ] Expected/Realized 점수 계산
  - [ ] `_build/impact.json` 출력

---

## Phase 1: API 엔드포인트

### 1.1 Auto-fill Impact API

- [ ] `POST /api/projects/autofill-impact` 엔드포인트
  - [ ] Request 스키마 (title, description, track_id, condition_ids)
  - [ ] Context 수집 로직 (ContextLoader)
  - [ ] LLM 호출 (Claude API)
  - [ ] Response 스키마 (tier, magnitude, confidence, contributes, rationale)

### 1.2 Context Loader

- [ ] `api/utils/context_loader.py` 구현
  - [ ] `_build/index.json` 로딩
  - [ ] `_build/graph.json` 로딩
  - [ ] Condition 문서 요약 추출
  - [ ] NorthStar 문서 요약 추출
  - [ ] 유사 Project 검색

---

## Phase 2: Project 스키마 확장

- [ ] `api/models/entities.py` 업데이트
  - [ ] `ProjectCreate` 스키마에 Impact 필드 추가
    - [ ] tier (strategic/enabling/operational)
    - [ ] contributes (List[ContributesItem])
    - [ ] impact_magnitude (high/mid/low)
    - [ ] confidence (0.0-1.0)
  - [ ] `ProjectResponse` 스키마 업데이트
  - [ ] `ContributesItem` 스키마 (to, weight, mechanism)

- [ ] `api/routers/projects.py` 업데이트
  - [ ] POST /api/projects에 Impact 필드 저장
  - [ ] PUT /api/projects/{id}에 Impact 필드 수정

---

## Phase 3: Evidence 시스템

- [ ] Evidence 엔티티 정의
  - [ ] Pydantic 스키마 (`EvidenceCreate`, `EvidenceResponse`)
  - [ ] YAML frontmatter 템플릿
- [ ] `POST /api/evidence` 엔드포인트
  - [ ] normalized_delta 입력
  - [ ] evidence_strength 입력
  - [ ] attribution_share 입력
- [ ] Realized Score 자동 계산
  - [ ] Evidence 저장 시 `build_impact.py` 트리거
  - [ ] Project.realized_status 갱신

---

## Phase 4: 대시보드 UI

### 4.1 Project 생성 모달

- [ ] Impact 섹션 UI
  - [ ] Track 선택 드롭다운
  - [ ] Condition 멀티셀렉트
  - [ ] [Auto-fill Project Impact] 버튼
- [ ] Preview 모달
  - [ ] Tier 표시
  - [ ] impact_magnitude / confidence 표시
  - [ ] contributes 목록 표시
  - [ ] rationale 텍스트 표시
  - [ ] 경고 메시지 (enabling tier)
  - [ ] Accept / Edit / Cancel 버튼

### 4.2 Project 리스트

- [ ] Expected Score 컬럼
- [ ] Realized Score 컬럼
- [ ] Tier 배지

### 4.3 Condition Roll-up 뷰

- [ ] Condition별 ExpectedSum
- [ ] Condition별 RealizedSum
- [ ] Enabling vs Strategic 분포 차트

---

## Phase 5: 빌드 자동화

- [ ] Pre-commit hook 업데이트
  - [ ] `build_index.py` 실행
  - [ ] `build_impact.py` 실행
- [ ] Dashboard deploy 스크립트 업데이트
  - [ ] `_build/impact.json` 포함
  - [ ] `_build/index.json` 포함

---

## Phase 6: LLM 프롬프트 최적화

- [ ] System prompt 작성
  - [ ] Impact 모델 설명
  - [ ] Tier 정의
  - [ ] magnitude/confidence 가이드라인
  - [ ] contributes 작성 규칙
- [ ] Few-shot 예시 수집
  - [ ] Strategic project 예시
  - [ ] Enabling project 예시
  - [ ] Operational project 예시
- [ ] Response 검증 로직
  - [ ] 필수 필드 체크
  - [ ] 값 범위 검증

---

## Phase 7: 테스트

- [ ] API 테스트
  - [ ] autofill-impact 엔드포인트
  - [ ] Project CRUD with Impact
  - [ ] Evidence CRUD
- [ ] 롤업 계산 테스트
  - [ ] Expected Score 계산
  - [ ] Realized Score 계산
  - [ ] Condition 집계
- [ ] UI E2E 테스트
  - [ ] Project 생성 플로우
  - [ ] Preview/Accept 플로우
  - [ ] Evidence 추가 플로우

---

## Milestone Targets

| Milestone | 완료 조건 | 상태 |
|-----------|----------|------|
| M1: 인프라 | Phase 0 완료 | ⬜ |
| M2: API | Phase 1-2 완료 | ⬜ |
| M3: Evidence | Phase 3 완료 | ⬜ |
| M4: UI | Phase 4 완료 | ⬜ |
| M5: 자동화 | Phase 5 완료 | ⬜ |
| M6: LLM | Phase 6 완료 | ⬜ |
| M7: 테스트 | Phase 7 완료 | ⬜ |

---

**Status Legend**: ⬜ Not Started | 🟡 In Progress | ✅ Done
