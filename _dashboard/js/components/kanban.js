/**
 * Kanban Component
 * 칸반 보드 렌더링
 */
const Kanban = {
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
