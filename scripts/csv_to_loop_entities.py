#!/usr/bin/env python3
"""
CSV 파일의 태스크를 LOOP vault의 Project/Task 엔티티로 변환하는 스크립트
"""

import csv
import os
import re
from collections import defaultdict
from datetime import datetime
from pathlib import Path


def clean_project_name(project_raw):
    """프로젝트 이름에서 Notion 링크 제거하고 정리"""
    if not project_raw:
        return None
    # Notion 링크 형식 제거: "Name (https-//...)"
    if '(' in project_raw and ')' in project_raw:
        project_name = project_raw.split('(')[0].strip()
    else:
        project_name = project_raw.strip()
    return project_name


def sanitize_filename(name):
    """파일명으로 사용할 수 있도록 문자열 정리"""
    # 파일명에 사용할 수 없는 문자 제거
    name = re.sub(r'[<>:"/\\|?*]', '', name)
    # 연속된 공백을 하나로
    name = re.sub(r'\s+', ' ', name)
    # 앞뒤 공백 제거
    name = name.strip()
    # 최대 길이 제한 (50자)
    if len(name) > 50:
        name = name[:50].rstrip()
    return name


def map_priority(csv_priority):
    """CSV Priority를 LOOP priority로 매핑"""
    csv_priority = (csv_priority or '').strip().lower()
    if csv_priority == 'high':
        return 'high', 'high'
    elif csv_priority == 'medium':
        return 'medium', 'medium'
    elif csv_priority == 'low':
        return 'low', 'low'
    else:
        return 'medium', 'medium'  # 기본값


def map_status(csv_status):
    """CSV Status를 LOOP status로 매핑"""
    csv_status = (csv_status or '').strip().lower()
    if 'progress' in csv_status:
        return 'in_progress'
    elif 'not started' in csv_status:
        return 'planning'
    elif 'done' in csv_status:
        return 'done'
    elif 'hold' in csv_status:
        return 'on_hold'
    else:
        return 'planning'  # 기본값


def create_project_directory(base_path, project_num, project_name_safe):
    """프로젝트 디렉토리 구조 생성"""
    project_dir = base_path / f"P{project_num:03d}_{project_name_safe}"
    tasks_dir = project_dir / "Tasks"
    results_dir = project_dir / "Results"

    project_dir.mkdir(parents=True, exist_ok=True)
    tasks_dir.mkdir(exist_ok=True)
    results_dir.mkdir(exist_ok=True)

    return project_dir, tasks_dir


def create_project_file(project_dir, project_id, project_num, project_name, owner, today):
    """project.md 파일 생성"""
    project_file = project_dir / "project.md"

    content = f"""---
entity_type: Project
entity_id: "{project_id}"
entity_name: "{project_name}"
created: {today}
updated: {today}
status: active

# === 계층 ===
parent_id: "trk-2"
aliases: []

# === 관계 ===
outgoing_relations- []
validates: []
validated_by: []

# === Project 전용 ===
owner: "{owner}"
budget: null
deadline: null
hypothesis_text: "Notion CSV에서 마이그레이션된 프로젝트"
experiments: []

# === 분류 ===
tags: ["migrated", "notion"]
priority_flag: medium
---

# {project_name}

> Project ID: `{project_id}` | Track: `trk-2` | Status: active

## 프로젝트 개요

이 프로젝트는 Notion Tasks 데이터베이스에서 마이그레이션되었습니다.

---

## Tasks

아래 Tasks/ 폴더에 프로젝트의 모든 태스크가 포함되어 있습니다.

---

## 참고 문서

- [[Track_2_Data]] - 소속 Track

---

**Created**: {today}
**Owner**: {owner}
"""

    with open(project_file, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"  ✓ Created: {project_file}")


def create_task_file(tasks_dir, task_id, task_name, project_id, assignee, priority, priority_flag, status, description, due_date, today):
    """Task 파일 생성"""
    # SSOT: tsk-{id}.md 강제 (tsk-022-24)
    task_file = tasks_dir / f"{task_id}.md"

    # Description 정리
    description_clean = (description or '').strip()
    if description_clean:
        description_section = f"\n{description_clean}\n"
    else:
        description_section = "\n(설명 없음)\n"

    # Due date 정리
    due_display = due_date if due_date else "미정"

    content = f"""---
entity_type: Task
entity_id: "{task_id}"
entity_name: "{task_name}"
created: {today}
updated: {today}
status: {status}

# === 계층 ===
parent_id: "{project_id}"
project_id: "{project_id}"
aliases: []

# === 관계 ===
outgoing_relations- []
validates: []
validated_by: []

# === Task 전용 ===
assignee: "{assignee}"
due: {due_date if due_date else "null"}
priority: {priority}
estimated_hours: null
actual_hours: null

# === 분류 ===
tags: ["migrated", "notion"]
priority_flag: {priority_flag}
---

# {task_name}

> Task ID: `{task_id}` | Project: `{project_id}` | Status: {status}

## 목표
{description_section}
---

## 상세 내용

### Notion에서 마이그레이션

- **마감일**: {due_display}
- **우선순위**: {priority_flag}
- **담당자**: {assignee}

---

## 체크리스트

- [ ] 태스크 내용 검토
- [ ] 실행 계획 수립
- [ ] 작업 시작

---

## 참고 문서

- [[{project_id}]] - 소속 Project

---

**Created**: {today}
**Assignee**: {assignee}
**Due**: {due_display}
"""

    with open(task_file, 'w', encoding='utf-8') as f:
        f.write(content)


