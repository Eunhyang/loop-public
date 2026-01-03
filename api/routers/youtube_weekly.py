"""
YouTube Weekly Round 자동 생성 API

매주 금요일 n8n에서 호출하여 새 라운드(Project + 10개 Task) 자동 생성
pgm-youtube-weekly 프로그램의 Round 관리

Usage:
    POST /api/youtube-weekly/create-round
    POST /api/youtube-weekly/create-round?week=W03&year=2026  # 특정 주차 지정
"""

import yaml
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..cache import get_cache
from ..utils.vault_utils import get_vault_dir, sanitize_filename

router = APIRouter(prefix="/api/youtube-weekly", tags=["youtube-weekly"])

# Vault 경로
VAULT_DIR = get_vault_dir()
YOUTUBE_WEEKLY_DIR = VAULT_DIR / "50_Projects" / "Youtube_Weekly"
ROUNDS_DIR = YOUTUBE_WEEKLY_DIR / "Rounds"

# 프로그램 정보
PROGRAM_ID = "pgm-youtube-weekly"
PARENT_TRACK = "trk-3"  # YouTube는 Track 3 (인지도/마케팅)
CONDITIONS_3Y = ["cond-a"]  # Condition A에 기여

# Task 템플릿 (10개)
TASK_TEMPLATES = [
    {"seq": 1, "name": "주제 선정", "day_offset": 0, "assignee": "김은향"},       # 금
    {"seq": 2, "name": "원고 작성", "day_offset": 1, "assignee": "한명학"},       # 토
    {"seq": 3, "name": "원고 수정 + 촬영", "day_offset": 2, "assignee": "한명학"}, # 일
    {"seq": 4, "name": "편집 외주", "day_offset": 3, "assignee": "외주"},         # 월~일 (1주)
    {"seq": 5, "name": "썸네일 + 업로드", "day_offset": 10, "assignee": "한명학"}, # 다음주 월
    {"seq": 6, "name": "쇼츠 #1", "day_offset": 11, "assignee": "한명학"},        # 다음주 화
    {"seq": 7, "name": "쇼츠 #2", "day_offset": 12, "assignee": "한명학"},        # 다음주 수
    {"seq": 8, "name": "쇼츠 #3", "day_offset": 13, "assignee": "한명학"},        # 다음주 목
    {"seq": 9, "name": "쇼츠 #4", "day_offset": 14, "assignee": "한명학"},        # 다음주 금
    {"seq": 10, "name": "쇼츠 #5", "day_offset": 15, "assignee": "한명학"},       # 다음주 토
]


class CreateRoundRequest(BaseModel):
    """Round 생성 요청"""
    week: Optional[str] = None  # W01, W02, ... (없으면 현재 주차)
    year: Optional[int] = None  # 2026 (없으면 현재 연도)
    start_date: Optional[str] = None  # YYYY-MM-DD (없으면 다음 금요일)


class CreateRoundResponse(BaseModel):
    """Round 생성 응답"""
    success: bool
    project_id: str
    project_name: str
    cycle: str
    directory: str
    tasks_created: int
    task_ids: list[str]
    start_date: str
    message: str


def get_current_week_info() -> tuple[int, int, datetime]:
    """현재 주차 정보 반환 (year, week_number, next_friday)"""
    today = datetime.now()

    # 다음 금요일 찾기
    days_until_friday = (4 - today.weekday()) % 7
    if days_until_friday == 0 and today.hour >= 12:  # 금요일 오후면 다음 금요일
        days_until_friday = 7
    next_friday = today + timedelta(days=days_until_friday)

    # ISO 주차
    year, week_num, _ = next_friday.isocalendar()

    return year, week_num, next_friday


def get_next_project_id() -> str:
    """다음 YouTube Weekly Project ID 생성 (prj-yt-WXX-YY)"""
    cache = get_cache()

    # 기존 YouTube Weekly 프로젝트 ID 검색
    all_projects = cache.get_all_projects()
    yt_projects = [p for p in all_projects if p.get("entity_id", "").startswith("prj-yt-")]

    if not yt_projects:
        return "prj-yt-W01-26"  # 첫 프로젝트

    # 최신 ID 파싱하여 다음 번호 생성
    # 형식: prj-yt-WXX-YY (WXX=주차, YY=연도 마지막 2자리)
    # 단순히 새 주차로 생성
    year, week_num, _ = get_current_week_info()
    return f"prj-yt-W{week_num:02d}-{year % 100}"


