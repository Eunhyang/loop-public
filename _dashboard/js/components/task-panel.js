/**
 * TaskPanel Component
 * Task 상세 보기/수정 사이드 패널
 */
const TaskPanel = {
    currentTask: null,
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
        // Projects
        const projectEl = document.getElementById('panelTaskProject');
        if (projectEl) {
            projectEl.innerHTML = State.projects.map(p =>
                `<option value="${p.entity_id}">${p.entity_name || p.entity_id}</option>`
            ).join('');
        }

        // Assignees
        const assigneeEl = document.getElementById('panelTaskAssignee');
        if (assigneeEl) {
            assigneeEl.innerHTML = State.members.map(m =>
                `<option value="${m.id}">${m.name}</option>`
            ).join('');
        }

        // Statuses
        const statusEl = document.getElementById('panelTaskStatus');
        if (statusEl) {
            const statuses = State.getTaskStatuses();
            const statusLabels = State.getTaskStatusLabels();
            statusEl.innerHTML = statuses.map(s =>
                `<option value="${s}">${statusLabels[s]}</option>`
            ).join('');
        }

        // Priorities
        const priorityEl = document.getElementById('panelTaskPriority');
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
        document.getElementById('taskPanelClose')?.addEventListener('click', () => this.close());

        // Overlay click
        document.getElementById('taskPanelOverlay')?.addEventListener('click', () => this.close());

        // Cancel button
        document.getElementById('panelTaskCancel')?.addEventListener('click', () => this.close());

        // Save button
        document.getElementById('panelTaskSave')?.addEventListener('click', () => this.save());

        // Delete button
        document.getElementById('panelTaskDelete')?.addEventListener('click', () => this.delete());

        // Expand button
        document.getElementById('taskPanelExpand')?.addEventListener('click', () => this.toggleExpand());

        // Notes toggle button
        document.getElementById('notesToggleBtn')?.addEventListener('click', () => this.toggleNotesEdit());

        // Live preview on notes input
        document.getElementById('panelTaskNotes')?.addEventListener('input', (e) => {
            this.updateNotesPreview(e.target.value);
        });
    },

    /**
     * 전체화면 토글
     */
    toggleExpand() {
        this.isExpanded = !this.isExpanded;
        const panel = document.getElementById('taskPanel');
        const btn = document.getElementById('taskPanelExpand');

        if (this.isExpanded) {
            panel.classList.add('expanded');
            btn.textContent = '⛶';
            btn.title = 'Collapse';
        } else {
            panel.classList.remove('expanded');
            btn.textContent = '⛶';
            btn.title = 'Expand';
        }
    },

    /**
     * Notes 편집 모드 토글
     */
    toggleNotesEdit() {
        this.isEditingNotes = !this.isEditingNotes;
        const previewEl = document.getElementById('panelTaskNotesPreview');
        const editEl = document.getElementById('panelTaskNotesEdit');
        const toggleBtn = document.getElementById('notesToggleBtn');

        if (this.isEditingNotes) {
            previewEl.style.display = 'none';
            editEl.style.display = 'block';
            toggleBtn.textContent = '👁️';
            toggleBtn.title = 'Preview';
            toggleBtn.classList.add('active');
            document.getElementById('panelTaskNotes').focus();
        } else {
            previewEl.style.display = 'block';
            editEl.style.display = 'none';
            toggleBtn.textContent = '✏️';
            toggleBtn.title = 'Edit';
            toggleBtn.classList.remove('active');
            // Update preview with current textarea value
            this.updateNotesPreview(document.getElementById('panelTaskNotes').value);
        }
    },

    /**
     * 마크다운 렌더링
     */
    renderMarkdown(text) {
        if (!text || !text.trim()) {
            return '<div class="notes-placeholder">No notes</div>';
        }

        let html = text
            // Escape HTML
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            // Code blocks (```code```)
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            // Inline code (`code`)
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // Headers
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            // Bold (**text**)
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            // Italic (*text*)
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            // Strikethrough (~~text~~)
            .replace(/~~(.+?)~~/g, '<del>$1</del>')
            // Blockquotes
            .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
            // Horizontal rule
            .replace(/^---$/gm, '<hr>')
            // Checklists
            .replace(/^- \[x\] (.+)$/gm, '<div class="checklist-item"><input type="checkbox" checked disabled> $1</div>')
            .replace(/^- \[ \] (.+)$/gm, '<div class="checklist-item"><input type="checkbox" disabled> $1</div>')
            // Unordered lists
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            // Links [text](url)
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
            // Paragraphs (double newlines)
            .replace(/\n\n/g, '</p><p>')
            // Single newlines to <br>
            .replace(/\n/g, '<br>');

        // Wrap list items in <ul>
        html = html.replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');

        // Wrap in paragraph if not already structured
        if (!html.startsWith('<h') && !html.startsWith('<ul') && !html.startsWith('<pre') && !html.startsWith('<blockquote')) {
            html = '<p>' + html + '</p>';
        }

        return html;
    },

    /**
     * Notes 프리뷰 업데이트
     */
    updateNotesPreview(text) {
        const previewEl = document.getElementById('panelTaskNotesPreview');
        previewEl.innerHTML = this.renderMarkdown(text);
    },

    /**
     * 새 Task 패널 열기
     */
    openNew() {
        this.currentTask = null;

        // 기본값: 오늘 날짜
        const today = new Date().toISOString().split('T')[0];

        document.getElementById('taskPanelTitle').textContent = 'New Task';
        document.getElementById('panelTaskId').textContent = '';
        document.getElementById('panelTaskId').style.display = 'none';
        document.getElementById('panelTaskName').value = '';
        document.getElementById('panelTaskStatus').value = 'todo';
        document.getElementById('panelTaskPriority').value = 'medium';
        document.getElementById('panelTaskStartDate').value = today;
        document.getElementById('panelTaskDue').value = today;
        document.getElementById('panelTaskNotes').value = '';

        // 현재 필터된 프로젝트 선택
        if (State.currentProject !== 'all') {
            document.getElementById('panelTaskProject').value = State.currentProject;
        }

        // Relations 숨기기 (새 Task는 관계 없음)
        document.getElementById('panelTaskRelations').innerHTML =
            '<div style="color: #999; font-style: italic;">Save task to see relations</div>';

        // Delete 버튼 숨기기
        document.getElementById('panelTaskDelete').style.display = 'none';

        // Notes 초기화 (편집 모드로 시작)
        this.resetNotesView();
        this.isEditingNotes = false;
        this.toggleNotesEdit(); // 새 Task는 편집 모드로 시작
        this.updateNotesPreview('');

        this.show();
    },

    /**
     * Task 상세 패널 열기 (API에서 본문 포함하여 로드)
     */
    async open(taskId) {
        // 원본 ID로 조회, 실패하면 정규화된 ID로 재시도
        let cachedTask = State.getTaskById(taskId);
        if (!cachedTask) {
            const normalizedId = this.normalizeId(taskId);
            if (normalizedId !== taskId) {
                cachedTask = State.getTaskById(normalizedId);
            }
        }
        if (!cachedTask) {
            showToast('Task not found', 'error');
            return;
        }

        // 기본 정보 먼저 표시
        document.getElementById('taskPanelTitle').textContent = 'Task Detail';
        document.getElementById('panelTaskId').textContent = cachedTask.entity_id;
        document.getElementById('panelTaskId').style.display = 'block';
        document.getElementById('panelTaskName').value = cachedTask.entity_name || '';
        document.getElementById('panelTaskProject').value = cachedTask.project_id || '';
        document.getElementById('panelTaskAssignee').value = cachedTask.assignee || '';
        document.getElementById('panelTaskStatus').value = State.normalizeStatus(cachedTask.status);
        document.getElementById('panelTaskPriority').value = cachedTask.priority || 'medium';
        document.getElementById('panelTaskStartDate').value = cachedTask.start_date || cachedTask.due || '';
        document.getElementById('panelTaskDue').value = cachedTask.due || '';

        // 패널 먼저 표시 (로딩 중)
        document.getElementById('panelTaskNotes').value = 'Loading...';
        this.resetNotesView();
        this.updateNotesPreview('Loading...');
        this.show();

        // API에서 본문 포함한 상세 정보 로드
        try {
            const response = await fetch(`${API.baseUrl}/api/tasks/${encodeURIComponent(taskId)}`);
            if (!response.ok) {
                throw new Error('Failed to load task');
            }
            const data = await response.json();
            const task = data.task;

            this.currentTask = task;

            // 본문 표시
            const notesContent = task.notes || task._body || '';
            document.getElementById('panelTaskNotes').value = notesContent;
            this.updateNotesPreview(notesContent);

            // Relations 표시
            this.renderRelations(task);

        } catch (err) {
            console.error('Error loading task detail:', err);
            // 폴백: 캐시된 정보 사용
            this.currentTask = cachedTask;
            const notesContent = cachedTask.notes || cachedTask._body || '';
            document.getElementById('panelTaskNotes').value = notesContent;
            this.updateNotesPreview(notesContent);
            this.renderRelations(cachedTask);
        }

        // Delete 버튼 표시
        document.getElementById('panelTaskDelete').style.display = 'block';
    },

    /**
     * Notes 뷰 리셋 (프리뷰 모드로)
     */
    resetNotesView() {
        this.isEditingNotes = false;
        document.getElementById('panelTaskNotesPreview').style.display = 'block';
        document.getElementById('panelTaskNotesEdit').style.display = 'none';
        const toggleBtn = document.getElementById('notesToggleBtn');
        toggleBtn.textContent = '✏️';
        toggleBtn.title = 'Edit';
        toggleBtn.classList.remove('active');
    },

    /**
     * HTML 특수문자 이스케이프 (XSS 방지)
     */
    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    /**
     * ID 형식 정규화 (하이픈 ↔ 콜론 변환)
     * Schema 표준: 하이픈 형식 (prj-001)
     */
    normalizeId(id) {
        if (!id) return id;
        // 콜론을 하이픈으로 변환 (cond-b → cond-b, prj-001 → prj-001)
        return String(id).replace(/:/g, '-');
    },

    /**
     * Relations 렌더링 - 클릭 가능한 링크로 표시
     */
    renderRelations(task) {
        const relationsEl = document.getElementById('panelTaskRelations');

        // ID 정규화하여 Project 조회 (하이픈/콜론 모두 지원)
        const normalizedProjectId = this.normalizeId(task.project_id);
        let project = State.getProjectById(task.project_id);
        if (!project && normalizedProjectId !== task.project_id) {
            project = State.getProjectById(normalizedProjectId);
        }

        const items = [];

        // Project (Task가 속한 프로젝트) - project가 null이어도 project_id가 있으면 표시
        if (project) {
            const projId = this.escapeHtml(project.entity_id);
            const projName = this.escapeHtml(project.entity_name || project.entity_id);
            items.push(`
                <div class="panel-relation-item clickable" data-entity-id="${projId}">
                    <span class="panel-relation-label">Project</span>
                    <span class="panel-relation-value project">${projName}</span>
                </div>
            `);

            // Track (Project의 상위)
            const track = State.getTrackForProject(project);
            if (track) {
                const trackId = this.escapeHtml(track.entity_id);
                const trackName = this.escapeHtml(track.entity_name || track.entity_id);
                items.push(`
                    <div class="panel-relation-item clickable" data-entity-id="${trackId}">
                        <span class="panel-relation-label">Track</span>
                        <span class="panel-relation-value track">${trackName}</span>
                    </div>
                `);
            }
        } else if (task.project_id) {
            // Project를 찾지 못했지만 project_id가 있으면 ID만이라도 표시
            const projId = this.escapeHtml(task.project_id);
            items.push(`
                <div class="panel-relation-item clickable" data-entity-id="${projId}">
                    <span class="panel-relation-label">Project</span>
                    <span class="panel-relation-value project">${projId}</span>
                </div>
            `);
        }

        // validates - 각각 개별 링크로
        if (task.validates && task.validates.length > 0) {
            task.validates.forEach(hypId => {
                const safeId = this.escapeHtml(hypId);
                items.push(`
                    <div class="panel-relation-item clickable" data-entity-id="${safeId}">
                        <span class="panel-relation-label">Validates</span>
                        <span class="panel-relation-value validates">${safeId}</span>
                    </div>
                `);
            });
        }

        // conditions_3y - Task 우선 (length > 0인 경우만), 없으면 Project에서 가져옴
        const taskConditions = Array.isArray(task.conditions_3y) && task.conditions_3y.length > 0
            ? task.conditions_3y
            : null;
        const conditions = taskConditions || project?.conditions_3y || [];
        if (conditions.length > 0) {
            conditions.forEach(condId => {
                const safeId = this.escapeHtml(condId);
                // ID 정규화 (cond-b → cond-b) - escape 적용
                const normalizedCondId = this.escapeHtml(this.normalizeId(condId));
                items.push(`
                    <div class="panel-relation-item clickable" data-entity-id="${normalizedCondId}">
                        <span class="panel-relation-label">Condition</span>
                        <span class="panel-relation-value condition">${safeId}</span>
                    </div>
                `);
            });
        }

        // outgoing_relations - 각각 개별 링크로
        if (task.outgoing_relations && task.outgoing_relations.length > 0) {
            task.outgoing_relations.forEach(rel => {
                const safeTargetId = this.escapeHtml(rel.target_id);
                const safeType = this.escapeHtml(rel.type);
                items.push(`
                    <div class="panel-relation-item clickable" data-entity-id="${safeTargetId}">
                        <span class="panel-relation-label">${safeType}</span>
                        <span class="panel-relation-value">${safeTargetId}</span>
                    </div>
                `);
            });
        }

        if (items.length === 0) {
            relationsEl.innerHTML = '<div style="color: #999; font-style: italic;">No relations</div>';
        } else {
            relationsEl.innerHTML = items.join('');
            // 이벤트 위임으로 클릭 핸들러 등록 (XSS 방지)
            this.bindRelationClickHandlers(relationsEl);
        }
    },

    /**
     * Relation 클릭 핸들러 바인딩 (이벤트 위임)
     */
    bindRelationClickHandlers(container) {
        container.querySelectorAll('.panel-relation-item.clickable').forEach(item => {
            item.addEventListener('click', () => {
                const entityId = item.dataset.entityId;
                if (entityId) {
                    this.navigateTo(entityId);
                }
            });
        });
    },

    /**
     * 엔티티 타입 확인 (하이픈/콜론 형식 모두 지원)
     */
    getEntityType(id) {
        if (!id) return null;
        const lowerId = id.toLowerCase();

        // 하이픈 또는 콜론 형식 모두 지원
        if (lowerId.startsWith('prj-') || lowerId.startsWith('prj-')) return 'project';
        if (lowerId.startsWith('tsk-') || lowerId.startsWith('tsk-')) return 'task';
        if (lowerId.startsWith('trk-') || lowerId.startsWith('trk-')) return 'track';
        if (lowerId.startsWith('hyp-') || lowerId.startsWith('hyp-')) return 'hypothesis';
        if (lowerId.startsWith('cond-') || lowerId.startsWith('cond-')) return 'condition';
        if (lowerId.startsWith('mh-') || lowerId.startsWith('mh-')) return 'metahypothesis';
        if (lowerId.startsWith('ns-') || lowerId.startsWith('ns-')) return 'northstar';

        return null;
    },

    /**
     * 연관 엔티티로 네비게이션
     */
    navigateTo(entityId) {
        // 타입 안전성 보장
        if (!entityId) return;
        const safeId = String(entityId);
        const entityType = this.getEntityType(safeId);

        // Project → ProjectPanel 열기 (정규화된 ID 사용)
        if (entityType === 'project') {
            this.close();
            const normalizedId = this.normalizeId(safeId);
            setTimeout(() => {
                if (typeof ProjectPanel !== 'undefined') {
                    // 원본 ID로 먼저 시도, 실패하면 정규화된 ID로 시도
                    ProjectPanel.open(safeId);
                } else {
                    showToast('ProjectPanel not available', 'error');
                }
            }, 100);
            return;
        }

        // Task → TaskPanel 열기 (다른 Task로 이동)
        if (entityType === 'task') {
            this.close();
            setTimeout(() => TaskPanel.open(safeId), 100);
            return;
        }

        // Track, Hypothesis, Condition, MetaHypothesis, NorthStar → Graph 뷰로 전환 후 노드 선택
        if (['track', 'hypothesis', 'condition', 'metahypothesis', 'northstar'].includes(entityType)) {
            this.close();

            // Graph 객체 존재 확인
            if (typeof Graph === 'undefined') {
                showToast('Graph view not available', 'error');
                return;
            }

            // Graph 뷰로 전환
            document.getElementById('viewGraph')?.click();

            // Graph 로드 대기 후 노드 선택 (retry 로직)
            let retryCount = 0;
            const maxRetries = 10;
            const normalizedId = this.normalizeId(safeId);  // 하이픈 형식으로 정규화
            const trySelectNode = () => {
                // Graph 객체 재확인
                if (typeof Graph === 'undefined' || !Graph.nodes) {
                    if (retryCount < maxRetries) {
                        retryCount++;
                        setTimeout(trySelectNode, 200);
                    } else {
                        showToast('Graph not loaded', 'warning');
                    }
                    return;
                }

                // 원본 ID, 정규화된 ID, 소문자 버전으로 노드 찾기
                const node = Graph.nodes.find(n => {
                    const nodeId = n.id?.toLowerCase();
                    const searchId = safeId.toLowerCase();
                    const normalizedSearchId = normalizedId.toLowerCase();
                    return nodeId === searchId || nodeId === normalizedSearchId;
                });

                if (node) {
                    Graph.selectNode(node);
                } else if (retryCount < maxRetries) {
                    retryCount++;
                    setTimeout(trySelectNode, 200);
                } else {
                    showToast(`Entity not found in graph: ${safeId}`, 'warning');
                }
            };
            setTimeout(trySelectNode, 300);
            return;
        }

        // 인식되지 않는 prefix
        console.warn('TaskPanel.navigateTo: Unknown entity type:', safeId);
        showToast(`Cannot navigate to: ${safeId}`, 'warning');
    },

    /**
     * 패널 표시
     */
    show() {
        document.getElementById('taskPanel').classList.add('active');
        document.getElementById('taskPanelOverlay').classList.add('active');
        document.getElementById('panelTaskName').focus();
    },

    /**
     * 패널 닫기
     */
    close() {
        const panel = document.getElementById('taskPanel');
        panel.classList.remove('active');
        panel.classList.remove('expanded');
        document.getElementById('taskPanelOverlay').classList.remove('active');
        this.currentTask = null;
        this.isExpanded = false;
        this.resetNotesView();

        // Reset expand button
        const btn = document.getElementById('taskPanelExpand');
        btn.textContent = '⛶';
        btn.title = 'Expand';
    },

    /**
     * Task 저장
     */
    async save() {
        const saveBtn = document.getElementById('panelTaskSave');
        const originalText = saveBtn.textContent;

        const taskData = {
            entity_name: document.getElementById('panelTaskName').value.trim(),
            project_id: document.getElementById('panelTaskProject').value,
            assignee: document.getElementById('panelTaskAssignee').value,
            status: document.getElementById('panelTaskStatus').value,
            priority: document.getElementById('panelTaskPriority').value,
            start_date: document.getElementById('panelTaskStartDate').value || null,
            due: document.getElementById('panelTaskDue').value || null,
            notes: document.getElementById('panelTaskNotes').value || null
        };

        // Validation
        if (!taskData.entity_name) {
            showToast('Please enter task name', 'error');
            return;
        }
        if (!taskData.project_id) {
            showToast('Please select a project', 'error');
            return;
        }
        if (!taskData.assignee) {
            showToast('Please select an assignee', 'error');
            return;
        }

        // Show loading state
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            let result;
            if (this.currentTask) {
                // Update
                result = await API.updateTask(this.currentTask.entity_id, taskData);
            } else {
                // Create
                result = await API.createTask(taskData);
            }

            if (result.success) {
                showToast(this.currentTask ? 'Task updated' : 'Task created', 'success');
                await State.reloadTasks();
                Kanban.render();
                Calendar.refresh();
                this.close();
            } else {
                showToast(result.message || result.detail || 'Save failed', 'error');
            }
        } catch (err) {
            console.error('Save task error:', err);
            showToast('Error saving task', 'error');
        } finally {
            // Restore button state
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    },

    /**
     * Task 삭제
     */
    async delete() {
        if (!this.currentTask) return;

        const confirmed = confirm(`Delete "${this.currentTask.entity_name}"?`);
        if (!confirmed) return;

        try {
            const result = await API.deleteTask(this.currentTask.entity_id);
            if (result.success) {
                showToast('Task deleted', 'success');
                await State.reloadTasks();
                Kanban.render();
                Calendar.refresh();
                this.close();
            } else {
                showToast(result.message || result.detail || 'Delete failed', 'error');
            }
        } catch (err) {
            console.error('Delete task error:', err);
            showToast('Error deleting task', 'error');
        }
    }
};
