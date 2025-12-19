/**
 * ProjectModal Component
 * Project 생성/수정 모달
 */
const ProjectModal = {
    /**
     * Select 옵션들 채우기
     */
    populateSelects() {
        // Owners
        const ownerEl = document.getElementById('projectOwner');
        ownerEl.innerHTML = State.members.map(m =>
            `<option value="${m.id}">${m.name}</option>`
        ).join('');

        // Tracks
        const trackEl = document.getElementById('projectTrack');
        trackEl.innerHTML = `
            <option value="">None</option>
            ${State.tracks.map(t =>
                `<option value="${t.entity_id}">${t.entity_name || t.entity_id}</option>`
            ).join('')}
        `;

        // Priorities
        const priorityEl = document.getElementById('projectPriority');
        const priorities = State.getPriorities();
        const priorityLabels = State.getPriorityLabels();
        priorityEl.innerHTML = priorities.map(p =>
            `<option value="${p}" ${p === 'medium' ? 'selected' : ''}>${priorityLabels[p]}</option>`
        ).join('');

        // Statuses
        const statusEl = document.getElementById('projectStatus');
        const statuses = State.getProjectStatuses();
        const statusLabels = State.getProjectStatusLabels();
        statusEl.innerHTML = statuses.map(s =>
            `<option value="${s}" ${s === 'planning' ? 'selected' : ''}>${statusLabels[s]}</option>`
        ).join('');
    },

    /**
     * 새 Project 모달 열기
     */
    open() {
        State.editingProject = null;
        document.getElementById('projectModalTitle').textContent = 'New Project';
        document.getElementById('projectId').value = '';
        document.getElementById('projectName').value = '';
        document.getElementById('projectTrack').value = '';
        document.getElementById('projectPriority').value = 'medium';
        document.getElementById('projectStatus').value = 'planning';

        document.getElementById('projectModal').classList.add('active');
        document.getElementById('projectName').focus();
    },

    /**
     * Project 수정 모달 열기
     */
    edit(projectId) {
        const project = State.getProjectById(projectId);
        if (!project) return;

        State.editingProject = project;
        document.getElementById('projectModalTitle').textContent = 'Edit Project';
        document.getElementById('projectId').value = project.entity_id;
        document.getElementById('projectName').value = project.entity_name || '';
        document.getElementById('projectOwner').value = project.owner || '';
        document.getElementById('projectTrack').value = project.parent_id || project.track_id || '';
        document.getElementById('projectPriority').value = project.priority_flag || 'medium';
        document.getElementById('projectStatus').value = project.status || 'planning';

        document.getElementById('projectModal').classList.add('active');
        document.getElementById('projectName').focus();
    },

    /**
     * 모달 닫기
     */
    close() {
        document.getElementById('projectModal').classList.remove('active');
        State.editingProject = null;
    },

    /**
     * Project 저장
     */
    async save() {
        const projectId = document.getElementById('projectId').value;
        const projectData = {
            entity_name: document.getElementById('projectName').value.trim(),
            owner: document.getElementById('projectOwner').value,
            parent_id: document.getElementById('projectTrack').value || null,
            priority: document.getElementById('projectPriority').value,
            status: document.getElementById('projectStatus').value
        };

        // Validation
        if (!projectData.entity_name) {
            showToast('Please enter project name', 'error');
            return;
        }
        if (!projectData.owner) {
            showToast('Please select an owner', 'error');
            return;
        }

        try {
            let result;
            if (projectId) {
                // Update - use priority_flag for API
                const updateData = {
                    entity_name: projectData.entity_name,
                    owner: projectData.owner,
                    parent_id: projectData.parent_id,
                    priority_flag: projectData.priority,
                    status: projectData.status
                };
                result = await API.updateProject(projectId, updateData);
            } else {
                result = await API.createProject(projectData);
            }

            if (result.success) {
                showToast(projectId ? 'Project updated' : 'Project created', 'success');
                await State.reloadProjects();
                Tabs.render();
                ProjectModal.populateSelects();
                TaskModal.populateSelects();
                this.close();
            } else {
                showToast(result.message || result.detail || 'Save failed', 'error');
            }
        } catch (err) {
            console.error('Save project error:', err);
            showToast('Error saving project', 'error');
        }
    }
};
