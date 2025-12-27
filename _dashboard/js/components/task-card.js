/**
 * TaskCard Component
 * 개별 Task 카드 렌더링
 */
const TaskCard = {
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

        const taskType = task.type || '';
        const typeClass = taskType ? `type-${taskType}` : '';

        // Escape entity_id for HTML attribute
        const escapedId = (task.entity_id || '').replace(/"/g, '&quot;');

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
                        <button class="btn-copy-link-card" data-entity-id="${escapedId}" data-entity-type="task" title="Copy link" onclick="event.stopPropagation(); Router.copyShareableUrl('task', '${escapedId}')">🔗</button>
                    </div>
                </div>
            </div>
        `;
    }
};
