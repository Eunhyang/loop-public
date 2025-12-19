/**
 * Kanban Component
 * 칸반 보드 렌더링
 */
const Kanban = {
    /**
     * 담당자 필터 렌더링
     */
    renderAssigneeFilter() {
        const filterEl = document.getElementById('assigneeFilter');
        if (!filterEl) return;

        // 담당자별 Task 개수 계산 (프로젝트 필터는 유지)
        const tasksByAssignee = {};
        let filteredByProject = State.tasks;
        if (State.currentProject !== 'all') {
            filteredByProject = State.tasks.filter(t => t.project_id === State.currentProject);
        }

        filteredByProject.forEach(task => {
            const assignee = task.assignee || 'unassigned';
            tasksByAssignee[assignee] = (tasksByAssignee[assignee] || 0) + 1;
        });

        // All 버튼
        let html = `
            <button class="filter-btn ${State.currentAssignee === 'all' ? 'active' : ''}" data-assignee="all">
                All
                <span class="filter-count">${filteredByProject.length}</span>
            </button>
        `;

        // 각 멤버 버튼
        State.members.forEach(member => {
            const count = tasksByAssignee[member.id] || 0;
            html += `
                <button class="filter-btn ${State.currentAssignee === member.id ? 'active' : ''}" data-assignee="${member.id}">
                    ${member.name}
                    <span class="filter-count">${count}</span>
                </button>
            `;
        });

        filterEl.innerHTML = html;

        // 이벤트 리스너
        filterEl.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                State.currentAssignee = btn.dataset.assignee;
                this.renderAssigneeFilter();
                this.render();
            });
        });
    },

    render() {
        const boardEl = document.getElementById('board');
        const statuses = State.getTaskStatuses();
        const statusLabels = State.getTaskStatusLabels();
        const grouped = State.getTasksByStatus();

        boardEl.innerHTML = statuses.map(status => `
            <div class="kanban-column" data-status="${status}">
                <div class="column-header">
                    <span class="column-title">${statusLabels[status] || status}</span>
                    <span class="column-count">${grouped[status]?.length || 0}</span>
                </div>
                <div class="column-body">
                    ${(grouped[status]?.length === 0)
                        ? '<div class="empty-column">No tasks</div>'
                        : grouped[status].map(task => TaskCard.render(task)).join('')
                    }
                </div>
            </div>
        `).join('');

        // Add event listeners for task cards
        this.attachCardListeners();
    },

    attachCardListeners() {
        // Card click -> open panel
        document.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't open panel if clicking on buttons or select
                if (e.target.closest('.task-actions')) return;
                const taskId = card.dataset.id;
                TaskPanel.open(taskId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.task-card .btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = e.target.closest('.task-card').dataset.id;
                const task = State.getTaskById(taskId);
                if (task) {
                    openDeleteModal('task', taskId, task.entity_name);
                }
            });
        });

        // Status quick select
        document.querySelectorAll('.task-card .status-select').forEach(select => {
            select.addEventListener('click', (e) => e.stopPropagation());
            select.addEventListener('change', async (e) => {
                e.stopPropagation();
                const taskId = e.target.closest('.task-card').dataset.id;
                const newStatus = e.target.value;
                await this.updateTaskStatus(taskId, newStatus);
            });
        });

        // Drag and Drop
        this.attachDragListeners();
    },

    attachDragListeners() {
        // Drag start on cards
        document.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', card.dataset.id);
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                document.querySelectorAll('.kanban-column').forEach(col => {
                    col.classList.remove('drag-over');
                });
            });
        });

        // Drop zone on columns
        document.querySelectorAll('.column-body').forEach(columnBody => {
            columnBody.addEventListener('dragover', (e) => {
                e.preventDefault();
                const column = columnBody.closest('.kanban-column');
                column.classList.add('drag-over');
            });

            columnBody.addEventListener('dragleave', (e) => {
                const column = columnBody.closest('.kanban-column');
                if (!column.contains(e.relatedTarget)) {
                    column.classList.remove('drag-over');
                }
            });

            columnBody.addEventListener('drop', async (e) => {
                e.preventDefault();
                const column = columnBody.closest('.kanban-column');
                column.classList.remove('drag-over');

                const taskId = e.dataTransfer.getData('text/plain');
                const newStatus = column.dataset.status;

                if (taskId && newStatus) {
                    await this.updateTaskStatus(taskId, newStatus);
                }
            });
        });
    },

    async updateTaskStatus(taskId, newStatus) {
        try {
            const result = await API.updateTask(taskId, { status: newStatus });
            if (result.success) {
                showToast('Status updated', 'success');
                await State.reloadTasks();
                this.render();
            } else {
                showToast(result.message || 'Update failed', 'error');
            }
        } catch (err) {
            console.error('Status update error:', err);
            showToast('Error updating status', 'error');
        }
    }
};
