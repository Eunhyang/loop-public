/**
 * Tabs Component
 * 프로젝트 탭 렌더링 및 필터링
 */
const Tabs = {
    render() {
        const tabsEl = document.getElementById('tabs');
        const projects = State.projects;

        tabsEl.innerHTML = `
            <div class="tab ${State.currentProject === 'all' ? 'active' : ''}"
                 data-project="all">
                All Projects
            </div>
            ${projects.map(p => `
                <div class="tab ${State.currentProject === p.entity_id ? 'active' : ''}"
                     data-project="${p.entity_id}">
                    <span class="tab-name">${p.entity_name || p.entity_id}</span>
                    <button class="tab-edit-btn" data-project-id="${p.entity_id}" title="Edit Project">⚙️</button>
                </div>
            `).join('')}
        `;

        // Add click handlers for tab selection
        tabsEl.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Don't select tab if clicking on edit button
                if (e.target.closest('.tab-edit-btn')) return;
                const projectId = tab.dataset.project;
                this.select(projectId);
            });
        });

        // Add click handlers for edit buttons
        tabsEl.querySelectorAll('.tab-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const projectId = btn.dataset.projectId;
                ProjectPanel.open(projectId);
            });
        });
    },

    select(projectId) {
        State.currentProject = projectId;
        this.render();
        Kanban.renderAssigneeFilter();
        Kanban.render();
    }
};
