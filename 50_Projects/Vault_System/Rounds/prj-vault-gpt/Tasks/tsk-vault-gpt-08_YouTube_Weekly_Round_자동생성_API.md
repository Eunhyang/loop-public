---
entity_type: Task
entity_id: "tsk-vault-gpt-08"
entity_name: "LOOP API - YouTube Weekly Round 자동 생성 엔드포인트"
created: 2026-01-03
updated: 2026-01-03
status: doing

# === 계층 ===
parent_id: "prj-vault-gpt"
project_id: "prj-vault-gpt"
aliases: ["tsk-vault-gpt-08"]

# === 관계 ===
outgoing_relations: []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "김은향"
start_date: 2026-01-03
due: 2026-01-03
priority: high
estimated_hours: null
actual_hours: null

# === Task 유형 (dev Task 연동용) ===
type: dev
target_project: loop-api

# === 분류 ===
tags: ["youtube", "automation", "api"]
priority_flag: high
---

# LOOP API - YouTube Weekly Round 자동 생성 엔드포인트

> Task ID: `tsk-vault-gpt-08` | Project: `prj-vault-gpt` | Status: doing

## 목표

**완료 조건**:
1. POST /api/youtube-weekly/create-round 엔드포인트 구현
2. 템플릿 기반 Project + 10개 Task 자동 생성
3. n8n에서 호출 가능한 상태로 배포

---

## 상세 내용

### 배경

YouTube Weekly 프로그램(pgm-youtube-weekly)은 매주 반복되는 콘텐츠 제작 워크플로우.
현재 수동으로 Project/Task를 생성하고 있어 자동화 필요.

### Task 구조 (1 Round = 10개 Task)

| # | Task | 시점 |
|---|------|------|
| 01 | 주제 선정 | 금 |
| 02 | 원고 작성 | 토 |
| 03 | 원고 수정 + 촬영 | 일 |
| 04 | 편집 외주 | 월~일 (1주간) |
| 05 | 썸네일 + 업로드 | 다음주 월 |
| 06 | 쇼츠 #1 | 다음주 화 |
| 07 | 쇼츠 #2 | 다음주 수 |
| 08 | 쇼츠 #3 | 다음주 목 |
| 09 | 쇼츠 #4 | 다음주 금 |
| 10 | 쇼츠 #5 | 다음주 토 |

### 파이프라인 구조

```
W34 금: 01.주제선정 (W34 콘텐츠용)
W34 토: 02.원고작성
W34 일: 03.원고수정+촬영
W34 월~W35 일: 04.편집외주 (1주)
W35 월: 05.썸네일+업로드 (W34 콘텐츠)
W35 화~토: 06-10.쇼츠 (W34 콘텐츠)
```

### 작업 내용

1. **API 라우터**: `api/routers/youtube_weekly.py`
2. **템플릿**: `50_Projects/Youtube_Weekly/_TEMPLATES/`
3. **n8n 연동**: 매주 금요일 트리거

---

## 체크리스트

- [x] youtube_weekly.py 라우터 생성
- [x] POST /api/youtube-weekly/create-round 구현
- [x] main.py에 라우터 등록
- [x] API 테스트 (로컬)
- [ ] NAS 배포 (`/mcp-server rebuild`)
- [ ] n8n 워크플로우 생성

---

## Notes

### PRD

**기능**: YouTube Weekly Round 자동 생성 API

**API 엔드포인트**:
- `POST /api/youtube-weekly/create-round` - 새 라운드 생성
- `GET /api/youtube-weekly/rounds` - 라운드 목록 조회
- `GET /api/youtube-weekly/current` - 현재 진행 중인 라운드 조회

**파라미터** (선택):
- `week`: W01, W02, ... (없으면 현재 주차)
- `year`: 2026 (없으면 현재 연도)
- `start_date`: YYYY-MM-DD (없으면 다음 금요일)

**응답 예시**:
```json
{
  "success": true,
  "project_id": "prj-yt-W02-26",
  "cycle": "W02-26",
  "tasks_created": 10,
  "task_ids": ["tsk-yt-w02-26-01", ...],
  "start_date": "2026-01-09"
}
```

---

### n8n 워크플로우 설계

**워크플로우 이름**: `youtube-weekly-round-creator`

**트리거**: 매주 금요일 09:00 (Cron: `0 9 * * 5`)

**노드 구성**:
```
[Schedule Trigger]
    ↓
[HTTP Request]
    POST https://mcp.sosilab.synology.me/api/youtube-weekly/create-round
    Headers: Authorization: Bearer $LOOP_API_TOKEN
    ↓
[IF: success == true]
    ↓ Yes
[Slack/Discord Notification]
    "✅ YouTube W{week}-{year} 라운드 생성됨! 10개 Task 준비 완료"
    ↓ No
[Slack/Discord Notification]
    "⚠️ 라운드 생성 실패: {error}"
```

**환경변수**:
- `LOOP_API_TOKEN`: API 인증 토큰

---

### 작업 로그

#### 2026-01-03 01:30
**개요**: YouTube Weekly Round 자동 생성 API 구현

**변경사항**:
- 개발: `api/routers/youtube_weekly.py` 신규 생성
- 수정: `api/main.py`에 라우터 등록

**핵심 코드**:
- `create_round()`: Project + 10개 Task 자동 생성
- `list_rounds()`: 라운드 목록 조회
- `get_current_round()`: 현재 진행 중인 라운드 + Tasks 조회

**결과**: ✅ 로컬 테스트 성공

**다음 단계**:
- NAS 배포
- n8n 워크플로우 생성


---

## 참고 문서

- [[prj-vault-gpt]] - 소속 Project
- [[pgm-youtube-weekly]] - YouTube Weekly 프로그램

---

**Created**: 2026-01-03
**Assignee**: 김은향
**Due**: 2026-01-03
