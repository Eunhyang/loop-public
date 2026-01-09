---
entity_type: Task
entity_id: tsk-022-01
entity_name: Calendar - 월뷰 overflow 수정 및 +more 토글 버튼 추가
created: 2026-01-06
updated: '2026-01-09'
status: done
parent_id: prj-022
project_id: prj-022
aliases:
- tsk-022-01
assignee: 김은향
start_date: 2026-01-06
due: 2026-01-06
priority: high
type: dev
target_project: sosi
tags:
- calendar
- overflow
- ux
- toggle-button
priority_flag: high
notes: "# Calendar - 월뷰 overflow 수정 및 +more 토글 버튼 추가\n\n> Task ID: `tsk-022-01` |\
  \ Project: `prj-022` | Status: doing\n\n---\n\n## 작업 내용\n\n두 가지 문제 해결:\n\n### 1.\
  \ 월(Month) 뷰 overflow 문제\n\n- **현재**: 캘린더가 흰색 바탕으로 고정된 높이를 가짐\n- **문제**: dayMaxEvents:\
  \ true 설정으로 태스크가 많으면 캘린더 고정 영역을 벗어남 (overflow)\n- **해결**: 캘린더 높이가 내용에 맞게 조절되거나,\
  \ overflow가 적절히 처리되도록 수정\n\n### 2. +more 모드 토글 버튼 추가\n\n- 사용자가 원할 때 \"+N more\"\
  \ 모드로 전환할 수 있는 버튼 추가\n- 버튼으로 \"모든 태스크 표시\" 와 \"+more 축소 모드\" 전환 가능\n\n---\n\n##\
  \ Notes\n\n### Tech Spec\n\n1\\. 현재 상태 분석\n\n- **패키지**: table_calendar v3.0.9\n\
  - **위젯 타입**: StatelessWidget (상태 관리 불가)\n- **마커**: `markerBuilder`로 이모지 최대 3개 표시\
  \ (이모지맵 기반)\n- **높이**: `rowHeight: 60` 고정, `daysOfWeekHeight: 13` 고정\n- **캘린더 포맷**:\
  \ `CalendarFormat.week` / `CalendarFormat.month` 토글 가능\n\n2\\. 문제점\n\n1. **월뷰 overflow**:\
  \ 이모지 마커가 많은 날짜에서 셀 영역 초과 가능\n2. **축소 모드 없음**: 현재는 모든 이모지를 3개까지 표시, \"+N more\"\
  \ 표시 없음\n\n3\\. 해결 방안\n\n**Option A: 마커 표시 모드 토글** (권장)\n\n- `CalendarWidget`을 `StatefulWidget`으로\
  \ 변경하거나 상위에서 상태 관리\n- 토글 버튼으로 \"전체 표시\" ↔ \"축소 모드 (+more)\" 전환\n- 축소 모드: 이모지 1개\
  \ + \"+N\" 표시\n- 전체 모드: 기존처럼 최대 3개 표시\n\n**Option B: 동적 rowHeight**\n\n- 내용에 따라\
  \ rowHeight 조절 (복잡도 높음)\n\n**Option C: AnimatedContainer 래핑**\n\n- 캘린더를 AnimatedContainer로\
  \ 감싸 높이 전환\n\n4\\. 구현 계획 (Option A 채택)\n\n**4-1. CalendarWidget 수정**\n\n```dart\n\
  // 새로운 파라미터 추가\nfinal bool compactMarkerMode;  // true = 축소 모드\n\n// markerBuilder\
  \ 수정\nWidget? _buildEmojiMarkers(...) {\n  if (compactMarkerMode && emojis.length\
  \ > 1) {\n    // 이모지 1개 + \"+N\" 표시\n    return Row(children: [\n      Text(emojis.first),\n\
  \      Text('+${emojis.length - 1}', style: ...),\n    ]);\n  }\n  // 기존 로직 (최대\
  \ 3개)\n  return Row(children: emojis.take(3).map(...));\n}\n```\n\n**4-2. TodayPage에서\
  \ 토글 상태 관리**\n\n```dart\nbool _compactMarkerMode = false;  // 기본: 전체 표시\n\n// AppBar에\
  \ 토글 버튼 추가\nIconButton(\n  icon: Icon(_compactMarkerMode ? Icons.expand : Icons.compress),\n\
  \  onPressed: () => setState(() => _compactMarkerMode = !_compactMarkerMode),\n\
  )\n\n// CalendarWidget에 전달\nCalendarWidget(\n  ...,\n  compactMarkerMode: _compactMarkerMode,\n\
  )\n```\n\n### Dependencies\n\n- table_calendar: ^3.0.9 (기존)\n\n### Todo\n\n- [ ]\
  \ CalendarWidget에 compactMarkerMode 파라미터 추가\n\n- [ ] \\_buildEmojiMarkers에 축소 모드\
  \ 로직 구현\n\n- [ ] TodayPage에 \\_compactMarkerMode 상태 추가\n\n- [ ] AppBar actions에\
  \ 토글 버튼 추가\n\n- [ ] 토글 버튼 아이콘/툴팁 설정\n\n- [ ] 빌드 및 테스트\n\n---\n\n## 관련 파일\n\n- `lib/presentation/today/widgets/calendar_widget.dart`\
  \ - 캘린더 위젯\n- `lib/presentation/today/page/today_page.dart` - 상위 페이지 (상태 관리)\n\n\
  ---\n\n**Created**: 2026-01-06 **Assignee**: 김은향"
