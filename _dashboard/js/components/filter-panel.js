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
    },

    render() {
        this.renderProjectStatusFilters();
        this.renderProjectPriorityFilters();
        this.renderTaskStatusFilters();
        this.renderTaskPriorityFilters();
        this.renderDateFilters();
        this.updateFilterIndicator();
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

        const hasFilters = hasProjectStatusFilter || hasProjectPriorityFilter ||
                          hasTaskStatusFilter || hasTaskPriorityFilter || hasDateFilter;

        if (hasFilters) {
            this.filterBtnEl.classList.add('has-filters');
        } else {
            this.filterBtnEl.classList.remove('has-filters');
        }
    }
};
