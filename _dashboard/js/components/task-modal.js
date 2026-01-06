/**
 * TaskModal Component
 * Task 생성/수정 모달
 *
 * tsk-dashboard-ux-v1-26: Google Meet 생성 기능 추가
 */
const TaskModal = {
    // Google accounts cache
    googleAccounts: [],

    /**
     * Escape HTML to prevent XSS attacks
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Select 옵션들 채우기
     */
    populateSelects() {
        // Projects
        const projectEl = document.getElementById('taskProject');
        projectEl.innerHTML = State.projects.map(p =>
            `<option value="${p.entity_id}">${p.entity_name || p.entity_id}</option>`
        ).join('');

        // Assignees
        const assigneeEl = document.getElementById('taskAssignee');
        assigneeEl.innerHTML = State.members.map(m =>
            `<option value="${m.id}">${m.name}</option>`
        ).join('');

        // Priorities
        const priorityEl = document.getElementById('taskPriority');
        const priorities = State.getPriorities();
        const priorityLabels = State.getPriorityLabels();
        priorityEl.innerHTML = priorities.map(p =>
            `<option value="${p}" ${p === 'medium' ? 'selected' : ''}>${priorityLabels[p]}</option>`
        ).join('');

        // Statuses
        const statusEl = document.getElementById('taskStatus');
        const statuses = State.getTaskStatuses();
        const statusLabels = State.getTaskStatusLabels();
        statusEl.innerHTML = statuses.map(s =>
            `<option value="${s}" ${s === 'todo' ? 'selected' : ''}>${statusLabels[s]}</option>`
        ).join('');
    },

    /**
     * Initialize event listeners (call once on app init)
     */
    init() {
        // Task Type change handler
        const taskTypeEl = document.getElementById('taskType');
        if (taskTypeEl) {
            taskTypeEl.addEventListener('change', (e) => {
                this.handleTypeChange(e.target.value);
            });
        }

        // Generate Meet button handler (tsk-019-02: Manual generation)
        const generateMeetBtn = document.getElementById('generateMeetBtn');
        if (generateMeetBtn) {
            generateMeetBtn.addEventListener('click', async () => {
                await this.generateMeetLink();
            });
        }

        // Copy Meet link button
        const copyBtn = document.getElementById('copyMeetLink');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const linkInput = document.getElementById('meetLinkDisplay');
                if (linkInput && linkInput.value) {
                    navigator.clipboard.writeText(linkInput.value);
                    showToast('Meet link copied!', 'success');
                }
            });
        }
    },

    /**
     * Handle task type change
     */
    handleTypeChange(type) {
        const meetingOptions = document.getElementById('meetingOptions');
        if (!meetingOptions) return;

        if (type === 'meeting') {
            meetingOptions.style.display = 'block';
            this.loadGoogleAccounts();
        } else {
            meetingOptions.style.display = 'none';
        }
    },

    /**
     * Load connected Google accounts for Meet
     */
    async loadGoogleAccounts() {
        try {
            const accounts = await API.getGoogleAccounts();
            this.googleAccounts = accounts || [];

            const selectEl = document.getElementById('meetGoogleAccount');
            if (!selectEl) return;

            if (this.googleAccounts.length === 0) {
                selectEl.innerHTML = '<option value="">No connected accounts</option>';
            } else {
                selectEl.innerHTML = this.googleAccounts.map((acc, index) =>
                    `<option value="${acc.id}" ${index === 0 ? 'selected' : ''}>${this.escapeHtml(acc.google_email)} (${this.escapeHtml(acc.label)})</option>`
                ).join('');
            }
        } catch (err) {
            console.error('Failed to load Google accounts:', err);
            const selectEl = document.getElementById('meetGoogleAccount');
            if (selectEl) {
                selectEl.innerHTML = '<option value="">Failed to load accounts</option>';
            }
        }
    },

    /**
     * Reset meeting options to default state (tsk-019-02)
     */
    resetMeetingOptions() {
        const meetingOptions = document.getElementById('meetingOptions');
        const meetLinkResult = document.getElementById('meetLinkResult');
        const meetLinkDisplay = document.getElementById('meetLinkDisplay');
        const taskMeetLink = document.getElementById('taskMeetLink');
        const taskType = document.getElementById('taskType');
        const meetStartTime = document.getElementById('meetStartTime');

        if (meetingOptions) meetingOptions.style.display = 'none';
        if (meetLinkResult) meetLinkResult.style.display = 'none';
        if (meetLinkDisplay) meetLinkDisplay.value = '';
        if (taskMeetLink) taskMeetLink.value = '';
        if (taskType) taskType.value = 'dev';
        if (meetStartTime) meetStartTime.value = '14:00';
    },

    /**
     * 새 Task 모달 열기
     * @param {Object} options - 옵션 객체
     * @param {string} options.date - 시작/마감 날짜 (YYYY-MM-DD)
     * @param {string} options.type - Task type (meeting for auto-open meet options)
     */
    open(options = {}) {
        State.editingTask = null;
        document.getElementById('taskModalTitle').textContent = 'New Task';
        document.getElementById('taskId').value = '';
        document.getElementById('taskName').value = '';
        document.getElementById('taskPriority').value = 'medium';
        document.getElementById('taskStatus').value = 'todo';

        // 날짜 설정: 옵션으로 전달된 날짜 또는 오늘 날짜
        const dateValue = options.date || new Date().toISOString().split('T')[0];
        document.getElementById('taskStartDate').value = dateValue;
        document.getElementById('taskDue').value = dateValue;

        // 현재 필터된 프로젝트 선택 (단일 선택인 경우에만)
        if (State.currentProjects.length === 1) {
            document.getElementById('taskProject').value = State.currentProjects[0];
        }

        // Reset meeting options
        this.resetMeetingOptions();

        // If type is meeting, show meeting options
        if (options.type === 'meeting') {
            const taskType = document.getElementById('taskType');
            if (taskType) {
                taskType.value = 'meeting';
                this.handleTypeChange('meeting');
            }
        }

        document.getElementById('taskModal').classList.add('active');
        document.getElementById('taskName').focus();
    },

    /**
     * Task 수정 모달 열기
     */
    edit(taskId) {
        const task = State.getTaskById(taskId);
        if (!task) return;

        State.editingTask = task;
        document.getElementById('taskModalTitle').textContent = 'Edit Task';
        document.getElementById('taskId').value = task.entity_id;
        document.getElementById('taskName').value = task.entity_name || '';
        document.getElementById('taskProject').value = task.project_id || '';
        document.getElementById('taskAssignee').value = task.assignee || '';
        document.getElementById('taskPriority').value = task.priority || 'medium';
        document.getElementById('taskStatus').value = task.status || 'todo';
        document.getElementById('taskStartDate').value = task.start_date || task.due || '';
        document.getElementById('taskDue').value = task.due || '';

        // Reset meeting options
        this.resetMeetingOptions();

        // Set task type if present
        const taskType = document.getElementById('taskType');
        if (taskType && task.type) {
            taskType.value = task.type;
            if (task.type === 'meeting') {
                this.handleTypeChange('meeting');

                // If task has existing meeting link, show it (tsk-019-02: populate hidden field)
                const meetLink = this.findMeetLink(task.links);
                if (meetLink) {
                    const meetLinkResult = document.getElementById('meetLinkResult');
                    const meetLinkDisplay = document.getElementById('meetLinkDisplay');
                    const taskMeetLink = document.getElementById('taskMeetLink');

                    if (meetLinkResult) meetLinkResult.style.display = 'block';
                    if (meetLinkDisplay) meetLinkDisplay.value = meetLink;
                    if (taskMeetLink) taskMeetLink.value = meetLink;  // Fix: populate hidden field for save
                }
            }
        }

        document.getElementById('taskModal').classList.add('active');
        document.getElementById('taskName').focus();
    },

    /**
     * Find Meet link from task.links array
     */
    findMeetLink(links) {
        if (!links || !Array.isArray(links)) return null;
        const meetLink = links.find(l =>
            l.url && l.url.includes('meet.google.com')
        );
        return meetLink ? meetLink.url : null;
    },

    /**
     * 모달 닫기
     */
    close() {
        document.getElementById('taskModal').classList.remove('active');
        State.editingTask = null;
    },

    /**
     * Generate Google Meet link (tsk-019-02: Manual generation with loading state)
     */
    async generateMeetLink() {
        // Disable button to prevent double-clicks (Codex Issue #3)
        const generateBtn = document.getElementById('generateMeetBtn');
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.textContent = '생성 중...';
        }

        const accountId = document.getElementById('meetGoogleAccount')?.value;
        const taskName = document.getElementById('taskName')?.value || 'Meeting';
        const startDate = document.getElementById('taskStartDate')?.value;
        const startTime = document.getElementById('meetStartTime')?.value || '14:00';
        const duration = parseInt(document.getElementById('taskDuration')?.value || '60');

        if (!accountId) {
            showToast('Please select a Google account', 'error');
            // Re-enable button
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.textContent = '링크 생성';
            }
            return null;
        }

        // Construct start time in ISO format
        let startDateTime;
        if (startDate) {
            startDateTime = `${startDate}T${startTime}:00`;
        }

        try {
            const result = await API.createGoogleMeet({
                account_id: parseInt(accountId),
                title: taskName,
                start_time: startDateTime,
                duration_minutes: duration,
                create_calendar_event: true
            });

            if (result.success && result.meet_link) {
                // Show the generated link
                const meetLinkResult = document.getElementById('meetLinkResult');
                const meetLinkDisplay = document.getElementById('meetLinkDisplay');
                const taskMeetLink = document.getElementById('taskMeetLink');

                if (meetLinkResult) meetLinkResult.style.display = 'block';
                if (meetLinkDisplay) meetLinkDisplay.value = result.meet_link;
                if (taskMeetLink) taskMeetLink.value = result.meet_link;

                showToast('Meet link generated!', 'success');
                return result.meet_link;
            } else {
                showToast(result.error || 'Failed to generate Meet link', 'error');
                return null;
            }
        } catch (err) {
            console.error('Generate Meet error:', err);
            showToast('Error generating Meet link', 'error');
            return null;
        } finally {
            // Re-enable button
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.textContent = '링크 생성';
            }
        }
    },

    /**
     * Task 저장 (tsk-019-02: No auto-generation, use manual link only)
     */
    async save() {
        const taskId = document.getElementById('taskId').value;
        const existingMeetLink = document.getElementById('taskMeetLink')?.value;

        // Use existing Meet link if present (from manual generation)
        const meetLink = existingMeetLink;

        const taskType = document.getElementById('taskType')?.value || 'dev';
        const taskData = {
            entity_name: document.getElementById('taskName').value.trim(),
            project_id: document.getElementById('taskProject').value,
            assignee: document.getElementById('taskAssignee').value,
            priority: document.getElementById('taskPriority').value,
            status: document.getElementById('taskStatus').value,
            start_date: document.getElementById('taskStartDate').value || null,
            due: document.getElementById('taskDue').value || null,
            type: taskType
        };

        // Add meeting link to links array if present (preserve existing non-Meet links)
        if (meetLink) {
            // Get existing links from the task being edited (if any)
            const existingLinks = State.editingTask?.links || [];
            // Filter out any existing Meet links (to avoid duplicates)
            const nonMeetLinks = existingLinks.filter(link =>
                !link.url?.includes('meet.google.com')
            );
            // Add new Meet link at the beginning
            taskData.links = [
                { label: 'Google Meet', url: meetLink },
                ...nonMeetLinks
            ];
        }

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

        try {
            let result;
            if (taskId) {
                result = await API.updateTask(taskId, taskData);
            } else {
                result = await API.createTask(taskData);
            }

            if (result.success) {
                showToast(taskId ? 'Task updated' : 'Task created', 'success');
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
        }
    }
};
