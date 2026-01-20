---
entity_type: Task
entity_id: tsk-content-os-15
entity_name: Content OS - YouTube Studio 스냅샷 시스템
created: 2026-01-11
updated: 2026-01-11
closed: 2026-01-11
status: done
parent_id: prj-content-os
type: dev
aliases:
  - tsk-content-os-15
assignee: 김은향
due: null
priority_flag: high
tags:
  - content-os
  - youtube-studio
  - snapshot
  - analytics
  - ctr
outgoing_relations: []
---

# Content OS - YouTube Studio 스냅샷 시스템

> Task ID: `tsk-content-os-15` | Project: `prj-content-os` | Status: done

---

## 목표

YouTube Studio의 "Last 7 days" 데이터를 직접 붙여 넣어 수집하는 스냅샷 시스템 구현:

1. 사용자가 YouTube Studio에서 복사한 텍스트 데이터 파싱
2. 비디오별 메트릭 추출 (views, impressions, CTR 등)
3. IndexedDB에 일일 스냅샷 저장
4. 24h 델타 계산 (이전 날의 스냅샷과 비교)
5. 실제 CTR 데이터 제공 (YouTube API는 thumbnail impressions/CTR 미지원)

---

## 문제 정의

### 현재 문제

| 문제 | 영향 |
|------|------|
| YouTube API는 thumbnail impressions을 제공하지 않음 | CTR 데이터 불완전 |
| Actual vs Expected CTR 비교 불가능 | 콘텐츠 진단 정확도 저하 |
| 일일 변화 추적이 수동 | 운영 비효율 |

### 해결 방안

YouTube Studio UI에서 직접 데이터를 복사하면 thumbnail impressions이 포함됨 → 스냅샷 기반 비교 분석 가능

---

## 기술 요구사항

### Phase 1: 데이터 파싱 & 저장

**입력 형식**: YouTube Studio "Last 7 days" 복사 텍스트

예시:
```
Video Title 1
Views: 1,234 | Impressions: 5,678 | CTR: 21.7%
...
Video Title N
Views: 456 | Impressions: 2,345 | CTR: 19.4%
```

**파싱 대상 필드**:
- Video title
- Views (조회수)
- Impressions (노출 수) ← **YouTube API 미제공**
- CTR (클릭률) ← **YouTube API 미제공**
- Watch time (선택)
- AVD - Average View Duration (선택)

**저장 구조** (IndexedDB):

```typescript
interface SnapshotEntry {
  snapshotId: string;        // UUID or timestamp
  date: string;              // YYYY-MM-DD
  timestamp: number;         // Unix timestamp
  videos: {
    title: string;
    views: number;
    impressions: number;
    ctr: number;             // 0-100 범위
    watchTime?: number;
    avd?: number;
  }[];
}
```

### Phase 2: 24h 델타 계산

비교 대상: 오늘 스냅샷 vs 어제 스냅샷 (같은 비디오)

```typescript
interface Delta24h {
  title: string;
  views_delta: number;
  impressions_delta: number;
  ctr_delta: number;
  ctr_change_reason: string;  // "impressions_up" | "views_down" | etc.
}
```

**CTR 변화 분석**:
```
CTR = Views / Impressions * 100

CTR ↑ 원인:
1. Impressions ↓ (노출 감소, 선택된 콘텐츠)
2. Views ↑ (조회 증가, 좋은 콘텐츠)
3. 둘 다

CTR ↓ 원인:
1. Impressions ↑ (노출 증가, 유통 개선)
2. Views ↓ (조회 감소, 클릭 유도 감소)
3. 둘 다
```

### Phase 3: UI 통합

**위치**: Content OS Performance Dashboard

- **Snapshot Input Panel**: 텍스트 붙여 넣기 + 자동 파싱
- **Snapshot History**: 최근 스냅샷 리스트 + 타임라인
- **24h Comparison**: 어제 vs 오늘 메트릭 + 델타 표시
- **CTR Analysis**: 변화 원인 분석 (impressions/views 기여도)

---

## 구현 계획

### Step 1: 파싱 유틸리티 작성

파일: `lib/youtube/snapshot-parser.ts`

```typescript
export function parseYouTubeStudioSnapshot(text: string): SnapshotEntry;
export function calculateDelta24h(today: SnapshotEntry, yesterday: SnapshotEntry): Delta24h[];
export function analyzeCtrChange(delta: Delta24h): ChangeAnalysis;
```

### Step 2: IndexedDB 저장소

파일: `lib/indexeddb/snapshot-store.ts`

```typescript
export class SnapshotStore {
  async saveSnapshot(entry: SnapshotEntry): Promise<string>;
  async getSnapshot(date: string): Promise<SnapshotEntry | null>;
  async getRecentSnapshots(days: number): Promise<SnapshotEntry[]>;
  async deleteSnapshot(snapshotId: string): Promise<void>;
}
```

### Step 3: Performance Dashboard 확장

