/**
 * Filter Panel Component
 * Handles project and task filtering with instant apply
 */
const FilterPanel = {
    panelEl: null,
    overlayEl: null,
    filterBtnEl: null,

    init() {
        this.panelEl = document.getElementById('filterPanel');
        this.overlayEl = document.getElementById('filterPanelOverlay');
        this.filterBtnEl = document.getElementById('btnFilter');

        // Initialize quick date filter with current week selected
        State.initQuickDateFilter();

        this.setupEventListeners();
        this.render();
    },

    setupEventListeners() {
        // Open panel
        this.filterBtnEl?.addEventListener('click', () => this.toggle());

        // Close panel
        document.getElementById('filterPanelClose')?.addEventListener('click', () => this.close());
        this.overlayEl?.addEventListener('click', () => this.close());

        // Reset button
        document.getElementById('filterResetBtn')?.addEventListener('click', () => this.reset());

        // Date inputs
        document.getElementById('filterDueDateStart')?.addEventListener('change', (e) => {
            State.setDateFilter('start', e.target.value);
            this.applyFilters();
            this.updateFilterIndicator();
        });
        document.getElementById('filterDueDateEnd')?.addEventListener('change', (e) => {
            State.setDateFilter('end', e.target.value);
            this.applyFilters();
            this.updateFilterIndicator();
        });
    },

    toggle() {
        if (State.filterPanelOpen) {
            this.close();
        } else {
            this.open();
        }
    },

    open() {
        State.filterPanelOpen = true;
        this.panelEl?.classList.add('active');
        this.overlayEl?.classList.add('active');
        this.filterBtnEl?.classList.add('active');
        this.render();
    },

    close() {
        State.filterPanelOpen = false;
        this.panelEl?.classList.remove('active');
        this.overlayEl?.classList.remove('active');
        this.filterBtnEl?.classList.remove('active');
    },

    reset() {
        State.resetFilters();
        this.render();
        this.applyFilters();
        this.updateFilterIndicator();

        // Re-render Tabs and Sidebar to reflect cleared filters
        Tabs.render();
        Sidebar.render();
        Sidebar.updateHeaderMeta();  // Reset header meta text

        // Reset Quick Date Toggle state
        if (typeof QuickDateToggle !== 'undefined') {
            QuickDateToggle.activeMode = null;
            QuickDateToggle.render();
        }
    },

    render() {
        this.renderActivateFilters();
        this.renderProjectStatusFilters();
        this.renderProjectPriorityFilters();
        this.renderTaskStatusFilters();
        this.renderTaskPriorityFilters();
        this.renderDateFilters();
        // Quick Date Filter moved to QuickDateToggle (tabs.js)
        this.updateFilterIndicator();
    },

    renderActivateFilters() {
        const container = document.getElementById('activateFilters');
        if (!container) return;

        const memberChecked = State.filters.showInactiveMembers;
        const projectChecked = State.filters.project.showInactive;
        const taskChecked = State.filters.task.showInactive;

        container.innerHTML = `
            <label class="filter-toggle ${memberChecked ? 'checked' : ''}" data-type="members">
                <span class="toggle-switch"></span>
                <span>Show inactive members</span>
            </label>
            <label class="filter-toggle ${projectChecked ? 'checked' : ''}" data-type="project">
                <span class="toggle-switch"></span>
                <span>Show inactive projects</span>
            </label>
            <label class="filter-toggle ${taskChecked ? 'checked' : ''}" data-type="task">
                <span class="toggle-switch"></span>
                <span>Show inactive tasks</span>
            </label>
        `;

        this.attachActivateListeners(container);
    },

    attachActivateListeners(container) {
        container.querySelectorAll('.filter-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const type = toggle.dataset.type;
                if (type === 'members') {
                    State.filters.showInactiveMembers = !State.filters.showInactiveMembers;
                } else {
                    State.filters[type].showInactive = !State.filters[type].showInactive;
                }
                toggle.classList.toggle('checked');
                this.applyFilters();
                this.updateFilterIndicator();
            });
        });
    },

    renderProjectStatusFilters() {
        const container = document.getElementById('projectStatusFilters');
        if (!container) return;

        const statuses = State.getProjectStatuses();
        const labels = State.getProjectStatusLabels();

        container.innerHTML = statuses.map(status => {
            const checked = State.isFilterActive('project', 'status', status);
            return `
                <label class="filter-checkbox ${checked ? 'checked' : ''}" data-category="project" data-type="status" data-value="${status}">
                    <span class="status-dot"></span>
                    <span>${labels[status] || status}</span>
                </label>
            `;
        }).join('');

        this.attachCheckboxListeners(container);
    },

    renderProjectPriorityFilters() {
        const container = document.getElementById('projectPriorityFilters');
        if (!container) return;

        const priorities = State.getPriorities();
        const labels = State.getPriorityLabels();

        container.innerHTML = priorities.map(priority => {
            const checked = State.isFilterActive('project', 'priority', priority);
            return `
                <label class="filter-checkbox ${checked ? 'checked' : ''}" data-category="project" data-type="priority" data-value="${priority}">
                    <span class="priority-dot"></span>
                    <span>${labels[priority] || priority}</span>
                </label>
            `;
        }).join('');

        this.attachCheckboxListeners(container);
    },

    renderTaskStatusFilters() {
        const container = document.getElementById('taskStatusFilters');
        if (!container) return;

        const statuses = State.getTaskStatuses();
        const labels = State.getTaskStatusLabels();

        container.innerHTML = statuses.map(status => {
            const checked = State.isFilterActive('task', 'status', status);
            return `
                <label class="filter-checkbox ${checked ? 'checked' : ''}" data-category="task" data-type="status" data-value="${status}">
                    <span class="status-dot"></span>
                    <span>${labels[status] || status}</span>
                </label>
            `;
        }).join('');

        this.attachCheckboxListeners(container);
    },

    renderTaskPriorityFilters() {
        const container = document.getElementById('taskPriorityFilters');
        if (!container) return;

        const priorities = State.getPriorities();
        const labels = State.getPriorityLabels();

        container.innerHTML = priorities.map(priority => {
            const checked = State.isFilterActive('task', 'priority', priority);
            return `
                <label class="filter-checkbox ${checked ? 'checked' : ''}" data-category="task" data-type="priority" data-value="${priority}">
                    <span class="priority-dot"></span>
                    <span>${labels[priority] || priority}</span>
                </label>
            `;
        }).join('');

        this.attachCheckboxListeners(container);
    },

    renderDateFilters() {
        const startInput = document.getElementById('filterDueDateStart');
        const endInput = document.getElementById('filterDueDateEnd');

        if (startInput) {
            startInput.value = State.filters.task.dueDateStart || '';
        }
        if (endInput) {
            endInput.value = State.filters.task.dueDateEnd || '';
        }
    },

    attachCheckboxListeners(container) {
        container.querySelectorAll('.filter-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                const category = checkbox.dataset.category;
                const type = checkbox.dataset.type;
                const value = checkbox.dataset.value;

                State.toggleFilter(category, type, value);
                checkbox.classList.toggle('checked');
                this.applyFilters();
                this.updateFilterIndicator();
            });
        });
    },

    applyFilters() {
        // Re-render tabs, project filter tabs, and kanban
        Tabs.render();
        Kanban.renderProjectFilter();
        Kanban.render();
        Calendar.refresh();  // Codex 피드백: 필터 변경 시 Calendar도 갱신
    },

    updateFilterIndicator() {
        if (!this.filterBtnEl) return;

        // Check if any filters are not at default (use dynamic lengths from State)
        const projectStatusCount = State.getProjectStatuses().length;
        const projectPriorityCount = State.getPriorities().length;
        const taskStatusCount = State.getTaskStatuses().length;
        const taskPriorityCount = State.getPriorities().length;

        const hasProjectStatusFilter = State.filters.project.status.length < projectStatusCount;
        const hasProjectPriorityFilter = State.filters.project.priority.length < projectPriorityCount;
        const hasTaskStatusFilter = State.filters.task.status.length < taskStatusCount;
        const hasTaskPriorityFilter = State.filters.task.priority.length < taskPriorityCount;
        const hasDateFilter = State.filters.task.dueDateStart || State.filters.task.dueDateEnd;
        const hasInactiveFilter = State.filters.project.showInactive || State.filters.task.showInactive || State.filters.showInactiveMembers;
        const hasQuickDateFilter = State.filters.task.selectedWeeks.length > 0 || State.filters.task.selectedMonths.length > 0;

        const hasFilters = hasProjectStatusFilter || hasProjectPriorityFilter ||
                          hasTaskStatusFilter || hasTaskPriorityFilter || hasDateFilter || hasInactiveFilter || hasQuickDateFilter;

        if (hasFilters) {
            this.filterBtnEl.classList.add('has-filters');
        } else {
            this.filterBtnEl.classList.remove('has-filters');
        }
    },

    // ============================================
    // Quick Date Filter
    // ============================================

    renderQuickDateFilter() {
        const container = document.getElementById('quickDateButtons');
        const tabContainer = document.querySelector('.quick-date-tabs');
        if (!container || !tabContainer) return;

        const mode = State.filters.task.quickDateMode;

        // Update tab active state
        tabContainer.querySelectorAll('.quick-date-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === mode);
        });

        // Render buttons based on mode
        if (mode === 'week') {
            this.renderWeekButtons(container);
        } else {
            this.renderMonthButtons(container);
        }

        // Attach tab listeners
        this.attachQuickDateTabListeners(tabContainer);
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

        this.attachQuickDateButtonListeners(container);
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

        this.attachQuickDateButtonListeners(container);
    },

    attachQuickDateTabListeners(tabContainer) {
        tabContainer.querySelectorAll('.quick-date-tab').forEach(tab => {
            // Remove old listener by cloning
            const newTab = tab.cloneNode(true);
            tab.parentNode.replaceChild(newTab, tab);

            newTab.addEventListener('click', () => {
                const mode = newTab.dataset.tab;
                State.setQuickDateMode(mode);
                this.renderQuickDateFilter();
                this.applyFilters();
                this.updateFilterIndicator();
            });
        });
    },

    attachQuickDateButtonListeners(container) {
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
                this.updateFilterIndicator();
            });
        });
    }
};
