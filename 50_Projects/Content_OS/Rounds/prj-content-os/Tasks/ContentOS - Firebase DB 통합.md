---
entity_type: Task
entity_id: "tsk-022-16"
entity_name: "ContentOS - Firebase DB 통합"
created: 2026-01-07
updated: 2026-01-07
status: doing

# === 계층 ===
parent_id: "prj-content-os"
project_id: "prj-content-os"
aliases: ["tsk-022-16"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-07
due: 2026-01-07
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 분류 ===
tags: ["content-os", "firebase", "firestore", "migration", "database"]
priority_flag: high
---

# ContentOS - Firebase DB 통합

> Task ID: `tsk-022-16` | Project: `prj-content-os` | Status: doing

## 목표

**완료 조건**:
1. Firebase Web SDK 초기화 완료
2. 5개 페이지 모두 Firebase Firestore 데이터 사용
3. 더미 데이터 파일 제거
4. React Query 훅으로 캐싱 및 상태 관리
5. CRUD 작업 구현 (Create, Update, Delete)

---

## 상세 내용

### 배경

ContentOS MVP의 4개 대시보드 UI가 완성되었으며, 현재는 더미 데이터로 동작 중입니다. Firebase Firestore를 단일 데이터베이스로 사용하여 모든 UI의 데이터 소스를 통합해야 합니다.

**현재 상황**:
- Firebase 스키마 설계 완료 (`firebase_schema.md`)
- Firestore DB: `loop` (sosi-4a8ee 프로젝트)
- Root Document: `loop/main/` (8개 subcollection)
- 5개 페이지가 모두 로컬 더미 데이터 사용 중

**목표**:
- 모든 UI를 Firebase Firestore 단일 DB로 통일
- 더미 데이터 파일 제거
- React Query로 데이터 캐싱 및 상태 관리

### 작업 내용

**Phase 1: Firebase 설정**
- Firebase Client 초기화 (`lib/firebase/client.ts`)
- Firebase Config 설정 (`lib/firebase/config.ts`)

**Phase 2: Firestore 쿼리 레이어**
- `contentos_contents` 쿼리 (Opportunity, Explorer)
- `vault_tasks` 쿼리 (Pipeline)
- `contentos_publishes` 쿼리 (Retro, Performance)
- `kpi_rollups` 쿼리 (Performance)

**Phase 3: React Query Hooks**
- `useOpportunities()` - Opportunity 페이지
- `useContents()` - Explorer 페이지
- `useTasks()` - Pipeline 페이지
- `usePublishes()` - Retro 페이지
- `useKpiRollups()` - Performance 페이지

**Phase 4: UI 페이지 수정**
- 더미 데이터 import 제거
- Firebase 데이터 사용
- 로딩/에러 상태 처리

**Phase 5: CRUD 작업**
- Create: Opportunity에서 Draft 생성
- Update: Pipeline에서 상태 변경
- Delete: 콘텐츠 제외/삭제

**Phase 6: 마이그레이션**
- 더미 데이터 → Firestore 마이그레이션 스크립트

---

## 체크리스트

- [ ] Firebase Client 초기화 (`lib/firebase/client.ts`)
- [ ] Firestore 쿼리 레이어 구현 (4개 컬렉션)
- [ ] React Query 훅 구현 (5개 페이지)
- [ ] Opportunity 페이지 Firebase 연동
- [ ] Explorer 페이지 Firebase 연동
- [ ] Pipeline 페이지 Firebase 연동
- [ ] Retro 페이지 Firebase 연동
- [ ] Performance 페이지 Firebase 연동
- [ ] CRUD 작업 구현
- [ ] 더미 데이터 파일 제거
- [ ] 마이그레이션 스크립트 작성 및 실행

---

## Notes

### PRD (Product Requirements Document)

## 📊 아키텍처 도식

```
┌─────────────────────────────────────────────────────────────────┐
│           ContentOS Firebase Integration Architecture           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ UI Layer (app/[page]/)                                    │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  ┌─ Opportunity ──→ OpportunityDashboard                 │   │
│  │  │   page.tsx          └─→ useQuery('opportunities')     │   │
│  │  │                                                        │   │
│  │  ├─ Explorer ──→ VideoExplorer                           │   │
│  │  │   page.tsx       └─→ useQuery('contents')             │   │
│  │  │                                                        │   │
│  │  ├─ Pipeline ──→ PipelineBoard                           │   │
│  │  │   page.tsx       └─→ useQuery('tasks')                │   │
│  │  │                                                        │   │
│  │  ├─ Retro ──→ RetroView                                  │   │
│  │  │   page.tsx    └─→ useQuery('publishes')               │   │
│  │  │                                                        │   │
│  │  └─ Performance ──→ PerformanceDashboard                 │   │
│  │      page.tsx         └─→ useQuery('publishes+kpi')      │   │
│  └──────────────────────────────────────────────────────────┘   │
│       │                                                          │
│       ↓                                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Data Layer (lib/api/)                                     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  ┌─ Firebase Client (lib/firebase/client.ts)            │   │
│  │  │   - initializeApp(firebaseConfig)                     │   │
│  │  │   - getFirestore()                                    │   │
│  │  │                                                        │   │
│  │  ├─ API Hooks (lib/api/)                                 │   │
│  │  │   - useOpportunities() ──→ getContents()              │   │
│  │  │   - useContents() ──→ getContents()                   │   │
│  │  │   - useTasks() ──→ getTasks()                         │   │
│  │  │   - usePublishes() ──→ getPublishes()                 │   │
│  │  │   - useKpiRollups() ──→ getKpiRollups()               │   │
│  │  │                                                        │   │
│  │  └─ Firestore Queries (lib/api/firestore/)              │   │
│  │      - getContents(filters) ──→ Firestore                │   │
│  │      - getTasks(projectId) ──→ Firestore                 │   │
│  │      - getPublishes(filters) ──→ Firestore               │   │
│  └──────────────────────────────────────────────────────────┘   │
│       │                                                          │
│       ↓                                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Firebase Firestore                                        │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  loop/{rootId}/                                           │   │
│  │   ├─ contentos_contents (Opportunity, Explorer)          │   │
│  │   ├─ vault_tasks (Pipeline)                              │   │
│  │   ├─ contentos_publishes (Retro, Performance)            │   │
│  │   └─ kpi_rollups (Performance)                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 📋 프로젝트 컨텍스트

- **Framework**: Next.js 16.1.1 (App Router) + React 19.2.3
- **Language**: TypeScript 5
- **State Management**: TanStack React Query 5
- **UI**: ShadCN UI (Radix UI), Tailwind CSS 4
- **Charts**: Recharts 3
- **Drag & Drop**: dnd-kit
- **Database**: Firebase Firestore (`loop`, sosi-4a8ee)
- **Root**: `loop/main/` (8 subcollections)

## 🎯 구현 범위

### 파일 구조

```
apps/content-os/
├── lib/
│   ├── firebase/
│   │   ├── client.ts              # Firebase 초기화
│   │   ├── config.ts              # Firebase 설정
│   │   └── admin.ts               # Firebase Admin (서버용)
│   ├── api/
│   │   ├── firestore/
│   │   │   ├── contents.ts        # contentos_contents 쿼리
│   │   │   ├── tasks.ts           # vault_tasks 쿼리
│   │   │   ├── publishes.ts       # contentos_publishes 쿼리
│   │   │   └── kpi.ts             # kpi_rollups 쿼리
│   │   └── hooks/
│   │       ├── useOpportunities.ts
│   │       ├── useContents.ts
│   │       ├── useTasks.ts
│   │       ├── usePublishes.ts
│   │       └── useKpiRollups.ts
│   ├── types/
│   │   └── firestore.ts           # Firestore 타입 정의
│   └── data/
│       └── (삭제: opportunity-data.ts 등)
├── scripts/
│   ├── migrate-to-firestore.ts    # 더미 → Firestore 마이그레이션
│   └── seed-firestore.ts          # Firestore 초기 데이터
└── app/
    ├── opportunity/page.tsx       # useOpportunities()
    ├── explorer/page.tsx          # useContents()
    ├── pipeline/page.tsx          # useTasks()
    ├── retro/page.tsx             # usePublishes()
    └── performance/page.tsx       # usePublishes() + useKpiRollups()
```

## 📝 Tech Spec

### Phase 1: Firebase 설정

#### lib/firebase/client.ts
```typescript
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
```

#### lib/firebase/config.ts
```typescript
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: 'sosi-4a8ee',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const FIRESTORE_ROOT = 'loop/main';
```

### Phase 2: Firestore 쿼리 레이어

#### lib/api/firestore/contents.ts
```typescript
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, FIRESTORE_ROOT } from '@/lib/firebase/client';

