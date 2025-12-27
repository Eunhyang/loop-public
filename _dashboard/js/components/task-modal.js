/**
 * TaskModal Component
 * Task 생성/수정 모달
 */
const TaskModal = {
    /**
     * Select 옵션들 채우기
     */
    populateSelects() {
        // Projects
        const projectEl = document.getElementById('taskProject');
        projectEl.innerHTML = State.projects.map(p =>
            `<option value="${p.entity_id}">${p.entity_name || p.entity_id}</option>`
        ).join('');

        // Assignees
        const assigneeEl = document.getElementById('taskAssignee');
        assigneeEl.innerHTML = State.members.map(m =>
            `<option value="${m.id}">${m.name}</option>`
        ).join('');

        // Priorities
        const priorityEl = document.getElementById('taskPriority');
        const priorities = State.getPriorities();
        const priorityLabels = State.getPriorityLabels();
        priorityEl.innerHTML = priorities.map(p =>
            `<option value="${p}" ${p === 'medium' ? 'selected' : ''}>${priorityLabels[p]}</option>`
        ).join('');

        // Statuses
        const statusEl = document.getElementById('taskStatus');
        const statuses = State.getTaskStatuses();
        const statusLabels = State.getTaskStatusLabels();
        statusEl.innerHTML = statuses.map(s =>
            `<option value="${s}" ${s === 'todo' ? 'selected' : ''}>${statusLabels[s]}</option>`
        ).join('');
    },

    /**
     * 새 Task 모달 열기
     */
    open() {
        State.editingTask = null;
        document.getElementById('taskModalTitle').textContent = 'New Task';
        document.getElementById('taskId').value = '';
        document.getElementById('taskName').value = '';
        document.getElementById('taskPriority').value = 'medium';
        document.getElementById('taskStatus').value = 'todo';

        // 기본값: 오늘 날짜
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('taskStartDate').value = today;
        document.getElementById('taskDue').value = today;

        // 현재 필터된 프로젝트 선택 (단일 선택인 경우에만)
        if (State.currentProjects.length === 1) {
            document.getElementById('taskProject').value = State.currentProjects[0];
        }

        document.getElementById('taskModal').classList.add('active');
        document.getElementById('taskName').focus();
    },

    /**
     * Task 수정 모달 열기
     */
    edit(taskId) {
        const task = State.getTaskById(taskId);
        if (!task) return;

        State.editingTask = task;
        document.getElementById('taskModalTitle').textContent = 'Edit Task';
        document.getElementById('taskId').value = task.entity_id;
        document.getElementById('taskName').value = task.entity_name || '';
        document.getElementById('taskProject').value = task.project_id || '';
        document.getElementById('taskAssignee').value = task.assignee || '';
        document.getElementById('taskPriority').value = task.priority || 'medium';
        document.getElementById('taskStatus').value = task.status || 'todo';
        document.getElementById('taskStartDate').value = task.start_date || task.due || '';
        document.getElementById('taskDue').value = task.due || '';

        document.getElementById('taskModal').classList.add('active');
        document.getElementById('taskName').focus();
    },

    /**
     * 모달 닫기
     */
    close() {
        document.getElementById('taskModal').classList.remove('active');
        State.editingTask = null;
    },

    /**
     * Task 저장
     */
    async save() {
        const taskId = document.getElementById('taskId').value;
        const taskData = {
            entity_name: document.getElementById('taskName').value.trim(),
            project_id: document.getElementById('taskProject').value,
            assignee: document.getElementById('taskAssignee').value,
            priority: document.getElementById('taskPriority').value,
            status: document.getElementById('taskStatus').value,
            start_date: document.getElementById('taskStartDate').value || null,
            due: document.getElementById('taskDue').value || null
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
            if (taskId) {
                result = await API.updateTask(taskId, taskData);
            } else {
                result = await API.createTask(taskData);
            }

            if (result.success) {
                showToast(taskId ? 'Task updated' : 'Task created', 'success');
                await State.reloadTasks();
                Kanban.render();
                Calendar.refresh();
                this.close();
            } else {
                showToast(result.message || result.detail || 'Save failed', 'error');
            }
        } catch (err) {
            console.error('Save task error:', err);
            showToast('Error saving task', 'error');
        }
    }
};
