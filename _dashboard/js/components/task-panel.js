/**
 * TaskPanel Component
 * Task 상세 보기/수정 사이드 패널
 */
const TaskPanel = {
    currentTask: null,

    /**
     * 패널 초기화 - Select 옵션 채우기
     */
    init() {
        this.populateSelects();
        this.setupEventListeners();
    },

    /**
     * Select 옵션들 채우기
     */
    populateSelects() {
        // Projects
        const projectEl = document.getElementById('panelTaskProject');
        if (projectEl) {
            projectEl.innerHTML = State.projects.map(p =>
                `<option value="${p.entity_id}">${p.entity_name || p.entity_id}</option>`
            ).join('');
        }

        // Assignees
        const assigneeEl = document.getElementById('panelTaskAssignee');
        if (assigneeEl) {
            assigneeEl.innerHTML = State.members.map(m =>
                `<option value="${m.id}">${m.name}</option>`
            ).join('');
        }

        // Statuses
        const statusEl = document.getElementById('panelTaskStatus');
        if (statusEl) {
            const statuses = State.getTaskStatuses();
            const statusLabels = State.getTaskStatusLabels();
            statusEl.innerHTML = statuses.map(s =>
                `<option value="${s}">${statusLabels[s]}</option>`
            ).join('');
        }

        // Priorities
        const priorityEl = document.getElementById('panelTaskPriority');
        if (priorityEl) {
            const priorities = State.getPriorities();
            const priorityLabels = State.getPriorityLabels();
            priorityEl.innerHTML = priorities.map(p =>
                `<option value="${p}">${priorityLabels[p]}</option>`
            ).join('');
        }
    },

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // Close button
        document.getElementById('taskPanelClose')?.addEventListener('click', () => this.close());

        // Overlay click
        document.getElementById('taskPanelOverlay')?.addEventListener('click', () => this.close());

        // Cancel button
        document.getElementById('panelTaskCancel')?.addEventListener('click', () => this.close());

        // Save button
        document.getElementById('panelTaskSave')?.addEventListener('click', () => this.save());

        // Delete button
        document.getElementById('panelTaskDelete')?.addEventListener('click', () => this.delete());
    },

    /**
     * 새 Task 패널 열기
     */
    openNew() {
        this.currentTask = null;

        document.getElementById('taskPanelTitle').textContent = 'New Task';
        document.getElementById('panelTaskId').textContent = '';
        document.getElementById('panelTaskId').style.display = 'none';
        document.getElementById('panelTaskName').value = '';
        document.getElementById('panelTaskStatus').value = 'todo';
        document.getElementById('panelTaskPriority').value = 'medium';
        document.getElementById('panelTaskDue').value = '';
        document.getElementById('panelTaskNotes').value = '';

        // 현재 필터된 프로젝트 선택
        if (State.currentProject !== 'all') {
            document.getElementById('panelTaskProject').value = State.currentProject;
        }

        // Relations 숨기기 (새 Task는 관계 없음)
        document.getElementById('panelTaskRelations').innerHTML =
            '<div style="color: #999; font-style: italic;">Save task to see relations</div>';

        // Delete 버튼 숨기기
        document.getElementById('panelTaskDelete').style.display = 'none';

        this.show();
    },

    /**
     * Task 상세 패널 열기
     */
    open(taskId) {
        const task = State.getTaskById(taskId);
        if (!task) {
            showToast('Task not found', 'error');
            return;
        }

        this.currentTask = task;

        document.getElementById('taskPanelTitle').textContent = 'Task Detail';
        document.getElementById('panelTaskId').textContent = task.entity_id;
        document.getElementById('panelTaskId').style.display = 'block';
        document.getElementById('panelTaskName').value = task.entity_name || '';
        document.getElementById('panelTaskProject').value = task.project_id || '';
        document.getElementById('panelTaskAssignee').value = task.assignee || '';
        document.getElementById('panelTaskStatus').value = State.normalizeStatus(task.status);
        document.getElementById('panelTaskPriority').value = task.priority || 'medium';
        document.getElementById('panelTaskDue').value = task.due || '';
        document.getElementById('panelTaskNotes').value = task.notes || '';

        // Relations 표시
        this.renderRelations(task);

        // Delete 버튼 표시
        document.getElementById('panelTaskDelete').style.display = 'block';

        this.show();
    },

    /**
     * Relations 렌더링
     */
    renderRelations(task) {
        const relationsEl = document.getElementById('panelTaskRelations');
        const project = State.getProjectById(task.project_id);
        const items = [];

        // Track
        if (project) {
            const track = State.getTrackForProject(project);
            if (track) {
                items.push(`
                    <div class="panel-relation-item">
                        <span class="panel-relation-label">Track</span>
                        <span class="panel-relation-value track">${track.entity_name || track.entity_id}</span>
                    </div>
                `);
            }
        }

        // validates
        if (task.validates && task.validates.length > 0) {
            items.push(`
                <div class="panel-relation-item">
                    <span class="panel-relation-label">Validates</span>
                    <span class="panel-relation-value validates">${task.validates.join(', ')}</span>
                </div>
            `);
        }

        // conditions_3y
        if (project?.conditions_3y && project.conditions_3y.length > 0) {
            items.push(`
                <div class="panel-relation-item">
                    <span class="panel-relation-label">Condition</span>
                    <span class="panel-relation-value condition">${project.conditions_3y.join(', ')}</span>
                </div>
            `);
        }

        // outgoing_relations
        if (task.outgoing_relations && task.outgoing_relations.length > 0) {
            task.outgoing_relations.forEach(rel => {
                items.push(`
                    <div class="panel-relation-item">
                        <span class="panel-relation-label">${rel.type}</span>
                        <span class="panel-relation-value">${rel.target_id}</span>
                    </div>
                `);
            });
        }

        if (items.length === 0) {
            relationsEl.innerHTML = '<div style="color: #999; font-style: italic;">No relations</div>';
        } else {
            relationsEl.innerHTML = items.join('');
        }
    },

    /**
     * 패널 표시
     */
    show() {
        document.getElementById('taskPanel').classList.add('active');
        document.getElementById('taskPanelOverlay').classList.add('active');
        document.getElementById('panelTaskName').focus();
    },

    /**
     * 패널 닫기
     */
    close() {
        document.getElementById('taskPanel').classList.remove('active');
        document.getElementById('taskPanelOverlay').classList.remove('active');
        this.currentTask = null;
    },

    /**
     * Task 저장
     */
    async save() {
        const taskData = {
            entity_name: document.getElementById('panelTaskName').value.trim(),
            project_id: document.getElementById('panelTaskProject').value,
            assignee: document.getElementById('panelTaskAssignee').value,
            status: document.getElementById('panelTaskStatus').value,
            priority: document.getElementById('panelTaskPriority').value,
            due: document.getElementById('panelTaskDue').value || null
        };

        // Validation
        if (!taskData.entity_name) {
            showToast('Please enter task name', 'error');
            return;
        }
        if (!taskData.project_id) {
            showToast('Please select a project', 'error');
            return;
        }
        if (!taskData.assignee) {
            showToast('Please select an assignee', 'error');
            return;
        }

        try {
            let result;
            if (this.currentTask) {
                // Update
                result = await API.updateTask(this.currentTask.entity_id, taskData);
            } else {
                // Create
                result = await API.createTask(taskData);
            }

            if (result.success) {
                showToast(this.currentTask ? 'Task updated' : 'Task created', 'success');
                await State.reloadTasks();
                Kanban.render();
                this.close();
            } else {
                showToast(result.message || result.detail || 'Save failed', 'error');
            }
        } catch (err) {
            console.error('Save task error:', err);
            showToast('Error saving task', 'error');
        }
    },

    /**
     * Task 삭제
     */
    async delete() {
        if (!this.currentTask) return;

        const confirmed = confirm(`Delete "${this.currentTask.entity_name}"?`);
        if (!confirmed) return;

        try {
            const result = await API.deleteTask(this.currentTask.entity_id);
            if (result.success) {
                showToast('Task deleted', 'success');
                await State.reloadTasks();
                Kanban.render();
                this.close();
            } else {
                showToast(result.message || result.detail || 'Delete failed', 'error');
            }
        } catch (err) {
            console.error('Delete task error:', err);
            showToast('Error deleting task', 'error');
        }
    }
};
