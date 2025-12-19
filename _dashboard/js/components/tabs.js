/**
 * Tabs Component
 * 프로젝트 탭 렌더링 및 필터링
 */
const Tabs = {
    render() {
        const tabsEl = document.getElementById('tabs');

        // Filter projects by track if a track is selected
        let projects = State.projects;
        if (State.filterTrack && State.filterTrack !== 'all') {
            projects = projects.filter(p =>
                p.parent_id === State.filterTrack || p.track_id === State.filterTrack
            );
        }

        // If filtering by hypothesis, show projects with tasks that validate it
        if (State.filterHypothesis) {
            const validatingProjects = new Set();
            State.tasks.forEach(t => {
                if (t.validates?.includes(State.filterHypothesis) ||
                    t.outgoing_relations?.some(r => r.target_id === State.filterHypothesis)) {
                    validatingProjects.add(t.project_id);
                }
            });
            projects = projects.filter(p => validatingProjects.has(p.entity_id));
        }

        // If filtering by condition, show projects with tasks linked to that condition
        if (State.filterCondition) {
            const conditionProjects = new Set();
            State.tasks.forEach(t => {
                if (t.conditions_3y?.includes(State.filterCondition)) {
                    conditionProjects.add(t.project_id);
                }
            });
            projects = projects.filter(p => conditionProjects.has(p.entity_id));
        }

        tabsEl.innerHTML = `
            <div class="tab ${State.currentProject === 'all' ? 'active' : ''}"
                 data-project="all">
                All Projects${projects.length > 0 && projects.length !== State.projects.length ? ` (${projects.length})` : ''}
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
