#!/usr/bin/env python3
"""
LOOP Strategy Dashboard Generator

Vault의 frontmatter를 읽어서 정적 HTML 칸반 보드를 생성합니다.
브라우저에서 열면 칸반 보드가 보이고, 클릭하면 Obsidian에서 해당 파일이 열립니다.

Usage:
    python scripts/build_dashboard.py [vault_path]

Output:
    _dashboard/index.html
"""

import os
import sys
import yaml
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional

# Vault 이름 (Obsidian URI용)
VAULT_NAME = "LOOP"

# 스캔할 폴더
SCAN_FOLDERS = [
    "01_North_Star",
    "20_Strategy",
    "50_Projects",
    "60_Hypotheses",
]

# 제외할 폴더
EXCLUDE_FOLDERS = [
    "00_Meta/_TEMPLATES",
    "10_Study",
    "90_Archive",
]

# 멤버 설정 파일
MEMBERS_FILE = "00_Meta/members.yaml"


def load_members(vault_path: Path) -> Dict[str, Dict]:
    """멤버 정보 로드"""
    members_path = vault_path / MEMBERS_FILE
    members = {}

    if members_path.exists():
        try:
            with open(members_path, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
                if data and 'members' in data:
                    for member in data['members']:
                        member_id = member.get('id', '')
                        if member_id:
                            members[member_id] = member
        except Exception as e:
            print(f"Warning: Failed to load members: {e}")

    return members


def get_member_display(assignee: str, members: Dict[str, Dict]) -> str:
    """assignee ID를 표시용 문자열로 변환 (아이콘 + 이름)"""
    if assignee in members:
        member = members[assignee]
        icon = member.get('icon', '👤')
        name = member.get('name', assignee)
        return f"{icon} {name}"
    return f"👤 {assignee}"


def extract_frontmatter(file_path: Path) -> Optional[Dict[str, Any]]:
    """마크다운 파일에서 YAML frontmatter 추출"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # YAML frontmatter 패턴
        match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
        if not match:
            return None

        yaml_content = match.group(1)
        data = yaml.safe_load(yaml_content)

        if data and isinstance(data, dict):
            # 파일 경로 추가
            data['_file_path'] = str(file_path)
            data['_file_name'] = file_path.stem
            return data
        return None
    except Exception as e:
        print(f"Warning: Failed to parse {file_path}: {e}")
        return None


def scan_vault(vault_path: Path) -> Dict[str, List[Dict]]:
    """Vault 스캔하여 entity_type별로 분류"""
    entities = {
        'NorthStar': [],
        'MetaHypothesis': [],
        'Condition': [],
        'Track': [],
        'Project': [],
        'Task': [],
        'Hypothesis': [],
        'Experiment': [],
    }

    for folder in SCAN_FOLDERS:
        folder_path = vault_path / folder
        if not folder_path.exists():
            continue

        for md_file in folder_path.rglob("*.md"):
            # 제외 폴더 체크
            relative_path = str(md_file.relative_to(vault_path))
            if any(excl in relative_path for excl in EXCLUDE_FOLDERS):
                continue

            data = extract_frontmatter(md_file)
            if data and 'entity_type' in data:
                entity_type = data['entity_type']
                if entity_type in entities:
                    # 상대 경로 저장 (Obsidian URI용)
                    data['_relative_path'] = str(md_file.relative_to(vault_path))
                    entities[entity_type].append(data)

    return entities


def get_obsidian_uri(vault_name: str, file_path: str) -> str:
    """Obsidian URI 생성"""
    # 파일 경로에서 .md 제거하고 URL 인코딩
    from urllib.parse import quote
    encoded_path = quote(file_path, safe='/')
    return f"obsidian://open?vault={quote(vault_name)}&file={encoded_path}"


def generate_html(entities: Dict[str, List[Dict]], vault_name: str, members: Dict[str, Dict]) -> str:
    """칸반 보드 HTML 생성"""

    # Task를 status별로 분류
    tasks_by_status = {
        'todo': [],
        'doing': [],
        'done': [],
        'blocked': [],
    }

    for task in entities.get('Task', []):
        status = task.get('status', 'todo').lower()
        if status in tasks_by_status:
            tasks_by_status[status].append(task)
        else:
            tasks_by_status['todo'].append(task)

    # validates 관계 매핑 (entity_id -> entity)
    all_entities = {}
    for entity_type, entity_list in entities.items():
        for entity in entity_list:
            if 'entity_id' in entity:
                all_entities[entity['entity_id']] = entity

    def get_validates_info(task: Dict) -> List[Dict]:
        """Task가 validates하는 대상 정보 추출"""
        validates = []

        # validates 필드
        if 'validates' in task and isinstance(task['validates'], list):
            for target_id in task['validates']:
                if target_id in all_entities:
                    target = all_entities[target_id]
                    validates.append({
                        'id': target_id,
                        'name': target.get('entity_name', target_id),
                        'path': target.get('_relative_path', ''),
                    })
                else:
                    validates.append({'id': target_id, 'name': target_id, 'path': ''})

        # outgoing_relations에서 validates 타입
        if 'outgoing_relations' in task and isinstance(task['outgoing_relations'], list):
            for rel in task['outgoing_relations']:
                if isinstance(rel, dict) and rel.get('type') == 'validates':
                    target_id = rel.get('target_id', '')
                    if target_id and target_id not in [v['id'] for v in validates]:
                        if target_id in all_entities:
                            target = all_entities[target_id]
                            validates.append({
                                'id': target_id,
                                'name': target.get('entity_name', target_id),
                                'path': target.get('_relative_path', ''),
                            })
                        else:
                            validates.append({'id': target_id, 'name': target_id, 'path': ''})

        return validates

    def render_task_card(task: Dict) -> str:
        """Task 카드 HTML 렌더링"""
        name = task.get('entity_name', task.get('_file_name', 'Unknown'))
        entity_id = task.get('entity_id', '')
        assignee_id = task.get('assignee', 'unassigned')
        assignee_display = get_member_display(assignee_id, members)
        status = task.get('status', 'todo')
        priority = task.get('priority', 'medium')
        tags = task.get('tags', [])
        due = task.get('due', '')
        file_path = task.get('_relative_path', '')
        validates = get_validates_info(task)

        # Project 정보
        project_id = task.get('project_id', '')
        project_info = all_entities.get(project_id, {})
        project_name = project_info.get('entity_name', project_id)
        project_path = project_info.get('_relative_path', '')

        uri = get_obsidian_uri(vault_name, file_path)

        priority_class = f"priority-{priority}"

        # 태그 HTML
        tags_html = ''
        if tags and isinstance(tags, list):
            tags_html = ''.join([f'<span class="tag">{tag}</span>' for tag in tags[:3]])

        # validates HTML
        validates_html = ''
        if validates:
            validates_links = []
            for v in validates:
                if v['path']:
                    v_uri = get_obsidian_uri(vault_name, v['path'])
                    validates_links.append(f'<a href="{v_uri}" class="validates-link">{v["name"]}</a>')
                else:
                    validates_links.append(f'<span class="validates-link">{v["name"]}</span>')
            validates_html = f'<div class="validates">validates: {" ".join(validates_links)}</div>'

        # Project 링크
        project_html = ''
        if project_id:
            if project_path:
                p_uri = get_obsidian_uri(vault_name, project_path)
                project_html = f'<a href="{p_uri}" class="project-link">{project_name}</a>'
            else:
                project_html = f'<span class="project-link">{project_name}</span>'

        return f'''
        <div class="task-card {priority_class}" onclick="window.location.href='{uri}'">
            <div class="task-header">
                <span class="task-name">{name}</span>
                <span class="task-id">{entity_id}</span>
            </div>
            <div class="task-meta">
                <span class="assignee">{assignee_display}</span>
                {f'<span class="due">📅 {due}</span>' if due else ''}
            </div>
            {f'<div class="task-project">📁 {project_html}</div>' if project_html else ''}
            {validates_html}
            <div class="task-tags">{tags_html}</div>
        </div>
        '''

    def render_kanban_column(status: str, tasks: List[Dict], emoji: str, color: str) -> str:
        """칸반 컬럼 렌더링"""
        cards_html = '\n'.join([render_task_card(t) for t in tasks])
        return f'''
        <div class="kanban-column" style="--column-color: {color}">
            <div class="column-header">
                <span class="column-title">{emoji} {status.upper()}</span>
                <span class="column-count">{len(tasks)}</span>
            </div>
            <div class="column-body">
                {cards_html if cards_html else '<div class="empty-column">No tasks</div>'}
            </div>
        </div>
        '''

    def render_entity_list(entity_type: str, entity_list: List[Dict], emoji: str) -> str:
        """엔티티 리스트 렌더링 (전략 계층용)"""
        if not entity_list:
            return ''

        items_html = ''
        for entity in sorted(entity_list, key=lambda x: x.get('entity_id', '')):
            name = entity.get('entity_name', entity.get('_file_name', 'Unknown'))
            entity_id = entity.get('entity_id', '')
            status = entity.get('status', '')
            file_path = entity.get('_relative_path', '')
            uri = get_obsidian_uri(vault_name, file_path)

            status_class = f"status-{status}" if status else ""

            items_html += f'''
            <a href="{uri}" class="entity-item {status_class}">
                <span class="entity-name">{name}</span>
                <span class="entity-id">{entity_id}</span>
                {f'<span class="entity-status">{status}</span>' if status else ''}
            </a>
            '''

        return f'''
        <div class="entity-section">
            <h3>{emoji} {entity_type}</h3>
            <div class="entity-list">
                {items_html}
            </div>
        </div>
        '''

    # 전체 HTML 생성
    html = f'''<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LOOP Strategy Dashboard</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f0f2f5;
            color: #333;
            min-height: 100vh;
        }}

        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 24px 32px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }}

        .header h1 {{
            font-size: 1.8em;
            margin-bottom: 8px;
        }}

        .header-meta {{
            font-size: 0.9em;
            opacity: 0.9;
        }}

        .tabs {{
            display: flex;
            background: white;
            border-bottom: 1px solid #e0e0e0;
            padding: 0 32px;
        }}

        .tab {{
            padding: 16px 24px;
            cursor: pointer;
            border-bottom: 3px solid transparent;
            font-weight: 500;
            color: #666;
            transition: all 0.2s;
        }}

        .tab:hover {{
            color: #667eea;
        }}

        .tab.active {{
            color: #667eea;
            border-bottom-color: #667eea;
        }}

        .tab-content {{
            display: none;
            padding: 24px 32px;
        }}

        .tab-content.active {{
            display: block;
        }}

        /* 칸반 보드 */
        .kanban-board {{
            display: flex;
            gap: 16px;
            overflow-x: auto;
            padding-bottom: 16px;
        }}

        .kanban-column {{
            flex: 1;
            min-width: 300px;
            max-width: 350px;
            background: #f8f9fa;
            border-radius: 12px;
            border-top: 4px solid var(--column-color);
        }}

        .column-header {{
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #e0e0e0;
        }}

        .column-title {{
            font-weight: 600;
            font-size: 1em;
        }}

        .column-count {{
            background: var(--column-color);
            color: white;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.85em;
            font-weight: 600;
        }}

        .column-body {{
            padding: 12px;
            max-height: calc(100vh - 300px);
            overflow-y: auto;
        }}

        .task-card {{
            background: white;
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 10px;
            cursor: pointer;
            transition: all 0.2s;
            border-left: 4px solid #ddd;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }}

        .task-card:hover {{
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }}

        .task-card.priority-high {{
            border-left-color: #f44336;
        }}

        .task-card.priority-medium {{
            border-left-color: #FF9800;
        }}

        .task-card.priority-low {{
            border-left-color: #4CAF50;
        }}

        .task-header {{
            margin-bottom: 10px;
        }}

        .task-name {{
            font-weight: 600;
            font-size: 0.95em;
            display: block;
            margin-bottom: 4px;
            color: #333;
        }}

        .task-id {{
            font-size: 0.75em;
            color: #888;
            font-family: monospace;
        }}

        .task-meta {{
            display: flex;
            gap: 12px;
            font-size: 0.85em;
            color: #666;
            margin-bottom: 8px;
        }}

        .task-project {{
            font-size: 0.85em;
            margin-bottom: 8px;
        }}

        .project-link {{
            color: #667eea;
            text-decoration: none;
        }}

        .project-link:hover {{
            text-decoration: underline;
        }}

        .validates {{
            font-size: 0.8em;
            color: #666;
            margin-bottom: 8px;
            padding: 6px 8px;
            background: #f5f5f5;
            border-radius: 4px;
        }}

        .validates-link {{
            color: #f5576c;
            text-decoration: none;
            font-weight: 500;
        }}

        .validates-link:hover {{
            text-decoration: underline;
        }}

        .task-tags {{
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
        }}

        .tag {{
            font-size: 0.7em;
            padding: 2px 8px;
            background: #e3f2fd;
            color: #1565c0;
            border-radius: 10px;
        }}

        .empty-column {{
            text-align: center;
            color: #999;
            padding: 24px;
            font-style: italic;
        }}

        /* 전략 계층 */
        .strategy-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }}

        .entity-section {{
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }}

        .entity-section h3 {{
            margin-bottom: 16px;
            color: #333;
            font-size: 1.1em;
        }}

        .entity-list {{
            display: flex;
            flex-direction: column;
            gap: 8px;
        }}

        .entity-item {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 14px;
            background: #f8f9fa;
            border-radius: 8px;
            text-decoration: none;
            color: inherit;
            transition: all 0.2s;
        }}

        .entity-item:hover {{
            background: #e8f4fd;
            transform: translateX(4px);
        }}

        .entity-name {{
            font-weight: 500;
        }}

        .entity-id {{
            font-size: 0.8em;
            color: #888;
            font-family: monospace;
        }}

        .entity-status {{
            font-size: 0.75em;
            padding: 2px 8px;
            border-radius: 10px;
            background: #e0e0e0;
        }}

        .entity-item.status-active .entity-status,
        .entity-item.status-validating .entity-status {{
            background: #E8F5E9;
            color: #2E7D32;
        }}

        .entity-item.status-fixed .entity-status {{
            background: #F3E5F5;
            color: #7B1FA2;
        }}

        .entity-item.status-in_progress .entity-status {{
            background: #E3F2FD;
            color: #1565C0;
        }}

        /* 프로젝트 섹션 */
        .project-card {{
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }}

        .project-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e0e0e0;
        }}

        .project-title {{
            font-size: 1.2em;
            font-weight: 600;
        }}

        .project-title a {{
            color: #333;
            text-decoration: none;
        }}

        .project-title a:hover {{
            color: #667eea;
        }}

        .progress-bar {{
            height: 8px;
            background: #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 8px;
        }}

        .progress-fill {{
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            border-radius: 4px;
        }}

        /* 반응형 */
        @media (max-width: 768px) {{
            .header {{
                padding: 16px;
            }}

            .tabs {{
                padding: 0 16px;
                overflow-x: auto;
            }}

            .tab {{
                padding: 12px 16px;
                white-space: nowrap;
            }}

            .tab-content {{
                padding: 16px;
            }}

            .kanban-board {{
                flex-direction: column;
            }}

            .kanban-column {{
                max-width: none;
            }}
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>LOOP Strategy Dashboard</h1>
        <div class="header-meta">
            Generated: {datetime.now().strftime("%Y-%m-%d %H:%M")} |
            Tasks: {len(entities.get('Task', []))} |
            Projects: {len(entities.get('Project', []))}
        </div>
    </div>

    <div class="tabs">
        <div class="tab active" onclick="showTab('kanban')">📋 Kanban Board</div>
        <div class="tab" onclick="showTab('strategy')">🎯 Strategy</div>
        <div class="tab" onclick="showTab('projects')">📁 Projects</div>
    </div>

    <div id="kanban" class="tab-content active">
        <div class="kanban-board">
            {render_kanban_column('todo', tasks_by_status['todo'], '📋', '#FF9800')}
            {render_kanban_column('doing', tasks_by_status['doing'], '⚡', '#2196F3')}
            {render_kanban_column('done', tasks_by_status['done'], '✅', '#4CAF50')}
            {render_kanban_column('blocked', tasks_by_status['blocked'], '🚫', '#f44336')}
        </div>
    </div>

    <div id="strategy" class="tab-content">
        <div class="strategy-grid">
            {render_entity_list('North Star', entities.get('NorthStar', []), '🎯')}
            {render_entity_list('Meta Hypotheses', entities.get('MetaHypothesis', []), '🔬')}
            {render_entity_list('Conditions', entities.get('Condition', []), '📋')}
            {render_entity_list('Tracks', entities.get('Track', []), '🛤️')}
        </div>
    </div>

    <div id="projects" class="tab-content">
        {generate_projects_section(entities, vault_name, all_entities, members)}
    </div>

    <script>
        function showTab(tabId) {{
            // 모든 탭 비활성화
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            // 선택된 탭 활성화
            document.querySelector(`[onclick="showTab('${{tabId}}')"]`).classList.add('active');
            document.getElementById(tabId).classList.add('active');
        }}
    </script>
</body>
</html>
'''

    return html


def generate_projects_section(entities: Dict, vault_name: str, all_entities: Dict, members: Dict[str, Dict]) -> str:
    """프로젝트 섹션 HTML 생성"""
    projects = entities.get('Project', [])
    tasks = entities.get('Task', [])

    if not projects:
        return '<p>No projects found.</p>'

    html = ''
    for project in sorted(projects, key=lambda x: x.get('entity_id', '')):
        name = project.get('entity_name', project.get('_file_name', 'Unknown'))
        entity_id = project.get('entity_id', '')
        file_path = project.get('_relative_path', '')
        uri = get_obsidian_uri(vault_name, file_path)
        track_id = project.get('track_id', '')

        # 프로젝트의 Task 필터링
        project_tasks = [t for t in tasks if t.get('project_id') == entity_id]
        done_count = len([t for t in project_tasks if t.get('status') == 'done'])
        total_count = len(project_tasks)
        progress = int((done_count / total_count * 100)) if total_count > 0 else 0

        # Track 정보
        track_info = all_entities.get(track_id, {})
        track_name = track_info.get('entity_name', track_id)
        track_path = track_info.get('_relative_path', '')

        track_html = ''
        if track_id:
            if track_path:
                track_uri = get_obsidian_uri(vault_name, track_path)
                track_html = f'<a href="{track_uri}" style="color: #667eea; text-decoration: none;">{track_name}</a>'
            else:
                track_html = track_name

        # Task 목록
        tasks_html = ''
        for task in sorted(project_tasks, key=lambda x: {'doing': 0, 'todo': 1, 'blocked': 2, 'done': 3}.get(x.get('status', 'todo'), 4)):
            t_name = task.get('entity_name', task.get('_file_name', ''))
            t_status = task.get('status', 'todo')
            t_assignee_id = task.get('assignee', 'unassigned')
            t_assignee_display = get_member_display(t_assignee_id, members)
            t_path = task.get('_relative_path', '')
            t_uri = get_obsidian_uri(vault_name, t_path)

            status_colors = {
                'todo': '#FF9800',
                'doing': '#2196F3',
                'done': '#4CAF50',
                'blocked': '#f44336',
            }
            status_color = status_colors.get(t_status, '#999')

            tasks_html += f'''
            <a href="{t_uri}" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8f9fa; border-radius: 6px; margin-bottom: 6px; text-decoration: none; color: inherit;">
                <span>{t_name}</span>
                <span style="display: flex; gap: 8px; align-items: center;">
                    <span style="font-size: 0.8em; color: #666;">{t_assignee_display}</span>
                    <span style="font-size: 0.75em; padding: 2px 8px; background: {status_color}; color: white; border-radius: 10px;">{t_status}</span>
                </span>
            </a>
            '''

        html += f'''
        <div class="project-card">
            <div class="project-header">
                <div>
                    <div class="project-title"><a href="{uri}">{name}</a></div>
                    <div style="font-size: 0.85em; color: #666;">
                        <code>{entity_id}</code> | Track: {track_html if track_html else 'N/A'}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.9em; color: #666;">Tasks: {done_count}/{total_count}</div>
                    <div class="progress-bar" style="width: 120px;">
                        <div class="progress-fill" style="width: {progress}%"></div>
                    </div>
                </div>
            </div>
            <div style="margin-top: 12px;">
                {tasks_html if tasks_html else '<p style="color: #999; font-style: italic;">No tasks</p>'}
            </div>
        </div>
        '''

    return html


def main():
    # Vault 경로 결정
    if len(sys.argv) > 1:
        vault_path = Path(sys.argv[1]).resolve()
    else:
        vault_path = Path.cwd()

    print(f"Scanning vault: {vault_path}")

    # 멤버 정보 로드
    members = load_members(vault_path)
    print(f"Members loaded: {len(members)}")
    for member_id, member in members.items():
        print(f"  {member.get('icon', '👤')} {member.get('name', member_id)} ({member_id})")

    # Vault 스캔
    entities = scan_vault(vault_path)

    # 통계 출력
    print("\nEntities found:")
    for entity_type, entity_list in entities.items():
        if entity_list:
            print(f"  {entity_type}: {len(entity_list)}")

    # HTML 생성
    html = generate_html(entities, VAULT_NAME, members)

    # 출력 디렉토리 생성
    output_dir = vault_path / "_dashboard"
    output_dir.mkdir(exist_ok=True)

    # HTML 파일 저장
    output_file = output_dir / "index.html"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"\nDashboard generated: {output_file}")
    print(f"Open in browser: file://{output_file}")


if __name__ == "__main__":
    main()
