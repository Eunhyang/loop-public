---
entity_type: Project
entity_id: prj-022
entity_name: KkokKkok App v1.0.29 - 캘린더 월뷰 개선
created: 2026-01-06
updated: '2026-01-15'
status: doing
parent_id: trk-1
aliases:
- prj-022
- KkokKkok v1.0.29
outgoing_relations:
- type: supports
  target_id: trk-4
  description: 앱 UX 개선 → 코칭 운영 효율 향상
validates: []
validated_by: []
primary_hypothesis_id: null
owner: 김은향
budget: null
deadline: 2026-01-06
program_id: pgm-kkokkkok-app-release
cycle: 2026-01
hypothesis_text: 캘린더 월뷰 overflow 수정과 +more 토글 버튼으로 UX 개선
experiments: []
tier: operational
impact_magnitude: low
confidence: 0.9
condition_contributes:
- to: cond-a
  weight: 0.1
  description: 앱 UX 개선 → PMF 기반
track_contributes: []
expected_impact:
  statement: 캘린더 월뷰 overflow 문제 해결과 +more 토글 버튼 추가로 사용자 경험 개선
  metric: 캘린더 UX 관련 버그 리포트
  target: 0건
realized_impact:
  verdict: pending
  outcome: null
  evidence_links: []
  decided: null
  window_id: null
  time_range: null
  metrics_snapshot: {}
conditions_3y:
- cond-a
tags:
- release
- calendar
- ux-improvement
- v1.0.29
priority_flag: high
tasks:
- tsk-022-01
---
# KkokKkok App v1.0.29 - 캘린더 월뷰 개선

> Project ID: `prj-022` | Track: `trk-1` | Status: active

---

## Project 가설

**"캘린더 월뷰 overflow 수정과 +more 토글 버튼으로 UX 개선"**

---

## 목표

### 성공 기준

1. 캘린더 월뷰에서 태스크가 많아도 overflow 없이 정상 표시
2. +more 토글 버튼으로 축소/확장 모드 전환 가능
3. 사용자가 원하는 표시 모드 선택 가능

### 실패 신호

1. 캘린더 관련 추가 버그 리포트
2. UX 불만 피드백

---

## 배경

### 왜 이 프로젝트인가?

1. **월(Month) 뷰 overflow 문제**:

   - 현재: 캘린더가 흰색 바탕으로 고정된 높이를 가짐
   - 문제: dayMaxEvents: true 설정으로 태스크가 많으면 캘린더 고정 영역을 벗어남 (overflow)
   - 해결: 캘린더 높이가 내용에 맞게 조절되거나, overflow가 적절히 처리되도록 수정

2. **+more 모드 토글 버튼 추가**:

   - 사용자가 원할 때 "+N more" 모드로 전환할 수 있는 버튼 추가
   - 버튼으로 "모든 태스크 표시" ↔ "+more 축소 모드" 전환 가능

---

## Tasks

| ID | Name | Assignee | Status | Due |
| --- | --- | --- | --- | --- |
| tsk-022-01 | Calendar - 월뷰 overflow 수정 및 +more 토글 버튼 추가 | 김은향 | doing | 2026-01-06 |

---

## Notes

### 기술 변경 예정

**파일**: `lib/presentation/today/widgets/calendar_widget.dart`

| 항목 | Before | After |
| --- | --- | --- |
| dayMaxEvents | 미설정 | true (선택적) |
| 높이 | 고정 | 동적 or overflow 처리 |
| 토글 버튼 | 없음 | +more 모드 토글 |

---

## 참고 문서

- \[\[trk-1\]\] - Product Track
- \[\[pgm-kkokkkok-app-release\]\] - 소속 Program
- \[\[prj-kkokkkok-v1028\]\] - 이전 버전

---

**Created**: 2026-01-06 **Owner**: 김은향