---
entity_type: Task
entity_id: "tsk-022-20"
entity_name: "Dashboard v2 - 프로젝트 초기화"
created: 2026-01-07
updated: 2026-01-07
status: doing

# === 계층 ===
parent_id: "prj-023"
project_id: "prj-023"
aliases: ["tsk-022-20", "Dashboard v2 - 프로젝트 초기화"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-07
due: 2026-01-07
priority: high
estimated_hours: 4
actual_hours: null

# === Task 유형 ===
type: dev
target_project: loop

# === 분류 ===
tags: ["dev", "dashboard", "react", "typescript", "setup"]
priority_flag: high
---

# Dashboard v2 - 프로젝트 초기화

> Task ID: `tsk-022-20` | Project: [[prj-023]] | Status: doing

## 📊 아키텍처 도식

```
┌─────────────────────────────────────────────────────────────────┐
│           Dashboard v2 - React+TS 프로젝트 구조                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Pages Layer (routes/)                                     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  /kanban ──→ Kanban Page                                 │   │
│  │  /projects/:id ──→ Project Detail Page                    │   │
│  │  /pending ──→ Pending Review Page                        │   │
│  │  /calendar ──→ Calendar Page (lazy)                       │   │
│  │  /graph ──→ Graph Page (lazy)                            │   │
│  │  /program ──→ Program Admin Page                         │   │
│  │  /login ──→ Login Page                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│       │                                                          │
│       ↓                                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Features Layer (features/)                                │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  tasks/ ──→ Task CRUD + components                        │   │
│  │  projects/ ──→ Project CRUD + components                  │   │
│  │  pending/ ──→ Pending review logic                        │   │
│  │  strategy/ ──→ Tracks/Conditions/Hypotheses              │   │
│  │  auth/ ──→ Login/JWT management                           │   │
│  │  attachments/ ──→ File upload/preview                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│       │                                                          │
│       ↓                                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Data Layer (queries/ + services/)                         │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  queries/                                                 │   │
│  │    ├── keys.ts (queryKey 상수)                            │   │
│  │    ├── useDashboardInit.ts ──→ React Query hook          │   │
│  │    ├── useTasks.ts                                        │   │
│  │    └── useProjects.ts                                     │   │
│  │        │                                                   │   │
│  │        ↓                                                   │   │
│  │  services/                                                │   │
│  │    ├── http.ts (baseURL, auth, error handling)           │   │
│  │    └── api.ts (endpoint functions)                        │   │
│  │            │                                               │   │
│  │            ↓                                               │   │
│  │      /api/dashboard-init                                  │   │
│  │      /api/tasks, /api/projects, /api/pending             │   │
│  └──────────────────────────────────────────────────────────┘   │
│       │                                                          │
│       ↓                                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ UI Components (components/)                               │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  layout/ ──→ Sidebar, Header, Shell                       │   │
│  │  ui/ ──→ Button, Modal, Select, Badge (순수 컴포넌트)     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 프로젝트 컨텍스트

### 현재 문제점 (v1)
- **위치**: `public/_dashboard/`
- **기술**: 바닐라 HTML + JS (47KB index.html, 35KB state.js)
- **문제**:
  - 한 페이지에 모든 기능 혼재 (Kanban+Calendar+Graph+Pending+Admin)
  - state.js 폭발 (서버 데이터+정규화+UI 상태+렌더 모두 섞임)
  - pending-panel.js 82KB, task-panel.js 59KB 비대화
  - 초기 로딩 62초 (cold cache)

### 목표 (v2)
- **위치**: `public/dashboard-v2/` (새 폴더, 기존과 병행 운영)
- **기술**: React + TypeScript + Vite
- **철학**:
  - **서버 상태**: React Query (캐시)
  - **정규화**: utils/ (순수 함수)
  - **UI 상태**: 페이지 local state 또는 URL params
  - **페이지 경계**: 라우트로 명확히 분리

---

## 🎯 구현 범위

### 주요 기능
1. ✅ Vite + React + TypeScript 프로젝트 스캐폴드
2. ✅ React Router 설정 (7개 라우트)
3. ✅ React Query 설정 (서버 상태 관리)
4. ✅ 폴더 구조 생성 (features/ + queries/ + types/)
5. ✅ API 클라이언트 기본 설정 (services/http.ts + api.ts)
6. ✅ 공통 컴포넌트 기초 (Layout, Button, Modal)
7. ✅ 기존 _dashboard/와 공존 가능한 빌드 설정

### 권장 폴더 구조 (v2)

```
public/dashboard-v2/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── src/
│   ├── main.tsx                 # 🔥 React Query / Router / AuthProvider 감싸기
│   ├── App.tsx                  # 🔥 Layout + Routes
│   ├── routes/                  # 🔥 라우트 정의 (페이지 경계의 SSOT)
│   │   └── index.tsx
│   ├── pages/                   # 페이지 컴포넌트 (라우트 단위)
│   │   ├── Kanban/
│   │   ├── Project/
│   │   ├── Pending/
│   │   ├── Calendar/            # lazy load
│   │   ├── Graph/               # lazy load
│   │   ├── Program/
│   │   └── Login/
│   ├── features/                # 🔥 도메인 단위 모듈 (강추)
│   │   ├── tasks/
│   │   ├── projects/
│   │   ├── pending/
│   │   ├── strategy/            # tracks/conditions/hypotheses
│   │   ├── auth/
│   │   └── attachments/
│   ├── components/              # 재사용 UI 컴포넌트 (순수)
│   │   ├── layout/              # Sidebar/Header/Shell
│   │   └── ui/                  # Button/Modal/Select/Badge 등
│   ├── services/                # 🔥 API 클라이언트
│   │   ├── http.ts              # baseURL, auth header, error handling
│   │   └── api.ts               # endpoint functions
│   ├── hooks/                   # 공용 hooks
│   │   ├── useDebounce.ts
│   │   └── useHotkeys.ts
│   ├── queries/                 # 🔥 react-query queryKey + hooks (강추)
│   │   ├── keys.ts
│   │   ├── useDashboardInit.ts
│   │   ├── useTasks.ts
│   │   ├── useProjects.ts
│   │   └── usePendingReviews.ts
│   ├── types/                   # 🔥 TS 타입 (서버 DTO)
│   │   ├── task.ts
│   │   ├── project.ts
│   │   ├── pending.ts
│   │   └── strategy.ts
│   ├── utils/                   # pure functions (정규화 로직 여기로)
│   │   ├── normalize.ts
│   │   └── date.ts
│   └── styles/                  # 전역 스타일
│       └── globals.css
└── public/
```

---

## 📝 상세 요구사항

### 1. 프로젝트 초기화 (Vite + React + TS)

**목적**: 프로젝트 스캐폴드 생성

**구현 내용**:
```bash
cd /Users/gim-eunhyang/dev/loop/public
npm create vite@latest dashboard-v2 -- --template react-ts
cd dashboard-v2
npm install
```

**dependencies**:
```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.22.0",
    "@tanstack/react-query": "^5.20.0",
    "@tanstack/react-query-devtools": "^5.20.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "eslint": "^8.0.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

---

### 2. 폴더 구조 생성

**목적**: 권장 구조대로 폴더 생성

**구현 내용**:
```bash
mkdir -p src/{routes,pages/{Kanban,Project,Pending,Calendar,Graph,Program,Login},features/{tasks,projects,pending,strategy,auth,attachments},components/{layout,ui},services,hooks,queries,types,utils,styles}
```

**폴더별 역할**:
- `routes/`: 라우트 정의 (페이지 경계의 SSOT)
- `pages/`: 각 라우트의 페이지 컴포넌트
- `features/`: 도메인별 모듈 (CRUD + 컴포넌트)
- `components/`: 재사용 UI (순수 컴포넌트)
- `services/`: API 클라이언트
- `queries/`: React Query hooks
- `types/`: TypeScript 타입 정의
- `utils/`: 순수 함수 (정규화 로직)

---

### 3. React Router 설정

**파일**: `src/routes/index.tsx`

**목적**: 7개 라우트 정의 + lazy loading

**구현 내용**:
```tsx
import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

// Eager load (초기 필수)
import LoginPage from '@/pages/Login';
import KanbanPage from '@/pages/Kanban';
import ProjectPage from '@/pages/Project';
import PendingPage from '@/pages/Pending';
import ProgramPage from '@/pages/Program';

// Lazy load (무거운 페이지)
const CalendarPage = lazy(() => import('@/pages/Calendar'));
const GraphPage = lazy(() => import('@/pages/Graph'));

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/kanban" replace /> },
      { path: 'kanban', element: <KanbanPage /> },
      { path: 'projects/:id', element: <ProjectPage /> },
      { path: 'pending', element: <PendingPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'graph', element: <GraphPage /> },
      { path: 'program', element: <ProgramPage /> },
    ],
  },
]);
```

**중요**: Calendar/Graph는 `lazy()`로 로드해야 초기 번들 크기 유지

---

### 4. React Query 설정

**파일**: `src/main.tsx`

**목적**: 서버 상태 캐시 설정

**구현 내용**:
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

<QueryClientProvider client={queryClient}>
  <RouterProvider router={router} />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

---

### 5. API 클라이언트 설정

**파일**: `src/services/http.ts`

**목적**: baseURL, auth header, 401 처리, 공통 에러 핸들링

**구현 내용**:
```tsx
import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mcp.sosilab.synology.me';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: JWT 토큰 추가
httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('LOOP_API_TOKEN');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: 401 처리
httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // 토큰 만료 → 로그인 페이지로
      localStorage.removeItem('LOOP_API_TOKEN');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

**파일**: `src/services/api.ts`

**목적**: endpoint functions (얇게 유지)

**구현 내용**:
```tsx
import { httpClient } from './http';
import type { DashboardInitResponse, Task, Project } from '@/types';

export const dashboardApi = {
  // 초기 로딩 통합 엔드포인트
  getDashboardInit: () =>
    httpClient.get<DashboardInitResponse>('/api/dashboard-init'),

  // Tasks
  getTasks: (params?: { status?: string; assignee?: string }) =>
    httpClient.get<Task[]>('/api/tasks', { params }),

  // Projects
  getProjects: () =>
    httpClient.get<Project[]>('/api/projects'),

  // Pending
  getPendingReviews: () =>
    httpClient.get('/api/pending'),
};
```

**원칙**:
- `api.ts`는 endpoint 함수만 정의
- 데이터 조합/정규화는 `queries/` 훅에서 처리
- 이렇게 하면 `api.js`가 600줄로 커지지 않음

---

### 6. Query Hooks (핵심)

**파일**: `src/queries/keys.ts`

**목적**: queryKey 상수 관리 (SSOT)

**구현 내용**:
```tsx
export const queryKeys = {
  dashboardInit: ['dashboard', 'init'] as const,
  tasks: (filters?: object) => ['tasks', filters] as const,
  task: (id: string) => ['tasks', id] as const,
  projects: () => ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  pending: () => ['pending'] as const,
};
```

---

**파일**: `src/queries/useDashboardInit.ts`

**목적**: 초기 데이터 로딩 훅 (단일 API 호출)

**구현 내용**:
```tsx
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/api';
import { queryKeys } from './keys';

export const useDashboardInit = () => {
  return useQuery({
    queryKey: queryKeys.dashboardInit,
    queryFn: async () => {
      const { data } = await dashboardApi.getDashboardInit();
      return data;
    },
    staleTime: Infinity, // 초기 로딩 데이터는 새로고침 전까지 유지
  });
};
```

**v1과의 차이**:
- v1: `State.loadAll()` → 12개 API 순차 호출 → 느림
- v2: `useDashboardInit()` → `/api/dashboard-init` 단일 호출 → 빠름
- React Query 캐시로 중복 요청 자동 방지

---

### 7. TypeScript 타입 정의

**파일**: `src/types/task.ts`

**목적**: 서버 DTO 타입 (SSOT)

**구현 내용**:
```tsx
export interface Task {
  entity_id: string;
  entity_name: string;
  project_id: string;
  assignee: string;
  status: 'todo' | 'doing' | 'hold' | 'done' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'dev' | 'bug' | 'strategy' | 'research' | 'ops' | 'meeting' | null;
  start_date: string;
  due: string;
  tags: string[];
  // ... 나머지 필드
}

export interface DashboardInitResponse {
  constants: Record<string, any>;
  members: Member[];
  tracks: Track[];
  conditions: Condition[];
  projects: Project[];
  tasks: Task[];
  pending_badge_count: number;
  user: User;
}
```

**원칙**:
- 서버 응답 형식과 정확히 일치
- `any` 사용 최소화
- 공통 타입은 재사용

---

### 8. 기본 Layout 컴포넌트

**파일**: `src/components/layout/AppLayout.tsx`

**목적**: Sidebar + Header + Main 구조

**구현 내용**:
```tsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export const AppLayout = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
```

---

### 9. Vite 빌드 설정

**파일**: `vite.config.ts`

**목적**: 빌드 산출물 경로 + alias 설정

**구현 내용**:
```tsx
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://mcp.sosilab.synology.me',
        changeOrigin: true,
      },
    },
  },
});
```

**빌드 전략**:
- `dist/` → NAS/웹 서버가 `_dashboard_v2/`로 서빙
- 기존 `_dashboard/`는 유지 (점진적 전환)
- manualChunks로 vendor/query 분리 (캐싱 최적화)

---

## ✅ 성공 기준

- [ ] ✅ `npm create vite` 실행 완료
- [ ] ✅ 권장 폴더 구조 생성 완료
- [ ] ✅ React Router 7개 라우트 설정
- [ ] ✅ React Query 설정 (QueryClientProvider)
- [ ] ✅ API 클라이언트 설정 (http.ts + api.ts)
- [ ] ✅ queryKeys + useDashboardInit 훅 작성
- [ ] ✅ TypeScript 타입 정의 (Task, Project, DashboardInitResponse)
- [ ] ✅ AppLayout 기본 구조 작성
- [ ] ✅ `npm run dev` 실행 → 로컬 3000번 포트 동작
- [ ] ✅ 빌드 설정 (dist/ → _dashboard_v2/ 준비)
- [ ] ✅ 기존 `_dashboard/`와 공존 가능한 독립 실행

---

## 🔍 확인 사항

**질문**:
1. ✅ API 엔드포인트 `/api/dashboard-init`가 이미 존재하나요?
   - 없으면 이 Task 완료 후 별도 백엔드 Task 필요
2. ✅ 스타일링은 어떻게 할까요?
   - Tailwind CSS (추천)
   - CSS Modules
   - styled-components
3. ✅ 로그인 페이지는 바로 구현?
   - 아니면 먼저 Kanban만 구현?

---

## 🚀 배포/연동 계획

### 단계적 전환 전략

**Phase 1 (이번 Task)**:
```
public/
├── _dashboard/          # 기존 (유지)
│   └── index.html
└── dashboard-v2/        # 신규 (병행 운영)
    ├── dist/
    └── src/
