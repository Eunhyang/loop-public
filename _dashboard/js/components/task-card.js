/**
 * TaskCard Component
 * 개별 Task 카드 렌더링
 */
const TaskCard = {
    /**
     * Obsidian URI 생성
     * @param {string} vaultPath - Vault 상대 경로 (예: 50_Projects/2025/P001/Tasks/task.md)
     * @returns {string} Obsidian URI
     */
    getObsidianUri(vaultPath) {
        if (!vaultPath) return '';
        // Obsidian은 .md 확장자 포함한 경로 사용
        return 'obsidian://open?vault=LOOP&file=' + encodeURIComponent(vaultPath);
    },

    render(task) {
        const project = State.getProjectById(task.project_id);
        const projectName = project?.entity_name || task.project_id || 'No Project';
        const member = State.getMemberById(task.assignee);
        const assigneeName = member?.name || task.assignee || 'Unassigned';
        const priority = task.priority || 'medium';

        // Get relations
        const relations = Relations.getTaskRelations(task, project);

        // Build status select options
        const statuses = State.getTaskStatuses();
        const statusLabels = State.getTaskStatusLabels();
        const currentStatus = State.normalizeStatus(task.status);
        const statusOptions = statuses.map(s =>
            `<option value="${s}" ${currentStatus === s ? 'selected' : ''}>${statusLabels[s] || s}</option>`
        ).join('');

        // Obsidian 링크 생성
        const obsidianUri = this.getObsidianUri(task._path);
        const obsidianLink = obsidianUri
            ? `<a href="${obsidianUri}" class="btn-small btn-obsidian" title="Open in Obsidian" onclick="event.stopPropagation()">📝</a>`
            : '';

        const taskType = task.type || '';
        const typeClass = taskType ? `type-${taskType}` : '';

        return `
            <div class="task-card priority-${priority} ${typeClass}" data-id="${task.entity_id}" draggable="true">
                <div class="task-name">${task.entity_name || 'Untitled'}</div>
                <div class="task-id">${task.entity_id}</div>
                <div class="task-project clickable" data-entity-type="Project" data-entity-id="${task.project_id || ''}">${projectName}</div>

                ${relations ? `<div class="task-relations">${relations}</div>` : ''}

                <div class="task-meta">
                    <span class="task-meta-item">👤 ${assigneeName}</span>
                    ${task.due ? `<span class="task-meta-item">📅 ${task.due}</span>` : ''}
                    <span class="task-meta-item priority-badge priority-${priority}">${priority}</span>
                </div>

                <div class="task-actions">
                    <div class="task-actions-left">
                        <select class="status-select">${statusOptions}</select>
                    </div>
                    <div class="task-actions-right">
                        ${obsidianLink}
                        <button class="btn-delete" title="Delete task">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }
};
