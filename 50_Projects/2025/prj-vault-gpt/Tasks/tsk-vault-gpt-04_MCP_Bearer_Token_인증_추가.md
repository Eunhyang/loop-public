---
entity_type: Task
entity_id: tsk-vault-gpt-04
entity_name: MCP Bearer Token 인증 추가
created: 2025-12-26
updated: '2025-12-26'
status: done
parent_id: prj-vault-gpt
project_id: prj-vault-gpt
aliases:
- tsk-vault-gpt-04
outgoing_relations: []
validates: []
validated_by: []
assignee: 김은향
due: 2025-12-26
priority: high
estimated_hours: 1
actual_hours: null
type: dev
target_project: loop
tags:
- mcp
- auth
- agent-builder
priority_flag: high
---
# MCP Bearer Token 인증 추가

> Task ID: `tsk-vault-gpt-04` | Project: `prj-vault-gpt` | Status: doing

## 목표

**완료 조건**:
1. OpenAI Agent Builder에서 `loop_2024_kanban_secret`을 access token으로 입력하면 MCP 연결 성공
2. Bearer 토큰으로 정적 API 토큰(`loop_2024_kanban_secret`) 허용
3. `/mcp` 경로에서도 Bearer 토큰 인증 적용

---

## 상세 내용

### 배경

OpenAI Agent Builder MCP 연결 UI:
- URL: `https://mcp.sosilab.synology.me/mcp`
- Label: (사용자 지정)
- Authentication: access token 입력

현재 문제:
- Bearer 토큰은 JWT만 검증 (`verify_jwt`)
- `loop_2024_kanban_secret`은 정적 문자열이라 JWT 검증 실패
- `/mcp` 경로는 PUBLIC_PREFIXES에 있어 인증 우회됨

### 작업 내용

1. `api/main.py` auth_middleware 수정
   - Bearer 토큰에서 정적 토큰(`API_TOKEN`) 허용
   - `/mcp` 경로도 인증 적용 (PUBLIC_PREFIXES에서 제거)

---

## 체크리스트

- [ ] Bearer 토큰에 정적 API 토큰 허용 로직 추가
- [ ] `/mcp` 경로 인증 적용
- [ ] Docker 재빌드 및 배포
- [ ] Agent Builder에서 테스트

---

## Notes

### Todo
- [ ] main.py auth_middleware 수정
- [ ] /mcp-server rebuild 실행
- [ ] Agent Builder 연결 테스트

### 작업 로그
<!-- workthrough 스킬로 자동 기록 -->

---

## 참고 문서

- [[prj-vault-gpt]] - 소속 Project
- `api/main.py` - 인증 미들웨어
- [[tsk-vault-gpt-02]] - TaskUpdate 모델 확장 (관련 작업)

---

**Created**: 2025-12-26
**Assignee**: 김은향
**Due**: 2025-12-26