```

**Phase 2 (구현 완료 후)**:
```bash
# 빌드
cd public/dashboard-v2
npm run build

# NAS/웹 서버 설정
# _dashboard_v2/ → dist/ 심볼릭 링크 or 복사
```

**Phase 3 (검증 완료 후)**:
```bash
# 기존 _dashboard/ 삭제
rm -rf public/_dashboard/

# dashboard-v2/dist/ → _dashboard/로 rename
mv public/_dashboard_v2 public/_dashboard
```

---

## 체크리스트

### 프로젝트 셋업
- [ ] Vite 프로젝트 생성
- [ ] package.json 의존성 설치
- [ ] 폴더 구조 생성

### 라우터 & 상태 관리
- [ ] React Router 설정
- [ ] React Query 설정
- [ ] API 클라이언트 설정

### 타입 & 훅
- [ ] TypeScript 타입 정의
- [ ] queryKeys 정의
- [ ] useDashboardInit 훅 작성

### 레이아웃 & 스타일
- [ ] AppLayout 컴포넌트
- [ ] Sidebar 기본 구조
- [ ] 전역 스타일 설정

### 빌드 & 배포
- [ ] vite.config.ts 최적화
- [ ] 로컬 개발 서버 동작 확인
- [ ] 빌드 테스트 (npm run build)

---

## Notes

### 구현 완료 (2026-01-07)

**상태**: ✅ 프로젝트 초기화 완료
**위치**: `/Users/gim-eunhyang/dev/loop/public/dashboard-v2/`
**빌드**: 성공 (223.79 kB main, 74.03 kB vendor, 33.67 kB query)

**완료 항목**:
1. ✅ Vite + React 19 + TypeScript 프로젝트 생성
2. ✅ 폴더 구조 생성 (routes/, pages/, features/, components/, services/, queries/, types/, utils/)
3. ✅ React Router 7개 라우트 설정 (lazy loading 포함)
4. ✅ React Query 설정 (staleTime: 5min, gcTime: 10min)
5. ✅ API 클라이언트 설정 (http.ts with JWT interceptors, api.ts with endpoints)
6. ✅ TypeScript 타입 정의 (Task, Project, DashboardInitResponse, APIError)
7. ✅ Query hooks (queryKeys, useDashboardInit)
8. ✅ Layout 컴포넌트 (AppLayout, Sidebar, Header)
9. ✅ Vite 설정 (path alias @/, manualChunks, API proxy)
10. ✅ 환경 변수 설정 (.env.example)

**다음 단계** (Phase 2 - Pending 분리):
- Pending Review 페이지 구현
- Task Drawer 구현
- Kanban 보드 기능 구현

**실행**:
```bash
cd /Users/gim-eunhyang/dev/loop/public/dashboard-v2
npm run dev  # http://localhost:3000
npm run build  # dist/ 생성
```

---

### 핵심 철학 (v1 → v2 변화)

**v1 문제**:
```
State.js (35KB)
├── 서버 데이터 (12개 API 호출)
├── 정규화 로직
├── UI 상태
└── 렌더 로직
→ 모두 섞여서 터짐
```

**v2 해결**:
```
서버 상태 → React Query (queries/)
정규화    → Utils (utils/normalize.ts)
UI 상태   → 페이지 local state or URL params
렌더      → Pages + Features 분리
→ 책임 분리로 유지보수 쉬워짐
```

### Query Hook이 데이터 주체

**v1 방식** (안티패턴):
```js
// api.js에서 데이터 조합 → 600줄로 커짐
export async function loadAll() {
  const tasks = await getTasks();
  const projects = await getProjects();
  return { tasks, projects, normalized: normalize(...) };
}
```

**v2 방식** (권장):
```tsx
// api.ts는 얇게 유지
export const dashboardApi = {
  getTasks: () => httpClient.get<Task[]>('/api/tasks'),
};

// queries/useTasks.ts에서 데이터 조합
export const useTasks = (filters) => {
  return useQuery({
    queryKey: queryKeys.tasks(filters),
    queryFn: async () => {
      const { data } = await dashboardApi.getTasks();
      return normalizeTaskData(data); // 정규화는 utils/에서
    },
  });
};
```

→ `api.ts`는 endpoint 정의만, 로직은 query hook에서 처리

### Lazy Loading 필수

**Calendar/Graph는 무거움** (D3.js, FullCalendar):
```tsx
// ❌ 나쁜 예
import CalendarPage from '@/pages/Calendar'; // 즉시 로드

// ✅ 좋은 예
const CalendarPage = lazy(() => import('@/pages/Calendar')); // 라우트 진입 시에만 로드
```

→ 초기 번들 크기 유지, 성능 향상

---

## 참고 문서

- [[prj-023]] - Dashboard - React+TS 마이그레이션 프로젝트
- [[pgm-vault-system]] - Vault System 프로그램
- 기존 대시보드: `public/_dashboard/`
- React Query Docs: https://tanstack.com/query/latest
- Vite Docs: https://vitejs.dev

---

**Created**: 2026-01-07
**Assignee**: 김은향
**Due**: 2026-01-07
**Priority**: high
