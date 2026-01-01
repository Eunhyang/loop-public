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

#### 1. Overview
Video Explorer에 **Live Search**, **Search History**, **Collect/Block** 기능을 추가하여 사용자가 실시간으로 영상을 검색하고, 검색 기록을 관리하며, 유용한 영상을 자산으로 수집할 수 있는 완전한 워크플로우를 구현한다.

#### 2. User Stories

**US-1: Live Search (키워드 검색)**
- As a 콘텐츠 기획자, I want to 검색창에 키워드를 입력하면 즉시 관련 영상을 볼 수 있기를
- Acceptance: 300ms debounce, 로딩 스피너, 빈 결과 메시지

**US-2: Search History (검색 기록)**
- As a 반복 리서치 사용자, I want to 이전 검색 기록을 저장하고 재실행할 수 있기를
- Acceptance: 세션 자동 생성, run_count 증가, 재로드/soft-delete

**US-3: Collect (영상 수집)**
- As a 콘텐츠 기획자, I want to 유용한 영상을 수집함에 저장할 수 있기를
- Acceptance: 다중 선택 수집, "수집됨" 배지, 수집함 탭

**US-4: Block (영상/채널 차단)**
- As a 사용자, I want to 특정 영상이나 채널을 차단할 수 있기를
- Acceptance: 영상/채널 제거, 검색 결과에서 숨김, "차단된 항목 보기" 토글

**US-5: Bundle Task 생성**
- As a 콘텐츠 제작자, I want to 선택한 영상들로 번들 태스크를 생성할 수 있기를
- Acceptance: 선택 영상 기반 번들 생성, 참조 영상 정보 포함

#### 3. 테이블 컬럼 (PRD 용어 유지)
| 컬럼 | 필드 | 설명 |
|------|------|------|
| 선택 | checkbox | 다중 선택용 |
| 썸네일 | thumbnail + duration | 영상 길이 오버레이 |
| 제목 | title | YouTube 링크 (새 탭) |
| 조회수 | views | 1.2M, 456K 포맷 |
| 구독자 | channel.name + subscribers | "채널명 / 구독자수" |
| **기여도** | contributionScore | 0-10 (views/subscribers 비율) |
| **성과도** | impactScore | 0-10 (engagement 기반) |
| **노출확률** | exposureGrade | Great/Good/Normal/Bad 배지 |
| 게시일 | publishedAt | YYYY-MM-DD |
| 액션 | - | 더보기 메뉴 (수집/제거) |

#### 4. 지표 계산 로직 (MVP)
```typescript
// 기여도: views / max(1, subscribers) 로그 정규화 -> 0-10
const contributionScore = Math.min(10, Math.log10(views / Math.max(1, subscribers) + 1) * 2.5);

// 성과도: views + velocity proxy -> 0-10
const impactScore = Math.min(10, Math.log10(views + 1) * 1.5 * 0.7 + velocity / 1000 * 0.3);

// 노출확률: velocity + freshness -> Grade
// velocityScore(0-3) + freshnessScore(0-3) = totalScore
// totalScore >= 5: Great, >= 3: Good, >= 1: Normal, else: Bad
```

### Tech Spec

#### 1. Type Definitions

**확장된 Video 타입:**
```typescript
interface Video {
  // 기존 필드 유지
  id, thumbnail, title, channel, publishedAt, views, velocity, youtubeUrl

  // 신규 필드
  duration: string;              // "4:13" 형식
  contributionScore: number;     // 기여도 0-10
  impactScore: number;           // 성과도 0-10
  exposureGrade: ExposureGrade;  // Great/Good/Normal/Bad
  isCollected?: boolean;
  isBlocked?: boolean;
}

type ExposureGrade = 'Great' | 'Good' | 'Normal' | 'Bad';
```

**Search Session 타입:**
```typescript
interface SearchSession {
  id: string;
  query: string;
  createdAt: string;
  lastRunAt: string;
  runCount: number;
  filtersSnapshot: SearchFiltersSnapshot;
  resultVideoIds: string[];
  pinned: boolean;
  deletedAt: string | null;
}
```

**Collection 타입:**
```typescript
interface CollectedVideo {
  videoId: string;
  collectedAt: string;
  sourceSearchSessionId: string | null;
}

interface BlockedVideo { videoId: string; blockedAt: string; }
interface BlockedChannel { channelId: string; blockedAt: string; }
```