@router.post("/create-round", response_model=CreateRoundResponse)
def create_round(request: CreateRoundRequest = CreateRoundRequest()):
    """
    YouTube Weekly Round (Project + Tasks) 자동 생성

    n8n에서 매주 금요일 호출하여 새 라운드 생성
    """
    # 1. 주차/연도 결정
    if request.year and request.week:
        year = request.year
        week_str = request.week.upper()
        week_num = int(week_str.replace("W", ""))
        # 시작일 계산 (해당 주의 금요일)
        jan_1 = datetime(year, 1, 1)
        start_date = jan_1 + timedelta(weeks=week_num - 1, days=(4 - jan_1.weekday()) % 7)
    elif request.start_date:
        start_date = datetime.strptime(request.start_date, "%Y-%m-%d")
        year, week_num, _ = start_date.isocalendar()
        week_str = f"W{week_num:02d}"
    else:
        year, week_num, start_date = get_current_week_info()
        week_str = f"W{week_num:02d}"

    year_short = year % 100
    cycle = week_str  # W34 (연도 suffix 제거)

    # 2. Project ID 생성 (ID에는 연도 유지 - 고유성)
    project_id = f"prj-yt-{week_str}-{year_short}"
    project_name = f"YouTube - {cycle}"

    # 3. 중복 체크
    cache = get_cache()
    existing = cache.get_project(project_id)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Round already exists: {project_id}"
        )

    # 4. Round 디렉토리 생성
    round_dir = ROUNDS_DIR / f"{project_id}"
    round_dir.mkdir(parents=True, exist_ok=True)
    tasks_dir = round_dir / "Tasks"
    tasks_dir.mkdir(exist_ok=True)

    # 5. Project 파일 생성
    today_str = datetime.now().strftime("%Y-%m-%d")
    start_date_str = start_date.strftime("%Y-%m-%d")

    # 마지막 쇼츠 업로드일 (시작일 + 15일)
    end_date = start_date + timedelta(days=15)
    end_date_str = end_date.strftime("%Y-%m-%d")

    project_frontmatter = {
        "entity_type": "Project",
        "entity_id": project_id,
        "entity_name": project_name,
        "created": today_str,
        "updated": today_str,
        "status": "active",

        # Program-Round 연결
        "program_id": PROGRAM_ID,
        "cycle": cycle,

        # 계층 (전략 연결)
        "parent_id": PARENT_TRACK,
        "conditions_3y": CONDITIONS_3Y,
        "aliases": [project_id, project_name],

        # Project 정보
        "owner": "한명학",
        "budget": None,
        "deadline": end_date_str,

        # Impact 판정
        "expected_impact": {
            "statement": f"{cycle} 영상이 예정대로 업로드되면 주간 업로드 일관성이 유지됨이 증명된다",
            "metric": "업로드 완료 여부 + 쇼츠 5개",
            "target": f"{end_date_str}까지 본편 1개 + 쇼츠 5개 업로드"
        },

        "realized_impact": {
            "verdict": None,
            "outcome": None,
            "evidence_links": [],
            "decided": None
        },

        # 관계
        "outgoing_relations": [],
        "validates": [],
        "validated_by": [],
        "experiments": [],
        "tags": ["youtube", cycle.lower(), "round"],
        "priority_flag": "medium"
    }

    project_content = f"""---
{yaml.dump(project_frontmatter, allow_unicode=True, sort_keys=False)}---

# {project_name}

> Project ID: `{project_id}` | Program: `{PROGRAM_ID}` | Cycle: {cycle}

## 개요

YouTube 1주 1업로드 프로그램의 {cycle} 라운드.

**기간**: {start_date_str} ~ {end_date_str}

---

## Tasks

| # | Task | 담당 | 마감 | Status |
|---|------|------|------|--------|
"""

    # 6. Task 파일들 생성
    task_ids = []

    for task in TASK_TEMPLATES:
        task_id = f"tsk-yt-{week_str.lower()}-{year_short}-{task['seq']:02d}"
        task_name = f"YouTube {cycle} - {task['name']}"
        task_due = start_date + timedelta(days=task["day_offset"])
        task_due_str = task_due.strftime("%Y-%m-%d")

        task_frontmatter = {
            "entity_type": "Task",
            "entity_id": task_id,
            "entity_name": task_name,
            "created": today_str,
            "updated": today_str,
            "status": "todo",

            # 계층
            "parent_id": project_id,
            "project_id": project_id,
            "aliases": [task_id],

            # 관계
            "outgoing_relations": [],
            "validates": [],
            "validated_by": [],

            # Task 전용
            "assignee": task["assignee"],
            "start_date": start_date_str if task["seq"] == 1 else None,
            "due": task_due_str,
            "priority": "medium",
            "estimated_hours": None,
            "actual_hours": None,

            # Task 유형
            "type": "ops",
            "target_project": None,

            # 분류
            "tags": ["youtube", cycle.lower(), task["name"].replace(" ", "-").lower()],
            "priority_flag": "medium"
        }

        task_content = f"""---
{yaml.dump(task_frontmatter, allow_unicode=True, sort_keys=False)}---

# {task_name}

> Task ID: `{task_id}` | Project: `{project_id}` | Due: {task_due_str}

## 목표

**완료 조건**:
- [ ] {task["name"]} 완료

---

## 체크리스트

- [ ]

---

## Notes

---

**Created**: {today_str}
**Assignee**: {task["assignee"]}
**Due**: {task_due_str}
"""

        # Task 파일 저장
        task_filename = f"{task_id}_{sanitize_filename(task['name'])}.md"
        task_file = tasks_dir / task_filename
        with open(task_file, 'w', encoding='utf-8') as f:
            f.write(task_content)

        task_ids.append(task_id)

        # Project 테이블에 Task 추가
        project_content += f"| {task['seq']:02d} | [[{task_id}]] {task['name']} | {task['assignee']} | {task_due_str} | todo |\n"

        # 캐시 업데이트
        cache.set_task(task_id, task_frontmatter, task_file)

    # 7. Project 파일 저장
    project_content += f"""
---

**Created**: {today_str}
**Owner**: 한명학
"""

    project_file = round_dir / "Project_정의.md"
    with open(project_file, 'w', encoding='utf-8') as f:
        f.write(project_content)

    # 8. 캐시 업데이트
    cache.set_project(project_id, project_frontmatter, project_file)

    return CreateRoundResponse(
        success=True,
        project_id=project_id,
        project_name=project_name,
        cycle=cycle,
        directory=str(round_dir.relative_to(VAULT_DIR)),
        tasks_created=len(task_ids),
        task_ids=task_ids,
        start_date=start_date_str,
        message=f"Round {cycle} created with {len(task_ids)} tasks"
    )


