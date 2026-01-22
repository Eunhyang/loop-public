---
entity_type: EntityTemplate
entity_id: tpl-weekly-review-meeting
entity_name: 주간 리뷰 미팅

template_type: task_only
description: "주간 리뷰 미팅 Task 생성 (16:00)"
icon: meeting
category: ops
default_project_id: prj-025

tasks:
  - seq: 1
    name_template: "주간 리뷰 미팅"
    day_offset: 0
    assignee: 김은향
    type: meeting
    time: "16:00"
---

# 주간 리뷰 미팅 Template

주간 리뷰 미팅 Task를 생성하는 템플릿입니다.

## 포함 항목
- Task 1개 (16:00 미팅)

## 사용법
1. 미팅 날짜 선택
2. 연결할 Project 선택 (선택사항)
3. Create 클릭
