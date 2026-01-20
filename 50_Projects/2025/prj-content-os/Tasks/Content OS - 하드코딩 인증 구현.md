---
entity_type: Task
entity_id: "tsk-content-os-11"
entity_name: "Content OS - 하드코딩 인증 구현"
created: 2026-01-02
updated: 2026-01-02
status: done

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

> Task ID: `tsk-content-os-11` | Project: `prj-content-os` | Status: done

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

- [x] middleware.ts 생성 (인증 쿠키 체크)
- [x] 로그인 페이지 UI 구현
- [x] 로그인 API 구현
- [x] 로그아웃 API 구현
- [x] 환경변수 설정
- [x] Docker 배포 테스트

---

## Notes

### PRD

#### 아키텍처
```
User Request → middleware.ts → Cookie Check
                    │
                    ├─ Has session cookie? → Yes → Continue
                    │
                    └─ No → Redirect /login → Login Form → POST /api/auth/login
                                                              │
                                                              ├─ Valid → Set Cookie → Redirect
                                                              └─ Invalid → 401 Error
```

#### 구현 파일
| 파일 | 역할 |
|------|------|
| `middleware.ts` | 전역 인증 가드, 쿠키 체크 |
| `lib/auth.ts` | 인증 상수 및 유틸리티 |
| `app/login/page.tsx` | 로그인 폼 UI |
| `app/login/layout.tsx` | MainLayout 제외용 |
| `app/api/auth/login/route.ts` | 로그인 API |
| `app/api/auth/logout/route.ts` | 로그아웃 API |

#### 보호 범위
- **Public**: `/login`, `/api/auth/*`, `/_next/*`, `/favicon.ico`
- **Protected**: 나머지 모든 경로

#### 환경변수
```bash
AUTH_USERNAME=admin
AUTH_PASSWORD=your_password
```

#### 쿠키 설정
- Name: `content-os-session`
- httpOnly: true, secure: production, sameSite: lax
- maxAge: 7일

#### 성공 기준
- [ ] 미인증 시 /login 리다이렉트
- [ ] 로그인 성공 시 세션 쿠키 발급
- [ ] 로그아웃 시 쿠키 삭제
- [ ] 기존 ShadCN UI 스타일 일관성

### 작업 로그

#### 2026-01-02 22:50
**개요**: Content OS에 하드코딩 기반 인증 시스템 구현 및 배포 완료

**변경사항**:
- 신규: `lib/auth.ts` - 인증 유틸리티 (세션 쿠키 상수, 자격증명 검증)
- 신규: `middleware.ts` - 전역 인증 가드 (쿠키 체크, /login 리다이렉트)
- 신규: `app/login/page.tsx` - ShadCN 기반 로그인 폼 UI
- 신규: `app/login/layout.tsx` - Sidebar 제외 레이아웃
- 신규: `app/api/auth/login/route.ts` - 로그인 API (HttpOnly 쿠키 발급)
- 신규: `app/api/auth/logout/route.ts` - 로그아웃 API (쿠키 삭제)
- 수정: `components/layout/sidebar.tsx` - 로그아웃 버튼 추가
- 수정: `docker-compose.yml` - AUTH_USERNAME, AUTH_PASSWORD 환경변수
- 수정: `.claude/commands/content-os-server.md` - 배포 스크립트 업데이트

**핵심 코드**:
- 세션 쿠키: `content-os-session`, 7일 유효, HttpOnly
- 보호 범위: `/login`, `/api/auth/*` 제외 전체
- 인증 정보: admin / contentos123

**결과**: ✅ 빌드 성공, Docker 배포 완료, /explorer 307 리다이렉트 확인

**테스트**:
- `/login` 페이지 200 OK
- `/explorer` 미인증 → 307 → `/login?callbackUrl=/explorer`

---

## 참고 문서

- [[prj-content-os]] - 소속 Project

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**: 2026-01-02
