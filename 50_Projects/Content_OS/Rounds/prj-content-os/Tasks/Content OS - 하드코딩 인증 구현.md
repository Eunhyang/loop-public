---
entity_type: Task
entity_id: "tsk-content-os-11"
entity_name: "Content OS - 하드코딩 인증 구현"
created: 2026-01-02
updated: 2026-01-02
status: doing

# === 계층 ===
parent_id: "prj-content-os"
project_id: "prj-content-os"
aliases: ["tsk-content-os-11"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-02
due: 2026-01-02
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: null

# === 분류 ===
tags: ["auth", "security", "content-os"]
priority_flag: high
---

# Content OS - 하드코딩 인증 구현

> Task ID: `tsk-content-os-11` | Project: `prj-content-os` | Status: doing

## 목표

**완료 조건**:
1. https://contentos.sosilab.synology.me/ 전체 앱에 로그인 인증 적용
2. 인증되지 않은 사용자는 /login 페이지로 리다이렉트
3. 환경변수 기반 ID/PW로 간단한 인증 구현

---

## 상세 내용

### 배경

현재 Content OS 배포 서버가 누구나 접근 가능한 상태. 하드코딩 방식의 간단한 인증을 추가하여 접근을 제한해야 함.

### 작업 내용

1. `middleware.ts` - 모든 요청에서 인증 쿠키 확인
2. `app/login/page.tsx` - 로그인 폼 UI
3. `app/api/auth/login/route.ts` - ID/PW 검증 → 세션 쿠키 발급
4. `app/api/auth/logout/route.ts` - 세션 쿠키 삭제
5. 환경변수: `AUTH_USERNAME`, `AUTH_PASSWORD`

---

## 체크리스트

- [ ] middleware.ts 생성 (인증 쿠키 체크)
- [ ] 로그인 페이지 UI 구현
- [ ] 로그인 API 구현
- [ ] 로그아웃 API 구현
- [ ] 환경변수 설정
- [ ] Docker 배포 테스트

---

## Notes

### Todo
- [ ] middleware.ts
- [ ] login page
- [ ] login/logout API
- [ ] 배포 확인

### 작업 로그


---

## 참고 문서

- [[prj-content-os]] - 소속 Project

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**: 2026-01-02