export async function getContents(filters?: {
  status?: string;
  limit?: number;
  orderBy?: 'finalScore' | 'createdAt';
}) {
  const contentsRef = collection(db, FIRESTORE_ROOT, 'contentos_contents');

  let q = query(contentsRef);

  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }

  const orderField = filters?.orderBy || 'finalScore';
  q = query(q, orderBy(orderField, 'desc'));

  if (filters?.limit) {
    q = query(q, limit(filters.limit));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

### Phase 3: React Query Hooks

#### lib/api/hooks/useOpportunities.ts
```typescript
import { useQuery } from '@tanstack/react-query';
import { getContents } from '../firestore/contents';

export function useOpportunities() {
  return useQuery({
    queryKey: ['opportunities'],
    queryFn: () => getContents({
      status: 'candidate',
      orderBy: 'finalScore',
      limit: 50
    }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
```

### Phase 4: UI 페이지 수정

#### app/opportunity/page.tsx
```typescript
// ❌ Before
import { getOpportunityData } from '@/lib/data/opportunity-data';
const opportunities = getOpportunityData();

// ✅ After
import { useOpportunities } from '@/lib/api/hooks/useOpportunities';

const { data: opportunities, isLoading, error } = useOpportunities();

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
```

## ✅ 성공 기준

- [ ] Firebase Web SDK 초기화 완료
- [ ] 4개 Firestore 쿼리 레이어 구현
- [ ] 5개 React Query 훅 구현
- [ ] 5개 페이지 모두 Firebase 데이터 사용
- [ ] 더미 데이터 파일 5개 제거
- [ ] CRUD 작업 구현
- [ ] React Query 캐싱 동작 확인
- [ ] 마이그레이션 스크립트 실행 성공
- [ ] TypeScript 타입 안정성
- [ ] 기존 UI/UX 동작 유지

## 🔍 확인 사항

- Firebase 환경 변수 설정 필요 (`.env.local`)
- Firestore Rules 배포 완료 확인
- Firestore Indexes 배포 완료 확인
- 마이그레이션 스크립트 실행 타이밍
- 더미 데이터 파일 삭제 시점

### Todo
- [x] Firebase SDK 설치 (`firebase`, `@tanstack/react-query`)
- [x] 환경 변수 설정 (`.env.local`)
- [x] Firebase Client 초기화
- [x] Firestore 쿼리 함수 4개 작성
- [x] React Query 훅 5개 작성
- [x] Opportunity 페이지 수정
- [ ] Explorer 페이지 수정
- [ ] Pipeline 페이지 수정
- [ ] Retro 페이지 수정
- [ ] Performance 페이지 수정
- [ ] CRUD 작업 구현
- [ ] 마이그레이션 스크립트 작성
- [ ] 더미 데이터 파일 삭제

### 작업 로그

**2026-01-07 - Phase 1-6 Complete (Opportunity Page)**

**Implemented:**
1. Firebase SDK Setup
   - `lib/firebase/client.ts` - Singleton Firebase app + Firestore instance
   - `lib/firebase/config.ts` - All config from env vars (NO hardcoded values)
   - `lib/firebase/serializer.ts` - Timestamp→ISO, handles GeoPoint/nested/undefined

2. QueryClientProvider
   - Updated `components/providers/query-provider.tsx`
   - Retry: 3, staleTime: 5min, gcTime: 10min
   - Added ReactQueryDevtools

3. Firestore Query Layer (4 collections)
   - `lib/api/firestore/contents.ts` - getDocs + onSnapshot
   - `lib/api/firestore/tasks.ts` - getDocs + onSnapshot
   - `lib/api/firestore/publishes.ts` - getDocs + onSnapshot
   - `lib/api/firestore/kpi.ts` - getDocs + onSnapshot

4. React Query Hooks (5 hooks with real-time)
   - `lib/api/hooks/useOpportunities.ts`
   - `lib/api/hooks/useContents.ts`
   - `lib/api/hooks/useTasks.ts`
   - `lib/api/hooks/usePublishes.ts`
   - `lib/api/hooks/useKpiRollups.ts`
   - Pattern: queryFn (getDocs) + useEffect (onSnapshot + setQueryData)
   - Memoized filters to prevent duplicate listeners

5. Error Handling Components
   - `components/firebase/loading-spinner.tsx`
   - `components/firebase/error-message.tsx` - Handles permission/index/network errors

6. Page Conversion
   - `app/opportunity/page.tsx` - Added 'use client' + dynamic='force-dynamic'
   - `components/opportunity/opportunity-dashboard.tsx` - useOpportunities hook
   - Loading/error states implemented

**Codex Review Fixes Applied:**
1. Error propagation: Use queryCache.find().setState() instead of throwing in setQueryData
2. useMemo → useEffect: Fixed setState during render warning
3. State preservation: Merge Firebase data with local isFavorite/isExcluded flags
4. All 5 hooks updated with proper error handling

**Remaining Work:**
- Convert 4 remaining pages (Explorer, Pipeline, Retro, Performance)
- Implement CRUD operations
- Migration script
- Remove dummy data files after verification

---

## 참고 문서

- [[prj-content-os]] - 소속 Project
- [[firebase_schema.md]] - Firebase Firestore 스키마
- [[Content OS - Firebase 스키마 설계]] - 선행 Task

---

**Created**: 2026-01-07
**Assignee**: 김은향
**Due**: 2026-01-07
