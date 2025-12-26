---
name: api-client
description: LOOP API 조회 스킬. curl로 https://mcp.sosilab.synology.me/ 엔드포인트 호출. tasks, projects, constants, members 조회 지원. 환경변수 LOOP_API_TOKEN으로 인증.
---

# LOOP API Client

## 인증

환경변수 `LOOP_API_TOKEN` 사용:

```bash
curl -s -H "Authorization: Bearer $LOOP_API_TOKEN" https://mcp.sosilab.synology.me/api/...
```

## 엔드포인트

| Endpoint | Description |
|----------|-------------|
| `/health` | 서버 상태 (인증 불필요) |
| `/api/constants` | 상수 (status, priority 등) |
| `/api/members` | 멤버 목록 |
| `/api/tasks` | Task 목록 |
| `/api/tasks/{id}` | Task 상세 (body 포함) |
| `/api/projects` | Project 목록 |
| `/api/tracks` | Track 목록 |
| `/api/hypotheses` | Hypothesis 목록 |

## 사용 예시

```bash
# Health check (인증 불필요)
curl -s https://mcp.sosilab.synology.me/health | python3 -m json.tool

# Constants 조회
curl -s -H "Authorization: Bearer $LOOP_API_TOKEN" \
  https://mcp.sosilab.synology.me/api/constants | python3 -m json.tool

# Task 목록 (필터 옵션)
curl -s -H "Authorization: Bearer $LOOP_API_TOKEN" \
  "https://mcp.sosilab.synology.me/api/tasks?status=doing&assignee=eunhyang" | python3 -m json.tool

# Task 상세
curl -s -H "Authorization: Bearer $LOOP_API_TOKEN" \
  https://mcp.sosilab.synology.me/api/tasks/tsk-003-01 | python3 -m json.tool

# Project 목록
curl -s -H "Authorization: Bearer $LOOP_API_TOKEN" \
  https://mcp.sosilab.synology.me/api/projects | python3 -m json.tool
```

## 필터 파라미터

**Tasks:**
- `project_id` - 프로젝트별 필터
- `status` - todo, doing, hold, done, blocked
- `assignee` - 담당자

**Projects:**
- `status` - planning, active, paused, done, cancelled