---
entity_type: EntityTemplate
entity_id: tpl-{template-id}
entity_name: 템플릿 이름

# === 템플릿 타입 ===
# project_with_tasks: Project + Tasks 일괄 생성
# task_only: 기존 Project에 Task만 추가
template_type: task_only | project_with_tasks

description: "템플릿 설명"
icon: document | video | meeting | megaphone | calendar
category: ops | content | marketing | general

# === task_only 전용 ===
default_project_id: prj-xxx  # 기본 연결 프로젝트

# === project_with_tasks 전용 ===
folder_name: _Programs/ProgramName  # 프로젝트 생성 위치

project:
  name_template: "Project Name - {cycle}"
  program_id: pgm-xxx
  parent_id: trk-x
  owner: 담당자

# === Tasks 정의 (필수, 배열 형식) ===
tasks:
  - seq: 1
    name_template: "Task 이름"
    day_offset: 0          # 시작일 기준 오프셋
    assignee: 담당자
    type: ops | meeting | content
    time: "16:00"          # 선택: 미팅 시간
    checklist:             # 선택: 체크리스트
      - "항목 1"
      - "항목 2"
---

# 템플릿 스키마 가이드

> **새 템플릿 생성 시 이 파일을 참조하세요**

## 필수 규칙

1. **tasks는 반드시 배열 형식** (`tasks:` not `task:`)
2. **각 task에 seq 번호 필수**
3. **파일명**: `tpl-{id}.md`

## 템플릿 타입별 예시

### task_only (기존 Project에 Task 추가)

```yaml
template_type: task_only
default_project_id: prj-025

tasks:
  - seq: 1
    name_template: "주간 리뷰 미팅"
    day_offset: 0
    assignee: 김은향
    type: meeting
```

### project_with_tasks (Project + Tasks 일괄 생성)

```yaml
template_type: project_with_tasks
folder_name: _Programs/Youtube_Weekly

project:
  name_template: "YouTube - {cycle}"
  program_id: pgm-youtube-weekly
  owner: 한명학

tasks:
  - seq: 1
    name_template: "주제 선정"
    day_offset: 0
    assignee: 김은향
    type: ops
  - seq: 2
    name_template: "촬영"
    day_offset: 1
    assignee: 한명학
    type: ops
```

## 변수

| 변수 | 설명 | 예시 |
|------|------|------|
| `{cycle}` | 주차 (W04-26) | YouTube - W04-26 |
| `{date}` | 날짜 (YYYY-MM-DD) | 2026-01-27 |

---

**참조**: `api/routers/entity_templates.py`
