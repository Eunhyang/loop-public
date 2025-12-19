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
                    ${p.entity_name || p.entity_id}
                </div>
            `).join('')}
        `;

        // Add click handlers
        tabsEl.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const projectId = tab.dataset.project;
                this.select(projectId);
            });
        });
    },

    select(projectId) {
        State.currentProject = projectId;
        this.render();
        Kanban.render();
    }
};
