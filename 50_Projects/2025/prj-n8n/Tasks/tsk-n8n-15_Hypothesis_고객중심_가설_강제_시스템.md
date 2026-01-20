---
entity_type: Task
entity_id: tsk-n8n-15
entity_name: "Hypothesis - 고객중심 가설 강제 시스템"
created: 2026-01-03
updated: 2026-01-03
status: done

# === 계층 ===
parent_id: prj-n8n
project_id: prj-n8n
aliases:
- tsk-n8n-15

# === 관계 ===
outgoing_relations:
- tsk-n8n-11
validates: []

# === Task 전용 ===
assignee: 김은향
start_date: 2026-01-03
due: 2026-01-05
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
- hypothesis
- customer-centric
- validation
- gate
- api
priority_flag: high
---

# Hypothesis - 고객중심 가설 강제 시스템

> Task ID: `tsk-n8n-15` | Project: `prj-n8n` | Status: doing

## 목표

**완료 조건**:
1. Hypothesis 생성 프롬프트에 "고객 문제 문법" 강제
2. `validate_hypothesis_quality`에 고객중심 휴리스틱 체크 추가
3. Project status → active/done 변경 시 가설 필수 게이트 구현
4. Evidence approve 시 validated/falsified 가설 연결 강제 게이트 구현

---

## 상세 내용

### 배경

tsk-n8n-11에서 가설 자동 생성 파이프라인은 완성되었으나, 다음 문제점이 남아있음:

1. **기술 가설도 통과**: 현재 품질 검증은 "형식"만 체크 (?, 길이, horizon 등)
2. **가설 없이 프로젝트 진행 가능**: active 상태로 올려도 validates가 비어있어도 막지 않음
3. **Evidence가 가설 업데이트 없이 저장 가능**: 학습 루프가 끊김

### 해결 방안

#### 1. 프롬프트 강화 (고객 문제 문법)

`HYPOTHESIS_SEEDER_SYSTEM_PROMPT`에 4요소 필수 규칙 추가:
- **고객 세그먼트** (누가)
- **상황/트리거** (언제)
- **비용/고통** (무슨 문제)
- **행동/상태 변화** (무엇이 바뀌면 해결)

#### 2. 품질 검증 강화 (휴리스틱)

`validate_hypothesis_quality()`에 고객중심 토큰 체크:
- 세그먼트 신호: "사용자/고객/코치/참여자" 등
- 트리거 신호: "~할 때/직후/상황에서" 등
- 비용 신호: "어렵다/못한다/이탈/재발/스트레스" 등
- 변화 신호: "증가/감소/개선/전환/복귀" 등

→ 2개 미만이면 `not_customer_centric` 이슈 + 감점

#### 3. Project Active Gate (API 하드 게이트)

`api/routers/projects.py`의 `update_project()`:
- status를 active/done으로 변경 시
- `primary_hypothesis_id` 또는 `validates[0]` 필수
- 없으면 400 에러 + "Hypothesis Seeder pending 생성" 안내

#### 4. Evidence Approve Gate (승인 하드 게이트)

`api/routers/pending.py`의 `approve_pending_review()`:
- entity_type == "Evidence" 승인 시
- `validated_hypotheses` 또는 `falsified_hypotheses` 비어있으면 거부
- 해당 hyp가 Project.validates 안에 포함되어야 함

---

## 체크리스트

- [ ] (A) 프롬프트 고객 문법 강제 규칙 추가
- [ ] (B) validate_hypothesis_quality 고객중심 휴리스틱 추가
- [ ] (C) Project update API 가설 필수 게이트 구현
- [ ] (D) Evidence approve 가설 연결 강제 게이트 구현
- [ ] (E) validate_schema.py에 Project 가설 필수 검증 추가 (선택)
- [ ] 테스트 및 배포

---

## Notes

### PRD (Product Requirements Document)

#### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| Task ID | `tsk-n8n-15` |
| Task Name | Hypothesis - 고객중심 가설 강제 시스템 |
| Project | `prj-n8n` (n8n Vault 자동화) |
| 목표 | 가설 생성/승인/진행의 모든 단계에서 "고객 중심" 강제 |

#### 1.2 문제 정의

