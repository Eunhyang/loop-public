---
entity_type: Task
entity_id: "tsk-content-os-07"
entity_name: "Content OS - Video Explorer Live Search"
created: 2026-01-02
updated: 2026-01-02
status: doing

# === 계층 ===
parent_id: "prj-content-os"
project_id: "prj-content-os"
aliases: ["tsk-content-os-07"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-02
due: null
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-a"]

# === 분류 ===
tags: ["content-os", "ui", "video-explorer", "live-search", "search-history"]
priority_flag: high
---

# Content OS - Video Explorer Live Search

> Task ID: `tsk-content-os-07` | Project: `prj-content-os` | Status: doing

## 목표

**완료 조건**:
1. Live Search: 키워드 입력 시 즉시 영상 리스트를 가져와 테이블에 표시
2. Search History: 검색 세션 자동 저장, "검색 내역"에서 재로드/삭제 가능
3. Collect: 선택한 영상을 "수집한 영상(내 자산)"으로 고정 저장
4. Remove: 영상 제거/채널 제거를 통해 결과 정리 (향후 검색에서 기본 숨김)
5. Bundle Task 생성 연결: 선택된 영상 → "번들 태스크 생성" 파이프라인

---

## 상세 내용

### 배경

현재 Video Explorer는 "수집된 DB 탐색"을 전제로 하지만, MVP 단계에서는 더미 데이터만 존재하고 키워드 기반 실시간 탐색/수집 흐름이 없다. 팀은 실제 기획 흐름에서 "키워드 검색 → 괜찮은 레퍼런스 고르기 → 수집 → 번들 태스크 생성"을 빠르게 하고 싶다.

### 작업 내용

1. **Live Search 구현**
   - 검색 입력창 + 검색 버튼
   - 키워드 입력 시 즉시 결과 테이블 표시
   - Search Session 자동 생성/업데이트

2. **Search History 기능**
   - "검색 내역" 드롭다운
   - 항목: 검색어, n회 검색, 마지막 검색 시각
   - 액션: 재로드, 삭제(soft-delete)

3. **테이블 컬럼 (용어 유지)**
   | 컬럼 | 설명 |
   |------|------|
   | 선택 | 체크박스 |
   | 썸네일 | 영상 길이 포함 |
   | 제목 | 클릭 시 YouTube 링크 |
   | 조회수 | 포맷된 숫자 |
   | 구독자 | 채널명 + 구독자 수 |
   | 기여도 | contribution_score_v1 |
   | 성과도 | impact_proxy_score_v1 |
   | 노출확률 | exposure_grade_v1 (Great/Good/Normal/Bad) |
   | 게시일 | YYYY-MM-DD |

4. **액션 버튼**
   - `영상 수집` → Collected로 저장
   - `영상 제거` → Blocked로 저장
   - `채널 제거` → 채널을 Blocked로 저장
   - `번들 태스크 생성` → 선택 항목 기반

---

## 체크리스트

- [ ] Live Search UI (검색창 + 결과 테이블)
- [ ] Search Session 자동 생성/업데이트
- [ ] Search History 드롭다운 (재로드/삭제)
- [ ] 테이블 컬럼 (기여도/성과도/노출확률 포함)
- [ ] 체크박스 다중 선택
- [ ] 영상 수집 기능
- [ ] 영상/채널 제거 기능
- [ ] 번들 태스크 생성 연결

---

## Notes

### PRD (Product Requirements Document)
<!-- prompt-enhancer로 자동 생성 예정 -->

### Tech Spec
<!-- prompt-enhancer로 자동 생성 예정 -->

### Todo
- [ ]
- [ ]
- [ ]

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)

#### YYYY-MM-DD HH:MM
**개요**: 2-3문장 요약

**변경사항**:
- 개발:
- 수정:
- 개선:

**핵심 코드**: (필요시)

**결과**: ✅ 빌드 성공 / ❌ 실패

**다음 단계**:
-->


---

## 참고 문서

- [[prj-content-os]] - 소속 Project
- [[tsk-content-os-03]] - 기존 Video Explorer UI Task

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**:
