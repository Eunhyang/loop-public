---
entity_type: Task
entity_id: "tsk-content-os-12"
entity_name: "Content OS - Performance Delta 툴팁 UX"
created: 2026-01-02
updated: 2026-01-02
status: done

# === 계층 ===
parent_id: "prj-content-os"
project_id: "prj-content-os"
aliases: ["tsk-content-os-12"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-02
due: null
priority: medium
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop

# === 분류 ===
tags: ["content-os", "performance-dashboard", "ux", "tooltip"]
priority_flag: medium
---

# Content OS - Performance Delta 툴팁 UX

> Task ID: `tsk-content-os-12` | Project: `prj-content-os` | Status: done

## 목표

**완료 조건**:
1. Delta 지표에 마우스 호버 시 툴팁으로 상세 정보 표시
2. 툴팁 내용: 24h 값, 7d 값, 변화율 계산 방식 설명
3. 사용자가 Delta 값의 의미를 직관적으로 이해할 수 있음

---

## 상세 내용

### 배경

Performance Dashboard에서 Delta 값(+15%, -8% 등)이 표시되지만, 이 값이 무엇을 의미하는지 사용자가 알 수 없다. 툴팁으로 상세 정보를 제공하여 UX를 개선한다.

### 현재 상태

**Delta 계산 로직** (`dummy-performance.ts:111-129`):
```typescript
percentage = ((value7d - value24h) / value24h) * 100
```
- 24시간 값을 기준으로 7일 값과의 변화율 계산
- ±5% 이상이면 up/down, 그 사이면 stable

**현재 UI** (`performance-table.tsx:191-195`):
- `DeltaIndicatorCompact` 컴포넌트로 `+12%` 형태만 표시
- 툴팁 없음

### 작업 내용

1. **DeltaIndicatorCompact에 Tooltip 추가**
   - ShadCN Tooltip 컴포넌트 래핑
   - 24h/7d 원본 값 표시
   - 계산 방식 설명

2. **툴팁 내용 구성**
   ```
   ┌─────────────────────────────────────┐
   │  Delta: +15%                        │
   │  ──────────────────────             │
   │  CTR 24h: 8.5%                      │
   │  CTR 7d:  7.4%                      │
   │  ──────────────────────             │
   │  24시간 성과가 7일 평균 대비 15% 높음   │
   └─────────────────────────────────────┘
   ```

---

## 체크리스트

- [x] DeltaIndicatorCompact에 Tooltip 래핑
- [x] Props에 원본 값 (24h, 7d) 추가 또는 계산 결과 활용
- [x] 툴팁 내용 (24h 값, 7d 값, 설명) 구성
- [x] performance-table.tsx에서 Props 전달 확인
- [x] 빌드 및 UI 테스트

---

## Notes

### PRD (Product Requirements Document)

#### 1. 아키텍처 도식

```
┌─────────────────────────────────────────────────────────────────┐
│              Delta Tooltip Feature Architecture                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ UI Layer (app/performance/)                               │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  PerformanceTable                                         │   │
│  │       │                                                   │   │
│  │       ↓                                                   │   │
│  │  DeltaIndicatorCompact ──→ Tooltip (NEW)                 │   │
│  │       │                       │                           │   │
│  │       ↓                       ↓                           │   │
│  │  Delta 값 (+15%)       TooltipContent                    │   │
│  │                         - value24h, value7d 표시          │   │
│  │                         - 계산 방식 설명                   │   │
│  │                         - 트렌드 해석 메시지               │   │
│  └──────────────────────────────────────────────────────────┘   │
│       │                                                          │
│       ↓                                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Component Layer (components/ui/)                          │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Tooltip (ShadCN)                                         │   │
│  │       │                                                   │   │
│  │       ↓                                                   │   │
│  │  @radix-ui/react-tooltip                                 │   │
│  │       - TooltipProvider (App root에 추가)                 │   │
│  │       - Tooltip, TooltipTrigger, TooltipContent          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 2. 프로젝트 컨텍스트

| 항목 | 값 |
|------|-----|
| Framework | Next.js 16.1.1 (App Router) |
| UI Library | ShadCN UI (Radix UI 기반) |
| Styling | TailwindCSS v4 |

#### 3. 상세 요구사항

**3.1 ShadCN Tooltip 설치**
- 위치: `components/ui/tooltip.tsx`
- 의존성: `@radix-ui/react-tooltip`

**3.2 TooltipProvider 추가**
- 위치: `app/layout.tsx`
- delayDuration: 300ms

**3.3 DeltaIndicatorCompact 수정**
- Props 확장: `metricLabel`, `format`
- Tooltip 래핑
- 트렌드 해석 메시지 로직

**3.4 PerformanceTable 수정**
- metricLabel="CTR", format="percentage" 전달

#### 4. 성공 기준

- [ ] ShadCN Tooltip 설치 완료
- [ ] TooltipProvider 앱 레이아웃에 추가
- [ ] Delta 값 호버 시 툴팁 표시
- [ ] 툴팁에 24h/7d 값 + 트렌드 해석 표시
- [ ] cursor-help 스타일 적용
- [ ] 다크모드 지원

### Tech Spec

#### 구현 순서

1. `@radix-ui/react-tooltip` 설치
2. `components/ui/tooltip.tsx` 생성 (ShadCN 표준)
3. `app/layout.tsx`에 TooltipProvider 추가
4. `DeltaIndicatorCompact` 수정 (Tooltip 래핑 + props 확장)
5. `PerformanceTable`에서 새 props 전달
6. 테스트

#### 파일 변경

| 파일 | 변경 유형 |
|------|----------|
| `components/ui/tooltip.tsx` | 신규 |
| `app/layout.tsx` | 수정 |
| `app/performance/components/delta-indicator.tsx` | 수정 |
| `app/performance/components/performance-table.tsx` | 수정 |

### Todo
- [x] PRD 생성 (prompt-enhancer)
- [x] 구현

### 작업 로그

#### 2026-01-02 21:30
**개요**: Performance Dashboard의 Delta 지표에 ShadCN Tooltip을 추가하여 24h/7d 원본 값과 트렌드 해석 메시지를 표시하도록 UX 개선.

**변경사항**:
- 개발:
  - `components/ui/tooltip.tsx` - ShadCN Tooltip 컴포넌트 (신규)
  - `@radix-ui/react-tooltip` 패키지 설치
- 수정:
  - `app/layout.tsx` - TooltipProvider 추가 (delayDuration: 300ms)
  - `app/performance/components/delta-indicator.tsx` - Tooltip 래핑, metricLabel/format props 추가
  - `app/performance/components/performance-table.tsx` - metricLabel="CTR", format="percentage" 전달

**핵심 코드**:
```tsx
// delta-indicator.tsx - 트렌드 해석 메시지
const getTrendMessage = (trend: string, percentage: number, label: string) => {
  if (trend === "up") {
    return `24시간 ${label}이(가) 7일 평균 대비 ${Math.abs(percentage).toFixed(0)}% 높음`;
  } else if (trend === "down") {
    return `24시간 ${label}이(가) 7일 평균 대비 ${Math.abs(percentage).toFixed(0)}% 낮음`;
  }
  return `24시간 ${label}이(가) 7일 평균과 비슷함`;
};
```

**파일 변경**: 신규 1개, 수정 3개 (총 4개)

**결과**: ✅ 빌드 성공, 툴팁 정상 동작 확인


---

## 참고 문서

- [[prj-content-os]] - 소속 Project
- [[tsk-content-os-06]] - Performance Dashboard Phase 1
- [[tsk-content-os-10]] - YouTube Analytics API 연동

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**:
