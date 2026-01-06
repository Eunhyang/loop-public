/**
 * ProgramRoundsView Component
 * Program-Round 관계를 표시하는 Admin 전용 뷰
 */
const ProgramRoundsView = {
    isLoading: false,

    /**
     * 초기화
     */
    init() {
        this.setupEventListeners();
    },

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // Program 선택 드롭다운
        const programSelect = document.getElementById('programRoundsSelect');
        if (programSelect) {
            programSelect.addEventListener('change', (e) => {
                this.onProgramSelect(e.target.value);
            });
        }
        // Note: btnNewProgram event listener moved to app.js (tsk-022-02)
    },

    /**
     * 뷰 렌더링 (전체)
     */
    render() {
        const container = document.getElementById('programRoundsView');
        if (!container) return;

        // Admin 권한 체크
        if (!Auth.isAdmin()) {
            container.innerHTML = `
                <div class="program-rounds-error">
                    <div class="error-icon">🔒</div>
                    <div class="error-message">Admin 권한이 필요합니다.</div>
                </div>
            `;
            return;
        }

        // Program 선택 드롭다운 + Round 목록 렌더링
        // Note: btnNewProgram moved to main header in index.html (tsk-022-02)
        container.innerHTML = `
            <div class="program-rounds-header">
                <div class="header-title-row">
                    <h2>Program-Round Dashboard</h2>
                </div>
                <div class="program-select-wrapper">
                    <label for="programRoundsSelect">Program 선택:</label>
                    <select id="programRoundsSelect" class="program-select">
                        <option value="">-- Select Program --</option>
                        ${this.renderProgramOptions()}
                    </select>
                </div>
            </div>
            <div class="program-rounds-content" id="programRoundsContent">
                <div class="program-rounds-placeholder">
                    <div class="placeholder-icon">📋</div>
                    <div class="placeholder-text">Program을 선택하면 Round(Project) 목록이 표시됩니다.</div>
                </div>
            </div>
        `;

        // 이벤트 리스너 재설정
        this.setupEventListeners();

        // 이전에 선택된 Program이 있으면 복원
        if (State.selectedProgramId) {
            const select = document.getElementById('programRoundsSelect');
            if (select) {
                select.value = State.selectedProgramId;
            }
            this.renderRounds(State.programRoundsData);
        }
    },

    /**
     * Program 옵션 렌더링
     */
    renderProgramOptions() {
        const programs = State.programs || [];
        return programs.map(pgm => {
            const id = this.escapeHtml(pgm.entity_id);
            const name = this.escapeHtml(pgm.entity_name || pgm.entity_id);
            return `<option value="${id}">${name}</option>`;
        }).join('');
    },

    /**
     * Program 선택 시 처리
     */
    async onProgramSelect(pgmId) {
        if (!pgmId) {
            State.clearProgramRounds();
            this.renderPlaceholder();
            return;
        }

        this.showLoading();

        try {
            const rounds = await State.loadProgramRounds(pgmId);
            this.renderRounds(rounds);
        } catch (e) {
            console.error('Failed to load program rounds:', e);
            this.renderError('Round 목록을 불러오는데 실패했습니다.');
        }
    },

    /**
     * 로딩 상태 표시
     */
    showLoading() {
        const content = document.getElementById('programRoundsContent');
        if (!content) return;

        content.innerHTML = `
            <div class="program-rounds-loading">
                <div class="loading-spinner"></div>
                <div class="loading-text">Loading rounds...</div>
            </div>
        `;
    },

    /**
     * 플레이스홀더 표시
     */
    renderPlaceholder() {
        const content = document.getElementById('programRoundsContent');
        if (!content) return;

        content.innerHTML = `
            <div class="program-rounds-placeholder">
                <div class="placeholder-icon">📋</div>
                <div class="placeholder-text">Program을 선택하면 Round(Project) 목록이 표시됩니다.</div>
            </div>
        `;
    },

    /**
     * 에러 표시
     */
    renderError(message) {
        const content = document.getElementById('programRoundsContent');
        if (!content) return;

        content.innerHTML = `
            <div class="program-rounds-error">
                <div class="error-icon">⚠️</div>
                <div class="error-message">${this.escapeHtml(message)}</div>
            </div>
        `;
    },

    /**
     * Round(Project) 목록 렌더링
     */
    renderRounds(rounds) {
        const content = document.getElementById('programRoundsContent');
        if (!content) return;

        if (!rounds || rounds.length === 0) {
            content.innerHTML = `
                <div class="program-rounds-empty">
                    <div class="empty-icon">📭</div>
                    <div class="empty-text">이 Program에 연결된 Round(Project)가 없습니다.</div>
                </div>
            `;
            return;
        }

        const cardsHtml = rounds.map(round => this.renderRoundCard(round)).join('');

        content.innerHTML = `
            <div class="program-rounds-stats">
                <span class="stats-item">
                    <span class="stats-label">Total Rounds:</span>
                    <span class="stats-value">${rounds.length}</span>
                </span>
            </div>
            <div class="program-rounds-grid">
                ${cardsHtml}
            </div>
        `;

        // Round 카드 클릭 이벤트
        this.attachRoundCardListeners();
    },

    /**
     * Round 카드 렌더링
     */
    renderRoundCard(round) {
        const id = this.escapeHtml(round.entity_id || round.project_id || '');
        const name = this.escapeHtml(round.entity_name || round.name || id);
        const status = this.escapeHtml(round.status || 'unknown');
        const owner = this.escapeHtml(round.owner || '');
        const roundNum = round.round_number || round.round || '';
        const taskCount = round.task_count !== undefined ? round.task_count : '-';

        // Status 색상 결정
        const statusColors = State.getProjectStatusLabels ? State.getProjectStatusLabels() : {};
        const statusLabel = statusColors[status] || status;

        return `
            <div class="round-card" data-project-id="${id}">
                <div class="round-card-header">
                    <span class="round-number">${roundNum ? `R${roundNum}` : ''}</span>
                    <span class="round-status status-${status}">${statusLabel}</span>
                </div>
                <div class="round-card-body">
                    <h3 class="round-name">${name}</h3>
                    <div class="round-id">${id}</div>
                </div>
                <div class="round-card-footer">
                    <span class="round-owner">${owner ? `👤 ${owner}` : ''}</span>
                    <span class="round-task-count">📋 ${taskCount} tasks</span>
                </div>
            </div>
        `;
    },

    /**
     * Round 카드 클릭 이벤트 연결
     */
    attachRoundCardListeners() {
        const cards = document.querySelectorAll('.round-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const projectId = card.dataset.projectId;
                if (projectId && typeof ProjectPanel !== 'undefined') {
                    ProjectPanel.open(projectId);
                }
            });
        });
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
     * 뷰 표시
     */
    show() {
        const view = document.getElementById('programRoundsView');
        if (view) {
            view.classList.add('active');
            this.render();
        }
    },

    /**
     * 뷰 숨김
     */
    hide() {
        const view = document.getElementById('programRoundsView');
        if (view) {
            view.classList.remove('active');
        }
    }
};
