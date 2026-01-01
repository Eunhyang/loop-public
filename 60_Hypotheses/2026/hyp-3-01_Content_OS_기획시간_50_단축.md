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

## 가설

Content OS를 도입하면 콘텐츠 기획 리드타임(기획→승인)이 50% 이상 감소하는가?

## 성공 기준

2주(또는 10개 기획 세션) 기준, 평균 기획 리드타임이 베이스라인 대비 ≥50% 감소 + Pending 승인률 ≥60% 달성

## 실패 기준

평균 기획 리드타임 감소 <20% 또는 승인률 <30% (또는 운영 부담 증가로 프로세스 정착 실패)

## 측정 방법

Content OS DB 이벤트(Draft→Approved timestamp) + Vault decision_log.jsonl + (선택) YouTube Analytics

## 검증 계획

(작성 예정)

## 근거/결과

(검증 후 기록)
