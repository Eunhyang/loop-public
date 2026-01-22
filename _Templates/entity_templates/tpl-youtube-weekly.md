---
entity_type: EntityTemplate
entity_id: tpl-youtube-weekly
entity_name: YouTube Weekly Round

template_type: project_with_tasks
description: "YouTube 1주 1업로드 라운드 생성 (Project + 11 Tasks)"
icon: video
category: content
folder_name: _Programs/Youtube_Weekly

project:
  name_template: "YouTube - {cycle}"
  program_id: pgm-youtube-weekly
  parent_id: trk-3
  owner: 한명학

tasks:
  - seq: 1
    name_template: "주제 선정"
    day_offset: 0
    assignee: 김은향
    type: ops

  - seq: 2
    name_template: "원고 작성"
    day_offset: 1
    assignee: 한명학
    type: ops

  - seq: 3
    name_template: "원고 수정 + 촬영"
    day_offset: 2
    assignee: 한명학
    type: ops

  - seq: 4
    name_template: "편집 외주"
    day_offset: 3
    assignee: 외주
    type: ops

  - seq: 5
    name_template: "썸네일 제작"
    day_offset: 10
    assignee: 김은향
    type: ops

  - seq: 6
    name_template: "업로드"
    day_offset: 10
    assignee: 한명학
    type: ops
    checklist:
      - "본문 작성"
      - "댓글 고정 내용 작성"
      - "Branch.io 측정 링크 설정"

  - seq: 7
    name_template: "쇼츠 #1"
    day_offset: 11
    assignee: 한명학
    type: ops

  - seq: 8
    name_template: "쇼츠 #2"
    day_offset: 12
    assignee: 한명학
    type: ops

  - seq: 9
    name_template: "쇼츠 #3"
    day_offset: 13
    assignee: 한명학
    type: ops

  - seq: 10
    name_template: "쇼츠 #4"
    day_offset: 14
    assignee: 한명학
    type: ops

  - seq: 11
    name_template: "쇼츠 #5"
    day_offset: 15
    assignee: 한명학
    type: ops
---

# YouTube Weekly Round Template

YouTube 1주 1업로드 프로젝트를 위한 템플릿입니다.

## 포함 항목
- Project 1개
- Task 11개 (주제 선정 ~ 쇼츠 #5)

## 사용법
1. 시작일 선택
2. Cycle 자동 계산 (예: W04-26)
3. Create 클릭