**현재 상태:**
- tsk-n8n-11에서 Hypothesis 자동 생성 파이프라인 완성
- 그러나 "기술 가설"도 형식만 맞으면 통과 가능
- Project가 가설 없이 active로 진행 가능
- Evidence가 가설 업데이트 없이 저장 가능 → 학습 루프 단절

**핵심 Pain Point:**
1. **지식 그래프 오염**: 기술 가설이 섞이면 A/B Score 체계 의미 상실
2. **사후 Impact 평가 불가**: 가설 없이 진행된 프로젝트는 평가 불가
3. **학습 루프 단절**: Evidence → Hypothesis 업데이트 경로가 강제되지 않음

#### 1.3 해결 원칙

> **"고객 문제 → 가설 → 실험 → 증거 → 가설 업데이트"의 전 경로에 하드 게이트 삽입**

4개 게이트:
1. **생성 게이트**: 프롬프트에 고객 문법 강제
2. **품질 게이트**: 휴리스틱으로 고객중심 검증
3. **진행 게이트**: Project active 전환 시 가설 필수
4. **증거 게이트**: Evidence 승인 시 가설 연결 필수

#### 1.4 성공 기준

- [ ] 기술 가설 생성 시 quality_score < 0.7 되도록 휴리스틱 작동
- [ ] Project status → active 변경 시 validates 없으면 400 에러
- [ ] Evidence approve 시 validated/falsified_hypotheses 없으면 400 에러
- [ ] MCP 서버 배포 후 E2E 검증

#### 1.5 기능 상세

**A. 프롬프트 고객 문법 강제**

기존 `HYPOTHESIS_SEEDER_SYSTEM_PROMPT`에 추가:
```
hypothesis_question은 반드시 다음 4요소를 포함해야 합니다:
1. 고객 세그먼트 (누가) - 예: "12주 과정 참여자", "습관 앱 사용자"
2. 상황/트리거 (언제) - 예: "첫 주에", "운동 후", "저녁 9시에"
3. 비용/고통 (무슨 문제) - 예: "지속하기 어렵다", "동기가 떨어진다"
4. 행동/상태 변화 (무엇이 바뀌면 해결) - 예: "지속률이 향상", "완료율 증가"
```

**B. 품질 검증 휴리스틱**

`validate_hypothesis_quality()`에 고객중심 토큰 체크 추가:
- **세그먼트 토큰**: 사용자, 고객, 코치, 참여자, 구독자, 회원
- **트리거 토큰**: ~할 때, ~직후, ~상황에서, ~시점에, ~경우에
- **비용 토큰**: 어렵다, 못한다, 이탈, 재발, 스트레스, 포기, 실패
- **변화 토큰**: 증가, 감소, 개선, 전환, 복귀, 완료, 지속, 향상

검증 규칙:
- 4개 카테고리 중 최소 2개 카테고리의 토큰 존재 필수
- 미충족 시 `not_customer_centric` 이슈 + score -0.25

**C. Project Active Gate**

`update_project()` 수정:
```python
if new_status in ["active", "done"]:
    if not (frontmatter.get("primary_hypothesis_id") or
            frontmatter.get("validates")):
        raise HTTPException(
            status_code=400,
            detail="Project requires hypothesis before active/done. "
                   "Use /api/ai/infer/hypothesis_draft to generate one."
        )
```

**D. Evidence Approve Gate**

`approve_pending_review()` 수정 (entity_type == "Evidence" 분기 추가):
```python
if entity_type == "Evidence":
    validated = fields_to_apply.get("validated_hypotheses", [])
    falsified = fields_to_apply.get("falsified_hypotheses", [])

    if not validated and not falsified:
        raise HTTPException(
            status_code=400,
            detail="Evidence must update at least one hypothesis. "
                   "Set validated_hypotheses or falsified_hypotheses."
        )

    # Project.validates와 교차 검증
    project_id = fields_to_apply.get("project")
    if project_id:
        project = cache.get_project(project_id)
        project_validates = project.get("validates", [])

        all_hyps = validated + falsified
        invalid_hyps = [h for h in all_hyps if h not in project_validates]

        if invalid_hyps:
            raise HTTPException(
                status_code=400,
                detail=f"Hypotheses not in project.validates: {invalid_hyps}"
            )
```

#### 1.6 예외 처리

**inconclusive Evidence 허용 조건:**
- `realized_status == "inconclusive"` 인 경우에도:
- validated/falsified 중 하나에 해당 hyp를 넣되
- evidence 텍스트에 "왜 inconclusive인지" 명시 필수
- Hypothesis.evidence_status는 "learning"으로 유지

