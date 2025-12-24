/**
 * ProgramPanel Component
 * Program 상세 보기 사이드 패널 (읽기 전용)
 */
const ProgramPanel = {
    currentProgram: null,
    isExpanded: false,

    /**
     * 패널 초기화
     */
    init() {
        this.setupEventListeners();
    },

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // Close button
        document.getElementById('programPanelClose')?.addEventListener('click', () => this.close());

        // Overlay click
        document.getElementById('programPanelOverlay')?.addEventListener('click', () => this.close());

        // Expand button
        document.getElementById('programPanelExpand')?.addEventListener('click', () => this.toggleExpand());
    },

    /**
     * 전체화면 토글
     */
    toggleExpand() {
        this.isExpanded = !this.isExpanded;
        const panel = document.getElementById('programPanel');
        const btn = document.getElementById('programPanelExpand');

        if (this.isExpanded) {
            panel.classList.add('expanded');
            btn.title = 'Collapse';
        } else {
            panel.classList.remove('expanded');
            btn.title = 'Expand';
        }
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
     * Program 상세 패널 열기
     */
    open(programId) {
        const program = State.programs?.find(p => p.entity_id === programId);
        if (!program) {
            showToast('Program not found', 'error');
            return;
        }

        this.currentProgram = program;

        // Basic Info
        document.getElementById('panelProgramId').textContent = program.entity_id;
        document.getElementById('panelProgramName').textContent = program.entity_name || programId;
        document.getElementById('panelProgramStatus').textContent = program.status || 'active';
        document.getElementById('panelProgramStatus').className = 'program-status-badge status-' + (program.status || 'active');

        // Description
        const descEl = document.getElementById('panelProgramDescription');
        if (program.description) {
            descEl.textContent = program.description;
            descEl.classList.remove('empty');
        } else {
            descEl.textContent = 'No description';
            descEl.classList.add('empty');
        }

        // Child Projects
        this.renderChildProjects(program);

        // Statistics
        this.renderStatistics(program);

        this.show();
    },

    /**
     * 하위 프로젝트 렌더링
     */
    renderChildProjects(program) {
        const projectsEl = document.getElementById('panelProgramProjects');
        const childProjects = State.projects?.filter(p => p.program_id === program.entity_id) || [];

        if (childProjects.length === 0) {
            projectsEl.innerHTML = '<div class="empty-message">No projects in this program</div>';
            return;
        }

        const statusLabels = State.getProjectStatusLabels();
        const statusColors = State.getProjectStatusColors ? State.getProjectStatusColors() : {
            'planning': '#9ca3af',
            'in_progress': '#3b82f6',
            'active': '#3b82f6',
            'blocked': '#ef4444',
            'done': '#22c55e',
            'completed': '#22c55e'
        };

        projectsEl.innerHTML = childProjects.map(project => {
            const status = State.normalizeStatus ? State.normalizeStatus(project.status) : (project.status || 'planning');
            const statusColor = statusColors[status] || '#9ca3af';
            const statusLabel = statusLabels[status] || status;

            return `
                <div class="program-project-item" data-project-id="${this.escapeHtml(project.entity_id)}">
                    <span class="program-project-status" style="background: ${statusColor}"></span>
                    <span class="program-project-name">${this.escapeHtml(project.entity_name || project.entity_id)}</span>
                    <span class="program-project-status-label">${statusLabel}</span>
                </div>
            `;
        }).join('');

        // Project 클릭 시 Project Panel 열기
        projectsEl.querySelectorAll('.program-project-item').forEach(item => {
            item.addEventListener('click', () => {
                const projectId = item.dataset.projectId;
                this.close();
                setTimeout(() => ProjectPanel.open(projectId), 300);
            });
        });
    },

    /**
     * 통계 렌더링
     */
    renderStatistics(program) {
        const statsEl = document.getElementById('panelProgramStats');
        const childProjects = State.projects?.filter(p => p.program_id === program.entity_id) || [];

        // 프로젝트별 태스크 수 계산
        const projectIds = childProjects.map(p => p.entity_id);
        const tasks = State.tasks?.filter(t => projectIds.includes(t.project_id)) || [];

        const totalTasks = tasks.length;
        const doneTasks = tasks.filter(t => {
            const status = State.normalizeStatus ? State.normalizeStatus(t.status) : t.status;
            return status === 'done' || status === 'completed';
        }).length;
        const inProgressTasks = tasks.filter(t => {
            const status = State.normalizeStatus ? State.normalizeStatus(t.status) : t.status;
            return status === 'in_progress' || status === 'active';
        }).length;

        const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

        statsEl.innerHTML = `
            <div class="program-stat-item">
                <span class="program-stat-label">Projects</span>
                <span class="program-stat-value">${childProjects.length}</span>
            </div>
            <div class="program-stat-item">
                <span class="program-stat-label">Total Tasks</span>
                <span class="program-stat-value">${totalTasks}</span>
            </div>
            <div class="program-stat-item">
                <span class="program-stat-label">In Progress</span>
                <span class="program-stat-value">${inProgressTasks}</span>
            </div>
            <div class="program-stat-item">
                <span class="program-stat-label">Completed</span>
                <span class="program-stat-value">${doneTasks}</span>
            </div>
            <div class="program-stat-item completion">
                <span class="program-stat-label">Completion</span>
                <span class="program-stat-value">${completionRate}%</span>
                <div class="program-completion-bar">
                    <div class="program-completion-fill" style="width: ${completionRate}%"></div>
                </div>
            </div>
        `;
    },

    /**
     * 패널 표시
     */
    show() {
        document.getElementById('programPanel').classList.add('active');
        document.getElementById('programPanelOverlay').classList.add('active');
    },

    /**
     * 패널 닫기
     */
    close() {
        const panel = document.getElementById('programPanel');
        panel.classList.remove('active');
        panel.classList.remove('expanded');
        document.getElementById('programPanelOverlay').classList.remove('active');
        this.currentProgram = null;
        this.isExpanded = false;

        // Reset expand button
        const btn = document.getElementById('programPanelExpand');
        if (btn) btn.title = 'Expand';
    }
};