@router.get("/rounds")
def list_rounds():
    """YouTube Weekly 라운드 목록 조회"""
    cache = get_cache()
    all_projects = cache.get_all_projects()

    # YouTube Weekly 프로젝트만 필터링
    yt_rounds = [
        {
            "project_id": p.get("entity_id"),
            "project_name": p.get("entity_name"),
            "cycle": p.get("cycle"),
            "status": p.get("status"),
            "deadline": p.get("deadline"),
            "created": p.get("created")
        }
        for p in all_projects
        if p.get("program_id") == PROGRAM_ID
    ]

    # cycle로 정렬 (최신 먼저)
    yt_rounds.sort(key=lambda x: x.get("cycle", ""), reverse=True)

    return {
        "program_id": PROGRAM_ID,
        "total_rounds": len(yt_rounds),
        "rounds": yt_rounds
    }


@router.get("/current")
def get_current_round():
    """현재 진행 중인 라운드 조회"""
    cache = get_cache()
    all_projects = cache.get_all_projects()

    # YouTube Weekly 프로젝트 중 active 상태인 것
    active_rounds = [
        p for p in all_projects
        if p.get("program_id") == PROGRAM_ID and p.get("status") == "active"
    ]

    if not active_rounds:
        return {"current": None, "message": "No active round"}

    # 가장 최근 생성된 것
    current = max(active_rounds, key=lambda x: x.get("created", ""))

    # 해당 프로젝트의 Tasks 조회
    project_id = current.get("entity_id")
    all_tasks = cache.get_all_tasks()
    tasks = [
        {
            "task_id": t.get("entity_id"),
            "name": t.get("entity_name"),
            "status": t.get("status"),
            "assignee": t.get("assignee"),
            "due": t.get("due")
        }
        for t in all_tasks
        if t.get("project_id") == project_id
    ]

    # seq로 정렬
    tasks.sort(key=lambda x: x.get("task_id", ""))

    return {
        "current": {
            "project_id": project_id,
            "project_name": current.get("entity_name"),
            "cycle": current.get("cycle"),
            "status": current.get("status"),
            "deadline": current.get("deadline"),
            "tasks": tasks
        }
    }
