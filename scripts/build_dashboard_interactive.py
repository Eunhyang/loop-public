#!/usr/bin/env python3
"""
LOOP Interactive Dashboard Generator

API 연동된 인터랙티브 칸반 보드 생성
- Task/Project 생성/수정/삭제 UI
- API 서버와 실시간 연동

Usage:
    python scripts/build_dashboard_interactive.py [vault_path]

Prerequisites:
    API 서버가 실행 중이어야 함:
    uvicorn api.main:app --host 0.0.0.0 --port 8081
"""

import sys
from pathlib import Path

# 기존 build_dashboard.py 로직 재사용
sys.path.insert(0, str(Path(__file__).parent))
from build_dashboard import (
    VAULT_NAME, load_members, scan_vault, get_obsidian_uri, generate_html
)

# API 서버 URL (NAS/MacBook 공통)
API_BASE_URL = "http://localhost:8081"


# 기존 generate_html 함수를 덮어쓰기 (인터랙티브 UI 추가)
def generate_interactive_html(entities, vault_name, members):
    """API 연동 인터랙티브 Dashboard HTML 생성"""

    # 기존 HTML 생성
    base_html = generate_html(entities, vault_name, members)

    # Projects 옵션 생성
    projects = entities.get('Project', [])
    projects_options = ''.join([
        f'<option value="{p.get("entity_id")}">{p.get("entity_name")} ({p.get("entity_id")})</option>'
        for p in sorted(projects, key=lambda x: x.get('entity_id', ''))
    ])

    # Members 옵션 생성
    members_options = ''.join([
        f'<option value="{mid}">{m.get("icon", "👤")} {m.get("name", mid)}</option>'
        for mid, m in members.items()
    ])

    # Header에 버튼 추가
    header_buttons = f'''
        <div class="header-actions">
            <button class="btn-new" onclick="openNewTaskModal()">➕ New Task</button>
            <button class="btn-new" onclick="openNewProjectModal()">📁 New Project</button>
            <button class="btn-new" onclick="location.reload()">🔄 Refresh</button>
        </div>
    '''

    # Task 카드에 액션 버튼 추가를 위한 CSS
    interactive_css = '''
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}

        .header-actions {{
            display: flex;
            gap: 12px;
        }}

        .btn-new {{
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.95em;
            font-weight: 500;
            transition: all 0.2s;
        }}

        .btn-new:hover {{
            background: rgba(255,255,255,0.3);
        }}

        /* Modal 스타일 */
        .modal {{
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            animation: fadeIn 0.2s;
        }}

        @keyframes fadeIn {{
            from {{ opacity: 0; }}
            to {{ opacity: 1; }}
        }}

        .modal-content {{
            background: white;
            margin: 5% auto;
            padding: 0;
            width: 90%;
            max-width: 600px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            animation: slideDown 0.3s;
        }}

        @keyframes slideDown {{
            from {{ transform: translateY(-50px); opacity: 0; }}
            to {{ transform: translateY(0); opacity: 1; }}
        }}

        .modal-header {{
            padding: 24px 28px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}

        .modal-header h2 {{
            font-size: 1.4em;
            color: #333;
        }}

        .close {{
            font-size: 28px;
            color: #999;
            cursor: pointer;
            line-height: 1;
        }}

        .close:hover {{
            color: #333;
        }}

        .modal-body {{
            padding: 24px 28px;
            max-height: 60vh;
            overflow-y: auto;
        }}

        .form-group {{
            margin-bottom: 20px;
        }}

        .form-group label {{
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #555;
        }}

        .form-group input,
        .form-group select {{
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 0.95em;
            font-family: inherit;
        }}

        .form-group input:focus,
        .form-group select:focus {{
            outline: none;
            border-color: #667eea;
        }}

        .form-row {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }}

        .modal-footer {{
            padding: 20px 28px;
            border-top: 1px solid #e0e0e0;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }}

        .btn {{
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 0.95em;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }}

        .btn-primary {{
            background: #667eea;
            color: white;
        }}

        .btn-primary:hover {{
            background: #5568d3;
        }}

        .btn-secondary {{
            background: #e0e0e0;
            color: #555;
        }}

        .btn-secondary:hover {{
            background: #d0d0d0;
        }}

        /* Toast */
        .toast {{
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #333;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s;
            z-index: 2000;
        }}

        .toast.show {{
            opacity: 1;
            transform: translateY(0);
        }}

        .toast.success {{
            background: #4CAF50;
        }}

        .toast.error {{
            background: #f44336;
        }}
    '''

    # Task 상세/수정 Modal용 추가 CSS
    task_detail_css = '''
        .form-group textarea {{
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 0.95em;
            font-family: inherit;
            min-height: 150px;
            resize: vertical;
        }}

        .form-group textarea:focus {{
            outline: none;
            border-color: #667eea;
        }}

        .task-detail-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}

        .task-detail-id {{
            font-size: 0.9em;
            color: #888;
            font-family: monospace;
        }}

        .btn-danger {{
            background: #f44336;
            color: white;
        }}

        .btn-danger:hover {{
            background: #d32f2f;
        }}

        .modal-footer-left {{
            display: flex;
            justify-content: space-between;
            width: 100%;
        }}
    '''

    # Modals HTML
    modals_html = f'''
    <!-- Task Detail/Edit Modal -->
    <div id="taskDetailModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <div class="task-detail-header">
                    <h2>Task Details</h2>
                    <span class="task-detail-id" id="detailTaskId"></span>
                </div>
                <span class="close" onclick="closeTaskDetailModal()">&times;</span>
            </div>
            <div class="modal-body">
                <form id="taskDetailForm">
                    <div class="form-group">
                        <label for="detailTaskName">Task Name *</label>
                        <input type="text" id="detailTaskName" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="detailAssignee">Assignee *</label>
                            <select id="detailAssignee" required>
                                {members_options}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="detailPriority">Priority</label>
                            <select id="detailPriority">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="detailStatus">Status</label>
                            <select id="detailStatus">
                                <option value="todo">Todo</option>
                                <option value="doing">Doing</option>
                                <option value="done">Done</option>
                                <option value="blocked">Blocked</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="detailDue">Due Date</label>
                            <input type="date" id="detailDue">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="detailBody">Description (Markdown)</label>
                        <textarea id="detailBody" placeholder="Task description..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <div class="modal-footer-left">
                    <button class="btn btn-danger" onclick="deleteTask()">Delete</button>
                    <div>
                        <button class="btn btn-secondary" onclick="closeTaskDetailModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="updateTask()">Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- New Task Modal -->
    <div id="newTaskModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Create New Task</h2>
                <span class="close" onclick="closeNewTaskModal()">&times;</span>
            </div>
            <div class="modal-body">
                <form id="newTaskForm">
                    <div class="form-group">
                        <label for="taskName">Task Name *</label>
                        <input type="text" id="taskName" required placeholder="e.g., API 서버 구축">
                    </div>
                    <div class="form-group">
                        <label for="taskProject">Project *</label>
                        <select id="taskProject" required>
                            <option value="">Select Project...</option>
                            {projects_options}
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="taskAssignee">Assignee *</label>
                            <select id="taskAssignee" required>
                                <option value="">Select Assignee...</option>
                                {members_options}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="taskPriority">Priority</label>
                            <select id="taskPriority">
                                <option value="low">Low</option>
                                <option value="medium" selected>Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="taskStatus">Status</label>
                            <select id="taskStatus">
                                <option value="todo" selected>Todo</option>
                                <option value="doing">Doing</option>
                                <option value="done">Done</option>
                                <option value="blocked">Blocked</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="taskDue">Due Date</label>
                            <input type="date" id="taskDue">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="taskTags">Tags (comma separated)</label>
                        <input type="text" id="taskTags" placeholder="e.g., urgent, bug, feature">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeNewTaskModal()">Cancel</button>
                <button class="btn btn-primary" onclick="createTask()">Create Task</button>
            </div>
        </div>
    </div>

    <!-- New Project Modal -->
    <div id="newProjectModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Create New Project</h2>
                <span class="close" onclick="closeNewProjectModal()">&times;</span>
            </div>
            <div class="modal-body">
                <form id="newProjectForm">
                    <div class="form-group">
                        <label for="projectName">Project Name *</label>
                        <input type="text" id="projectName" required placeholder="e.g., API 서버 개발">
                    </div>
                    <div class="form-group">
                        <label for="projectOwner">Owner *</label>
                        <select id="projectOwner" required>
                            <option value="">Select Owner...</option>
                            {members_options}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="projectPriority">Priority</label>
                        <select id="projectPriority">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeNewProjectModal()">Cancel</button>
                <button class="btn btn-primary" onclick="createProject()">Create Project</button>
            </div>
        </div>
    </div>

    <!-- Toast -->
    <div id="toast" class="toast"></div>
    '''

    # JavaScript
    javascript = f'''
    <script>
        const API_URL = '{API_BASE_URL}';

        // Toast
        function showToast(message, type = 'success') {{
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.className = `toast ${{type}} show`;
            setTimeout(() => {{
                toast.className = 'toast';
            }}, 3000);
        }}

        // Modal
        function openNewTaskModal() {{
            document.getElementById('newTaskModal').style.display = 'block';
        }}

        function closeNewTaskModal() {{
            document.getElementById('newTaskModal').style.display = 'none';
            document.getElementById('newTaskForm').reset();
        }}

        function openNewProjectModal() {{
            document.getElementById('newProjectModal').style.display = 'block';
        }}

        function closeNewProjectModal() {{
            document.getElementById('newProjectModal').style.display = 'none';
            document.getElementById('newProjectForm').reset();
        }}

        // Task 생성
        async function createTask() {{
            const name = document.getElementById('taskName').value;
            const project_id = document.getElementById('taskProject').value;
            const assignee = document.getElementById('taskAssignee').value;
            const priority = document.getElementById('taskPriority').value;
            const status = document.getElementById('taskStatus').value;
            const due = document.getElementById('taskDue').value;
            const tags = document.getElementById('taskTags').value
                .split(',')
                .map(t => t.trim())
                .filter(t => t);

            if (!name || !project_id || !assignee) {{
                showToast('Please fill all required fields', 'error');
                return;
            }}

            try {{
                const response = await fetch(`${{API_URL}}/api/tasks`, {{
                    method: 'POST',
                    headers: {{ 'Content-Type': 'application/json' }},
                    body: JSON.stringify({{
                        entity_name: name,
                        project_id: project_id,
                        assignee: assignee,
                        priority: priority,
                        status: status,
                        due: due || null,
                        tags: tags
                    }})
                }});

                const data = await response.json();

                if (response.ok) {{
                    showToast(`Task created: ${{data.task_id}}`);
                    closeNewTaskModal();
                    setTimeout(() => location.reload(), 1500);
                }} else {{
                    showToast(data.detail || 'Failed to create task', 'error');
                }}
            }} catch (error) {{
                console.error('Error:', error);
                showToast('API server not running. Please start: uvicorn api.main:app --port 8081', 'error');
            }}
        }}

        // Project 생성
        async function createProject() {{
            const name = document.getElementById('projectName').value;
            const owner = document.getElementById('projectOwner').value;
            const priority = document.getElementById('projectPriority').value;

            if (!name || !owner) {{
                showToast('Please fill all required fields', 'error');
                return;
            }}

            try {{
                const response = await fetch(`${{API_URL}}/api/projects`, {{
                    method: 'POST',
                    headers: {{ 'Content-Type': 'application/json' }},
                    body: JSON.stringify({{
                        entity_name: name,
                        owner: owner,
                        priority: priority
                    }})
                }});

                const data = await response.json();

                if (response.ok) {{
                    showToast(`Project created: ${{data.project_id}}`);
                    closeNewProjectModal();
                    setTimeout(() => location.reload(), 1500);
                }} else {{
                    showToast(data.detail || 'Failed to create project', 'error');
                }}
            }} catch (error) {{
                console.error('Error:', error);
                showToast('API server not running', 'error');
            }}
        }}

        // Modal 외부 클릭 시 닫기
        window.onclick = function(event) {{
            const taskModal = document.getElementById('newTaskModal');
            const projectModal = document.getElementById('newProjectModal');
            const detailModal = document.getElementById('taskDetailModal');
            if (event.target == taskModal) closeNewTaskModal();
            if (event.target == projectModal) closeNewProjectModal();
            if (event.target == detailModal) closeTaskDetailModal();
        }}

        // ========================================
        // Task Detail Modal
        // ========================================
        let currentTaskId = null;

        async function openTaskDetail(taskId) {{
            currentTaskId = taskId;

            try {{
                const response = await fetch(`${{API_URL}}/api/tasks/${{taskId}}`);
                if (!response.ok) {{
                    showToast('Task not found', 'error');
                    return;
                }}

                const data = await response.json();
                const task = data.task;

                // Modal에 데이터 채우기
                document.getElementById('detailTaskId').textContent = task.entity_id;
                document.getElementById('detailTaskName').value = task.entity_name || '';
                document.getElementById('detailAssignee').value = task.assignee || '';
                document.getElementById('detailPriority').value = task.priority || 'medium';
                document.getElementById('detailStatus').value = task.status || 'todo';
                document.getElementById('detailDue').value = task.due || '';
                document.getElementById('detailBody').value = task._body || '';

                // Modal 표시
                document.getElementById('taskDetailModal').style.display = 'block';
            }} catch (error) {{
                console.error('Error:', error);
                showToast('Failed to load task details', 'error');
            }}
        }}

        function closeTaskDetailModal() {{
            document.getElementById('taskDetailModal').style.display = 'none';
            currentTaskId = null;
        }}

        async function updateTask() {{
            if (!currentTaskId) return;

            const data = {{
                entity_name: document.getElementById('detailTaskName').value,
                assignee: document.getElementById('detailAssignee').value,
                priority: document.getElementById('detailPriority').value,
                status: document.getElementById('detailStatus').value,
                due: document.getElementById('detailDue').value || null
            }};

            try {{
                const response = await fetch(`${{API_URL}}/api/tasks/${{currentTaskId}}`, {{
                    method: 'PUT',
                    headers: {{ 'Content-Type': 'application/json' }},
                    body: JSON.stringify(data)
                }});

                if (response.ok) {{
                    showToast('Task updated successfully');
                    closeTaskDetailModal();
                    setTimeout(() => location.reload(), 1000);
                }} else {{
                    const err = await response.json();
                    showToast(err.detail || 'Failed to update task', 'error');
                }}
            }} catch (error) {{
                console.error('Error:', error);
                showToast('Failed to update task', 'error');
            }}
        }}

        async function deleteTask() {{
            if (!currentTaskId) return;

            if (!confirm('Are you sure you want to delete this task?')) {{
                return;
            }}

            try {{
                const response = await fetch(`${{API_URL}}/api/tasks/${{currentTaskId}}`, {{
                    method: 'DELETE'
                }});

                if (response.ok) {{
                    showToast('Task deleted successfully');
                    closeTaskDetailModal();
                    setTimeout(() => location.reload(), 1000);
                }} else {{
                    const err = await response.json();
                    showToast(err.detail || 'Failed to delete task', 'error');
                }}
            }} catch (error) {{
                console.error('Error:', error);
                showToast('Failed to delete task', 'error');
            }}
        }}

        // ========================================
        // Task 카드 클릭 이벤트 재바인딩
        // ========================================
        document.addEventListener('DOMContentLoaded', function() {{
            document.querySelectorAll('.task-card').forEach(card => {{
                const taskIdEl = card.querySelector('.task-id');
                if (taskIdEl) {{
                    const taskId = taskIdEl.textContent.trim();
                    card.onclick = function(e) {{
                        e.preventDefault();
                        openTaskDetail(taskId);
                    }};
                    card.style.cursor = 'pointer';
                }}
            }});
        }});
    </script>
    '''

    # HTML 조합
    final_html = base_html

    # CSS 추가 (</style> 태그 직전에 삽입)
    final_html = final_html.replace('</style>', interactive_css + task_detail_css + '\n    </style>')

    # Header 수정 (header-meta 다음에 header-actions 추가)
    final_html = final_html.replace(
        '</div>\n    </div>\n\n    <div class="tabs">',
        '</div>\n        ' + header_buttons + '\n    </div>\n\n    <div class="tabs">'
    )

    # Modals & JavaScript 추가 (</body> 태그 직전에 삽입)
    final_html = final_html.replace('</body>', modals_html + '\n' + javascript + '\n</body>')

    return final_html


def main():
    # Vault 경로
    if len(sys.argv) > 1:
        vault_path = Path(sys.argv[1]).resolve()
    else:
        vault_path = Path.cwd()

    print(f"Scanning vault: {vault_path}")

    # 멤버 정보 로드
    members = load_members(vault_path)
    print(f"Members loaded: {len(members)}")

    # Vault 스캔
    entities = scan_vault(vault_path)

    # 통계
    print("\nEntities found:")
    for entity_type, entity_list in entities.items():
        if entity_list:
            print(f"  {entity_type}: {len(entity_list)}")

    # Interactive HTML 생성
    html = generate_interactive_html(entities, VAULT_NAME, members)

    # 저장
    output_dir = vault_path / "_dashboard"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / "index.html"

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"\n✅ Interactive Dashboard generated: {output_file}")
    print(f"\n⚠️  Make sure API server is running:")
    print(f"   cd {vault_path}")
    print(f"   uvicorn api.main:app --host 0.0.0.0 --port 8081")


if __name__ == "__main__":
    main()
