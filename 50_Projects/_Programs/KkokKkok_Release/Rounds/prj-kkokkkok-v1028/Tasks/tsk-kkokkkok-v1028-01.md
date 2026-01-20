---
entity_type: Task
entity_id: tsk-kkokkkok-v1028-01
entity_name: Calendar - 2026년 캘린더 표시 버그 수정
created: 2026-01-02
updated: '2026-01-20'
status: done
parent_id: prj-kkokkkok-v1028
project_id: prj-kkokkkok-v1028
aliases:
- tsk-kkokkkok-v1028-01
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
start_date: '2026-01-02'
due: '2026-01-19'
priority: critical
estimated_hours: 1
actual_hours: 1
closed: 2026-01-02
type: bug
target_project: kkokkkok
tags:
- bug
- calendar
- hotfix
- '2026'
priority_flag: critical
notes: '# Calendar - 2026년 캘린더 표시 버그 수정


  > Task ID: `tsk-kkokkkok-v1028-01` | Project: `prj-kkokkkok-v1028` | Status: done


  ## 목표


  **완료 조건**:

  1. 2026년 캘린더가 정상 표시됨

  2. 날짜 선택 가능

  3. 식사 기록 저장 가능


  ---


  ## 상세 내용


  ### 배경


  2026년 1월 1일부터 앱에서 캘린더가 표시되지 않는 버그 발생.

  - 캘린더 UI에서 2026년이 표시되지 않음

  - 날짜 선택이 불가능한 상태

  - 식사 일기 등의 기록 기능에 영향


  ### 작업 내용


  **원인 분석**:

  - `calendar_widget.dart`에서 날짜 범위가 하드코딩됨

  - `lastDay: DateTime.utc(2025, 12, 31)` → 2025년까지만 허용


  **수정 내용**:

  - `firstDay`: `DateTime.utc(2024, 1, 1)` → `DateTime.utc(2020, 1, 1)`

  - `lastDay`: `DateTime.utc(2025, 12, 31)` → `DateTime.now().add(Duration(days: 365))`


  ---


  ## 체크리스트


  - [x] 캘린더 관련 코드 전체 탐색

  - [x] 원인 파악 (하드코딩된 날짜 범위)

  - [x] `calendar_widget.dart` 수정

  - [x] 린트 검사 통과

  - [x] 커밋 완료


  ---


  ## Notes


  ### PRD (Product Requirements Document)


  **문제 정의**:

  2026년 1월 1일부터 캘린더가 표시되지 않아 사용자가 식사 기록을 할 수 없음.


  **목표**:

  캘린더 날짜 범위를 동적으로 변경하여 향후 연도 변경에도 문제없도록 수정.


  **핵심 요구사항**:

  1. 2026년 캘린더 표시

  2. 과거 기록 조회 가능 (2020년부터)

  3. 미래 1년까지 기록 가능


  **기술 스펙**:

  - 파일: `lib/presentation/today/widgets/calendar_widget.dart`

  - 라인: 26-27


  **제약 조건**:

  - 기존 아키텍처 유지 (Presentation Layer만 수정)

  - 중복 코드 생성 금지


  **성공 지표**:

  - 캘린더 정상 표시

  - 린트 에러 없음


  ### 작업 로그


  #### 2026-01-02

  **개요**: 2026년 캘린더 표시 버그 수정


  **변경사항**:

  - 수정: `calendar_widget.dart` 날짜 범위 동적 변경


  **핵심 코드**:

  ```dart

  // Before

  firstDay: DateTime.utc(2024, 1, 1),

  lastDay: DateTime.utc(2025, 12, 31),


  // After

  firstDay: DateTime.utc(2020, 1, 1),

  lastDay: DateTime.now().add(const Duration(days: 365)),

  ```


  **결과**: ✅ 빌드 성공, 린트 통과


  **커밋**: `85f30ee` on `fix/calendar-2026`


  ---


  ## 참고 문서


  - [[prj-kkokkkok-v1028]] - 소속 Project


  ---


  **Created**: 2026-01-02

  **Assignee**: 은향

  **Closed**: 2026-01-02

  '
---
# Calendar - 2026년 캘린더 표시 버그 수정

> Task ID: `tsk-kkokkkok-v1028-01` | Project: `prj-kkokkkok-v1028` | Status: done

## 목표

**완료 조건**:
1. 2026년 캘린더가 정상 표시됨
2. 날짜 선택 가능
3. 식사 기록 저장 가능

---

## 상세 내용

### 배경

2026년 1월 1일부터 앱에서 캘린더가 표시되지 않는 버그 발생.
- 캘린더 UI에서 2026년이 표시되지 않음
- 날짜 선택이 불가능한 상태
- 식사 일기 등의 기록 기능에 영향

### 작업 내용

**원인 분석**:
- `calendar_widget.dart`에서 날짜 범위가 하드코딩됨
- `lastDay: DateTime.utc(2025, 12, 31)` → 2025년까지만 허용

**수정 내용**:
- `firstDay`: `DateTime.utc(2024, 1, 1)` → `DateTime.utc(2020, 1, 1)`
- `lastDay`: `DateTime.utc(2025, 12, 31)` → `DateTime.now().add(Duration(days: 365))`

---

## 체크리스트

- [x] 캘린더 관련 코드 전체 탐색
- [x] 원인 파악 (하드코딩된 날짜 범위)
- [x] `calendar_widget.dart` 수정
- [x] 린트 검사 통과
- [x] 커밋 완료

---

## Notes

### PRD (Product Requirements Document)

**문제 정의**:
2026년 1월 1일부터 캘린더가 표시되지 않아 사용자가 식사 기록을 할 수 없음.

**목표**:
캘린더 날짜 범위를 동적으로 변경하여 향후 연도 변경에도 문제없도록 수정.

**핵심 요구사항**:
1. 2026년 캘린더 표시
2. 과거 기록 조회 가능 (2020년부터)
3. 미래 1년까지 기록 가능

**기술 스펙**:
- 파일: `lib/presentation/today/widgets/calendar_widget.dart`
- 라인: 26-27

**제약 조건**:
- 기존 아키텍처 유지 (Presentation Layer만 수정)
- 중복 코드 생성 금지

**성공 지표**:
- 캘린더 정상 표시
- 린트 에러 없음

### 작업 로그

#### 2026-01-02
**개요**: 2026년 캘린더 표시 버그 수정

**변경사항**:
- 수정: `calendar_widget.dart` 날짜 범위 동적 변경

**핵심 코드**:
```dart
// Before
firstDay: DateTime.utc(2024, 1, 1),
lastDay: DateTime.utc(2025, 12, 31),

// After
firstDay: DateTime.utc(2020, 1, 1),
lastDay: DateTime.now().add(const Duration(days: 365)),
```

**결과**: ✅ 빌드 성공, 린트 통과

**커밋**: `85f30ee` on `fix/calendar-2026`

---

## 참고 문서

- [[prj-kkokkkok-v1028]] - 소속 Project

---

**Created**: 2026-01-02
**Assignee**: 은향
**Closed**: 2026-01-02