#### 2. Component Architecture
```
app/explorer/
├── page.tsx                    # 탭 관리, 상태 통합
├── components/
│   ├── explorer-tabs.tsx       # 검색/수집함/검색내역 탭
│   ├── search/
│   │   ├── live-search-input.tsx
│   │   ├── search-history-list.tsx
│   │   └── search-panel.tsx
│   ├── badges/
│   │   ├── exposure-grade-badge.tsx
│   │   ├── score-display.tsx
│   │   └── collected-badge.tsx
│   ├── video-table.tsx         # 새 컬럼 추가
│   ├── video-table-row.tsx     # 행 분리 (액션 메뉴)
│   ├── bulk-actions.tsx        # 수집/제거 버튼
│   └── collection/
│       └── collection-list.tsx
├── hooks/
│   ├── use-local-storage.ts
│   ├── use-debounce.ts
│   ├── use-search-history.ts
│   └── use-collection.ts
└── lib/
    └── score-calculator.ts
```

#### 3. 상태 관리 (MVP: useState + localStorage)
- 검색: useState (query, results, isSearching)
- 검색 기록: useLocalStorage('search-sessions')
- 수집/차단: useLocalStorage('collected-videos', 'blocked-*')

### Todo

#### Phase 1: Type & Infrastructure
- [x] `types/video.ts` - Video 타입 확장 (duration, scores, isCollected, isBlocked)
- [x] `types/search.ts` - SearchSession, SearchFiltersSnapshot 정의
- [x] `types/collection.ts` - CollectedVideo, BlockedVideo, BlockedChannel 정의
- [x] `app/explorer/lib/score-calculator.ts` - 점수 계산 함수

#### Phase 2: Hooks & Data
- [x] `app/explorer/hooks/use-local-storage.ts` - localStorage 동기화
- [x] `app/explorer/hooks/use-debounce.ts` - debounce 훅
- [x] `app/explorer/hooks/use-search-history.ts` - 검색 기록 CRUD
- [x] `app/explorer/hooks/use-collection.ts` - 수집/차단 관리
- [x] `app/explorer/data/dummy-videos.ts` - 데이터 확장 (scores, duration)

#### Phase 3: UI Components - Table
- [x] `components/badges/exposure-grade-badge.tsx` - 노출확률 배지
- [x] `components/badges/score-display.tsx` - 점수 표시
- [x] `components/badges/collected-badge.tsx` - 수집됨 배지
- [x] `components/video-table-row.tsx` - 행 분리 + 액션 메뉴
- [x] `components/video-table.tsx` - 새 컬럼 적용

#### Phase 4: UI Components - Search
- [x] `components/search/live-search-input.tsx` - debounced 입력
- [x] `components/search/search-history-item.tsx` - 세션 아이템
- [x] `components/search/search-history-list.tsx` - 세션 목록
- [x] `components/search/search-panel.tsx` - 통합 패널

#### Phase 5: UI Components - Actions & Tabs
- [x] `components/bulk-actions.tsx` - 수집/제거 버튼 추가
- [x] `components/collection/collection-list.tsx` - 수집함 목록
- [x] `components/explorer-tabs.tsx` - 탭 컴포넌트
- [x] `components/video-filters.tsx` - showBlocked 토글 추가

#### Phase 6: Integration
- [x] `app/explorer/page.tsx` - 탭/검색/수집 통합
- [x] 빌드 테스트 및 동작 확인

### 작업 로그

#### 2026-01-02 04:23
**개요**: Video Explorer에 Live Search, Search History, Collect/Block 기능을 구현했습니다. Viewtrap 스타일의 영상 검색 및 수집 워크플로우를 완성했습니다.

**변경사항**:
- 개발:
  - Type 확장: `types/video.ts` (ExposureGrade, ProcessedVideo), `types/search.ts`, `types/collection.ts`
  - 점수 계산: `lib/score-calculator.ts` (기여도/성과도/노출확률)
  - Hooks: `use-local-storage.ts`, `use-debounce.ts`, `use-search-history.ts`, `use-collection.ts`
  - Badge 컴포넌트: `exposure-grade-badge.tsx`, `score-display.tsx`, `collected-badge.tsx`
  - 테이블: `video-table-row.tsx` (액션 메뉴 포함), `video-table.tsx` (새 컬럼)
  - 검색: `live-search-input.tsx`, `search-history-*.tsx`, `search-panel.tsx`
  - 탭: `explorer-tabs.tsx`, `collection-list.tsx`
- 수정:
  - `video-filters.tsx` - showBlocked 토글 추가
  - `bulk-actions.tsx` - 수집/제거 버튼 추가
  - `dummy-videos.ts` - duration 필드 추가
  - `page.tsx` - 전체 통합 (탭, 검색, 수집/차단)
- 추가:
  - `components/ui/tabs.tsx` - ShadCN Tabs 컴포넌트

**파일 변경**: 신규 17개, 수정 6개 (총 23개)

**결과**: ✅ 빌드 성공 (`pnpm build` 통과)

**다음 단계**:
- 한국어 라벨로 변경 (Contrib→기여도, Impact→성과도, Exposure→노출확률)
- YouTube Data API 연동 (Phase 2)


---

## 참고 문서

- [[prj-content-os]] - 소속 Project
- [[tsk-content-os-03]] - 기존 Video Explorer UI Task

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**:
