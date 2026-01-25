---
entity_type: Project
entity_id: prj-content-os-ops
entity_name: Content OS - 운영 및 고도화
created: 2026-01-25
updated: '2026-01-25'
status: doing
parent_id: trk-3
program_id: pgm-content-os
conditions_3y:
- cond-a
- cond-b
- cond-d
owner: 김은향
priority_flag: medium
outgoing_relations:
- target: prj-waoz74
  rel_type: follows
- target: prj-023
  rel_type: references
tags:
- content-os
- 운영
- 고도화
- dashboard-v2
validates:
- hyp-3-01
primary_hypothesis_id: hyp-3-01
condition_contributes:
- to: cond-a
  weight: 0.5
  description: 프로젝트가 성공적으로 운영되면 Tier1/2가 Loop 언어로 문제를 설명할 가능성이 높아짐.
- to: cond-b
  weight: 0.3
  description: 기능 확장과 안정화가 이루어지면 재현 가능한 패턴이 늘어날 것으로 기대됨.
- to: cond-d
  weight: 0.2
  description: 운영 안정성과 기능 고도화가 이루어지면 월 매출이 전략 지속 가능 수준에 도달할 가능성이 높아짐.
track_contributes:
- to: trk-1
  weight: 0.3
  description: Loop Core OS 제품이 국내 PMF를 달성하는 목표와 간접적으로 기여할 가능성이 있음.
- to: trk-2
  weight: 0.2
  description: 데이터 패턴화 가능성에 기여할 수 있는 Track으로, 간접적인 연관성이 있음.
expected_impact:
  tier: operational
  impact_magnitude: low
  confidence: 0.8
  contributes: []
  rationale: Content OS 프로젝트는 운영 안정성과 기능 확장을 통해 일상 운영을 지원하며, 조건 A의 충족에 주요하게 기여할 것으로
    예상됩니다.
start_date: '2026-01-25'
deadline: '2026-02-28'
---
# Content OS - 운영 및 고도화

> Project ID: `prj-content-os-ops` | Track: [[trk-3]] | Program: [[pgm-content-os]] | Status: todo

---

## 프로젝트 개요

Content OS가 Dashboard v2에 통합 완료(prj-waoz74)되었으며, 본 프로젝트는 **안정적 운영과 기능 고도화**를 담당합니다.

기존 8개 모듈(auth, explorer, performance, opportunity, retro, keywords, intro-retention, layout)의 유지보수와 새로운 기능 확장을 수행합니다.

### 선행 프로젝트

- [[prj-waoz74]] - Content OS → Dashboard v2 마이그레이션 (완료)
- [[prj-023]] - Dashboard v2 아키텍처 정의

---

## 핵심 목표

### 성공 기준

| \# | 기준 | 측정 방법 |
| --- | --- | --- |
| 1 | 운영 안정성 | 주간 에러율 &lt; 1%, 사용자 보고 버그 0건 |
| 2 | 기능 확장 | 분기별 1+ 신규 기능 배포 |
| 3 | 성능 유지 | 페이지 로딩 &lt; 2초, API 응답 &lt; 500ms |
| 4 | 코드 품질 | LLM Work Rules 준수율 100% |

### 실패 신호

1. 동일 버그 반복 발생 (3회+)
2. 사용자 기피로 Legacy 방식 회귀
3. 코드베이스 복잡도 증가로 기능 추가 불가

---

## 현재 모듈 구조

> 위치: `~/dev/loop/code/dashboard-v2/src/features/content-os/`

| 모듈 | 역할 | 복잡도 | 운영 방향 |
| --- | --- | --- | --- |
| `auth` | YouTube OAuth 인증 | 낮음 | 유지 |
| `explorer` | 영상 검색/수집/라이브러리 | 중간 | 확장 |
| `performance` | 성과 분석 대시보드 | 높음 | 고도화 |
| `opportunity` | 콘텐츠 기회 발견 | 중간 | 확장 |
| `retro` | 회고, A/B 리포트 | 중간 | 유지 |
| `keywords` | 키워드 CRUD | 낮음 | 유지 |
| `intro-retention` | 30초 시청률 분석 | 중간 | 고도화 |
| `layout` | Content OS 전용 레이아웃 | 낮음 | 유지 |

