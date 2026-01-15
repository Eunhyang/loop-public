---
entity_type: Project
entity_id: prj-kkokkkok-v1028
entity_name: KkokKkok App v1.0.28 - Hotfix
created: 2026-01-02
updated: '2026-01-16'
status: done
parent_id: trk-1
aliases:
- prj-kkokkkok-v1028
- KkokKkok v1.0.28
outgoing_relations:
- type: supports
  target_id: trk-4
  description: 앱 안정성 개선 → 코칭 운영 효율 향상
validates: []
validated_by: []
primary_hypothesis_id: null
owner: 김은향
budget: null
deadline: 2026-01-02
program_id: pgm-kkokkkok-app-release
cycle: 2026-01
hypothesis_text: 2026년 캘린더 버그 수정으로 사용자 기록 기능 정상화
experiments: []
tier: operational
impact_magnitude: low
confidence: 0.9
condition_contributes:
- to: cond-a
  weight: 0.1
  description: 앱 안정성 → PMF 기반
track_contributes: []
expected_impact:
  statement: 2026년 캘린더 표시 버그 수정으로 사용자가 정상적으로 식사 기록 가능
  metric: 캘린더 관련 버그 리포트
  target: 0건
realized_impact:
  verdict: go
  outcome: supported
  evidence_links: []
  decided: 2026-01-02
  window_id: 2026-01
  time_range: 2026-01-02..2026-01-02
  metrics_snapshot:
    calendar_bug_reports: 0
conditions_3y:
- cond-a
tags:
- hotfix
- calendar
- bug-fix
- v1.0.28
priority_flag: high
---
# KkokKkok App v1.0.28 - Hotfix

> Project ID: `prj-kkokkkok-v1028` | Track: `trk-1` | Status: done

---

## Project Rollup

### Conclusion

1. 2026년 캘린더가 표시되지 않는 버그 수정 완료
2. `lastDay` 하드코딩 → 동적 날짜 범위로 변경
3. 향후 연도 변경에도 문제없는 구조로 개선

### Evidence

| \# | Type | 근거 요약 | 링크 |
| --- | --- | --- | --- |
| 1 | task | 캘린더 버그 수정 커밋 | \[\[tsk-kkokkkok-v1028-01\]\] |

### Metric Delta

| Metric | Before | After | Delta | 판정 |
| --- | --- | --- | --- | --- |
| 캘린더 표시 | X (2026년 불가) | O (정상) | +100% | go |

### Decision

- **Verdict**: `go`
- **Next Action**: 앱스토어 배포
- **Decided**: 2026-01-02

---

## Project 가설

**"2026년 캘린더 버그 수정으로 사용자 기록 기능 정상화"**

---

## 목표

### 성공 기준

1. 2026년 캘린더 정상 표시
2. 날짜 선택 가능
3. 식사 기록 저장 가능

### 실패 신호

1. 캘린더 관련 추가 버그 리포트

---

## 배경

### 왜 이 프로젝트인가?

2026년 1월 1일부터 앱에서 캘린더가 표시되지 않는 치명적 버그 발생. `lastDay: DateTime.utc(2025, 12, 31)` 하드코딩이 원인.

### 선행 조건

- v1.0.27 배포 완료

---

## 실행 계획

### Phase 1: 버그 분석 (완료)

- [x] 캘린더 관련 코드 전체 탐색

- [x] 원인 파악 (하드코딩된 날짜 범위)

### Phase 2: 수정 (완료)

- [x] `calendar_widget.dart` 수정

- [x] 동적 날짜 범위 적용

---

## Tasks

| ID | Name | Assignee | Status | Due |
| --- | --- | --- | --- | --- |
| tsk-kkokkkok-v1028-01 | Calendar - 2026년 캘린더 표시 버그 수정 | 은향 | done | 2026-01-02 |

---

## Notes

### 기술 변경 내용

**파일**: `lib/presentation/today/widgets/calendar_widget.dart`

| 항목 | Before | After |
| --- | --- | --- |
| firstDay | `DateTime.utc(2024, 1, 1)` | `DateTime.utc(2020, 1, 1)` |
| lastDay | `DateTime.utc(2025, 12, 31)` | `DateTime.now().add(Duration(days: 365))` |

**커밋**: `85f30ee` on `fix/calendar-2026`

---

## 참고 문서

- \[\[trk-1\]\] - Product Track
- \[\[pgm-kkokkkok-app-release\]\] - 소속 Program

---

**Created**: 2026-01-02 **Owner**: 은향