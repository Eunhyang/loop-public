---
entity_type: Task
entity_id: "tsk-vault-gpt-09"
entity_name: "LOOP n8n - YouTube Weekly 자동 트리거 워크플로우"
created: 2026-01-03
updated: 2026-01-03
status: doing

# === 계층 ===
parent_id: "prj-vault-gpt"
project_id: "prj-vault-gpt"
aliases: ["tsk-vault-gpt-09"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-03
due: 2026-01-03
priority: medium
estimated_hours: 1
actual_hours: null

# === Task 유형 ===
type: dev
target_project: loop-api

# === 분류 ===
tags: ["n8n", "youtube", "automation"]
priority_flag: medium
---

# LOOP n8n - YouTube Weekly 자동 트리거 워크플로우

> Task ID: `tsk-vault-gpt-09` | Project: `prj-vault-gpt` | Status: todo

## 목표

**완료 조건**:
1. n8n에 YouTube Weekly Round 자동 생성 워크플로우 생성
2. 매주 금요일 09:00 트리거 설정
3. 성공/실패 알림 설정

---

## 상세 내용

### 배경

tsk-vault-gpt-08에서 구현한 `/api/youtube-weekly/create-round` API를 n8n에서 자동 호출하여 매주 Round를 생성.

### 워크플로우 설계

**이름**: `youtube-weekly-round-creator`

**트리거**: 매주 금요일 09:00 (Cron: `0 9 * * 5`)

**노드 구성**:
```
[Schedule Trigger]
    ↓
[HTTP Request]
    POST https://mcp.sosilab.synology.me/api/youtube-weekly/create-round
    Headers: Authorization: Bearer {LOOP_API_TOKEN}
    ↓
[IF: success == true]
    ↓ Yes
[알림] "✅ YouTube {cycle} 라운드 생성됨! 10개 Task 준비 완료"
    ↓ No
[알림] "⚠️ 라운드 생성 실패: {error}"
```

### 작업 위치

- n8n UI: https://n8n.sosilab.synology.me

---

## 체크리스트

- [x] 워크플로우 JSON 생성 (`_build/n8n_workflows/youtube_weekly_round_creator.json`)
- [ ] n8n UI에서 워크플로우 import
- [ ] 환경변수 확인 (LOOP_API_TOKEN)
- [ ] 워크플로우 활성화
- [ ] 테스트 실행

---

## Notes

### Tech Spec

**n8n 워크플로우 아키텍처**:
```
[Schedule Trigger: 0 9 * * 5]
    ↓
[HTTP Request: POST /api/youtube-weekly/create-round]
    ↓
[IF: success == true]
    ├── Yes → [Code: Success Message] → (알림 준비)
    └── No  → [Code: Failure Message] → (알림 준비)
```

**기술 스택**:
- n8n (워크플로우 자동화)
- n8n-nodes-base.scheduleTrigger (Cron 스케줄러)
- n8n-nodes-base.httpRequest (API 호출)
- n8n-nodes-base.if (조건부 분기)
- n8n-nodes-base.code (JavaScript 메시지 생성)

**인증 방식**:
- 환경변수 `LOOP_API_TOKEN`을 Authorization 헤더에 포함
- Bearer Token 형식: `Authorization: Bearer {token}`

**API 응답 구조** (CreateRoundResponse):
```json
{
  "success": true,
  "project_id": "prj-yt-W03-26",
  "project_name": "YouTube - W03-26",
  "cycle": "W03-26",
  "directory": "50_Projects/Youtube_Weekly/Rounds/prj-yt-W03-26",
  "tasks_created": 10,
  "task_ids": ["tsk-yt-w03-26-01", ...],
  "start_date": "2026-01-17",
  "message": "Round W03-26 created with 10 tasks"
}
```

**에러 응답**:
```json
{
  "detail": "Round already exists: prj-yt-W03-26"
}
```

### Todo

- [x] 워크플로우 JSON 기본 구조 생성
- [ ] Success/Failure 메시지 코드 개선 (null 체크)
- [ ] n8n UI import 및 Credential 설정
- [ ] 테스트 실행

### 환경변수

n8n에서 사용할 환경변수:
- `LOOP_API_TOKEN`: API 인증 토큰 (n8n 환경변수에 설정)

### 작업 로그

#### 2026-01-03 02:00
**개요**: n8n 워크플로우 JSON 파일 생성

**변경사항**:
- 신규: `_build/n8n_workflows/youtube_weekly_round_creator.json`

**워크플로우 구조**:
```
[Schedule Trigger: Every Friday 09:00]
    ↓
[HTTP Request: POST /api/youtube-weekly/create-round]
    ↓
[IF: success == true]
    ├── Yes → [Code: Success Message]
    └── No  → [Code: Failure Message]
```

**다음 단계**:
- n8n UI에서 워크플로우 import
- 워크플로우 활성화
- 테스트 실행

---

## 참고 문서

- [[tsk-vault-gpt-08]] - YouTube Weekly API 구현
- [[pgm-youtube-weekly]] - YouTube Weekly 프로그램

---

**Created**: 2026-01-03
**Assignee**: 김은향
**Due**: 2026-01-03
