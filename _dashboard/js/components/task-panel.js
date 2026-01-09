/**
 * TaskPanel Component
 * Task 상세 보기/수정 사이드 패널
 */
const TaskPanel = {
    currentTask: null,
    isExpanded: false,
    isEditingNotes: false,
    editableLinks: [], // 편집 중인 링크 목록 (Save 시 저장)
    isUploading: false, // 업로드 중 상태
    currentTaskType: null, // 새 Task 생성 시 선택된 타입 (임시)

    /**
     * Obsidian URI 생성
     * @param {string} vaultPath - Vault 상대 경로
     * @returns {string} Obsidian URI
     */
    getObsidianUri(vaultPath) {
        if (!vaultPath) return '';
        return 'obsidian://open?vault=LOOP&file=' + encodeURIComponent(vaultPath);
    },

    /**
     * 패널 초기화 - Select 옵션 채우기
     */
    init() {
        this.populateSelects();
        this.setupEventListeners();
        this.setupTypeChips();
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
     * Task Type Chips 설정
     */
    setupTypeChips() {
        // 이벤트는 renderTypeChips에서 동적으로 바인딩
    },

    /**
     * Task Type Chips 렌더링
     * @param {string} currentType - 현재 선택된 타입
     */
    renderTypeChips(currentType) {
        const container = document.getElementById('taskTypeChips');
        if (!container) return;

        const types = State.getTaskTypes();
        if (!types || types.length === 0) {
            container.innerHTML = '';
            return;
        }

        const chips = types.map(type => {
            const isActive = type === currentType;
            const activeClass = isActive ? 'active' : '';
            return `
                <span class="task-type-chip type-${type} ${activeClass}" data-type="${type}">
                    ${type}
                </span>
            `;
        }).join('');

        container.innerHTML = chips;

        // 클릭 이벤트 바인딩
        container.querySelectorAll('.task-type-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const newType = chip.dataset.type;
                this.changeTaskType(newType);
            });
        });
    },

    /**
     * Task Type 변경
     * @param {string} newType - 새 타입
     */
    changeTaskType(newType) {
        if (!this.currentTask) {
            // 새 Task 생성 중이면 로컬 상태만 변경
            this.currentTaskType = newType;
            this.renderTypeChips(newType);
            return;
        }

        // 기존 Task면 즉시 API 업데이트
        this.updateTaskType(newType);
    },

    /**
     * Task Type API 업데이트
     * @param {string} newType - 새 타입
     */
    async updateTaskType(newType) {
        if (!this.currentTask) return;

        const taskId = this.currentTask.entity_id;

        try {
            // tsk-dashboard-ux-v1-31: Debug logging
            console.log('[updateTaskType] Sending:', { taskId, type: newType });

            const result = await API.updateTask(taskId, { type: newType });

            // tsk-dashboard-ux-v1-31: Log full response
            console.log('[updateTaskType] Response:', result);

            if (result.success) {
                // tsk-dashboard-ux-v1-31: API 응답에서 task.type 확인
                const savedType = result.task?.type || newType;
                console.log('[updateTaskType] Saved type from response:', savedType);

                // 성공 시 currentTask 업데이트
                this.currentTask.type = savedType;
                this.renderTypeChips(savedType);
                showToast(`Type changed to ${savedType}`, 'success');

                // State 갱신
                await State.reloadTasks();
                Kanban.render();
                Calendar.refresh();
            } else {
                showToast(result.message || 'Type update failed', 'error');
            }
        } catch (err) {
            console.error('Update task type error:', err);
            showToast('Error updating type', 'error');
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

        // Keyboard shortcut: Shift+Cmd+F to toggle fullscreen
        document.addEventListener('keydown', (e) => {
            // Check if panel is active
            const panel = document.getElementById('taskPanel');
            if (!panel?.classList.contains('active')) return;

            // Shift+Cmd+F (Mac) or Shift+Ctrl+F (Windows)
            if (e.shiftKey && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                this.toggleExpand();
            }
        });

        // Notes toggle button
        document.getElementById('notesToggleBtn')?.addEventListener('click', () => this.toggleNotesEdit());

        // Live preview on notes input
        document.getElementById('panelTaskNotes')?.addEventListener('input', (e) => {
            this.updateNotesPreview(e.target.value);
        });

        // ID 클릭 시 복사
        const idEl = document.getElementById('panelTaskId');
        if (idEl) {
            idEl.style.cursor = 'pointer';
            idEl.title = 'Click to copy ID';
            idEl.addEventListener('click', () => this.copyId(idEl.textContent));
        }

        // 링크 복사 버튼
        document.getElementById('panelTaskCopyLink')?.addEventListener('click', () => {
            if (this.currentTask) {
                Router.copyShareableUrl('task', this.currentTask.entity_id);
            }
        });

        // 첨부파일 이벤트 (tsk-dashboard-ux-v1-19)
        this.setupAttachmentEvents();
    },

    /**
     * ID를 클립보드에 복사
     */
    copyId(id) {
        if (!id) return;
        navigator.clipboard.writeText(id).then(() => {
            showToast(`Copied: ${id}`, 'success');
        }).catch(err => {
            console.error('Copy failed:', err);
            showToast('Copy failed', 'error');
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
        this.currentTaskType = null;

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

        // Obsidian 링크 숨기기 (새 Task는 파일 없음)
        document.getElementById('taskPanelObsidian').style.display = 'none';

        // 링크 복사 버튼 숨기기 (새 Task는 ID 없음)
        document.getElementById('panelTaskCopyLink').style.display = 'none';

        // 현재 필터된 프로젝트 선택 (단일 선택인 경우에만)
        if (State.currentProjects.length === 1) {
            document.getElementById('panelTaskProject').value = State.currentProjects[0];
        }

        // Relations 숨기기 (새 Task는 관계 없음)
        document.getElementById('panelTaskRelations').innerHTML =
            '<div style="color: #999; font-style: italic;">Save task to see relations</div>';

        // Links 초기화 (새 Task는 링크 없음, 추가 가능)
        this.editableLinks = [];
        document.getElementById('panelTaskLinksSection').style.display = 'block';
        this.renderLinksUI();

        // Delete 버튼 숨기기
        document.getElementById('panelTaskDelete').style.display = 'none';

        // Notes 초기화 (편집 모드로 시작)
        this.resetNotesView();
        this.isEditingNotes = false;
        this.toggleNotesEdit(); // 새 Task는 편집 모드로 시작
        this.updateNotesPreview('');

        // 첨부파일 섹션 숨김 (새 Task는 저장 후 첨부파일 추가 가능)
        this.initAttachmentsForNewTask();

        // Task Type Chips 렌더링 (새 Task는 타입 없음)
        this.renderTypeChips(null);

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

        // GitHub Integration fields (tsk-uegvfe-1767941662809)
        document.getElementById('panelTaskPrUrl').value = cachedTask.pr_url || '';
        document.getElementById('panelTaskMergedCommit').value = cachedTask.merged_commit || '';

        // Obsidian 링크 설정
        const obsidianLinkEl = document.getElementById('taskPanelObsidian');
        const obsidianUri = this.getObsidianUri(cachedTask._path);
        if (obsidianUri) {
            obsidianLinkEl.href = obsidianUri;
            obsidianLinkEl.style.display = 'inline-flex';
        } else {
            obsidianLinkEl.style.display = 'none';
        }

        // 링크 복사 버튼 표시
        document.getElementById('panelTaskCopyLink').style.display = 'inline-flex';

        // 패널 먼저 표시 (로딩 중)
        document.getElementById('panelTaskNotes').value = 'Loading...';
        this.resetNotesView();
        this.updateNotesPreview('Loading...');

        // URL hash를 위해 먼저 캐시된 task를 currentTask로 설정
        this.currentTask = cachedTask;

        // Task Type Chips 렌더링 (캐시된 타입으로 먼저 표시)
        this.renderTypeChips(cachedTask.type || null);

        this.show();

        // API에서 본문 포함한 상세 정보 로드
        try {
            const response = await API.authFetch(`${API.baseUrl}/api/tasks/${encodeURIComponent(taskId)}`);
            const data = await response.json();
            const task = data.task;

            this.currentTask = task;

            // 본문 표시 (notes + _body 합쳐서)
            const notesContent = [task.notes, task._body].filter(Boolean).join('\n\n---\n\n');
            document.getElementById('panelTaskNotes').value = notesContent;
            this.updateNotesPreview(notesContent);

            // GitHub Integration fields 업데이트 (API response에서 최신 값으로 갱신)
            document.getElementById('panelTaskPrUrl').value = task.pr_url || '';
            document.getElementById('panelTaskMergedCommit').value = task.merged_commit || '';

            // Task Type Chips 렌더링 (API에서 로드한 최신 타입으로 갱신)
            this.renderTypeChips(task.type || null);

            // Relations 표시
            this.renderRelations(task);

            // Links 표시
            this.renderLinks(task);

            // 첨부파일 섹션 표시 및 로드
            this.showAttachmentsSection(taskId);

        } catch (err) {
            console.error('Error loading task detail:', err);
            // 폴백: 캐시된 정보 사용
            this.currentTask = cachedTask;
            const notesContent = [cachedTask.notes, cachedTask._body].filter(Boolean).join('\n\n---\n\n');
            document.getElementById('panelTaskNotes').value = notesContent;
            this.updateNotesPreview(notesContent);

            // Task Type Chips 렌더링 (폴백 시에도)
            this.renderTypeChips(cachedTask.type || null);

            this.renderRelations(cachedTask);
            this.renderLinks(cachedTask);

            // 첨부파일 섹션 표시 및 로드 (폴백에서도)
            this.showAttachmentsSection(taskId);
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
     * URL이 안전한지 확인 (javascript: 등 차단)
     */
    isSafeUrl(url) {
        if (!url) return false;
        const lower = url.toLowerCase().trim();
        return lower.startsWith('https://') || lower.startsWith('http://');
    },

    /**
     * Links 렌더링 - 외부 링크 목록 표시 (편집 가능)
     */
    renderLinks(task) {
        const sectionEl = document.getElementById('panelTaskLinksSection');
        const linksEl = document.getElementById('panelTaskLinks');

        // editableLinks 초기화 (task.links 복사)
        this.editableLinks = Array.isArray(task.links) ? [...task.links] : [];

        // 섹션 항상 표시 (추가 버튼 필요)
        sectionEl.style.display = 'block';

        this.renderLinksUI();
    },

    /**
     * Links UI 렌더링 (editableLinks 기반)
     */
    renderLinksUI() {
        const linksEl = document.getElementById('panelTaskLinks');

        // 링크 목록 렌더링
        const items = this.editableLinks.map((link, index) => {
            const label = this.escapeHtml(link.label || 'Link');
            const url = link.url || '';

            // 안전한 URL만 허용
            if (!this.isSafeUrl(url)) {
                return `
                    <div class="panel-link-item invalid">
                        <span class="panel-link-label">${label}</span>
                        <span class="panel-link-url invalid">(invalid URL)</span>
                        <button type="button" class="panel-link-delete-btn" data-index="${index}" title="Delete">🗑</button>
                    </div>
                `;
            }

            const escapedUrl = this.escapeHtml(url);
            return `
                <div class="panel-link-item">
                    <span class="panel-link-label">${label}:</span>
                    <a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" class="panel-link-url">${escapedUrl}</a>
                    <button type="button" class="panel-link-delete-btn" data-index="${index}" title="Delete">🗑</button>
                </div>
            `;
        });

        // Add Link 버튼 + 입력 폼
        const addFormHtml = `
            <div class="panel-link-add-form" id="taskLinkAddForm" style="display: none;">
                <div class="panel-link-input-row">
                    <input type="text" id="taskLinkLabelInput" class="panel-link-input" placeholder="Label (예: 기획문서)">
                    <input type="url" id="taskLinkUrlInput" class="panel-link-input" placeholder="URL (https://...)">
                </div>
                <div class="panel-link-form-buttons">
                    <button type="button" class="btn btn-sm btn-primary" id="taskLinkSaveBtn">Add</button>
                    <button type="button" class="btn btn-sm btn-secondary" id="taskLinkCancelBtn">Cancel</button>
                </div>
            </div>
            <button type="button" class="panel-link-add-btn" id="taskLinkAddBtn">+ Add Link</button>
        `;

        linksEl.innerHTML = items.join('') + addFormHtml;

        // 이벤트 바인딩
        this.bindLinkEventHandlers();
    },

    /**
     * Link 이벤트 핸들러 바인딩
     */
    bindLinkEventHandlers() {
        // Delete 버튼들
        document.querySelectorAll('#panelTaskLinks .panel-link-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index, 10);
                this.deleteLink(index);
            });
        });

        // Add 버튼
        document.getElementById('taskLinkAddBtn')?.addEventListener('click', () => {
            this.showAddLinkForm();
        });

        // Save 버튼 (폼 내)
        document.getElementById('taskLinkSaveBtn')?.addEventListener('click', () => {
            this.addNewLink();
        });

        // Cancel 버튼
        document.getElementById('taskLinkCancelBtn')?.addEventListener('click', () => {
            this.hideAddLinkForm();
        });

        // Enter 키로 추가
        document.getElementById('taskLinkUrlInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addNewLink();
            }
        });
    },

    /**
     * Add Link 폼 표시
     */
    showAddLinkForm() {
        const form = document.getElementById('taskLinkAddForm');
        const addBtn = document.getElementById('taskLinkAddBtn');
        if (form) form.style.display = 'block';
        if (addBtn) addBtn.style.display = 'none';
        document.getElementById('taskLinkLabelInput')?.focus();
    },

    /**
     * Add Link 폼 숨김
     */
    hideAddLinkForm() {
        const form = document.getElementById('taskLinkAddForm');
        const addBtn = document.getElementById('taskLinkAddBtn');
        if (form) form.style.display = 'none';
        if (addBtn) addBtn.style.display = 'inline-block';
        // 입력값 초기화
        const labelInput = document.getElementById('taskLinkLabelInput');
        const urlInput = document.getElementById('taskLinkUrlInput');
        if (labelInput) labelInput.value = '';
        if (urlInput) urlInput.value = '';
    },

    /**
     * 새 링크 추가 (로컬 배열에)
     */
    addNewLink() {
        const labelInput = document.getElementById('taskLinkLabelInput');
        const urlInput = document.getElementById('taskLinkUrlInput');
        const label = labelInput?.value?.trim() || '';
        const url = urlInput?.value?.trim() || '';

        // 유효성 검사
        if (!label) {
            showToast('Please enter a label', 'error');
            labelInput?.focus();
            return;
        }
        if (!this.isSafeUrl(url)) {
            showToast('Please enter a valid URL (https:// or http://)', 'error');
            urlInput?.focus();
            return;
        }

        // 배열에 추가
        this.editableLinks.push({ label, url });

        // UI 갱신
        this.renderLinksUI();

        showToast('Link added (click Save to persist)', 'info');
    },

    /**
     * 링크 삭제 (로컬 배열에서)
     */
    deleteLink(index) {
        if (index >= 0 && index < this.editableLinks.length) {
            this.editableLinks.splice(index, 1);
            this.renderLinksUI();
            showToast('Link removed (click Save to persist)', 'info');
        }
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

        // URL hash 업데이트
        if (this.currentTask) {
            Router.setHash('task', this.currentTask.entity_id);
        }
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

        // URL hash 클리어
        Router.clearHash();
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
            notes: document.getElementById('panelTaskNotes').value || null,
            // 유효한 URL만 저장 (invalid 링크 필터링)
            links: this.editableLinks.filter(link => this.isSafeUrl(link.url)).length > 0
                ? this.editableLinks.filter(link => this.isSafeUrl(link.url))
                : null,
            // Task Type (새 Task인 경우 currentTaskType 사용, 기존 Task인 경우 currentTask.type 사용)
            type: this.currentTask ? this.currentTask.type : this.currentTaskType
        };

        // GitHub Integration fields (tsk-uegvfe-1767941662809)
        const prUrl = document.getElementById('panelTaskPrUrl').value.trim();
        const mergedCommit = document.getElementById('panelTaskMergedCommit').value.trim();

        // URL 검증: pr_url이 있으면 유효한 URL인지 확인
        if (prUrl && !this.isSafeUrl(prUrl)) {
            showToast('Invalid PR URL - must start with http:// or https://', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
            return;
        }

        taskData.pr_url = prUrl || null;
        taskData.merged_commit = mergedCommit || null;

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
            // 에러 객체에서 상세 정보 추출
            let errorMsg = err.message;
            if (err.detail) {
                errorMsg = err.detail;
            }
            showToast('Error saving task: ' + errorMsg, 'error');
            // 에러 시에도 패널 닫기 (오버레이 stuck 방지)
            this.close();
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
    },

    // ============================================
    // Attachments (tsk-dashboard-ux-v1-19)
    // ============================================

    /**
     * 첨부파일 이벤트 리스너 설정
     */
    setupAttachmentEvents() {
        const dropzone = document.getElementById('attachmentDropzone');
        const fileInput = document.getElementById('attachmentFileInput');

        if (!dropzone || !fileInput) return;

        // 클릭으로 파일 선택
        dropzone.addEventListener('click', () => {
            if (!this.isUploading) {
                fileInput.click();
            }
        });

        // 파일 선택 시 업로드
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                this.uploadFiles(Array.from(e.target.files));
                fileInput.value = ''; // 초기화
            }
        });

        // 드래그 이벤트
        dropzone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('drag-over');
        });

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('drag-over');
        });

        dropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('drag-over');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('drag-over');

            if (!this.isUploading && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                this.uploadFiles(Array.from(e.dataTransfer.files));
            }
        });
    },

    /**
     * 파일 업로드 처리
     * @param {File[]} files - 업로드할 파일 목록
     */
    async uploadFiles(files) {
        if (!this.currentTask) {
            showToast('Please save task first', 'warning');
            return;
        }

        if (this.isUploading) {
            showToast('Upload in progress', 'warning');
            return;
        }

        const taskId = this.currentTask.entity_id;

        for (const file of files) {
            try {
                this.isUploading = true;
                this.showUploadProgress(file.name);

                await API.uploadAttachment(taskId, file, (percent) => {
                    this.updateUploadProgress(percent);
                });

                showToast(`Uploaded: ${file.name}`, 'success');
            } catch (err) {
                console.error('Upload error:', err);
                showToast(`Upload failed: ${err.message}`, 'error');
            } finally {
                this.isUploading = false;
                this.hideUploadProgress();
            }
        }

        // 업로드 완료 후 목록 새로고침
        this.loadAttachments(taskId);
    },

    /**
     * 업로드 진행 UI 표시
     * @param {string} filename - 파일명
     */
    showUploadProgress(filename) {
        const progressEl = document.getElementById('attachmentProgress');
        const filenameEl = document.getElementById('attachmentProgressFilename');
        const percentEl = document.getElementById('attachmentProgressPercent');
        const barEl = document.getElementById('attachmentProgressBar');

        if (progressEl) {
            progressEl.style.display = 'block';
            filenameEl.textContent = filename;
            percentEl.textContent = '0%';
            barEl.style.width = '0%';
        }
    },

    /**
     * 업로드 진행률 업데이트
     * @param {number} percent - 진행률 (0-100)
     */
    updateUploadProgress(percent) {
        const percentEl = document.getElementById('attachmentProgressPercent');
        const barEl = document.getElementById('attachmentProgressBar');

        if (percentEl) percentEl.textContent = `${percent}%`;
        if (barEl) barEl.style.width = `${percent}%`;
    },

    /**
     * 업로드 진행 UI 숨김
     */
    hideUploadProgress() {
        const progressEl = document.getElementById('attachmentProgress');
        if (progressEl) {
            progressEl.style.display = 'none';
        }
    },

    /**
     * 첨부파일 목록 로드 및 렌더링
     * @param {string} taskId - Task ID
     */
    async loadAttachments(taskId) {
        const listEl = document.getElementById('attachmentList');
        if (!listEl) return;

        // 로딩 상태
        listEl.innerHTML = '<div class="attachment-list-loading">Loading attachments...</div>';

        try {
            const data = await API.getAttachments(taskId);
            this.renderAttachmentList(taskId, data.attachments || []);
        } catch (err) {
            console.error('Error loading attachments:', err);
            listEl.innerHTML = '<div class="attachment-empty">Failed to load attachments</div>';
        }
    },

    /**
     * 첨부파일 목록 렌더링
     * @param {string} taskId - Task ID
     * @param {Array} attachments - 첨부파일 목록
     */
    renderAttachmentList(taskId, attachments) {
        const listEl = document.getElementById('attachmentList');
        if (!listEl) return;

        if (!attachments || attachments.length === 0) {
            listEl.innerHTML = '<div class="attachment-empty">No attachments</div>';
            return;
        }

        const items = attachments.map(att => {
            const icon = this.getFileIcon(att.content_type, att.filename);
            const size = this.formatFileSize(att.size);
            const ext = att.filename.split('.').pop()?.toUpperCase() || '';
            const isPdf = att.content_type === 'application/pdf';
            const safeFilename = this.escapeHtml(att.filename);

            // PDF인 경우 뷰어 버튼 추가 (tsk-20 연동 포인트)
            const viewerBtn = isPdf
                ? `<button class="attachment-btn viewer" data-filename="${safeFilename}" title="View PDF">👁</button>`
                : '';

            return `
                <div class="attachment-item" data-filename="${safeFilename}">
                    <span class="attachment-icon ${icon.class}">${icon.emoji}</span>
                    <div class="attachment-info">
                        <span class="attachment-name" title="${safeFilename}">${safeFilename}</span>
                        <div class="attachment-meta">
                            <span class="attachment-size">${size}</span>
                            <span class="attachment-type">${ext}</span>
                        </div>
                    </div>
                    <div class="attachment-actions">
                        ${viewerBtn}
                        <button class="attachment-btn download" data-filename="${safeFilename}" title="Download">⬇</button>
                        <button class="attachment-btn delete" data-filename="${safeFilename}" title="Delete">🗑</button>
                    </div>
                </div>
            `;
        });

        listEl.innerHTML = items.join('');

        // 이벤트 바인딩
        this.bindAttachmentActions(taskId);
    },

    /**
     * 첨부파일 액션 버튼 이벤트 바인딩
     * @param {string} taskId - Task ID
     */
    bindAttachmentActions(taskId) {
        const listEl = document.getElementById('attachmentList');
        if (!listEl) return;

        // 다운로드 버튼
        listEl.querySelectorAll('.attachment-btn.download').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const filename = btn.dataset.filename;
                const url = API.getAttachmentUrl(taskId, filename);
                // Authorization 헤더가 필요하므로 새 탭에서 직접 열기 대신 fetch + blob 사용
                this.downloadAttachment(taskId, filename);
            });
        });

        // PDF 뷰어 버튼 (tsk-dashboard-ux-v1-20 연동)
        listEl.querySelectorAll('.attachment-btn.viewer').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const filename = btn.dataset.filename;
                const url = API.getAttachmentUrl(taskId, filename);

                // PDFViewer 모달 열기
                if (typeof PDFViewer !== 'undefined') {
                    PDFViewer.open(url, filename, taskId);
                } else {
                    showToast('PDF viewer not available', 'error');
                    console.error('PDFViewer component not loaded');
                }
            });
        });

        // 삭제 버튼
        listEl.querySelectorAll('.attachment-btn.delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const filename = btn.dataset.filename;
                if (confirm(`Delete "${filename}"?`)) {
                    await this.deleteAttachment(taskId, filename);
                }
            });
        });
    },

    /**
     * 첨부파일 다운로드 (인증 헤더 포함)
     * @param {string} taskId - Task ID
     * @param {string} filename - 파일명
     */
    async downloadAttachment(taskId, filename) {
        try {
            const url = API.getAttachmentUrl(taskId, filename);
            const response = await API.authFetch(url);

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.error('Download error:', err);
            showToast('Download failed', 'error');
        }
    },

    /**
     * 첨부파일 삭제
     * @param {string} taskId - Task ID
     * @param {string} filename - 파일명
     */
    async deleteAttachment(taskId, filename) {
        try {
            const result = await API.deleteAttachment(taskId, filename);
            if (result.success) {
                showToast('Attachment deleted', 'success');
                this.loadAttachments(taskId);
            } else {
                showToast(result.message || 'Delete failed', 'error');
            }
        } catch (err) {
            console.error('Delete attachment error:', err);
            showToast('Delete failed', 'error');
        }
    },

    /**
     * 파일 타입에 따른 아이콘 반환
     * @param {string} mimeType - MIME 타입
     * @param {string} filename - 파일명
     * @returns {{emoji: string, class: string}}
     */
    getFileIcon(mimeType, filename) {
        const ext = filename.split('.').pop()?.toLowerCase() || '';

        // PDF
        if (mimeType === 'application/pdf' || ext === 'pdf') {
            return { emoji: '📄', class: 'pdf' };
        }

        // HWP
        if (ext === 'hwp' || ext === 'hwpx') {
            return { emoji: '📋', class: 'hwp' };
        }

        // Word
        if (mimeType?.includes('word') || ext === 'doc' || ext === 'docx') {
            return { emoji: '📝', class: 'doc' };
        }

        // Excel
        if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel') || ext === 'xls' || ext === 'xlsx' || ext === 'csv') {
            return { emoji: '📊', class: 'xls' };
        }

        // PowerPoint
        if (mimeType?.includes('presentation') || mimeType?.includes('powerpoint') || ext === 'ppt' || ext === 'pptx') {
            return { emoji: '📑', class: 'ppt' };
        }

        // Image
        if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
            return { emoji: '🖼', class: 'image' };
        }

        // Audio
        if (mimeType?.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'ogg', 'flac'].includes(ext)) {
            return { emoji: '🎵', class: 'audio' };
        }

        // Video
        if (mimeType?.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv'].includes(ext)) {
            return { emoji: '🎬', class: 'video' };
        }

        // Archive
        if (['zip', 'tar', 'gz', 'rar', '7z'].includes(ext)) {
            return { emoji: '📦', class: 'archive' };
        }

        // Text
        if (mimeType?.startsWith('text/') || ['txt', 'md', 'json'].includes(ext)) {
            return { emoji: '📃', class: 'text' };
        }

        // Default
        return { emoji: '📎', class: 'other' };
    },

    /**
     * 파일 크기 포맷
     * @param {number} bytes - 바이트
     * @returns {string} 포맷된 크기
     */
    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';

        const units = ['B', 'KB', 'MB', 'GB'];
        let unitIndex = 0;
        let size = bytes;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
    },

    /**
     * 첨부파일 섹션 초기화 (새 Task용)
     */
    initAttachmentsForNewTask() {
        const sectionEl = document.getElementById('panelTaskAttachmentsSection');
        const listEl = document.getElementById('attachmentList');

        if (sectionEl) {
            // 새 Task는 저장 후 첨부파일 추가 가능
            sectionEl.style.display = 'none';
        }

        if (listEl) {
            listEl.innerHTML = '';
        }
    },

    /**
     * 첨부파일 섹션 표시 (기존 Task용)
     * @param {string} taskId - Task ID
     */
    showAttachmentsSection(taskId) {
        const sectionEl = document.getElementById('panelTaskAttachmentsSection');

        if (sectionEl) {
            sectionEl.style.display = 'block';
        }

        this.loadAttachments(taskId);
    },

    /**
     * 읽기 전용 HTML 렌더링 (Pending Panel Entity Preview용)
     * @param {Object} task - Task 엔티티
     * @returns {string} HTML 문자열
     */
    renderReadOnlyHTML(task) {
        if (!task) return '<div class="empty-state">No task data</div>';

        let html = '';

        // Status
        if (task.status) {
            const statusIcon = { done: '✅', doing: '🔄', todo: '⬜', blocked: '🚫' }[task.status] || '⬜';
            html += `
                <div class="entity-section">
                    <div class="entity-section-title">Status</div>
                    <div class="entity-status-badge ${task.status.replace(/\s+/g, '_')}">${statusIcon} ${this.escapeHtml(task.status)}</div>
                </div>
            `;
        }

        // Assignee
        if (task.assignee) {
            html += `
                <div class="entity-section">
                    <div class="entity-section-title">Assignee</div>
                    <div class="entity-section-content">${this.escapeHtml(task.assignee)}</div>
                </div>
            `;
        }

        // Due Date
        if (task.due) {
            html += `
                <div class="entity-section">
                    <div class="entity-section-title">Due Date</div>
                    <div class="entity-section-content">${this.escapeHtml(task.due)}</div>
                </div>
            `;
        }

        // Priority
        if (task.priority_flag || task.priority) {
            const priority = task.priority_flag || task.priority;
            html += `
                <div class="entity-section">
                    <div class="entity-section-title">Priority</div>
                    <div class="entity-status-badge priority-${priority}">${this.escapeHtml(priority)}</div>
                </div>
            `;
        }

        // Project
        if (task.project_id) {
            html += `
                <div class="entity-section">
                    <div class="entity-section-title">Project</div>
                    <span class="entity-id-link" data-entity-id="${this.escapeHtml(task.project_id)}">${this.escapeHtml(task.project_id)}</span>
                </div>
            `;
        }

        // Conditions (3Y)
        if (task.conditions_3y && task.conditions_3y.length > 0) {
            html += `
                <div class="entity-section">
                    <div class="entity-section-title">Conditions (3Y)</div>
                    <div class="field-value-badges">
                        ${task.conditions_3y.map(c => `<span class="field-value-badge entity-id-link" data-entity-id="${this.escapeHtml(c)}">${this.escapeHtml(c)}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        // Links
        if (task.links && task.links.length > 0) {
            html += `
                <div class="entity-section">
                    <div class="entity-section-title">Links</div>
                    <div class="entity-links-list">
                        ${task.links.map(link => {
                            const label = this.escapeHtml(link.label || 'Link');
                            const url = link.url || '';
                            if (!this.isSafeUrl(url)) return '';
                            return `<a href="${this.escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="entity-link-item">${label}</a>`;
                        }).filter(Boolean).join('')}
                    </div>
                </div>
            `;
        }

        // GitHub Integration (tsk-uegvfe-1767941662809)
        if (task.pr_url || task.merged_commit) {
            html += `<div class="entity-section">`;
            html += `<div class="entity-section-title">GitHub Integration</div>`;
            html += `<div class="entity-section-content">`;

            if (task.pr_url && this.isSafeUrl(task.pr_url)) {
                html += `
                    <div style="margin-bottom: 8px;">
                        <strong>PR:</strong>
                        <a href="${this.escapeHtml(task.pr_url)}" target="_blank" rel="noopener noreferrer" class="entity-link-item">${this.escapeHtml(task.pr_url)}</a>
                    </div>
                `;
            }

            if (task.merged_commit) {
                const commitDisplay = task.merged_commit.length > 7
                    ? task.merged_commit.substring(0, 7)
                    : task.merged_commit;
                html += `
                    <div>
                        <strong>Commit:</strong>
                        <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${this.escapeHtml(commitDisplay)}</code>
                        <button
                            class="icon-btn"
                            onclick="navigator.clipboard.writeText('${this.escapeHtml(task.merged_commit)}'); alert('Copied full commit SHA!');"
                            title="Copy full commit SHA">
                            📋
                        </button>
                    </div>
                `;
            }

            html += `</div></div>`;
        }

        // Notes + Body (마크다운 렌더링)
        const notesContent = [task.notes, task._body].filter(Boolean).join('\n\n---\n\n');
        if (notesContent) {
            html += `
                <div class="entity-section entity-notes-section">
                    <div class="entity-section-title">Notes</div>
                    <div class="entity-notes-content markdown-body">
                        ${this.renderMarkdown(notesContent)}
                    </div>
                </div>
            `;
        }

        return html;
    }
};
