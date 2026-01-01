---
entity_type: Task
entity_id: "tsk-content-os-01"
entity_name: "Content OS - 프로젝트 초기 세팅"
created: 2025-12-31
updated: 2025-12-31
status: doing

# === 계층 ===
parent_id: "prj-content-os"
project_id: "prj-content-os"
aliases: ["tsk-content-os-01"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2025-12-31
due: 2025-12-31
priority: high
estimated_hours: 4
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-a"]

# === 분류 ===
tags: ["content-os", "setup", "infrastructure"]
priority_flag: high
---

# Content OS - 프로젝트 초기 세팅

> Task ID: `tsk-content-os-01` | Project: `prj-content-os` | Status: doing

## 목표

**완료 조건**:
1. Next.js 15 + App Router 프로젝트 생성
2. ShadCN UI + Tailwind CSS 설정
3. 공통 Layout, Navigation 컴포넌트
4. 기본 라우팅 구조 (4개 대시보드)

---

## 상세 내용

### 배경

Content OS MVP의 기반이 되는 프로젝트 구조 세팅. 후속 UI 태스크들이 병렬로 진행될 수 있도록 공통 컴포넌트와 레이아웃을 먼저 구축.

### 작업 내용

1. **프로젝트 초기화**
   - Next.js 15 + TypeScript
   - App Router 사용
   - ESLint + Prettier 설정

2. **UI 프레임워크**
   - ShadCN UI 설치 및 설정
   - Tailwind CSS 커스텀 테마
   - 다크 모드 지원

3. **공통 컴포넌트**
   - Layout (Sidebar + Main)
   - Navigation (4개 대시보드 메뉴)
   - Header (검색/필터 공통)

4. **라우팅 구조**
   ```
   /opportunity     - Opportunity 대시보드
   /explorer        - Video Explorer
   /pipeline        - Task Pipeline
   /retro           - 회고 대시보드
   ```

---

## 체크리스트

- [ ] Next.js 15 프로젝트 생성
- [ ] ShadCN UI 설치
- [ ] Tailwind CSS 테마 설정
- [ ] 공통 Layout 컴포넌트
- [ ] Navigation 컴포넌트
- [ ] 4개 라우트 기본 페이지

---

## Notes

### PRD (Product Requirements Document)

# Content OS - 프로젝트 초기 세팅

> Task ID: `tsk-content-os-01` | Project: `prj-content-os` | Program: `pgm-content-os`

#### 아키텍처 도식

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Content OS - 프로젝트 초기 세팅 Architecture              │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ App Layer (app/)                                                        │ │
│  │  layout.tsx ──→ RootLayout + ThemeProvider + MainLayout                │ │
│  │       └──→ Sidebar (Navigation) + Main Content Area                    │ │
│  │            ├── /opportunity  ← NavLink                                  │ │
│  │            ├── /explorer     ← NavLink                                  │ │
│  │            ├── /pipeline     ← NavLink                                  │ │
│  │            └── /retro        ← NavLink                                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ UI Layer: components/layout/ (main-layout, sidebar, header)            │ │
│  │          components/ui/ (ShadCN: button, input, card, badge, etc.)     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Style Layer: Tailwind CSS + CSS Variables (Dark mode class-based)      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 프로젝트 컨텍스트

| 항목 | 값 |
|------|-----|
| **Framework** | Next.js 15 + TypeScript |
| **Router** | App Router |
| **UI Framework** | ShadCN UI |
| **Styling** | Tailwind CSS (with CSS Variables) |
| **Theme** | Dark mode 지원 (class-based) |
| **Package Manager** | pnpm (권장) |

#### 구현 범위

1. **Next.js 15 App Router 프로젝트 생성** - TypeScript, ESLint + Prettier, pnpm
2. **ShadCN UI + Tailwind CSS 설정** - 커스텀 테마, CSS Variables, 다크 모드
3. **공통 Layout 및 Navigation 컴포넌트** - MainLayout, Sidebar, Header
4. **기본 라우팅 구조 (4개 대시보드)** - /opportunity, /explorer, /pipeline, /retro

#### 파일 구조

```
content-os/
├── app/
│   ├── layout.tsx, page.tsx, globals.css
│   ├── opportunity/page.tsx
│   ├── explorer/page.tsx
│   ├── pipeline/page.tsx
│   └── retro/page.tsx
├── components/
│   ├── layout/ (main-layout.tsx, sidebar.tsx, header.tsx)
│   ├── ui/ (ShadCN 컴포넌트)
│   └── theme-provider.tsx
├── lib/utils.ts
├── tailwind.config.ts, next.config.ts, tsconfig.json
├── .eslintrc.json, .prettierrc, components.json
└── package.json
```

#### 성공 기준

- Next.js 15 프로젝트가 `pnpm dev`로 정상 실행됨
- ShadCN UI 컴포넌트가 정상 렌더링됨
- Tailwind CSS 커스텀 테마가 적용됨
- 다크 모드 토글이 정상 동작함
- Sidebar 네비게이션이 4개 라우트로 정상 이동함
- ESLint + Prettier가 정상 동작함
- TypeScript 타입 에러 없음

---

### Tech Spec

#### 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| Framework | Next.js | 15.x (App Router) |
| Language | TypeScript | 5.x |
| UI Library | ShadCN UI | Latest |
| Styling | Tailwind CSS | 3.4.x |
| Theme | next-themes | 0.3.x |
| Icons | Lucide React | 0.4.x |
| Package Manager | pnpm | 9.x |

#### 프로젝트 생성 명령어

```bash
# 1. 프로젝트 생성
cd ~/dev
pnpm create next-app@latest content-os \
  --typescript --tailwind --eslint --app \
  --src-dir=false --import-alias="@/*" --use-pnpm

cd content-os

# 2. 추가 의존성 설치
pnpm add next-themes lucide-react
pnpm add -D prettier prettier-plugin-tailwindcss

# 3. ShadCN UI 초기화 및 컴포넌트 설치
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input card badge separator sheet
```

#### 주요 설정 파일

- `.eslintrc.json`: next/core-web-vitals + next/typescript
- `.prettierrc`: semi: false, singleQuote: true, prettier-plugin-tailwindcss
- `tailwind.config.ts`: darkMode: ["class"], Content OS 전용 색상 변수
- `components.json`: ShadCN 설정 (rsc: true, cssVariables: true)

#### 핵심 컴포넌트

1. **ThemeProvider** - next-themes 래퍼, class-based dark mode
2. **MainLayout** - Sidebar (240px fixed) + Main content (flex-1)
3. **Sidebar** - 4개 NavLink + 다크모드 토글 + 현재 경로 하이라이트
4. **Header** - 페이지 제목 + 검색 Input + 필터 버튼

---

### Todo

#### Phase 1: 프로젝트 초기화
- [ ] 프로젝트 폴더 위치 확정 (`~/dev/content-os`)
- [ ] Next.js 15 프로젝트 생성
- [ ] 추가 의존성 설치 (next-themes, lucide-react, prettier)
- [ ] ESLint/Prettier 설정

#### Phase 2: ShadCN UI + Tailwind CSS
- [ ] ShadCN UI 초기화
- [ ] 필수 컴포넌트 설치 (button, input, card, badge, separator, sheet)
- [ ] tailwind.config.ts 커스텀 테마
- [ ] globals.css CSS Variables (Light/Dark)

#### Phase 3: 공통 Layout 컴포넌트
- [ ] theme-provider.tsx 생성
- [ ] main-layout.tsx 생성
- [ ] sidebar.tsx 생성 (4개 NavLink + 다크모드 토글)
- [ ] header.tsx 생성 (페이지 제목 + 검색/필터)
- [ ] app/layout.tsx 수정

#### Phase 4: 라우팅 구조
- [ ] app/page.tsx (→ /opportunity redirect)
- [ ] app/opportunity/page.tsx (placeholder)
- [ ] app/explorer/page.tsx (placeholder)
- [ ] app/pipeline/page.tsx (placeholder)
- [ ] app/retro/page.tsx (placeholder)

#### Phase 5: 검증
- [ ] pnpm dev 실행 테스트
- [ ] 4개 라우트 네비게이션 테스트
- [ ] 다크 모드 토글 테스트
- [ ] ESLint/TypeScript 에러 없음 확인

---

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)
-->


---

## 참고 문서

- [[prj-content-os]] - 소속 Project
- [[pgm-content-os]] - 소속 Program

---

**Created**: 2025-12-31
**Assignee**: 김은향
**Due**: 2025-12-31
