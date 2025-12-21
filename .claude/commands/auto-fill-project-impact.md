# Auto-fill Project Impact

> Project의 Expected Impact (A) 필드를 LLM이 제안합니다.

---

## 실행 시 동작

이 커맨드는 `auto-fill-project-impact` 스킬을 실행합니다.

**워크플로우 위치**: [[TEAM_WORKFLOW]] 2단계 (전략 베팅 선언)

> Accept되는 순간, 이 Project는 **"우리가 감수하기로 한 전략적 베팅"**이 된다.

---

## 수행 단계

1. **프로젝트 확인**
   - Project 문서 읽기
   - 기존 Impact 필드 확인

2. **컨텍스트 수집**
   - 연결된 Track/Hypothesis 읽기
   - 관련 Condition 확인
   - NorthStar/MH 요약

3. **Impact 필드 제안** (LLM)
   - `tier` 판단 (strategic/enabling/operational)
   - `impact_magnitude` 제안 (high/mid/low)
   - `confidence` 제안 (0.0-1.0)
   - `contributes` 구조 제안

4. **Preview 표시**
   - 제안된 필드 값 표시
   - 계산될 ExpectedScore 표시
   - 판단 근거 표시

5. **사용자 확인**
   - Accept → Project frontmatter 업데이트
   - Edit → 필드 수정 후 재확인
   - Cancel → 중단

6. **저장 및 빌드**
   - Project 파일 업데이트
   - build_impact.py 실행 (선택)

---

## 사용 예시

**방법 1: 컨텍스트와 함께**
```
와디즈 펀딩 프로젝트를 시작하려고 해.
목표는 매출 1200만원이고, 온라인 코칭 시장 검증이야.

/auto-fill-project-impact
```

**방법 2: Project ID 지정**
```
/auto-fill-project-impact prj-010
```

---

## Impact 필드 요약

| 필드 | 설명 | 예시 |
|------|------|------|
| `tier` | 전략적 위치 | strategic, enabling, operational |
| `impact_magnitude` | 영향 크기 | high, mid, low |
| `confidence` | 실행 가능성 | 0.0 ~ 1.0 |
| `contributes` | 기여하는 Condition | cond-a, cond-b, ... |

---

## ExpectedScore 계산

```
ExpectedScore = magnitude_points[tier][magnitude] × confidence
```

**예시:**
```
tier: strategic, magnitude: high → 10점
confidence: 0.6

ExpectedScore = 10 × 0.6 = 6.0
```

---

## 다음 단계

Impact 채우기 완료 후:
1. `/new-task` 로 세부 태스크 추가
2. 프로젝트 실행
3. 완료 후 `/retro` 로 회고→Evidence 변환

---

## 참조

- `auto-fill-project-impact` 스킬 - 실제 실행 로직
- [[impact_model_config]] - 점수 계산 설정
- [[TEAM_WORKFLOW]] - 전체 워크플로우