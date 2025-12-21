# Retrospective to Evidence

> 회고 문서를 구조화된 Evidence로 변환합니다.

---

## 실행 시 동작

이 커맨드는 `retrospective-to-evidence` 스킬을 실행합니다.

**워크플로우 위치**: [[TEAM_WORKFLOW]] 5단계 (핵심 전환점)

> **이 단계가 전체 시스템의 심장이다.**

---

## 수행 단계

1. **입력 수집**
   - 회고 문서 경로 (또는 위 컨텍스트에서 자동 인식)
   - Project ID (prj-NNN)
   - 핵심 지표 (목표 vs 실제)

2. **회고 분석** (LLM)
   - 정량 데이터 추출
   - 반증된 가설 추출
   - 확인된 인사이트 추출
   - 학습 가치 판단

3. **Evidence 필드 매핑** (LLM 제안)
   - normalized_delta (목표 대비 달성률)
   - evidence_strength (증거 강도)
   - attribution_share (기여 비율)
   - learning_value (학습 가치)
   - realized_status (판정)

4. **Preview 표시**
   - 추출된 필드 값 표시
   - 계산된 RealizedScore 표시
   - 판정 근거 표시

5. **사용자 확인**
   - Accept → Evidence 파일 생성
   - Edit → 필드 수정 후 재확인
   - Cancel → 중단

6. **저장 및 빌드**
   - Evidence 파일 생성
   - build_impact.py 자동 실행

---

## 사용 예시

```
## 와디즈 펀딩 회고

### 결과
- 목표: 매출 1200만원
- 실제: 매출 250만원

### 잘된 점
- 알림신청 상위 1% 달성

### 아쉬운 점
- 전환율 0.97%로 예상보다 낮음

### 배운 것
- 브랜드 스토리 중심 설득이 와디즈에서는 안 통함

/retro
```

---

## LLM의 역할

- **LLM이 하는 것**: 판단 재료 제안 (필드 값 + 근거)
- **LLM이 안 하는 것**: 점수 직접 계산

> "계산은 코드가, 판단은 사람이"

---

## realized_status 판정 기준

| 상태 | 조건 |
|------|------|
| `succeeded` | normalized_delta >= 0.8 |
| `failed_but_high_signal` | delta < 0.5 AND learning_value = high |
| `failed_low_signal` | delta < 0.5 AND learning_value = low |
| `inconclusive` | attribution_share < 0.3 |

---

## 참조

- `retrospective-to-evidence` 스킬 - 실제 실행 로직
- [[template_evidence]] - Evidence 템플릿
- [[impact_model_config]] - 점수 계산 설정