### 라우팅 구조

```
/content-os/opportunity    → 콘텐츠 기회 발굴
/content-os/explorer       → 영상 검색/수집
/content-os/performance    → 성과 분석 메인
/content-os/performance/weekly → 주간 요약
/content-os/performance/:videoId → 영상별 상세
/content-os/retro          → 회고/A/B 리포트
/content-os/keywords       → 키워드 관리
```

---

## Content OS LLM Work Rules

> **강제**: 이 규칙은 Content OS 코드의 "법"이며, LLM/Claude Code 포함 모든 기여자는 작업 전 반드시 읽고 준수해야 합니다.

### 0) 절대 규칙 (Hard Rules)

0.1 Feature 범위 고정

- Content OS 작업은 `src/features/content-os/*` 내부에서만 수행
- 다른 feature 폴더 수정 금지
- 공유 필요 시 `src/components/common/` 또는 `src/services/` 사용

0.2 의존성 방향 고정 (Dependency Rule)

- `content-os/*` → `../common/*` import ✅
- `content-os/*` → `../../services/*` import ✅
- `../common/*` → `content-os/*` import ❌ (절대 금지)
- 타 feature → `content-os/*` import ❌ (절대 금지)

0.3 SSOT(단일 진실의 원천) 고정

| SSOT | 파일 |
| --- | --- |
| HTTP Client | `src/services/http.ts` |
| DTO 타입 | `src/types/*` (모듈 내 DTO 재정의 금지) |
| Query Key | `src/queries/keys.ts` |
| Feature API | `src/features/content-os/*/api.ts` |
| Feature Query Hooks | `src/features/content-os/*/queries.ts` |

0.4 빌드 게이트 (필수)

- 작업 후 `npm run build` 통과 필수
- TypeScript 에러/빌드 실패 상태로 작업 종료 금지

0.5 Firebase 직접 호출 금지

- Firebase는 API 서버를 통해서만 접근
- 프론트엔드에서 Firebase SDK 직접 사용 금지

---

### 1) 모듈 내부 구조 표준

각 모듈은 다음 구조를 따릅니다:

```
src/features/content-os/{module}/
├── api.ts           # API 엔드포인트 래퍼 (SSOT)
├── queries.ts       # React Query hooks (useQuery, useMutation)
├── selectors.ts     # 순수 함수 (필터링/변환). React/Query import 금지
├── types.ts         # 모듈 전용 UI 타입 (DTO는 src/types/)
├── components/      # 모듈 전용 UI 컴포넌트
│   ├── *Dashboard.tsx
│   ├── *Card.tsx
│   └── *Form.tsx
└── utils/           # 모듈 전용 유틸리티 함수
```

---

### 2) API 패턴

```typescript
// api.ts 예시
import { http } from '@/services/http';

export const performanceApi = {
  getMetrics: (params: MetricsParams) =>
    http.get<MetricsResponse>('/content-os/metrics', { params }),

  updateMetric: (id: string, data: UpdateData) =>
    http.patch<Metric>(`/content-os/metrics/${id}`, data),
};
```

---

### 3) Query Hooks 패턴

```typescript
// queries.ts 예시
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from '@/queries/keys';
import { performanceApi } from './api';

export const useMetrics = (params: MetricsParams) =>
  useQuery({
    queryKey: queryKeys.contentOs.metrics(params),
    queryFn: () => performanceApi.getMetrics(params),
  });

export const useUpdateMetric = () =>
  useMutation({
    mutationFn: ({ id, data }) => performanceApi.updateMetric(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.contentOs.metrics }),
  });
```

---

## 운영 영역

### 유지보수 항목

| 영역 | 빈도 | 담당 |
| --- | --- | --- |
| 버그 수정 | 수시 | 발견 즉시 |
| YouTube API 토큰 갱신 | 주간 | 자동화 (loop-auth) |
| Firebase 쿼리 최적화 | 월간 | 성능 모니터링 |
| 의존성 업데이트 | 분기 | 보안 패치 |

### 모니터링 지표