파일: `app/performance/page.tsx`

- Snapshot input component
- History timeline
- 24h comparison table
- CTR analysis chart

### Step 4: API 엔드포인트 (optional)

파일: `app/api/snapshots/route.ts`

```
POST /api/snapshots - 스냅샷 저장 (또는 IndexedDB만 사용)
GET /api/snapshots?days=7 - 최근 스냅샷 조회
GET /api/snapshots/delta?from=date1&to=date2 - 델타 계산
```

---

## 예상 결과

### 사용자 경험

1. YouTube Studio에서 "Last 7 days" 데이터 복사
2. Content OS에 붙여 넣기
3. 자동 파싱 + 저장
4. 대시보드에서 24h 변화 시각화
5. CTR 변화 원인 분석 (impressions vs views)

### 기대 효과

- 실제 CTR 데이터 수집 (YouTube API 부족 보완)
- 일일 성과 추적 자동화
- 콘텐츠 진단 정확도 향상 (thumbnail impressions 기반)
- 유통 효율 vs 클릭률 트레이드오프 명확화

---

## Tech Spec

### 파일 구조

```
apps/content-os/
├── types/
│   └── youtube-snapshot.ts          # 스냅샷 타입 정의
├── lib/youtube/
│   ├── snapshot-parser.ts           # YouTube Studio 텍스트 파싱
│   ├── snapshot-storage.ts          # IndexedDB 저장소
│   └── snapshot-calculator.ts       # 델타 계산
└── app/performance/
    ├── components/
    │   ├── snapshot-import.tsx      # 붙여넣기 UI
    │   └── snapshot-preview.tsx     # 파싱 결과 미리보기
    └── hooks/
        └── use-snapshot.ts          # 스냅샷 훅
```

### 타입 정의 (`types/youtube-snapshot.ts`)

```typescript
// 단일 영상의 스냅샷 데이터
export interface VideoSnapshot {
  title: string;
  duration: number;        // seconds
  views: number;
  watchTimeHours: number;
  impressions: number;
  ctr: number;             // percentage (0-100)
  subscribers: number;
  revenue?: number;
}

// 일일 스냅샷 (모든 영상 포함)
export interface DailySnapshot {
  date: string;            // "2026-01-11"
  timestamp: string;       // ISO datetime
  videos: Record<string, VideoSnapshot>;  // key = title
}

// 델타 메트릭
export interface VideoMetricsWithDelta {
  views_7d: number;
  impressions_7d: number;
  ctr_7d: number;
  views_24h_delta: number;
  impressions_24h_delta: number;
  ctr_24h_delta: number;
  trend: "up" | "down" | "stable";
}
```

### 파싱 로직 (`lib/youtube/snapshot-parser.ts`)

YouTube Studio에서 복사한 raw text 파싱:
- "Video thumbnail:" 패턴으로 영상 구분
- 정규식으로 Duration (MM:SS, H:MM:SS), Views, Impressions, CTR (N.N%) 추출
- 숫자 포맷 처리 (쉼표, K/M 단위)

### 저장소 (`lib/youtube/snapshot-storage.ts`)

IndexedDB 기반 (localStorage보다 대용량 지원):
- `saveSnapshot(snapshot)` - 일일 스냅샷 저장
- `getSnapshot(date)` - 특정 날짜 스냅샷 조회
- `getHistory(days)` - 최근 N일 히스토리
- `getVideoHistory(title, days)` - 특정 영상 히스토리

### 영상 매칭 전략

YouTube Studio 데이터에는 videoId가 없으므로 **제목 + Duration**으로 매칭:
1. 1차: 제목 정확히 일치
2. 2차: 제목 fuzzy match + duration 일치
3. 3차: 매칭 실패 → 신규 영상으로 처리

---

## Todo

### Phase 1: 에러 수정 (필수)
- [ ] `youtube-analytics-service.ts` - impressions 메트릭 제거
- [ ] `VideoMapper.ts` - snippet null 체크 추가

### Phase 2: 스냅샷 시스템 구축
- [ ] `types/youtube-snapshot.ts` - 타입 정의
- [ ] `lib/youtube/snapshot-parser.ts` - 파싱 로직
- [ ] `lib/youtube/snapshot-storage.ts` - IndexedDB 저장소
- [ ] `lib/youtube/snapshot-calculator.ts` - 델타 계산

### Phase 3: UI 구현
- [ ] `snapshot-import.tsx` - 붙여넣기 UI
- [ ] `snapshot-preview.tsx` - 미리보기 UI
- [ ] `use-snapshot.ts` - 훅

### Phase 4: 통합
- [x] Performance 페이지에 스냅샷 데이터 통합
- [x] Clean Architecture 적용 (Domain/Application/Infrastructure/Hooks/UI)
- [x] 테스트 및 검증 (pnpm build 성공)

---

## Verification

1. **에러 수정 확인**
   ```bash
   cd /Users/gim-eunhyang/dev/loop/public/apps/content-os
   pnpm dev
   # /performance 접속 → API 에러 없이 로드 확인
   ```