---

### Tech Spec

#### 2.1 수정 대상 파일

| 파일 | 작업 | 설명 |
|------|------|------|
| `api/prompts/hypothesis_seeder.py` | 수정 | 고객 문법 4요소 규칙 추가 |
| `api/utils/hypothesis_generator.py` | 수정 | 고객중심 휴리스틱 검증 추가 |
| `api/routers/projects.py` | 수정 | update_project에 가설 필수 게이트 |
| `api/routers/pending.py` | 수정 | Evidence approve 시 가설 연결 게이트 |

#### 2.2 상세 구현

**A. hypothesis_seeder.py 수정**

```python
# HYPOTHESIS_SEEDER_SYSTEM_PROMPT에 추가할 규칙

## 고객 중심 가설 문법 (MANDATORY)

hypothesis_question은 반드시 다음 4요소를 포함해야 합니다:

1. **고객 세그먼트** (누가)
   - 예: "12주 과정 참여자", "습관 앱 사용자", "코칭 수강생"
   - 금지: "시스템이", "알고리즘이" (기술 주어 금지)

2. **상황/트리거** (언제)
   - 예: "첫 주에", "운동 직후", "저녁 9시에", "실패 경험 후"
   - 시간적/상황적 맥락 필수

3. **비용/고통** (무슨 문제)
   - 예: "지속하기 어렵다", "동기가 떨어진다", "재발한다"
   - 고객이 느끼는 문제점 명시

4. **행동/상태 변화** (무엇이 바뀌면 해결)
   - 예: "지속률 30% 향상", "이탈률 감소", "완료율 증가"
   - 측정 가능한 변화 명시

### 잘못된 가설 예시 (REJECT)
- "API 응답 속도를 개선하면 성능이 좋아지는가?" → 기술 가설
- "알고리즘이 정확도를 높일 수 있는가?" → 고객 부재

### 올바른 가설 예시 (ACCEPT)
- "12주 과정 참여자가 첫 주에 습관 설정 시 코칭 AI의 리마인더를 받으면 2주차 지속률이 30% 이상 향상되는가?"
```

**B. hypothesis_generator.py 수정**

```python
# validate_hypothesis_quality() 함수에 추가

# 고객중심 토큰 정의
CUSTOMER_TOKENS = {
    "segment": ["사용자", "고객", "코치", "참여자", "구독자", "회원", "수강생", "클라이언트"],
    "trigger": ["할 때", "직후", "상황에서", "시점에", "경우에", "시에", "후에", "전에"],
    "pain": ["어렵다", "못한다", "이탈", "재발", "스트레스", "포기", "실패", "힘들", "불편", "불안"],
    "change": ["증가", "감소", "개선", "전환", "복귀", "완료", "지속", "향상", "줄어", "높아"]
}

def check_customer_centric(question: str) -> Tuple[bool, List[str]]:
    """
    가설 질문이 고객 중심인지 휴리스틱으로 검증

    Returns:
        (is_customer_centric, found_categories)
    """
    found_categories = []

    for category, tokens in CUSTOMER_TOKENS.items():
        for token in tokens:
            if token in question:
                found_categories.append(category)
                break  # 카테고리당 하나만 카운트

    # 최소 2개 카테고리 필요
    is_customer_centric = len(found_categories) >= 2
    return is_customer_centric, found_categories


# validate_hypothesis_quality() 안에서 호출
def validate_hypothesis_quality(draft: Dict[str, Any]) -> Tuple[float, List[str]]:
    # ... 기존 검증 코드 ...

    # 8. 고객중심 검증 (NEW)
    question = draft.get("hypothesis_question", "")
    is_customer_centric, found_categories = check_customer_centric(question)

    if not is_customer_centric:
        issues.append("not_customer_centric")
        score -= 0.25  # 중요 감점

        # 디버깅용: 어떤 카테고리가 부족한지
        missing = set(CUSTOMER_TOKENS.keys()) - set(found_categories)
        if missing:
            issues.append(f"missing_customer_elements:{','.join(missing)}")

    # ... 나머지 코드 ...
```

**C. projects.py 수정**

