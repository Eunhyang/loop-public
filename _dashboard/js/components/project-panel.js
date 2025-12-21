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
        this.setupRelationClickHandlers();
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
     * Relations 클릭 핸들러 설정 (이벤트 위임 방식)
     */
    setupRelationClickHandlers() {
        const relationsEl = document.getElementById('panelProjectRelations');
        if (!relationsEl) return;

        // 중복 핸들러 방지: 이미 설정되었으면 스킵
        if (relationsEl._relationClickHandlerSet) return;
        relationsEl._relationClickHandlerSet = true;

        // 이벤트 위임: 컨테이너에 단일 핸들러
        relationsEl.addEventListener('click', (e) => {
            const link = e.target.closest('.panel-relation-link');
            if (!link) return;

            const entityId = link.dataset.entityId;
            const entityType = link.dataset.entityType;

            if (entityId && entityType) {
                this.navigateToEntity(entityId, entityType);
            }
        });
    },

    /**
     * 엔티티 상세 페이지로 이동
     */
    navigateToEntity(entityId, entityType) {
        switch (entityType) {
            case 'Project':
                // 다른 프로젝트로 이동
                const project = State.getProjectById(entityId);
                if (project) {
                    this.close();
                    setTimeout(() => ProjectPanel.open(entityId), 300);
                } else {
                    showToast('Project not found', 'error');
                }
                break;

            case 'Task':
                const task = State.getTaskById ? State.getTaskById(entityId) :
                    (Array.isArray(State.tasks) ? State.tasks.find(t => t.entity_id === entityId) : null);
                if (task) {
                    this.close();
                    setTimeout(() => TaskPanel.open(entityId), 300);
                } else {
                    showToast('Task not found', 'error');
                }
                break;

            case 'Track':
            case 'Condition':
            case 'Hypothesis':
            default:
                // Graph 뷰로 전환 후 노드 선택
                this.navigateToGraphNode(entityId);
                break;
        }
    },

    /**
     * Graph 뷰에서 노드 선택
     */
    navigateToGraphNode(entityId) {
        // Graph 객체 존재 확인
        if (typeof Graph === 'undefined' || !Array.isArray(Graph.nodes)) {
            showToast('Graph view not available', 'error');
            return;
        }

        // 노드 찾기
        const node = Graph.nodes.find(n => n.id === entityId);
        if (!node) {
            showToast(`Entity "${entityId}" not found in graph`, 'error');
            return;
        }

        // 패널 닫기
        this.close();

        // Graph 뷰로 전환
        setTimeout(() => {
            if (typeof switchView === 'function') {
                switchView('graph');
            }
            // 노드 선택
            if (typeof Graph.selectNode === 'function') {
                Graph.selectNode(node);
            }
        }, 300);
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
     * ID 형식 정규화 (콜론 → 하이픈)
     */
    normalizeId(id) {
        if (!id) return id;
        return String(id).replace(/:/g, '-');
    },

    /**
     * Project 상세 패널 열기
     */
    open(projectId) {
        // 원본 ID로 조회, 실패하면 정규화된 ID로 재시도
        let project = State.getProjectById(projectId);
        if (!project) {
            const normalizedId = this.normalizeId(projectId);
            if (normalizedId !== projectId) {
                project = State.getProjectById(normalizedId);
            }
        }
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
     * Relations 렌더링 (클릭 가능한 링크 포함)
     */
    renderRelations(project) {
        const relationsEl = document.getElementById('panelProjectRelations');
        const items = [];

        // Track
        const track = State.getTrackForProject(project);
        if (track) {
            const trackId = this.escapeHtml(track.entity_id);
            const trackName = this.escapeHtml(track.entity_name || track.entity_id);
            items.push(`
                <div class="panel-relation-item">
                    <span class="panel-relation-label">Track</span>
                    <span class="panel-relation-value track panel-relation-link"
                          data-entity-id="${trackId}"
                          data-entity-type="Track"
                          title="Click to view in Graph">${trackName}</span>
                </div>
            `);
        }

        // conditions_3y - 각 항목별로 개별 렌더링
        if (project.conditions_3y && project.conditions_3y.length > 0) {
            const conditionLinks = project.conditions_3y.map(condId => {
                const escapedId = this.escapeHtml(condId);
                return `<span class="panel-relation-link"
                       data-entity-id="${escapedId}"
                       data-entity-type="Condition"
                       title="Click to view in Graph">${escapedId}</span>`;
            }).join(', ');

            items.push(`
                <div class="panel-relation-item">
                    <span class="panel-relation-label">Conditions</span>
                    <span class="panel-relation-value condition">${conditionLinks}</span>
                </div>
            `);
        }

        // validates - 각 항목별로 개별 렌더링
        if (project.validates && project.validates.length > 0) {
            const validateLinks = project.validates.map(hypId => {
                const escapedId = this.escapeHtml(hypId);
                return `<span class="panel-relation-link"
                       data-entity-id="${escapedId}"
                       data-entity-type="Hypothesis"
                       title="Click to view in Graph">${escapedId}</span>`;
            }).join(', ');

            items.push(`
                <div class="panel-relation-item">
                    <span class="panel-relation-label">Validates</span>
                    <span class="panel-relation-value validates">${validateLinks}</span>
                </div>
            `);
        }

        // outgoing_relations - 타겟 ID로 엔티티 타입 추론
        if (project.outgoing_relations && project.outgoing_relations.length > 0) {
            project.outgoing_relations.forEach(rel => {
                const entityType = this.inferEntityTypeFromId(rel.target_id);
                const escapedTargetId = this.escapeHtml(rel.target_id);
                const escapedType = this.escapeHtml(rel.type);
                items.push(`
                    <div class="panel-relation-item">
                        <span class="panel-relation-label">${escapedType}</span>
                        <span class="panel-relation-value panel-relation-link"
                              data-entity-id="${escapedTargetId}"
                              data-entity-type="${entityType}"
                              title="Click to navigate">${escapedTargetId}</span>
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
     * ID 접두사로 엔티티 타입 추론
     */
    inferEntityTypeFromId(entityId) {
        if (!entityId) return 'Unknown';
        const id = entityId.toLowerCase();
        if (id.startsWith('trk-')) return 'Track';
        if (id.startsWith('cond-')) return 'Condition';
        if (id.startsWith('hyp-')) return 'Hypothesis';
        if (id.startsWith('prj-')) return 'Project';
        if (id.startsWith('tsk-')) return 'Task';
        if (id.startsWith('mh-')) return 'MetaHypothesis';
        if (id.startsWith('ns-')) return 'NorthStar';
        return 'Unknown';
    },

    /**
     * HTML 이스케이프 (XSS 방지)
     */
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
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