def main():
    # 경로 설정
    base_dir = Path(__file__).parent.parent
    csv_file = base_dir / "Tasks 2b36a363106a8145878ff2796c1a6efc.csv"
    projects_base = base_dir / "50_Projects" / "2025"

    today = datetime.now().strftime("%Y-%m-%d")

    print("=" * 60)
    print("CSV → LOOP Entity 변환 시작")
    print("=" * 60)
    print()

    # CSV 읽기
    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        tasks = list(reader)

    # 필터링: In progress + Not started
    target_statuses = ['In progress', 'Not started']
    filtered_tasks = [t for t in tasks if t.get('Status', '').strip() in target_statuses]

    print(f"✓ CSV 파일 로드: {len(tasks)}개 태스크")
    print(f"✓ 필터링 완료: {len(filtered_tasks)}개 태스크 (In progress + Not started)")
    print()

    # 프로젝트별로 그룹화
    projects_dict = defaultdict(list)
    for task in filtered_tasks:
        project_name = clean_project_name(task.get('Projects', ''))
        if not project_name:
            project_name = '(프로젝트 없음)'
        projects_dict[project_name].append(task)

    print(f"✓ 프로젝트 그룹화: {len(projects_dict)}개 프로젝트")
    print()

    # 프로젝트 ID 시작 번호 (P001_Ontology 다음부터)
    next_project_num = 2

    # 각 프로젝트 처리
    for project_name, project_tasks in sorted(projects_dict.items(), key=lambda x: -len(x[1])):
        project_id = f"prj-{next_project_num:03d}"
        project_name_safe = sanitize_filename(project_name)

        print(f"[{project_id}] {project_name} ({len(project_tasks)}개 태스크)")

        # 프로젝트 디렉토리 생성
        project_dir, tasks_dir = create_project_directory(
            projects_base, next_project_num, project_name_safe
        )

        # Owner 결정 (첫 번째 태스크의 Assigned to 사용)
        owner = "미정"
        for task in project_tasks:
            assignee = (task.get('Assigned to', '') or '').strip()
            if assignee:
                owner = assignee
                break

        # project.md 생성
        create_project_file(
            project_dir, project_id, next_project_num, project_name, owner, today
        )

        # 각 태스크 처리
        for task_seq, task in enumerate(project_tasks, start=1):
            task_id = f"tsk-{next_project_num:03d}-{task_seq:02d}"
            task_name = (task.get('Name', '') or '').strip() or '(이름 없음)'
            assignee = (task.get('Assigned to', '') or '').strip() or '미정'
            priority, priority_flag = map_priority(task.get('Priority', ''))
            status = map_status(task.get('Status', ''))
            description = task.get('Description', '')

            # Action Date를 due로 사용
            due_date_raw = (task.get('Action Date', '') or '').strip()
            if due_date_raw:
                try:
                    # "December 17, 2025" 형식을 "2025-12-17"로 변환
                    due_date_obj = datetime.strptime(due_date_raw, "%B %d, %Y")
                    due_date = due_date_obj.strftime("%Y-%m-%d")
                except:
                    due_date = None
            else:
                due_date = None

            # Task 파일 생성
            create_task_file(
                tasks_dir, task_id, task_name, project_id, assignee,
                priority, priority_flag, status, description, due_date, today
            )

        print(f"  ✓ Created: {len(project_tasks)}개 태스크")
        print()

        next_project_num += 1

    print("=" * 60)
    print("✓ 변환 완료!")
    print(f"  - 프로젝트: {len(projects_dict)}개")
    print(f"  - 태스크: {len(filtered_tasks)}개")
    print("=" * 60)
    print()
    print("다음 단계:")
    print("  1. python3 scripts/validate_schema.py .")
    print("  2. python3 scripts/check_orphans.py .")
    print("  3. python3 scripts/build_graph_index.py .")


if __name__ == "__main__":
    main()