| 지표 | 임계치 | 대응 |
| --- | --- | --- |
| 페이지 로딩 시간 | &gt; 3초 | 번들 분석, lazy load 검토 |
| API 에러율 | &gt; 5% | 긴급 대응, 로그 확인 |
| YouTube Quota 사용률 | &gt; 80% | 캐시 강화, 호출 최적화 |

---

## 고도화 로드맵

> 각 기능은 별도 Task로 생성하여 추적

### Phase 1: 안정화

- [ ] 기존 버그 수정 및 에러 핸들링 강화

- [ ] 타입 안전성 개선 (any 제거)

- [ ] 테스트 커버리지 확보

### Phase 2: 성능 최적화

- [ ] Performance 모듈 쿼리 최적화

- [ ] 차트 렌더링 성능 개선

- [ ] 캐시 전략 고도화

### Phase 3: 기능 확장 (지속)

- [ ] 새 분석 지표 추가

- [ ] 대시보드 커스터마이징

- [ ] 알림 시스템 연동

---

## 기능 확장 템플릿

> 새 기능 추가 시 이 체크리스트를 따릅니다

### 신규 기능 체크리스트

**1. 사전 검토**

- [ ] 기존 모듈에 추가 가능한가? (새 모듈 생성 최소화)

- [ ] API 엔드포인트 필요한가?

- [ ] 타입 정의 완료했는가?

**2. 구현**

- [ ] api.ts에 엔드포인트 추가

- [ ] queries.ts에 hook 추가

- [ ] components/에 UI 구현

- [ ] queryKeys에 키 등록

**3. 검증**

- [ ] npm run build 통과

- [ ] 수동 테스트 완료

- [ ] 기존 기능 영향 없음 확인

---

## Pre/Post-flight Checklist

### Pre-flight (작업 전 필수)

- [ ] 변경 대상이 `src/features/content-os/` 내부인가?

- [ ] 파일 배치가 모듈 구조에 맞는가?

- [ ] DTO 타입은 `src/types/`에서 import 했는가?

- [ ] queryKey는 `src/queries/keys.ts`에서 import 했는가?

- [ ] Firebase 직접 호출하지 않는가?

- [ ] selectors는 pure function (React/Query import 금지)인가?

### Post-flight (작업 후 필수)

- [ ] `npm run build` 통과

- [ ] TypeScript 에러 0건

- [ ] 수동 테스트 완료 (해당 기능 + 인접 기능)

- [ ] 성능 저하 없음 확인

---

## 의존성 및 제약

| 항목 | 상태 | 설명 |
| --- | --- | --- |
| Dashboard v2 통합 | ✅ 완료 | prj-waoz74 |
| YouTube API Quota | 제한 있음 | 일 10,000 units |
| Firebase 비용 | 모니터링 | 읽기/쓰기 최적화 필요 |
| OAuth 갱신 | 자동화됨 | loop-auth 컨테이너 |

---

## 리스크 및 대응

| 리스크 | 확률 | 영향 | 대응책 |
| --- | --- | --- | --- |
| YouTube API 변경 | 중간 | 높음 | API 버전 고정, 변경 알림 구독 |
| 성능 저하 | 중간 | 중간 | 모니터링 강화, 임계치 알림 |
| 복잡도 증가 | 높음 | 중간 | LLM Work Rules 준수, 코드 리뷰 |

---

## 참고 문서

- [[pgm-content-os]] - 소속 Program
- [[trk-3]] - 소속 Track (Content)
- [[prj-waoz74]] - 선행 프로젝트 (마이그레이션)
- [[prj-023]] - Dashboard v2 아키텍처 (LLM Work Rules 원본)

---

## Project Rollup

> 운영 프로젝트는 분기별 점검

### Conclusion

1. 
2. 
3. 

### Evidence

| \# | Type | 근거 요약 | 링크 |
| --- | --- | --- | --- |
| 1 |  |  | \[\[\]\] |

### Metric Delta

| Metric | Before | After | Δ | 판정 |
| --- | --- | --- | --- | --- |
| 에러율 |  |  |  |  |
| 로딩시간 |  |  |  |  |
| 기능 추가 수 |  |  |  |  |

### Decision

- **Verdict**: `pending`
- **Next Action**:
- **Decided**:

---

**Created**: 2026-01-25 | **Owner**: 김은향