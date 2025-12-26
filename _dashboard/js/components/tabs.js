/**
 * Tabs Component
 * Assignee 탭 렌더링 (Kanban by Assignee)
 */
const Tabs = {
    render() {
        const tabsEl = document.getElementById('tabs');
        const counts = State.getTaskCountByAssignee();

        // Build assignee tabs: All + members + unassigned
        let html = `
            <div class="tab ${State.currentAssignee === 'all' ? 'active' : ''}"
                 data-assignee="all" role="tab" aria-selected="${State.currentAssignee === 'all'}">
                All
                <span class="tab-count">${counts.all || 0}</span>
            </div>
        `;

        // Add tab for each active member (respects showInactiveMembers filter)
        State.getActiveMembers().forEach(member => {
            const count = counts[member.id] || 0;
            const isActive = State.currentAssignee === member.id;
            html += `
                <div class="tab ${isActive ? 'active' : ''}"
                     data-assignee="${member.id}" role="tab" aria-selected="${isActive}">
                    ${member.name}
                    <span class="tab-count">${count}</span>
                </div>
            `;
        });

        // Add unassigned tab if there are unassigned tasks
        if (counts['unassigned'] > 0) {
            const isActive = State.currentAssignee === 'unassigned';
            html += `
                <div class="tab ${isActive ? 'active' : ''}"
                     data-assignee="unassigned" role="tab" aria-selected="${isActive}">
                    미정
                    <span class="tab-count">${counts['unassigned']}</span>
                </div>
            `;
        }

        tabsEl.innerHTML = html;
        tabsEl.setAttribute('role', 'tablist');

        // Add click handlers
        tabsEl.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const assigneeId = tab.dataset.assignee;
                this.select(assigneeId);
            });
        });

        // Render Quick Date Toggle
        QuickDateToggle.render();
    },

    select(assigneeId) {
        State.currentAssignee = assigneeId;
        State.currentProject = 'all';  // 담당자 변경 시 프로젝트 필터 초기화
        this.render();
        Kanban.renderProjectFilter();
        Kanban.render();
        Calendar.refresh();  // Codex 피드백: 필터 변경 시 Calendar도 갱신
    }
};

/**
 * Quick Date Toggle Component
 * [W][M] 토글 버튼 + 하위 날짜 필터
 */
const QuickDateToggle = {
    // 현재 활성화된 모드 (null = 비활성, 'week' or 'month')
    activeMode: null,

    init() {
        // 초기 상태: week/month 선택이 있으면 해당 모드 활성화
        if (State.filters.task.selectedWeeks.length > 0) {
            this.activeMode = 'week';
        } else if (State.filters.task.selectedMonths.length > 0) {
            this.activeMode = 'month';
        }
    },

    render() {
        this.renderModeButtons();
        this.renderDateButtons();
    },

    renderModeButtons() {
        const container = document.querySelector('.qd-mode-buttons');
        if (!container) return;

        container.querySelectorAll('.qd-toggle-btn').forEach(btn => {
            const mode = btn.dataset.mode;
            btn.classList.toggle('active', this.activeMode === mode);

            // Clone to remove old listeners
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', () => this.toggleMode(mode));
        });
    },

    renderDateButtons() {
        const container = document.getElementById('qdButtons');
        if (!container) return;

        // 모드가 없으면 하위 버튼 숨김
        if (!this.activeMode) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';

        if (this.activeMode === 'week') {
            this.renderWeekButtons(container);
        } else {
            this.renderMonthButtons(container);
        }
    },

    renderWeekButtons(container) {
        const weeks = State.getWeekRange(2, 2);  // 2 weeks before, 2 weeks after
        const selectedWeeks = State.filters.task.selectedWeeks;

        container.innerHTML = weeks.map(week => {
            const isSelected = selectedWeeks.includes(week.key);
            const currentClass = week.isCurrent ? 'current' : '';
            const selectedClass = isSelected ? 'selected' : '';
            return `
                <button class="quick-date-btn ${currentClass} ${selectedClass}"
                        data-type="week"
                        data-key="${week.key}"
                        title="${week.key}">
                    ${week.label}
                </button>
            `;
        }).join('');

        this.attachDateButtonListeners(container);
    },

    renderMonthButtons(container) {
        const months = State.getMonthRange(1, 1);  // 1 month before, 1 month after
        const selectedMonths = State.filters.task.selectedMonths;

        container.innerHTML = months.map(month => {
            const isSelected = selectedMonths.includes(month.key);
            const currentClass = month.isCurrent ? 'current' : '';
            const selectedClass = isSelected ? 'selected' : '';
            return `
                <button class="quick-date-btn ${currentClass} ${selectedClass}"
                        data-type="month"
                        data-key="${month.key}"
                        title="${month.key}">
                    ${month.label}
                </button>
            `;
        }).join('');

        this.attachDateButtonListeners(container);
    },

    attachDateButtonListeners(container) {
        container.querySelectorAll('.quick-date-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                const key = btn.dataset.key;

                if (type === 'week') {
                    State.toggleWeek(key);
                } else {
                    State.toggleMonth(key);
                }

                btn.classList.toggle('selected');
                this.applyFilters();
            });
        });
    },

    toggleMode(mode) {
        if (this.activeMode === mode) {
            // 같은 버튼 재클릭 → 해제
            this.activeMode = null;
        } else {
            // 다른 버튼 클릭 → 모드 전환
            this.activeMode = mode;
            State.setQuickDateMode(mode);
        }
        // 모드 변경 시 양쪽 선택값 모두 클리어 (W/M 독립성 보장)
        State.filters.task.selectedWeeks = [];
        State.filters.task.selectedMonths = [];

        this.render();
        // 모드 변경 시에도 필터 적용 (선택된 항목이 있으면)
        this.applyFilters();
    },

    applyFilters() {
        // Re-render kanban and calendar
        Kanban.renderProjectFilter();
        Kanban.render();
        Calendar.refresh();
        FilterPanel.updateFilterIndicator();
    }
};
