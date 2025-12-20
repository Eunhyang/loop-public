# LOOP 팀 워크플로우

> 2-3명 팀 기준, Claude Code 중심으로 일하는 방식

---

## 핵심 원칙 3가지

| 원칙 | 설명 |
|------|------|
| **1. 모든 '의미 판단'은 Project에서만** | Task는 실행 로그일 뿐, 전략적 의미는 Project가 담는다 |
| **2. LLM은 판단만, 계산은 코드가** | Claude는 판단 재료 제안, 점수 계산은 스크립트가 수행 |
| **3. Claude Code는 '판단 변환기'** | 자유 형식 회고 → 구조화된 Evidence로 변환 |

---

## 팀원이 실제로 쓰는 커맨드 5개

```
/new-project              → Project 껍데기 생성
/auto-fill-project-impact → Expected(A) LLM 제안 + Accept
/new-task                 → Task 생성 (가볍게)
/retro                    → 회고 → Evidence 변환
/build-impact             → 점수 계산 (보통 자동)
```

**이 5개로 전략–실행–회고–학습이 닫힌 루프를 이룬다.**

---

## 9단계 워크플로우

### 1️⃣ 일의 시작: Project 생성

**언제?**
- "이거 해볼까?"라는 말이 나왔을 때
- Task를 쪼개기 이전

**어떻게?**
```
/new-project

[프로젝트 내용 붙여넣기]
```

**결과:**
- Project 템플릿 생성
- 필수 필드만 비워둠
- Impact는 아직 안 채움

> 이 시점의 Project는 **'전략 가설 껍데기'**다.

**상세 가이드:** [[TEAM_GUIDE_Task_Project_생성#Project 만들기]]

---

### 2️⃣ 전략 베팅 선언: Expected(A) 채우기

**언제?**
- Project를 실제로 "시작하기로" 결정했을 때

**어떻게?**
```
/auto-fill-project-impact
```

**Claude가 하는 일:**
1. Project 문서 읽음
2. 연결된 Condition / NorthStar 요약
3. LLM 호출:
   - `tier` 판단 (strategic / enabling / operational)
   - `impact_magnitude` / `confidence` 제안
   - `contributes` 구조 제안
4. Preview 표시
5. 사용자 Accept / Edit / Cancel

**Accept되는 순간:**
> 이 Project는 **"우리가 감수하기로 한 전략적 베팅"**이 된다.

---

### 3️⃣ 실행 단계: Task 운영

**언제?**
- 실제 일을 쪼개서 진행할 때

**어떻게?**
```
/new-task
```

**Task의 특징:**
- 전략 판단 ❌
- Impact ❌
- 실행만 기록 ⭕

> Task는 많아도 상관없고, 아무리 사소해도 괜찮다.

**상세 가이드:** [[TEAM_GUIDE_Task_Project_생성#Task 만들기]]

---

### 4️⃣ 회고 단계: 자유롭게 쓰기

**언제?**
- Project가 끝났거나
- "이거 뭔가 배운 게 있다" 싶을 때

**어떻게?**
자유 형식 마크다운으로 작성:

```markdown
## 와디즈 펀딩 회고

### 잘된 점
- 알림신청 상위 1% 달성 (1739명)
- 회복/다이어트 탈출 메시지 관심 유발

### 아쉬운 점
- 상세페이지 메시지가 플랫폼 문맥과 맞지 않았음
- 사회적 증거 부족
- 전환율이 예상보다 훨씬 낮았음

### 배운 것
- 내부 가설이 여러 개 깨짐
- 전략은 내부가 소유해야 함
```

**중요:**
> 이 단계에서는 구조 신경 쓰지 말 것. 구조화는 Claude의 역할.

---

### 5️⃣ 핵심 전환점: 회고 → Evidence 변환

**이 단계가 전체 시스템의 심장이다.**

**어떻게?**
```
/retro
```

**스킬 실행 흐름:**
1. 현재 회고 문서 읽음
2. 연결된 Project 확인
3. LLM 호출:
   - 정량 데이터 추출
   - `normalized_delta` 제안
   - `evidence_strength` 제안
   - `falsified_hypotheses` / `confirmed_insights` 추출
4. Evidence Preview 표시
5. 사용자 Accept / Edit / Cancel

**Accept되면:**
- Evidence 파일 생성
- `build_impact.py` 자동 실행

---

### 6️⃣ 자동 계산 & 판정

**이 시점부터는 완전 자동:**
- Expected vs Realized 계산
- `realized_status` 판정
- `impact.json` / dashboard 업데이트

**사람은:**
- 숫자 계산 ❌
- 판정 ❌
- 변명 ❌

> **"감정이 개입되지 않는 구간"**

---

### 7️⃣ 학습 축적 & 전략 반영

**무엇이 남는가?**

이 Project는:
- 성공인가? (`succeeded`)
- 실패지만 고신호인가? (`failed_but_high_signal`)
- 다시 하면 안 되는가? (`failed_low_signal`)

**이 정보는:**
- 다음 Project 생성 시
- Claude가 `confidence` / `magnitude`를 자동으로 보정하는 근거가 된다.

---

### 8️⃣ 왜 이 방식이 2-3명 팀에 특히 좋은가?

| 이유 | 설명 |
|------|------|
| **회의가 줄어든다** | "이거 실패 아님?" 논쟁 ❌ → Evidence + 모델이 대신 말해줌 |
| **기억에 의존하지 않는다** | 3개월 뒤에도 판단이 그대로 재현됨 |
| **Claude가 '보조 두뇌'가 된다** | 판단 ❌, 정리/변환/요약 ⭕ |

---

### 9️⃣ 일일/주간 루틴 예시

**일일 (5분):**
```
1. /new-task 로 오늘 할 일 기록
2. Task 상태 업데이트 (pending → in_progress → completed)
```

**주간 (30분):**
```
1. 완료된 Project 회고 작성
2. /retro 실행하여 Evidence 변환
3. Dashboard에서 Impact 현황 확인
```

---

## realized_status 판정 기준

| 상태 | 조건 | 의미 |
|------|------|------|
| `succeeded` | normalized_delta ≥ 0.8 | 목표 달성 + 가설 검증 |
| `failed_but_high_signal` | delta < 0.5 AND learning_value = high | 목표 미달 + 전략 학습 |
| `failed_low_signal` | delta < 0.5 AND learning_value = low | 목표 미달 + 학습도 부족 |
| `inconclusive` | attribution_share < 0.3 | 판단 불가 |

---

## 운영 철학 (한 문장)

> LOOP에서 일한다는 건
> "열심히 하는 것"이 아니라
> **"의미 있는 실험을 하고, 그 결과를 구조화해서, 다음 선택을 더 똑똑하게 만드는 것"**이다.

---

## 관련 문서

- [[TEAM_GUIDE_Task_Project_생성]] - Task/Project 생성 상세 가이드
- [[impact_model_config]] - Impact A/B 모델 설정
- [[template_evidence]] - Evidence 템플릿

---

**Last updated**: 2025-12-20
**Author**: LOOP Team