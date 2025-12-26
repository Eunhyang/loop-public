/**
 * State Module
 * 전역 상태 관리
 */
const State = {
    // Data
    constants: null,
    members: [],
    northstars: [],
    metahypotheses: [],
    conditions: [],
    productlines: [],
    partnershipstages: [],
    tracks: [],
    programs: [],
    projects: [],
    tasks: [],
    hypotheses: [],

    // UI State
    currentProject: 'all',
    currentAssignee: 'all',
    currentTrack: 'all',
    currentHypothesis: null,
    currentCondition: null,
    filterTrack: null,
    filterProgram: null,
    filterHypothesis: null,
    filterCondition: null,
    loading: false,
    editingTask: null,
    editingProject: null,

    // Filter Panel State
    filters: {
        project: {
            status: ['todo', 'doing', 'blocked'],  // done excluded by default
            priority: ['critical', 'high', 'medium', 'low'],
            showInactive: false  // activate: false 엔티티 숨김 (기본값)
        },
        task: {
            status: ['todo', 'doing', 'done', 'blocked'],
            priority: ['critical', 'high', 'medium', 'low'],
            dueDateStart: null,
            dueDateEnd: null,
            showInactive: false,  // activate: false 엔티티 숨김 (기본값)
            // Quick Date Filter
            quickDateMode: 'week',  // 'week' or 'month'
            selectedWeeks: [],      // e.g., ['2024-W52', '2025-W01']
            selectedMonths: []      // e.g., ['2024-11', '2024-12', '2025-01']
        },
        showInactiveMembers: false  // active: false 멤버 숨김 (기본값)
    },
    filterPanelOpen: false,

    // ============================================
    // Data Loading
    // ============================================
    async loadAll() {
        this.loading = true;
        try {
            const [
                constants, members,
                northstars, metahypotheses, conditions, productlines, partnershipstages,
                tracks, programs, projects, tasks, hypotheses
            ] = await Promise.all([
                API.getConstants(),
                API.getMembers(),
                API.getNorthStars().catch(() => []),
                API.getMetaHypotheses().catch(() => []),
                API.getConditions().catch(() => []),
                API.getProductLines().catch(() => []),
                API.getPartnershipStages().catch(() => []),
                API.getTracks(),
                API.getPrograms().catch(() => []),
                API.getProjects(),
                API.getTasks(),
                API.getHypotheses().catch(() => [])
            ]);

            this.constants = constants;
            this.members = members;
            this.northstars = northstars;
            this.metahypotheses = metahypotheses;
            this.conditions = conditions;
            this.productlines = productlines;
            this.partnershipstages = partnershipstages;
            this.tracks = tracks;
            this.programs = programs;
            this.projects = projects;
            this.tasks = tasks;
            this.hypotheses = hypotheses;
        } finally {
            this.loading = false;
        }
    },

    async reloadTasks() {
        this.tasks = await API.getTasks();
    },

    async reloadProjects() {
        this.projects = await API.getProjects();
    },

    async reloadPrograms() {
        this.programs = await API.getPrograms();
    },

    // ============================================
    // Helpers
    // ============================================
    getTaskStatuses() {
        return this.constants?.task?.status || ['todo', 'doing', 'done', 'blocked'];
    },

    getTaskStatusLabels() {
        return this.constants?.task?.status_labels || {
            todo: 'To Do', doing: 'Doing', done: 'Done', blocked: 'Blocked'
        };
    },

    getTaskStatusColors() {
        return this.constants?.task?.status_colors || {
            todo: '#6b7280', doing: '#3b82f6', done: '#10b981', blocked: '#ef4444'
        };
    },

    getPriorities() {
        return this.constants?.priority?.values || ['critical', 'high', 'medium', 'low'];
    },

    getPriorityLabels() {
        return this.constants?.priority?.labels || {
            critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low'
        };
    },

    getProjectStatuses() {
        return this.constants?.project?.status || ['todo', 'doing', 'done', 'blocked'];
    },

    getProjectStatusLabels() {
        return this.constants?.project?.status_labels || {
            todo: 'To Do', doing: 'Doing', done: 'Done', blocked: 'Blocked'
        };
    },

    // ============================================
    // Lookups
    // ============================================
    getProjectById(projectId) {
        return this.projects.find(p => p.entity_id === projectId);
    },

    getTrackById(trackId) {
        return this.tracks.find(t => t.entity_id === trackId);
    },

    getProgramById(programId) {
        return this.programs.find(p => p.entity_id === programId);
    },

    getMemberById(memberId) {
        return this.members.find(m => m.id === memberId);
    },

    // Get active members (respects showInactiveMembers filter)
    getActiveMembers() {
        if (this.filters.showInactiveMembers) {
            return this.members;
        }
        return this.members.filter(m => m.active !== false);
    },

    // Get inactive member IDs (for filtering tasks/projects)
    getInactiveMemberIds() {
        return this.members
            .filter(m => m.active === false)
            .map(m => m.id);
    },

    // Check if a member is active
    isMemberActive(memberId) {
        if (this.filters.showInactiveMembers) return true;
        const member = this.getMemberById(memberId);
        return member ? member.active !== false : true;
    },

    getTaskById(taskId) {
        return this.tasks.find(t => t.entity_id === taskId);
    },

    // Get Track for a Project
    getTrackForProject(project) {
        if (!project) return null;
        const parentId = project.parent_id || project.track_id;
        if (!parentId) return null;
        return this.tracks.find(t => t.entity_id === parentId);
    },

    // Get filtered tasks by current project, assignee, and strategy filters
    // Also applies task-level filters (status, priority, due date)
    // Options: { skipQuickDateFilter: boolean } - skip quick date filter for calendar view
    getFilteredTasks(options = {}) {
        const { skipQuickDateFilter = false } = options;
        let filtered = this.tasks;

        // Filter by activate (hide inactive by default)
        if (!this.filters.task.showInactive) {
            filtered = filtered.filter(t => t.activate !== false);
        }

        // Filter by inactive members (hide tasks assigned to inactive members)
        if (!this.filters.showInactiveMembers) {
            const inactiveIds = this.getInactiveMemberIds();
            filtered = filtered.filter(t => !inactiveIds.includes(t.assignee));
        }

        // Filter by track (via project's parent_id)
        if (this.filterTrack && this.filterTrack !== 'all') {
            const trackProjects = this.projects
                .filter(p => p.parent_id === this.filterTrack || p.track_id === this.filterTrack)
                .map(p => p.entity_id);
            filtered = filtered.filter(t => trackProjects.includes(t.project_id));
        }

        // Filter by program (via project's program_id)
        if (this.filterProgram) {
            const programProjects = this.projects
                .filter(p => p.program_id === this.filterProgram)
                .map(p => p.entity_id);
            filtered = filtered.filter(t => programProjects.includes(t.project_id));
        }

        // Filter by hypothesis (tasks that validate this hypothesis)
        if (this.filterHypothesis) {
            filtered = filtered.filter(t =>
                t.validates?.includes(this.filterHypothesis) ||
                t.outgoing_relations?.some(r => r.target_id === this.filterHypothesis)
            );
        }

        // Filter by condition (tasks with conditions_3y containing this condition)
        if (this.filterCondition) {
            filtered = filtered.filter(t =>
                t.conditions_3y?.includes(this.filterCondition)
            );
        }

        // Filter by project
        if (this.currentProject !== 'all') {
            filtered = filtered.filter(t => t.project_id === this.currentProject);
        }

        // Filter by assignee
        if (this.currentAssignee !== 'all') {
            if (this.currentAssignee === 'unassigned') {
                filtered = filtered.filter(t => !t.assignee);
            } else {
                filtered = filtered.filter(t => t.assignee === this.currentAssignee);
            }
        }

        // Apply project status/priority filters (filter tasks by their parent project)
        filtered = filtered.filter(t => {
            const project = this.getProjectById(t.project_id);
            if (!project) return true;  // Keep tasks without project
            const projectStatus = project.status || 'doing';
            const projectPriority = project.priority || 'medium';
            return this.filters.project.status.includes(projectStatus) &&
                   this.filters.project.priority.includes(projectPriority);
        });

        // Apply task status filter
        filtered = filtered.filter(t => {
            const status = this.normalizeStatus(t.status);
            return this.filters.task.status.includes(status);
        });

        // Apply task priority filter
        filtered = filtered.filter(t => {
            const priority = t.priority || 'medium';
            return this.filters.task.priority.includes(priority);
        });

        // Apply due date filter (manual date range)
        if (this.filters.task.dueDateStart) {
            const startDate = new Date(this.filters.task.dueDateStart);
            filtered = filtered.filter(t => {
                if (!t.due_date) return false;
                return new Date(t.due_date) >= startDate;
            });
        }
        if (this.filters.task.dueDateEnd) {
            const endDate = new Date(this.filters.task.dueDateEnd);
            filtered = filtered.filter(t => {
                if (!t.due_date) return false;
                return new Date(t.due_date) <= endDate;
            });
        }

        // Apply quick date filter (week/month buttons) - skip for calendar view
        if (!skipQuickDateFilter) {
            filtered = filtered.filter(t => this.passesQuickDateFilter(t));
        }

        return filtered;
    },

    // Status 매핑 (다양한 상태값을 표준 상태로 변환)
    normalizeStatus(status) {
        const statusMap = {
            // 표준 상태 (Dashboard UI)
            'todo': 'todo',
            'doing': 'doing',
            'done': 'done',
            'blocked': 'blocked',
            // Schema 값 (schema_registry.md 기준)
            'planning': 'todo',
            'active': 'doing',
            'failed': 'blocked',
            'learning': 'done',
            // 레거시/대체 상태
            'pending': 'todo',
            'in_progress': 'doing',
            'completed': 'done',
            'complete': 'done',
            'on_hold': 'blocked',
            'cancelled': 'blocked'
        };
        return statusMap[status] || 'todo';
    },

    // Get tasks grouped by status
    getTasksByStatus() {
        const statuses = this.getTaskStatuses();
        const grouped = {};
        statuses.forEach(s => grouped[s] = []);

        this.getFilteredTasks().forEach(task => {
            const status = this.normalizeStatus(task.status);
            if (grouped[status]) {
                grouped[status].push(task);
            }
        });

        return grouped;
    },

    // Get all Done tasks (ignoring assignee filter, for member-split Done columns)
    getAllDoneTasks() {
        let filtered = this.tasks;

        // Filter by activate (hide inactive by default)
        if (!this.filters.task.showInactive) {
            filtered = filtered.filter(t => t.activate !== false);
        }

        // Filter by inactive members (hide tasks assigned to inactive members)
        if (!this.filters.showInactiveMembers) {
            const inactiveIds = this.getInactiveMemberIds();
            filtered = filtered.filter(t => !inactiveIds.includes(t.assignee));
        }

        // Filter by track (via project's parent_id)
        if (this.filterTrack && this.filterTrack !== 'all') {
            const trackProjects = this.projects
                .filter(p => p.parent_id === this.filterTrack || p.track_id === this.filterTrack)
                .map(p => p.entity_id);
            filtered = filtered.filter(t => trackProjects.includes(t.project_id));
        }

        // Filter by program (via project's program_id)
        if (this.filterProgram) {
            const programProjects = this.projects
                .filter(p => p.program_id === this.filterProgram)
                .map(p => p.entity_id);
            filtered = filtered.filter(t => programProjects.includes(t.project_id));
        }

        // Filter by hypothesis
        if (this.filterHypothesis) {
            filtered = filtered.filter(t =>
                t.validates?.includes(this.filterHypothesis) ||
                t.outgoing_relations?.some(r => r.target_id === this.filterHypothesis)
            );
        }

        // Filter by condition
        if (this.filterCondition) {
            filtered = filtered.filter(t =>
                t.conditions_3y?.includes(this.filterCondition)
            );
        }

        // Filter by project
        if (this.currentProject !== 'all') {
            filtered = filtered.filter(t => t.project_id === this.currentProject);
        }

        // NOTE: Assignee filter is intentionally SKIPPED here

        // Apply project status/priority filters
        filtered = filtered.filter(t => {
            const project = this.getProjectById(t.project_id);
            if (!project) return true;
            const projectStatus = project.status || 'doing';
            const projectPriority = project.priority || 'medium';
            return this.filters.project.status.includes(projectStatus) &&
                   this.filters.project.priority.includes(projectPriority);
        });

        // Only return done tasks
        filtered = filtered.filter(t => {
            const status = this.normalizeStatus(t.status);
            return status === 'done' && this.filters.task.status.includes('done');
        });

        // Apply task priority filter
        filtered = filtered.filter(t => {
            const priority = t.priority || 'medium';
            return this.filters.task.priority.includes(priority);
        });

        // Apply quick date filter
        filtered = filtered.filter(t => this.passesQuickDateFilter(t));

        return filtered;
    },

    // ============================================
    // Assignee-centric helpers (for Kanban by Assignee)
    // ============================================

    // Get tasks filtered by Track/Program/Hypothesis/Condition (but not by assignee/project)
    getStrategyFilteredTasks() {
        let filtered = this.tasks;

        // Filter by activate (hide inactive by default)
        if (!this.filters.task.showInactive) {
            filtered = filtered.filter(t => t.activate !== false);
        }

        // Filter by inactive members (hide tasks assigned to inactive members)
        if (!this.filters.showInactiveMembers) {
            const inactiveIds = this.getInactiveMemberIds();
            filtered = filtered.filter(t => !inactiveIds.includes(t.assignee));
        }

        // Filter by track (via project's parent_id)
        if (this.filterTrack && this.filterTrack !== 'all') {
            const trackProjects = this.projects
                .filter(p => p.parent_id === this.filterTrack || p.track_id === this.filterTrack)
                .map(p => p.entity_id);
            filtered = filtered.filter(t => trackProjects.includes(t.project_id));
        }

        // Filter by program (via project's program_id)
        if (this.filterProgram) {
            const programProjects = this.projects
                .filter(p => p.program_id === this.filterProgram)
                .map(p => p.entity_id);
            filtered = filtered.filter(t => programProjects.includes(t.project_id));
        }

        // Filter by hypothesis (tasks that validate this hypothesis)
        if (this.filterHypothesis) {
            filtered = filtered.filter(t =>
                t.validates?.includes(this.filterHypothesis) ||
                t.outgoing_relations?.some(r => r.target_id === this.filterHypothesis)
            );
        }

        // Filter by condition (tasks with conditions_3y containing this condition)
        if (this.filterCondition) {
            filtered = filtered.filter(t =>
                t.conditions_3y?.includes(this.filterCondition)
            );
        }

        return filtered;
    },

    // Get task count per assignee (for tabs)
    // Applies Track/Hypothesis/Condition filters
    getTaskCountByAssignee() {
        const filteredTasks = this.getStrategyFilteredTasks();
        const counts = { all: filteredTasks.length };
        this.members.forEach(m => counts[m.id] = 0);
        counts['unassigned'] = 0;

        filteredTasks.forEach(task => {
            const assignee = task.assignee || 'unassigned';
            if (counts[assignee] !== undefined) {
                counts[assignee]++;
            } else {
                counts['unassigned']++;
            }
        });

        return counts;
    },

    // Get projects that have tasks for current assignee (for Project sub-tabs)
    // Applies Track/Hypothesis/Condition + project status/priority filters
    getProjectsForAssignee() {
        // 1. Start with strategy-filtered tasks (Track/Hypothesis/Condition)
        let filteredTasks = this.getStrategyFilteredTasks();

        // 2. Filter by current assignee
        if (this.currentAssignee !== 'all') {
            if (this.currentAssignee === 'unassigned') {
                filteredTasks = filteredTasks.filter(t => !t.assignee);
            } else {
                filteredTasks = filteredTasks.filter(t => t.assignee === this.currentAssignee);
            }
        }

        // 3. Count tasks per project
        const projectTaskCount = {};
        filteredTasks.forEach(task => {
            const projectId = task.project_id;
            if (projectId) {
                projectTaskCount[projectId] = (projectTaskCount[projectId] || 0) + 1;
            }
        });

        // 3. Get project objects with task count, applying filters
        const result = [];
        Object.keys(projectTaskCount).forEach(projectId => {
            const project = this.getProjectById(projectId);
            if (project) {
                // Apply project status filter
                const projectStatus = project.status || 'doing';
                if (!this.filters.project.status.includes(projectStatus)) {
                    return;
                }
                // Apply project priority filter
                const projectPriority = project.priority || 'medium';
                if (!this.filters.project.priority.includes(projectPriority)) {
                    return;
                }
                // Apply project activate filter (hide inactive by default)
                if (!this.filters.project.showInactive && project.activate === false) {
                    return;
                }
                // Apply inactive member filter (hide projects owned by inactive members)
                if (!this.filters.showInactiveMembers && !this.isMemberActive(project.owner)) {
                    return;
                }
                result.push({
                    ...project,
                    taskCount: projectTaskCount[projectId]
                });
            }
        });

        return result;
    },

    // ============================================
    // Filter Helpers
    // ============================================

    // Toggle filter value (for checkbox click)
    toggleFilter(category, type, value) {
        const arr = this.filters[category][type];
        const idx = arr.indexOf(value);
        if (idx > -1) {
            arr.splice(idx, 1);
        } else {
            arr.push(value);
        }
    },

    // Check if filter value is active
    isFilterActive(category, type, value) {
        return this.filters[category][type].includes(value);
    },

    // Reset all filters to default (use dynamic values from constants if available)
    resetFilters() {
        this.filters = {
            project: {
                status: [...this.getProjectStatuses()],
                priority: [...this.getPriorities()],
                showInactive: false
            },
            task: {
                status: [...this.getTaskStatuses()],
                priority: [...this.getPriorities()],
                dueDateStart: null,
                dueDateEnd: null,
                showInactive: false,
                // Reset quick date filter
                quickDateMode: 'week',
                selectedWeeks: [],
                selectedMonths: []
            },
            showInactiveMembers: false
        };
    },

    // Set date filter
    setDateFilter(startOrEnd, value) {
        if (startOrEnd === 'start') {
            this.filters.task.dueDateStart = value || null;
        } else {
            this.filters.task.dueDateEnd = value || null;
        }
    },

    // ============================================
    // Quick Date Filter Helpers
    // ============================================

    // Get ISO week number for a date (ISO 8601)
    getISOWeek(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return { year: d.getFullYear(), week: weekNum };
    },

    // Get week key string (e.g., "2024-W52")
    getWeekKey(date) {
        const { year, week } = this.getISOWeek(date);
        return `${year}-W${String(week).padStart(2, '0')}`;
    },

    // Get month key string (e.g., "2024-12")
    getMonthKey(date) {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    },

    // Get current week key
    getCurrentWeek() {
        return this.getWeekKey(new Date());
    },

    // Get current month key
    getCurrentMonth() {
        return this.getMonthKey(new Date());
    },

    // Get week range (current week +/- offset weeks)
    getWeekRange(offsetBefore = 2, offsetAfter = 2) {
        const weeks = [];
        const today = new Date();

        for (let i = -offsetBefore; i <= offsetAfter; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + (i * 7));
            const key = this.getWeekKey(d);
            const { year, week } = this.getISOWeek(d);

            // Display format: M12W1 (Month 12, Week 1 of month)
            const monthWeek = this.getMonthWeekDisplay(d);

            if (!weeks.find(w => w.key === key)) {
                weeks.push({
                    key,
                    label: monthWeek,
                    isCurrent: i === 0
                });
            }
        }
        return weeks;
    },

    // Get display format for week: M12W1
    getMonthWeekDisplay(date) {
        const d = new Date(date);
        const month = d.getMonth() + 1;
        // Get week number within month
        const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
        const weekOfMonth = Math.ceil((d.getDate() + firstDay.getDay()) / 7);
        return `M${month}W${weekOfMonth}`;
    },

    // Get month range (current month +/- offset months)
    getMonthRange(offsetBefore = 1, offsetAfter = 1) {
        const months = [];
        const today = new Date();

        for (let i = -offsetBefore; i <= offsetAfter; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const key = this.getMonthKey(d);
            const month = d.getMonth() + 1;

            months.push({
                key,
                label: String(month),  // Just the month number
                isCurrent: i === 0
            });
        }
        return months;
    },

    // Check if a date falls within a week key
    isDateInWeek(dateStr, weekKey) {
        if (!dateStr) return false;
        const taskWeek = this.getWeekKey(new Date(dateStr));
        return taskWeek === weekKey;
    },

    // Check if a date falls within a month key
    isDateInMonth(dateStr, monthKey) {
        if (!dateStr) return false;
        const taskMonth = this.getMonthKey(new Date(dateStr));
        return taskMonth === monthKey;
    },

    // Set quick date mode (week or month)
    setQuickDateMode(mode) {
        this.filters.task.quickDateMode = mode;
    },

    // Toggle week selection
    toggleWeek(weekKey) {
        const idx = this.filters.task.selectedWeeks.indexOf(weekKey);
        if (idx > -1) {
            this.filters.task.selectedWeeks.splice(idx, 1);
        } else {
            this.filters.task.selectedWeeks.push(weekKey);
        }
    },

    // Toggle month selection
    toggleMonth(monthKey) {
        const idx = this.filters.task.selectedMonths.indexOf(monthKey);
        if (idx > -1) {
            this.filters.task.selectedMonths.splice(idx, 1);
        } else {
            this.filters.task.selectedMonths.push(monthKey);
        }
    },

    // Check if task passes quick date filter
    passesQuickDateFilter(task) {
        const mode = this.filters.task.quickDateMode;
        const selectedWeeks = this.filters.task.selectedWeeks;
        const selectedMonths = this.filters.task.selectedMonths;

        // If no quick filters selected, pass all
        if (mode === 'week' && selectedWeeks.length === 0) return true;
        if (mode === 'month' && selectedMonths.length === 0) return true;

        const dueDate = task.due_date || task.due;
        if (!dueDate) return false;  // No due date = doesn't match

        if (mode === 'week') {
            return selectedWeeks.some(wk => this.isDateInWeek(dueDate, wk));
        } else {
            return selectedMonths.some(mk => this.isDateInMonth(dueDate, mk));
        }
    },

    // Initialize with current week selected by default
    initQuickDateFilter() {
        const currentWeek = this.getCurrentWeek();
        this.filters.task.selectedWeeks = [currentWeek];
        this.filters.task.selectedMonths = [];
    },

    // Clear quick date filter
    clearQuickDateFilter() {
        this.filters.task.selectedWeeks = [];
        this.filters.task.selectedMonths = [];
    }
};
