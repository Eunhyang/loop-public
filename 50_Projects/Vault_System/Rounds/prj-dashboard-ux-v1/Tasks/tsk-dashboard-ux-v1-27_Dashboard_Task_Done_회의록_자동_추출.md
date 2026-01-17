---
entity_type: Task
entity_id: tsk-dashboard-ux-v1-27
entity_name: Dashboard - Task Done 회의록 자동 추출
created: 2026-01-06
updated: '2026-01-17'
status: todo
parent_id: prj-dashboard-ux-v1
project_id: prj-dashboard-ux-v1
aliases:
- tsk-dashboard-ux-v1-27
outgoing_relations:
- target: tsk-dashboard-ux-v1-26
  type: depends_on
validates: []
validated_by: []
assignee: 김은향
start_date: '2026-01-20'
due: '2026-01-20'
priority: medium
estimated_hours: null
actual_hours: null
type: dev
target_project: loop
tags:
- dashboard
- google
- docs
- meeting
- transcript
- automation
priority_flag: medium
---
# Dashboard - Task Done 회의록 자동 추출

> Task ID: `tsk-dashboard-ux-v1-27` | Project: `prj-dashboard-ux-v1` | Status: todo

## 목표

**완료 조건**:
1. type=meeting Task를 Done 처리 시 연결된 회의록 자동 검색
2. Google Docs에 저장된 회의록 내용 추출
3. Task.notes에 회의록 요약 자동 추가
4. 원본 Docs 링크 Task.links에 추가

---

## 상세 내용

### 배경

Google Meet에서 미팅 진행 후 녹취록/노트가 Google Docs로 자동 저장됨 (Workspace Business Standard+). 이를 Task 완료 시 자동으로 가져와서 기록.

### 의존성

- `tsk-dashboard-ux-v1-26` (Meeting Task Meet 생성) 완료 후 진행
- Google Workspace Business Standard 이상 플랜 필요 (녹취록 기능)

### 작업 내용

1. **회의록 검색 로직**
   - Task.meeting_link 또는 calendar_event_id로 연결된 Docs 검색
   - Drive API: 특정 폴더 또는 최근 파일에서 매칭
   - 파일명 패턴: "Meeting notes - {meeting title}"

2. **API 엔드포인트**
   - `GET /api/google/docs/find-transcript?event_id=` - 회의록 Docs 검색
   - `GET /api/google/docs/{id}/content` - Docs 내용 추출

3. **Docs API 연동**
   - documents.get() - 문서 내용 조회
   - 텍스트 추출 및 마크다운 변환

4. **자동화 플로우**
   - Task status → done 변경 시
   - type=meeting이고 meeting_link 있으면
   - 회의록 Docs 검색 → 내용 추출 → notes에 추가

5. **Dashboard UI**
   - Task 상세에서 "회의록 가져오기" 수동 버튼
   - 자동 추출된 회의록 표시

---

## 체크리스트

- [ ] Drive API 연동 (파일 검색)
- [ ] Docs API 연동 (내용 추출)
- [ ] API `/api/google/docs/find-transcript`
- [ ] API `/api/google/docs/{id}/content`
- [ ] Task Done 시 자동 추출 로직 (훅 또는 API 미들웨어)
- [ ] 마크다운 변환 로직
- [ ] Dashboard "회의록 가져오기" 버튼
- [ ] notes 필드 자동 업데이트
- [ ] 테스트 (Workspace 계정 필요)

---

## Notes

### PRD

#### 문제 정의

현재 Meeting Task 완료 시 회의록이 Google Docs에 별도로 존재하며, Task와 연결되지 않아 다음 문제 발생:

1. **정보 분산**: 회의 내용을 확인하려면 별도로 Google Docs 검색 필요
2. **컨텍스트 손실**: Task 히스토리에 회의 결과가 기록되지 않음
3. **추적성 부재**: 어떤 회의에서 어떤 결정이 내려졌는지 Task에서 바로 확인 불가
4. **수동 작업**: 회의록 링크를 수동으로 Task에 붙여넣기 해야 함

