---
entity_type: Task
entity_id: "tsk-vault-gpt-07"
entity_name: "OAuth 인증 서버 분리 (loop-auth)"
created: 2026-01-02
updated: 2026-01-02
status: doing

# === 계층 ===
parent_id: "prj-vault-gpt"
project_id: "prj-vault-gpt"
aliases: ["tsk-vault-gpt-07"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-02
due: 2026-01-02
priority: high
estimated_hours: 3
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop-api

# === 3Y 전략 연결 (필수) ===
conditions_3y: ["cond-b"]

# === 분류 ===
tags: [mcp, oauth, docker, auth, infrastructure]
priority_flag: high
---

# OAuth 인증 서버 분리 (loop-auth)

> Task ID: `tsk-vault-gpt-07` | Project: `prj-vault-gpt` | Status: doing

## 목표

MCP API 서버와 OAuth 인증 서버를 분리하여, API 서버 rebuild 시에도 인증 세션이 유지되도록 함

**완료 조건**:
1. `loop-auth` 컨테이너 생성 (OAuth 전용)
2. `loop-api` 컨테이너는 API + MCP만 담당
3. API rebuild 시 재인증 불필요 확인
4. ChatGPT 연동 테스트 성공

---

## 상세 내용

### 배경

현재 상황:
- `loop-api` 단일 컨테이너에 OAuth + API + MCP 모두 포함
- Docker rebuild 시 모든 세션 무효화
- ChatGPT에서 매번 재인증 필요

목표 아키텍처:
```
┌──────────────────┐    ┌──────────────────┐
│  loop-auth       │    │  loop-api        │
│  (인증 전용)      │    │  (API + MCP)     │
│  - OAuth         │    │  - MCP SSE       │
│  - Token 발급    │←──→│  - API 로직      │
│  - SQLite DB     │    │                  │
│  포트: 8083      │    │  포트: 8082      │
└──────────────────┘    └──────────────────┘
```

### 작업 내용

1. **OAuth 라우터 분리**: `api/routers/oauth.py` 독립 실행 가능하도록
2. **loop-auth Dockerfile 생성**: 최소 의존성
3. **loop-api에서 OAuth 제거**: API/MCP만 담당
4. **docker-compose로 통합 관리**
5. **Nginx 리버스 프록시 설정** (선택)

---

## 체크리스트

- [ ] OAuth 라우터 독립 실행 가능 여부 확인
- [ ] loop-auth용 Dockerfile.auth 생성
- [ ] loop-api용 Dockerfile 수정 (OAuth 제외)
- [ ] docker-compose.yml 작성 (두 컨테이너 연동)
- [ ] NAS 배포 테스트
- [ ] ChatGPT 재인증 테스트

---

## Notes

<!-- PRD, Tech Spec, Todo, 작업 로그는 여기에 추가됨 -->

---

## 참고 문서

- [[prj-vault-gpt]] - 소속 Project
- [[tsk-vault-gpt-06]] - 이전 Task (vault-full-scan API)
- [[api/routers/oauth.py]] - OAuth 라우터

---

**Created**: 2026-01-02
**Assignee**: 김은향
**Due**: 2026-01-02
