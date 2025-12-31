---
entity_type: Task
entity_id: "tsk-018-01"
entity_name: "Content OS - 프로젝트 초기 세팅"
created: 2025-12-31
updated: 2025-12-31
status: doing

# === 계층 ===
parent_id: "prj-018"
project_id: "prj-018"
aliases: ["tsk-018-01"]

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

> Task ID: `tsk-018-01` | Project: `prj-018` | Status: doing

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

### Todo
- [ ] 프로젝트 폴더 위치 결정 (~/dev/content-os)
- [ ] 패키지 매니저 선택 (pnpm 권장)

### 작업 로그
<!--
작업 완료 시 아래 형식으로 기록 (workthrough 스킬 자동 생성)
-->


---

## 참고 문서

- [[prj-018]] - 소속 Project
- [[pgm-content-os]] - 소속 Program

---

**Created**: 2025-12-31
**Assignee**: 김은향
**Due**: 2025-12-31
