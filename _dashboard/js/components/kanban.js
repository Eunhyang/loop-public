/**
 * Kanban Component
 * 칸반 보드 렌더링 (프로젝트별 그룹)
 */
const Kanban = {
    // 프로젝트 접기/펼치기 상태 (기본: 모두 펼침)
    collapsedProjects: new Set(),

    render() {
        const boardEl = document.getElementById('board');
        const groupedByProject = State.getTasksGroupedByProject();
        const statuses = State.getTaskStatuses();
        const statusLabels = State.getTaskStatusLabels();

        // 프로젝트가 없는 경우
        const projectIds = Object.keys(groupedByProject);
        if (projectIds.length === 0) {
            boardEl.innerHTML = `
                <div class="empty-board">
                    <div class="empty-icon">📋</div>
                    <div class="empty-text">No tasks for this assignee</div>
                </div>
            `;
            return;
        }

        // 프로젝트별로 그룹 렌더링
        let html = '';
        projectIds.forEach(projectId => {
            const tasks = groupedByProject[projectId];
            const projectName = State.getProjectDisplayName(projectId);
            const isCollapsed = this.collapsedProjects.has(projectId);
            const project = State.getProjectById(projectId);

            // 상태별로 Task 그룹핑
            const tasksByStatus = {};
            statuses.forEach(s => tasksByStatus[s] = []);
            tasks.forEach(task => {
                const status = State.normalizeStatus(task.status);
                if (tasksByStatus[status]) {
                    tasksByStatus[status].push(task);
                }
            });

            html += `
                <div class="project-group ${isCollapsed ? 'collapsed' : ''}" data-project-id="${projectId}">
                    <div class="project-group-header" data-project-id="${projectId}">
                        <span class="collapse-icon">${isCollapsed ? '▶' : '▼'}</span>
                        <span class="project-name">${projectName}</span>
                        <span class="project-task-count">${tasks.length}</span>
                        ${project ? `<button class="project-edit-btn" data-project-id="${projectId}" title="Edit Project">⚙️</button>` : ''}
                    </div>
                    <div class="project-kanban" ${isCollapsed ? 'style="display:none;"' : ''}>
                        ${statuses.map(status => `
                            <div class="kanban-column" data-status="${status}" data-project-id="${projectId}">
                                <div class="column-header">
                                    <span class="column-title">${statusLabels[status] || status}</span>
                                    <span class="column-count">${tasksByStatus[status]?.length || 0}</span>
                                </div>
                                <div class="column-body">
                                    ${(tasksByStatus[status]?.length === 0)
                                        ? '<div class="empty-column">No tasks</div>'
                                        : tasksByStatus[status].map(task => TaskCard.render(task)).join('')
                                    }
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        boardEl.innerHTML = html;

        // 이벤트 리스너 추가
        this.attachCardListeners();
        this.attachProjectGroupListeners();
    },

    attachProjectGroupListeners() {
        // 프로젝트 그룹 헤더 클릭 (접기/펼치기)
        document.querySelectorAll('.project-group-header').forEach(header => {
            header.addEventListener('click', (e) => {
                // Edit 버튼 클릭 시 무시
                if (e.target.closest('.project-edit-btn')) return;

                const projectId = header.dataset.projectId;
                this.toggleProjectCollapse(projectId);
            });
        });

        // 프로젝트 Edit 버튼
        document.querySelectorAll('.project-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const projectId = btn.dataset.projectId;
                ProjectPanel.open(projectId);
            });
        });
    },

    toggleProjectCollapse(projectId) {
        const group = document.querySelector(`.project-group[data-project-id="${projectId}"]`);
        const kanban = group.querySelector('.project-kanban');
        const icon = group.querySelector('.collapse-icon');

        if (this.collapsedProjects.has(projectId)) {
            this.collapsedProjects.delete(projectId);
            group.classList.remove('collapsed');
            kanban.style.display = '';
            icon.textContent = '▼';
        } else {
            this.collapsedProjects.add(projectId);
            group.classList.add('collapsed');
            kanban.style.display = 'none';
            icon.textContent = '▶';
        }
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