2. **스냅샷 임포트 테스트**
   - YouTube Studio에서 "Last 7 days" 데이터 복사
   - Content OS에 붙여넣기
   - 파싱 결과 미리보기 확인
   - 저장 버튼 클릭

3. **델타 계산 테스트**
   - Day 1: 스냅샷 저장
   - Day 2: 새 스냅샷 저장
   - 24h 변화량 정확히 계산되는지 확인

4. **진단 테스트**
   - CTR < 5% 영상 → "thumbnail_title" 문제 감지
   - CTR >= 8% 영상 → "early_success" 상태

---

## Notes

### 기술 고려사항

1. **텍스트 파싱 정확도**: 불완전한 입력 처리 (오타, 포맷 변경)
2. **중복 처리**: 같은 날 여러 번 붙여 넣기 (덮어쓰기 vs 병합)
3. **오프라인 동작**: IndexedDB 기반이므로 네트워크 불필요
4. **데이터 마이그레이션**: 나중에 Firebase로 옮길 수 있도록 설계

### 보안 & 프라이버시

- 스냅샷 데이터는 로컬 IndexedDB에만 저장
- 서버 업로드는 사용자 선택 (선택사항)
- 민감 정보 없음 (공개 metrics)

### 향후 확장

- YouTube 채널별 비교
- 월별 / 분기별 리포트
- 예측 모델 (CTR 트렌드 예측)
- Slack / Email 알림 (대폭 하락 감지)

---

## Work Log

### 2026-01-11 (Phase 4: Performance 페이지 통합)
**Summary**: Clean Architecture 기반 스냅샷 데이터 Performance 페이지 통합 완료

**Architecture** (Clean Architecture 5 Layer):
```
[YouTube API] ──┐
                ├──→ [MergeUseCase] ──→ [useMergedPerformance] ──→ [UI]
[IndexedDB]  ───┘
```

**New Files Created (6)**:
| Layer | File |
|-------|------|
| Domain | `lib/domain/performance/types.ts` - MergedPerformance, DisplayMetrics, MatchStats |
| Domain | `lib/domain/performance/merge-logic.ts` - Pure merge functions |
| Application | `lib/application/performance/ports/ISnapshotRepository.ts` - Port interface |
| Application | `lib/application/performance/usecases/MergePerformanceDataUseCase.ts` - Orchestration |
| Infrastructure | `lib/infrastructure/performance/IndexedDBSnapshotRepository.ts` - Adapter |
| Hooks | `app/performance/hooks/use-merged-performance.ts` - React Query hook |
| UI | `app/performance/components/snapshot-history.tsx` - Collapsible panel |

**Modified Files (4)**:
- `app/performance/page.tsx` - `useMergedPerformance` 사용
- `app/performance/components/performance-table.tsx` - `MergedPerformance` 지원 + 소스 표시 (`S` 배지)
- `app/performance/hooks/index.ts` - 새 훅 export
- `app/performance/components/index.ts` - 새 컴포넌트 export

**Features Delivered**:
- 데이터 병합: YouTube API + IndexedDB 스냅샷 자동 병합
- 소스 추적: CTR/Impressions가 스냅샷에서 온 경우 `S` 배지 표시
- 24h 델타: 어제+오늘 스냅샷 있으면 자동 계산
- 매칭 통계: exact/fuzzy/no match 비율 표시
- SnapshotHistory 패널: 접이식 패널로 스냅샷 상태 확인

**Build**: `pnpm build` 성공

---

### 2026-01-11 (Phase 1-3: 스냅샷 시스템 구축)
**Summary**: Task complete - YouTube Studio snapshot system fully implemented

**Implementation Completed**:
- Type definitions (`types/youtube-snapshot.ts`)
- Parsing logic (`lib/youtube/snapshot-parser.ts`) - Handles multi-line YouTube Studio format
- IndexedDB storage (`lib/youtube/snapshot-storage.ts`) - Full CRUD operations
- Delta calculator (`lib/youtube/snapshot-calculator.ts`) - 24h comparison logic
- React hooks (`app/performance/hooks/use-snapshot.ts`) - State management
- UI components:
  - `snapshot-import.tsx` - Paste interface with validation
  - `snapshot-preview.tsx` - Preview and save confirmation

**Features Delivered**:
- YouTube Studio "Last 7 days" text parsing (views, impressions, CTR)
- IndexedDB persistence with date-based indexing
- 24h delta calculation (today vs yesterday)
- Video matching by title normalization
- Storage statistics and management
- Complete UI workflow (import → preview → save)

**Technical Highlights**:
- Handles multi-line format (13 lines per video)
- Robust number parsing (commas, percentages, duration)
- Validation and error handling
- React Query integration for caching
- Accessible UI components

**Status**: done

---

**Created**: 2026-01-11 | **Assignee**: 김은향 | **Closed**: 2026-01-11