#### 목표

| 목표 | 성공 기준 |
|------|----------|
| 자동 연결 | Meeting Task Done 시 95% 이상 자동으로 회의록 발견 |
| 요약 추가 | Task.notes에 회의록 핵심 내용 3-5줄 요약 자동 추가 |
| 원클릭 접근 | Task에서 원본 Docs로 바로 이동 가능 |
| 수동 작업 제거 | 회의록 연결 위한 수동 작업 0건 |

#### 핵심 요구사항

**R1. 회의록 자동 검색**
- Task Done 처리 시 Google Drive API로 관련 회의록 검색
- 검색 패턴: `"Meeting notes - {task.entity_name}"` 또는 Task 제목 포함 문서
- 검색 범위: Task 생성일 ~ 현재
- 후보가 여러 개면 가장 최근 수정된 문서 선택

**R2. 회의록 내용 추출**
- Google Docs API로 문서 본문 추출
- 최대 추출 길이: 10,000자 (초과 시 truncate)

**R3. AI 요약 생성**
- 추출된 회의록을 3-5줄로 요약
- 요약 포함 항목: 참석자, 주요 논의, 결정사항, Action Items

**R4. Task 자동 업데이트**
- `task.notes`에 요약 추가 (기존 notes 유지, 하단에 append)
- `task.links`에 원본 Docs URL 추가

#### 기술 설계

**API 엔드포인트**

```
POST /api/tasks/{task_id}/extract-meeting-notes

Request: { "doc_id": "optional - 직접 지정 시" }

Response: {
  "success": true,
  "doc_url": "https://docs.google.com/...",
  "doc_title": "Meeting notes - Weekly Sync",
  "summary": "- 참석자: A, B, C\n- 주요 논의: ...",
  "updated_task": { ... }
}
```

**데이터 모델 확장**

```yaml
# Task 스키마 확장
meeting_notes:
  doc_id: string          # Google Docs ID
  doc_url: string         # 원본 링크
  extracted_at: datetime  # 추출 시각
  summary: string         # AI 요약
```

**처리 플로우**

```
Task Done 트리거
    ↓
task.type == "meeting" 확인
    ↓
Google Drive API: 파일 검색
    ↓
[후보 0개] → 수동 연결 옵션 표시
[후보 1개+] → 최신 문서 선택
    ↓
Google Docs API: 내용 추출
    ↓
AI 요약 생성 (Claude API)
    ↓
Task 업데이트 (notes, links)
    ↓
Dashboard 반영
```

**UI 컴포넌트**

1. **Done 처리 시 피드백**
   - 로딩: "회의록 검색 중..."
   - 성공: "회의록이 연결되었습니다" + 요약 미리보기
   - 실패: "회의록을 찾지 못했습니다" + 수동 연결 버튼

2. **수동 연결 모달**
   - Docs URL 입력 필드

#### 의존성

| 의존성 | 상태 | 비고 |
|--------|------|------|
| tsk-dashboard-ux-v1-26 (Meet 생성) | 선행 필수 | Meet 생성 시 회의록 자동 생성 설정 |
| Google Drive API | 필요 | 파일 검색용, OAuth scope: `drive.readonly` |
| Google Docs API | 필요 | 내용 추출용, OAuth scope: `documents.readonly` |
| Claude API | 필요 | 요약 생성용 |
| Google Workspace | 조건부 | 녹취록 자동 생성은 Business Standard+ 필요 |

---

## 참고 문서

- [[prj-dashboard-ux-v1]] - 소속 Project
- [[tsk-dashboard-ux-v1-26]] - 의존 Task (Meet 생성)
- Google Docs API: https://developers.google.com/docs/api
- Google Drive API: https://developers.google.com/drive/api

---

**Created**: 2026-01-06
**Assignee**: 김은향
