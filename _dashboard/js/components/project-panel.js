/**
 * ProjectPanel Component
 * Project 상세 보기/수정 사이드 패널
 */
const ProjectPanel = {
    currentProject: null,
    isExpanded: false,
    isEditingNotes: false,

    /**
     * 패널 초기화 - Select 옵션 채우기
     */
    init() {
        this.populateSelects();
        this.setupEventListeners();
    },

    /**
     * Select 옵션들 채우기
     */
    populateSelects() {
        // Owners (Members)
        const ownerEl = document.getElementById('panelProjectOwner');
        if (ownerEl) {
            ownerEl.innerHTML = State.members.map(m =>
                `<option value="${m.id}">${m.name}</option>`
            ).join('');
        }

        // Tracks
        const trackEl = document.getElementById('panelProjectTrack');
        if (trackEl) {
            trackEl.innerHTML = '<option value="">None</option>' +
                State.tracks.map(t =>
                    `<option value="${t.entity_id}">${t.entity_name || t.entity_id}</option>`
                ).join('');
        }

        // Statuses
        const statusEl = document.getElementById('panelProjectStatus');
        if (statusEl) {
            const statuses = State.getProjectStatuses();
            const statusLabels = State.getProjectStatusLabels();
            statusEl.innerHTML = statuses.map(s =>
                `<option value="${s}">${statusLabels[s]}</option>`
            ).join('');
        }

        // Priorities
        const priorityEl = document.getElementById('panelProjectPriority');
        if (priorityEl) {
            const priorities = State.getPriorities();
            const priorityLabels = State.getPriorityLabels();
            priorityEl.innerHTML = priorities.map(p =>
                `<option value="${p}">${priorityLabels[p]}</option>`
            ).join('');
        }
    },

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // Close button
        document.getElementById('projectPanelClose')?.addEventListener('click', () => this.close());

        // Overlay click
        document.getElementById('projectPanelOverlay')?.addEventListener('click', () => this.close());

        // Cancel button
        document.getElementById('panelProjectCancel')?.addEventListener('click', () => this.close());

        // Save button
        document.getElementById('panelProjectSave')?.addEventListener('click', () => this.save());

        // Delete button
        document.getElementById('panelProjectDelete')?.addEventListener('click', () => this.delete());

        // Expand button
        document.getElementById('projectPanelExpand')?.addEventListener('click', () => this.toggleExpand());

        // Notes toggle button
        document.getElementById('projectNotesToggleBtn')?.addEventListener('click', () => this.toggleNotesEdit());

        // Live preview on notes input
        document.getElementById('panelProjectNotes')?.addEventListener('input', (e) => {
            this.updateNotesPreview(e.target.value);
        });
    },

    /**
     * 전체화면 토글
     */
    toggleExpand() {
        this.isExpanded = !this.isExpanded;
        const panel = document.getElementById('projectPanel');
        const btn = document.getElementById('projectPanelExpand');

        if (this.isExpanded) {
            panel.classList.add('expanded');
            btn.title = 'Collapse';
        } else {
            panel.classList.remove('expanded');
            btn.title = 'Expand';
        }
    },

    /**
     * Notes 편집 모드 토글
     */
    toggleNotesEdit() {
        this.isEditingNotes = !this.isEditingNotes;
        const previewEl = document.getElementById('panelProjectNotesPreview');
        const editEl = document.getElementById('panelProjectNotesEdit');
        const toggleBtn = document.getElementById('projectNotesToggleBtn');

        if (this.isEditingNotes) {
            previewEl.style.display = 'none';
            editEl.style.display = 'block';
            toggleBtn.textContent = '👁️';
            toggleBtn.title = 'Preview';
            toggleBtn.classList.add('active');
            document.getElementById('panelProjectNotes').focus();
        } else {
            previewEl.style.display = 'block';
            editEl.style.display = 'none';
            toggleBtn.textContent = '✏️';
            toggleBtn.title = 'Edit';
            toggleBtn.classList.remove('active');
            this.updateNotesPreview(document.getElementById('panelProjectNotes').value);
        }
    },

    /**
     * 마크다운 렌더링 (TaskPanel의 renderMarkdown 재사용)
     */
    renderMarkdown(text) {
        // TaskPanel의 renderMarkdown 함수 재사용
        return TaskPanel.renderMarkdown(text);
    },

    /**
     * Notes 프리뷰 업데이트
     */
    updateNotesPreview(text) {
        const previewEl = document.getElementById('panelProjectNotesPreview');
        previewEl.innerHTML = this.renderMarkdown(text);
    },

    /**
     * Project 상세 패널 열기
     */
    open(projectId) {
        const project = State.getProjectById(projectId);
        if (!project) {
            showToast('Project not found', 'error');
            return;
        }

        this.currentProject = project;

        document.getElementById('projectPanelTitle').textContent = 'Project Detail';
        document.getElementById('panelProjectId').textContent = project.entity_id;
        document.getElementById('panelProjectId').style.display = 'block';
        document.getElementById('panelProjectName').value = project.entity_name || '';
        document.getElementById('panelProjectOwner').value = project.owner || '';
        document.getElementById('panelProjectTrack').value = project.parent_id || project.track_id || '';
        document.getElementById('panelProjectStatus').value = project.status || 'planning';
        document.getElementById('panelProjectPriority').value = project.priority_flag || project.priority || 'medium';
        document.getElementById('panelProjectNotes').value = project.notes || project.description || '';

        // Relations 표시
        this.renderRelations(project);

        // 하위 Tasks 표시
        this.renderProjectTasks(project);

        // Delete 버튼 표시
        document.getElementById('panelProjectDelete').style.display = 'block';

        // Notes 프리뷰 모드로 초기화
        this.resetNotesView();
        this.updateNotesPreview(project.notes || project.description || '');

        this.show();
    },

    /**
     * Notes 뷰 리셋 (프리뷰 모드로)
     */
    resetNotesView() {
        this.isEditingNotes = false;
        document.getElementById('panelProjectNotesPreview').style.display = 'block';
        document.getElementById('panelProjectNotesEdit').style.display = 'none';
        const toggleBtn = document.getElementById('projectNotesToggleBtn');
        toggleBtn.textContent = '✏️';
        toggleBtn.title = 'Edit';
        toggleBtn.classList.remove('active');
    },

    /**
     * Relations 렌더링
     */
    renderRelations(project) {
        const relationsEl = document.getElementById('panelProjectRelations');
        const items = [];

        // Track
        const track = State.getTrackForProject(project);
        if (track) {
            items.push(`
                <div class="panel-relation-item">
                    <span class="panel-relation-label">Track</span>
                    <span class="panel-relation-value track">${track.entity_name || track.entity_id}</span>
                </div>
            `);
        }

        // conditions_3y
        if (project.conditions_3y && project.conditions_3y.length > 0) {
            items.push(`
                <div class="panel-relation-item">
                    <span class="panel-relation-label">Conditions</span>
                    <span class="panel-relation-value condition">${project.conditions_3y.join(', ')}</span>
                </div>
            `);
        }

        // validates
        if (project.validates && project.validates.length > 0) {
            items.push(`
                <div class="panel-relation-item">
                    <span class="panel-relation-label">Validates</span>
                    <span class="panel-relation-value validates">${project.validates.join(', ')}</span>
                </div>
            `);
        }

        // outgoing_relations
        if (project.outgoing_relations && project.outgoing_relations.length > 0) {
            project.outgoing_relations.forEach(rel => {
                items.push(`
                    <div class="panel-relation-item">
                        <span class="panel-relation-label">${rel.type}</span>
                        <span class="panel-relation-value">${rel.target_id}</span>
                    </div>
                `);
            });
        }

        if (items.length === 0) {
            relationsEl.innerHTML = '<div style="color: #999; font-style: italic;">No relations</div>';
        } else {
            relationsEl.innerHTML = items.join('');
        }
    },

    /**
     * 프로젝트 내 Tasks 렌더링
     */
    renderProjectTasks(project) {
        const tasksEl = document.getElementById('panelProjectTasks');
        const projectTasks = State.tasks.filter(t => t.project_id === project.entity_id);

        if (projectTasks.length === 0) {
            tasksEl.innerHTML = '<div style="color: #999; font-style: italic;">No tasks</div>';
            return;
        }

        const statusLabels = State.getTaskStatusLabels();
        const statusColors = State.getTaskStatusColors();

        tasksEl.innerHTML = projectTasks.map(task => {
            const status = State.normalizeStatus(task.status);
            return `
                <div class="project-task-item" data-task-id="${task.entity_id}">
                    <span class="project-task-status" style="background: ${statusColors[status]}"></span>
                    <span class="project-task-name">${task.entity_name}</span>
                    <span class="project-task-status-label">${statusLabels[status]}</span>
                </div>
            `;
        }).join('');

        // Task 클릭 시 Task Panel 열기
        tasksEl.querySelectorAll('.project-task-item').forEach(item => {
            item.addEventListener('click', () => {
                const taskId = item.dataset.taskId;
                this.close();
                setTimeout(() => TaskPanel.open(taskId), 300);
            });
        });
    },

    /**
     * 패널 표시
     */
    show() {
        document.getElementById('projectPanel').classList.add('active');
        document.getElementById('projectPanelOverlay').classList.add('active');
        document.getElementById('panelProjectName').focus();
    },

    /**
     * 패널 닫기
     */
    close() {
        const panel = document.getElementById('projectPanel');
        panel.classList.remove('active');
        panel.classList.remove('expanded');
        document.getElementById('projectPanelOverlay').classList.remove('active');
        this.currentProject = null;
        this.isExpanded = false;
        this.resetNotesView();

        // Reset expand button
        const btn = document.getElementById('projectPanelExpand');
        btn.title = 'Expand';
    },

    /**
     * Project 저장
     */
    async save() {
        const saveBtn = document.getElementById('panelProjectSave');
        const originalText = saveBtn.textContent;

        const projectData = {
            entity_name: document.getElementById('panelProjectName').value.trim(),
            owner: document.getElementById('panelProjectOwner').value,
            parent_id: document.getElementById('panelProjectTrack').value || null,
            status: document.getElementById('panelProjectStatus').value,
            priority_flag: document.getElementById('panelProjectPriority').value,
            notes: document.getElementById('panelProjectNotes').value || null
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

        // Show loading state
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            const result = await API.updateProject(this.currentProject.entity_id, projectData);

            if (result.success) {
                showToast('Project updated', 'success');
                await State.reloadProjects();
                Tabs.render();
                Kanban.renderAssigneeFilter();
                Kanban.render();
                this.close();
            } else {
                showToast(result.message || result.detail || 'Save failed', 'error');
            }
        } catch (err) {
            console.error('Save project error:', err);
            showToast('Error saving project', 'error');
        } finally {
            // Restore button state
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    },

    /**
     * Project 삭제
     */
    async delete() {
        if (!this.currentProject) return;

        // 하위 Task 확인
        const projectTasks = State.tasks.filter(t => t.project_id === this.currentProject.entity_id);

        let message = `Delete "${this.currentProject.entity_name}"?`;
        if (projectTasks.length > 0) {
            message = `Delete "${this.currentProject.entity_name}" and its ${projectTasks.length} task(s)?`;
        }

        const confirmed = confirm(message);
        if (!confirmed) return;

        try {
            const forceDelete = projectTasks.length > 0;
            const result = await API.deleteProject(this.currentProject.entity_id, forceDelete);

            if (result.success) {
                showToast('Project deleted', 'success');
                await Promise.all([State.reloadProjects(), State.reloadTasks()]);
                Tabs.render();
                Kanban.renderAssigneeFilter();
                Kanban.render();
                this.close();
            } else {
                showToast(result.message || result.detail || 'Delete failed', 'error');
            }
        } catch (err) {
            console.error('Delete project error:', err);
            showToast('Error deleting project', 'error');
        }
    }
};