---
# Calendar - 월뷰 overflow 수정 및 +more 토글 버튼 추가

> Task ID: `tsk-022-01` | Project: `prj-022` | Status: doing

---

## 작업 내용

두 가지 문제 해결:

### 1. 월(Month) 뷰 overflow 문제
- **현재**: 캘린더가 흰색 바탕으로 고정된 높이를 가짐
- **문제**: dayMaxEvents: true 설정으로 태스크가 많으면 캘린더 고정 영역을 벗어남 (overflow)
- **해결**: 캘린더 높이가 내용에 맞게 조절되거나, overflow가 적절히 처리되도록 수정

### 2. +more 모드 토글 버튼 추가
- 사용자가 원할 때 "+N more" 모드로 전환할 수 있는 버튼 추가
- 버튼으로 "모든 태스크 표시" 와 "+more 축소 모드" 전환 가능

---

## Notes

### Tech Spec

#### 1. 현재 상태 분석
- **패키지**: table_calendar v3.0.9
- **위젯 타입**: StatelessWidget (상태 관리 불가)
- **마커**: `markerBuilder`로 이모지 최대 3개 표시 (이모지맵 기반)
- **높이**: `rowHeight: 60` 고정, `daysOfWeekHeight: 13` 고정
- **캘린더 포맷**: `CalendarFormat.week` / `CalendarFormat.month` 토글 가능

#### 2. 문제점
1. **월뷰 overflow**: 이모지 마커가 많은 날짜에서 셀 영역 초과 가능
2. **축소 모드 없음**: 현재는 모든 이모지를 3개까지 표시, "+N more" 표시 없음

#### 3. 해결 방안

**Option A: 마커 표시 모드 토글** (권장)
- `CalendarWidget`을 `StatefulWidget`으로 변경하거나 상위에서 상태 관리
- 토글 버튼으로 "전체 표시" ↔ "축소 모드 (+more)" 전환
- 축소 모드: 이모지 1개 + "+N" 표시
- 전체 모드: 기존처럼 최대 3개 표시

**Option B: 동적 rowHeight**
- 내용에 따라 rowHeight 조절 (복잡도 높음)

**Option C: AnimatedContainer 래핑**
- 캘린더를 AnimatedContainer로 감싸 높이 전환

#### 4. 구현 계획 (Option A 채택)

**4-1. CalendarWidget 수정**
```dart
// 새로운 파라미터 추가
final bool compactMarkerMode;  // true = 축소 모드

// markerBuilder 수정
Widget? _buildEmojiMarkers(...) {
  if (compactMarkerMode && emojis.length > 1) {
    // 이모지 1개 + "+N" 표시
    return Row(children: [
      Text(emojis.first),
      Text('+${emojis.length - 1}', style: ...),
    ]);
  }
  // 기존 로직 (최대 3개)
  return Row(children: emojis.take(3).map(...));
}
```

**4-2. TodayPage에서 토글 상태 관리**
```dart
bool _compactMarkerMode = false;  // 기본: 전체 표시

// AppBar에 토글 버튼 추가
IconButton(
  icon: Icon(_compactMarkerMode ? Icons.expand : Icons.compress),
  onPressed: () => setState(() => _compactMarkerMode = !_compactMarkerMode),
)

// CalendarWidget에 전달
CalendarWidget(
  ...,
  compactMarkerMode: _compactMarkerMode,
)
```

### Dependencies
- table_calendar: ^3.0.9 (기존)

### Todo
- [ ] CalendarWidget에 compactMarkerMode 파라미터 추가
- [ ] _buildEmojiMarkers에 축소 모드 로직 구현
- [ ] TodayPage에 _compactMarkerMode 상태 추가
- [ ] AppBar actions에 토글 버튼 추가
- [ ] 토글 버튼 아이콘/툴팁 설정
- [ ] 빌드 및 테스트

---

## 관련 파일

- `lib/presentation/today/widgets/calendar_widget.dart` - 캘린더 위젯
- `lib/presentation/today/page/today_page.dart` - 상위 페이지 (상태 관리)

---

**Created**: 2026-01-06
**Assignee**: 김은향
