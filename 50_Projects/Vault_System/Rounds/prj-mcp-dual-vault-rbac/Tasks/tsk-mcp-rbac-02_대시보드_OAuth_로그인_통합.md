---
entity_type: Task
entity_id: tsk-mcp-rbac-02
entity_name: 대시보드 OAuth 로그인 통합
created: 2025-12-26
updated: '2025-12-26'
status: done
parent_id: prj-mcp-dual-vault-rbac
project_id: prj-mcp-dual-vault-rbac
program_id: pgm-vault-system
aliases:
- tsk-mcp-rbac-02
outgoing_relations:
- type: depends_on
  target_id: tsk-mcp-rbac-01
  description: User 모델 + role 필드 필요
validates: []
validated_by: []
assignee: 김은향
due: 2025-12-26
priority: high
estimated_hours: null
actual_hours: null
type: dev
target_project: loop
conditions_3y:
- cond-b
tags:
- oauth
- dashboard
- rbac
- security
priority_flag: high
---
# 대시보드 OAuth 로그인 통합

> Task ID: `tsk-mcp-rbac-02` | Project: `prj-mcp-dual-vault-rbac` | Status: planning

## 목표

대시보드에 OAuth 로그인을 적용하여 역할 기반 접근 제어 구현

**완료 조건**:
1. 대시보드 접속 시 OAuth 로그인 페이지로 리다이렉트
2. 로그인 성공 후 JWT 토큰 저장 + 대시보드 접근
3. API 호출 시 Bearer 토큰 포함
4. exec/admin role만 exec/ 경로 데이터 표시

---

## 상세 내용

### 배경

현재 대시보드는 `loop_2024_kanban_secret` 시크릿 키로 단순 인증.
OAuth + RBAC 적용하여 역할별 데이터 접근 제어 필요.

### 작업 내용

#### Phase 1: 인증 플로우
- 대시보드 index.html에 JWT 토큰 체크 로직 추가
- 토큰 없으면 /oauth/login으로 리다이렉트
- 로그인 성공 후 토큰을 localStorage에 저장

#### Phase 2: API 통합
- api.js에서 모든 API 호출 시 Authorization 헤더 추가
- 401 응답 시 로그인 페이지로 리다이렉트

#### Phase 3: RBAC UI
- role=exec/admin일 때 exec/ 경로 데이터 추가 표시
- 사이드바 또는 필터에 exec vault 토글 추가

---

## 체크리스트

- [ ] index.html: JWT 토큰 체크 로직
- [ ] index.html: 시크릿 키 인증 제거
- [ ] api.js: Authorization 헤더 추가
- [ ] api.js: 401 핸들링 (로그인 리다이렉트)
- [ ] app.js: 로그인 상태 관리
- [ ] oauth/routes.py: 대시보드용 로그인 플로우
- [ ] exec 데이터 표시 UI

---

## Notes

### Todo
- [ ] 현재 대시보드 인증 코드 분석
- [ ] OAuth 로그인 페이지 디자인
- [ ] JWT 토큰 저장 방식 결정 (localStorage vs cookie)

### 작업 로그
<!-- 작업 진행 시 여기에 기록 -->


---

## 참고 문서

- [[prj-mcp-dual-vault-rbac]] - 소속 Project
- [[tsk-mcp-rbac-01]] - User 모델 role 필드 + CLI
- `api/oauth/` - OAuth 관련 코드

---

**Created**: 2025-12-26
**Assignee**: 김은향
**Due**: 2025-12-26
