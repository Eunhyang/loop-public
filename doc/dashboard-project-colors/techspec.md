# Dashboard Project Colors - Technical Specification

**Project**: dashboard-project-colors
**Version**: 0.1.0
**Last Updated**: 2025-12-23
**Status**: Planning

---

## 1. 개요

### 목적

프로젝트마다 고유한 연한(pastel) 색상을 부여하고, Calendar 뷰에서 태스크가 해당 프로젝트의 색상으로 표시되도록 구현.

### 핵심 기능

1. **프로젝트별 고유 색상**: 각 프로젝트(prj-001, prj-002...)마다 서로 다른 색상
2. **색상 고정**: 프로젝트 ID 기반 해시로 항상 같은 색상 유지
3. **Calendar 뷰 적용**: 태스크가 소속 프로젝트의 색상으로 표시

---

## 2. 아키텍처

### 기술 스택

- **Language**: JavaScript (ES6+)
- **Framework**: Vanilla JS (기존 대시보드)
- **CSS**: 기존 CSS 파일 확장

### 색상 매핑 알고리즘

```
프로젝트 ID (예: "prj-002")
    ↓
해시 함수 (djb2 또는 간단한 해시)
    ↓
해시값 % 팔레트 크기
    ↓
색상 팔레트[인덱스]
    ↓
고정된 pastel 색상 (예: "#E3F2FD")
```

### Pastel 색상 팔레트 (12개)

```javascript
const PASTEL_COLORS = [
  '#FFCDD2', // 연한 빨강
  '#F8BBD9', // 연한 핑크
  '#E1BEE7', // 연한 보라
  '#D1C4E9', // 연한 라벤더
  '#C5CAE9', // 연한 인디고
  '#BBDEFB', // 연한 파랑
  '#B3E5FC', // 연한 하늘
  '#B2EBF2', // 연한 시안
  '#C8E6C9', // 연한 초록
  '#DCEDC8', // 연한 라임
  '#FFF9C4', // 연한 노랑
  '#FFE0B2', // 연한 오렌지
];
```

### 데이터 흐름

```
Calendar 렌더링
    ↓
태스크 데이터 (project_id 포함)
    ↓
getProjectColor(project_id) 호출
    ↓
해시 기반 색상 반환
    ↓
태스크 DOM에 background-color 적용
```

---

## 3. 구현 상세

### 색상 유틸리티 함수

```javascript
// _dashboard/js/utils/colors.js

const PASTEL_COLORS = [...]; // 12개 팔레트

function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return Math.abs(hash);
}

export function getProjectColor(projectId) {
  if (!projectId) return '#F5F5F5'; // 기본 회색
  const index = hashString(projectId) % PASTEL_COLORS.length;
  return PASTEL_COLORS[index];
}
```

### Calendar 적용

```javascript
// calendar.js 수정
import { getProjectColor } from '../utils/colors.js';

function renderTask(task) {
  const color = getProjectColor(task.project_id);
  taskElement.style.backgroundColor = color;
  // ...
}
```

---

## 4. 변경 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `_dashboard/js/utils/colors.js` | 신규 생성 - 색상 유틸리티 |
| `_dashboard/js/components/calendar.js` | 태스크 렌더링 시 색상 적용 |
| (선택) `kanban.js` | Kanban에도 적용 시 |

---

## 5. ADR

### ADR-001: 해시 기반 색상 매핑

- **날짜**: 2025-12-23
- **결정**: 프로젝트 ID를 해시하여 팔레트 인덱스로 변환
- **이유**:
  - 별도 저장소 없이 항상 동일한 색상 보장
  - 새 프로젝트 추가 시 자동으로 색상 할당
  - 클라이언트 사이드만으로 구현 가능
- **영향**: 프로젝트가 많아지면 색상 충돌 가능 (12개 팔레트 한계)

---

**Version**: 0.1.0
**Status**: Living Document
