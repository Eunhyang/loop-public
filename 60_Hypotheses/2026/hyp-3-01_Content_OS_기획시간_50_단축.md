---
entity_type: Hypothesis
entity_id: hyp-3-01
entity_name: Content OS 기획시간 50% 단축
created: '2026-01-01'
updated: '2026-01-01'
status: assumed
parent_id: trk-3
aliases:
- hyp-3-01
- Content_OS_기획시간_50_단축
hypothesis_question: Content OS를 도입하면 콘텐츠 기획 리드타임(기획→승인)이 50% 이상 감소하는가?
success_criteria: 2주(또는 10개 기획 세션) 기준, 평균 기획 리드타임이 베이스라인 대비 ≥50% 감소 + Pending 승인률
  ≥60% 달성
failure_criteria: 평균 기획 리드타임 감소 <20% 또는 승인률 <30% (또는 운영 부담 증가로 프로세스 정착 실패)
measurement: Content OS DB 이벤트(Draft→Approved timestamp) + Vault decision_log.jsonl
  + (선택) YouTube Analytics
horizon: '2026'
deadline: null
evidence_status: assumed
confidence: 0.5
loop_layer:
- habit
- reward
tags:
- '2026'
- trk-3
- content
- content-os
- workflow
- productivity
validates: []
validated_by: []
---

# Content OS 기획시간 50% 단축

> Track: [[trk-3]] | ID: hyp-3-01 | 상태: assumed

---

## 가설

**Q: Content OS를 도입하면 콘텐츠 기획 리드타임(기획→승인)이 50% 이상 감소하는가?**

---

## 판정 기준

### 성공 (Success)

2주(또는 10개 기획 세션) 기준, 평균 기획 리드타임이 베이스라인 대비 ≥50% 감소 + Pending 승인률 ≥60% 달성

### 실패 (Failure)

평균 기획 리드타임 감소 <20% 또는 승인률 <30% (또는 운영 부담 증가로 프로세스 정착 실패)

---

## 측정 방법

### 핵심 지표 (필수)

| 지표 | 정의 | 단위 |
|------|------|------|
| (지표1) | (정의) | (단위) |
| (지표2) | (정의) | (단위) |

### 베이스라인 (필수)

- 측정 기간: (도입 전 2주 또는 N건)
- baseline_avg: (측정값)

### 데이터 소스

Content OS DB 이벤트(Draft→Approved timestamp) + Vault decision_log.jsonl + (선택) YouTube Analytics

---

## Evidence 설계

> B Score 계산을 위한 Evidence 생성 규칙

### Window 설정

- window_id: `YYYY-MM` (월간)
- time_range: `YYYY-MM-01..YYYY-MM-말일`

### normalized_delta 계산

```
target_reduction = 0.50  # 목표 감소율
observed_reduction = 1 - (current_avg / baseline_avg)
normalized_delta = clamp(observed_reduction / target_reduction, 0, 1)
```

### evidence_strength 룰

| 강도 | 조건 |
|------|------|
| strong | n ≥ 10 AND measurement_quality = high |
| medium | n ≥ 5 |
| weak | n < 5 OR measurement_quality = low |

### attribution_share

- 기본: `1.0`
- confounders 존재 시: `0.5 ~ 0.8`

### evidence_quality_meta (필수)

```yaml
provenance: auto | mixed | human
source_refs: [(DB query / dashboard 링크)]
sample_size: (n)
measurement_quality: low | medium | high
counterfactual: none | before_after | controlled
confounders: [(교란 변수 목록)]
query_version: "(버전)"
```

---

## 연결된 프로젝트

> 이 Hypothesis는 Project.validates로 연결

| Project ID | 역할 |
|------------|------|
| (prj-XXX) | validates / primary_hypothesis_id |

---

## 검증 로그

| 날짜 | 상태 | 메모 |
|------|------|------|
| 2026-01-01 | assumed | 가설 정의 및 측정 규칙 확정 |

---

## 다음 단계

1. [ ] 베이스라인 측정 (도입 전 2주)
2. [ ] 데이터 소스 연동 확인
3. [ ] 첫 번째 Evidence 생성 (window 완료 후)
