---
entity_type: Task
entity_id: "tsk-vault-gpt-09"
entity_name: "LOOP n8n - YouTube Weekly 자동 트리거 워크플로우"
created: 2026-01-03
updated: 2026-01-03
status: todo

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
type: ops
target_project: null

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

- [ ] n8n 접속
- [ ] 새 워크플로우 생성
- [ ] Schedule Trigger 노드 추가 (금요일 09:00)
- [ ] HTTP Request 노드 추가
- [ ] IF 노드 추가 (성공/실패 분기)
- [ ] 알림 노드 추가 (선택)
- [ ] 워크플로우 활성화
- [ ] 테스트 실행

---

## Notes

### 환경변수

n8n에서 사용할 Credential 설정:
- `LOOP_API_TOKEN`: API 인증 토큰

---

## 참고 문서

- [[tsk-vault-gpt-08]] - YouTube Weekly API 구현
- [[pgm-youtube-weekly]] - YouTube Weekly 프로그램

---

**Created**: 2026-01-03
**Assignee**: 김은향
**Due**: 2026-01-03