```python
@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: str, project: ProjectUpdate):
    # ... 기존 코드 ...

    # 5. 업데이트 (기존)
    if project.status is not None:
        # === NEW: 가설 필수 게이트 ===
        if project.status in ["active", "done"]:
            has_hypothesis = (
                frontmatter.get("primary_hypothesis_id") or
                frontmatter.get("validates")
            )
            if not has_hypothesis:
                raise HTTPException(
                    status_code=400,
                    detail="Project requires at least one hypothesis before transitioning to active/done. "
                           "Use POST /api/ai/infer/hypothesis_draft to generate a hypothesis, "
                           "then approve it via Dashboard."
                )
        # === END NEW ===

        frontmatter['status'] = project.status

    # ... 나머지 코드 ...
```

**D. pending.py 수정**

```python
@router.post("/{review_id}/approve")
def approve_pending_review(review_id: str, approve: Optional[PendingApprove] = None):
    # ... 기존 조회 코드 ...

    entity_type = review.get("entity_type", "")

    # === NEW: Evidence 승인 시 가설 연결 강제 게이트 ===
    if entity_type == "Evidence":
        validated = fields_to_apply.get("validated_hypotheses", [])
        falsified = fields_to_apply.get("falsified_hypotheses", [])

        # 1. 최소 하나의 가설 업데이트 필수
        if not validated and not falsified:
            raise HTTPException(
                status_code=400,
                detail="Evidence must reference at least one hypothesis. "
                       "Set validated_hypotheses or falsified_hypotheses field."
            )

        # 2. Project.validates와 교차 검증
        project_id = fields_to_apply.get("project")
        if project_id:
            cache = get_cache()
            project = cache.get_project(project_id)

            if project:
                project_validates = project.get("validates", [])
                all_hyps = (validated or []) + (falsified or [])

                invalid_hyps = [h for h in all_hyps if h not in project_validates]

                if invalid_hyps:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Hypotheses not in project.validates: {invalid_hyps}. "
                               f"Valid hypotheses: {project_validates}"
                    )
    # === END NEW ===

    # ... 기존 Hypothesis 처리 코드 (entity_type == "Hypothesis") ...
    # ... 기존 Task/Project 처리 코드 ...
```

#### 2.3 테스트 케이스

| # | 테스트 | 입력 | 예상 결과 |
|---|--------|------|----------|
| 1 | 기술 가설 생성 | "API 속도 개선?" | quality_score < 0.7, issues에 `not_customer_centric` |
| 2 | 고객 가설 생성 | "사용자가 첫 주에 습관 설정 시 지속률 향상?" | quality_score >= 0.7 |
| 3 | Project active 전환 (가설 없음) | PUT /api/projects/prj-001 {status: "active"} | 400 에러 |
| 4 | Project active 전환 (가설 있음) | PUT /api/projects/prj-001 {status: "active"} | 200 OK |
| 5 | Evidence approve (가설 연결 없음) | POST .../approve | 400 에러 |
| 6 | Evidence approve (가설 연결 있음) | POST .../approve | 200 OK |
| 7 | Evidence approve (잘못된 가설 ID) | validated_hypotheses: ["hyp-99-99"] | 400 에러 |

#### 2.4 롤백 계획

각 게이트는 독립적으로 활성화/비활성화 가능:
- 프롬프트: 규칙 텍스트 제거
- 휴리스틱: `check_customer_centric()` 호출 주석 처리
- Project 게이트: if문 주석 처리
- Evidence 게이트: if문 주석 처리

---

### Todo

| # | 상태 | 작업 내용 |
|---|------|----------|
| 1 | done | hypothesis_seeder.py 프롬프트에 고객 문법 규칙 추가 |
| 2 | done | hypothesis_generator.py에 CUSTOMER_TOKENS 및 check_customer_centric() 추가 |
| 3 | done | validate_hypothesis_quality()에 고객중심 검증 추가 |
| 4 | done | projects.py update_project()에 가설 필수 게이트 추가 |
| 5 | done | pending.py approve_pending_review()에 Evidence 게이트 추가 |
| 6 | todo | /mcp-server rebuild 후 배포 |
| 7 | skip | E2E 테스트 |

---

## 참고 문서

- [[tsk-n8n-11]] - 선행 Task (Hypothesis Seeder API)
- [[prj-n8n]] - 소속 Project

---

**Created**: 2026-01-03
**Assignee**: 김은향
**Due**: 2026-01-05
