/**
 * State Module
 * 전역 상태 관리
 */

// ============================================
// FALLBACK_CONSTANTS (API 로드 실패 시 사용)
// Source: 00_Meta/schema_constants.yaml 미러링
// ============================================
const FALLBACK_CONSTANTS = {
    task: {
        status: ['todo', 'doing', 'hold', 'done', 'blocked'],
        status_labels: {
            todo: 'To Do', doing: 'Doing', hold: 'Hold', done: 'Done', blocked: 'Blocked'
        },
        status_colors: {
            todo: '#6b7280', doing: '#3b82f6', hold: '#f59e0b', done: '#10b981', blocked: '#ef4444'
        },
        types: ['dev', 'bug', 'strategy', 'research', 'ops', 'meeting'],
        type_labels: {
            dev: 'Dev', bug: 'Bug', strategy: 'Strategy', research: 'Research', ops: 'Ops', meeting: 'Meeting'
        }
    },
    project: {
        status: ['planning', 'active', 'paused', 'done', 'cancelled'],
        status_labels: {
            planning: 'Planning', active: 'Active', paused: 'Paused', done: 'Done', cancelled: 'Cancelled'
        }
    },
    priority: {
        values: ['critical', 'high', 'medium', 'low'],
        labels: {
            critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low'
        }
    },
    status_mapping: {
        // Project → Task
        planning: 'todo', active: 'doing', paused: 'hold', cancelled: 'blocked',
        // Legacy
        pending: 'todo', in_progress: 'doing', completed: 'done', complete: 'done',
        failed: 'blocked', learning: 'done'
    }
};

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
    pendingReviews: [],
    programRoundsData: [],       // Program-Round 조인 데이터 (Admin only)
    selectedProgramId: null,     // 현재 선택된 Program ID

    // UI State (다중 선택 지원: 배열)
    currentProjects: [],      // 빈 배열 = 전체, ['prj-001', 'prj-002'] = 다중 선택
    currentAssignees: [],     // 빈 배열 = 전체, ['김은향', '한명학'] = 다중 선택
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
    // Source: 00_Meta/schema_constants.yaml
    filters: {
        project: {
            status: FALLBACK_CONSTANTS.project.status.filter(s => s !== 'done'),  // done excluded by default
            priority: [...FALLBACK_CONSTANTS.priority.values],
            showInactive: false  // activate: false 엔티티 숨김 (기본값)
        },
        task: {
            status: [...FALLBACK_CONSTANTS.task.status],
            priority: [...FALLBACK_CONSTANTS.priority.values],
            types: [...FALLBACK_CONSTANTS.task.types],  // SSOT 참조
            dueDateStart: null,
            dueDateEnd: null,
            showInactive: false,  // activate: false 엔티티 숨김 (기본값)
            // Quick Date Filter
            quickDateMode: 'week',  // 'week' or 'month'
            selectedWeeks: [],      // e.g., ['2024-W52', '2025-W01']
            selectedMonths: []      // e.g., ['2024-11', '2024-12', '2025-01']
        },
        showInactiveMembers: false,  // active: false 멤버 숨김 (기본값)
        showNonCoreMembers: false    // 비코어 멤버(Advisor, External 등) 숨김 (기본값)
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

            // Load pending reviews (awaited for badge update)
            await this.loadPendingReviews();

            // API constants 로드 후 필터 초기화 (YAML SSOT 적용)
            this.resetFilters();
            // Project 필터에서 done 제외 (기본값: 완료된 프로젝트 숨김)
            this.filters.project.status = this.filters.project.status.filter(s => s !== 'done');

            // Core member만 기본 선택 (Founder, Cofounder)
            // tsk-018-06: Non-core (Advisor, External, Former 등)는 기본 필터에서 제외
            this.currentAssignees = this.members
                .filter(m => m.role === 'Founder' || m.role === 'Cofounder')
                .map(m => m.id);
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
    // Program-Round API (Admin only)
    // ============================================
    async loadProgramRounds(pgmId, limit = 20) {
        // Admin 권한 체크
        if (!Auth.isAdmin()) {
            console.warn('loadProgramRounds: Admin role required');
            this.programRoundsData = [];
            return [];
        }

        try {
            this.selectedProgramId = pgmId;
            this.programRoundsData = await API.getProgramRounds(pgmId, limit);
            return this.programRoundsData;
        } catch (e) {
            console.warn('Failed to load program rounds:', e);
            this.programRoundsData = [];
            return [];
        }
    },

    clearProgramRounds() {
        this.programRoundsData = [];
        this.selectedProgramId = null;
    },

    // ============================================
    // Pending Reviews (n8n 자동화)
    // ============================================
    async loadPendingReviews() {
        try {
            this.pendingReviews = await API.getPendingReviews();
        } catch (e) {
            console.warn('Failed to load pending reviews:', e);
            this.pendingReviews = [];
        }
    },

    async reloadPendingReviews() {
        await this.loadPendingReviews();
    },

    getPendingReviewCount() {
        return this.pendingReviews.filter(r => r.status === 'pending').length;
    },

    getPendingReviewsByStatus(status = 'pending') {
        return this.pendingReviews.filter(r => r.status === status);
    },

    async approvePendingReview(reviewId, modifiedFields = null) {
        const result = await API.approvePendingReview(reviewId, modifiedFields);
        await this.loadPendingReviews();
        // Reload tasks/projects to reflect changes
        await Promise.all([this.reloadTasks(), this.reloadProjects()]);
        return result;
    },

    async rejectPendingReview(reviewId, reason) {
        const result = await API.rejectPendingReview(reviewId, reason);
        await this.loadPendingReviews();
        return result;
    },

    async deletePendingReview(reviewId) {
        const result = await API.deletePendingReview(reviewId);
        await this.loadPendingReviews();
        return result;
    },

    // ============================================
    // Helpers
    // ============================================
    getTaskStatuses() {
        return this.constants?.task?.status || FALLBACK_CONSTANTS.task.status;
    },

    getTaskStatusLabels() {
        return this.constants?.task?.status_labels || FALLBACK_CONSTANTS.task.status_labels;
    },

    getTaskStatusColors() {
        return this.constants?.task?.status_colors || FALLBACK_CONSTANTS.task.status_colors;
    },

    getPriorities() {
        return this.constants?.priority?.values || FALLBACK_CONSTANTS.priority.values;
    },

    getPriorityLabels() {
        return this.constants?.priority?.labels || FALLBACK_CONSTANTS.priority.labels;
    },

    getProjectStatuses() {
        return this.constants?.project?.status || FALLBACK_CONSTANTS.project.status;
    },

    getProjectStatusLabels() {
        return this.constants?.project?.status_labels || FALLBACK_CONSTANTS.project.status_labels;
    },

    getTaskTypes() {
        return this.constants?.task?.types || FALLBACK_CONSTANTS.task.types;
    },

    getTaskTypeLabels() {
        return this.constants?.task?.type_labels || FALLBACK_CONSTANTS.task.type_labels;
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

    // Get active members (respects showInactiveMembers and showNonCoreMembers filters)
    getActiveMembers() {
        let filtered = this.members;

        // Filter by active status
        if (!this.filters.showInactiveMembers) {
            filtered = filtered.filter(m => m.active !== false);
        }

        // Filter by role (core members only by default)
        if (!this.filters.showNonCoreMembers) {
            filtered = filtered.filter(m =>
                m.role === 'Founder' || m.role === 'Cofounder'
            );
        }

        return filtered;
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

        // Filter by project (다중 선택 지원)
        if (this.currentProjects.length > 0) {
            filtered = filtered.filter(t => this.currentProjects.includes(t.project_id));
        }

        // Filter by assignee (다중 선택 지원)
        if (this.currentAssignees.length > 0) {
            filtered = filtered.filter(t => {
                if (this.currentAssignees.includes('unassigned')) {
                    // 'unassigned'가 포함된 경우: 미지정 또는 선택된 담당자
                    const otherAssignees = this.currentAssignees.filter(a => a !== 'unassigned');
                    return !t.assignee || otherAssignees.includes(t.assignee);
                }
                return this.currentAssignees.includes(t.assignee);
            });
        }

        // Apply project status/priority filters (filter tasks by their parent project)
        filtered = filtered.filter(t => {
            const project = this.getProjectById(t.project_id);
            if (!project) return true;  // Keep tasks without project
            const projectStatus = this.normalizeProjectStatus(project.status || 'doing');
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

        // Apply task type filter
        filtered = filtered.filter(t => {
            const taskType = t.type;
            // Tasks without type pass through (null/undefined = show always)
            if (!taskType) return true;
            return this.filters.task.types.includes(taskType);
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

    // Project Status 매핑 (구 상태값을 새 Project 상태로 변환)
    // Source: 00_Meta/schema_constants.yaml > project.status (API에서 로드)
    normalizeProjectStatus(status) {
        // 표준 Project 상태는 그대로 반환
        const standardStatuses = this.constants?.project?.status || FALLBACK_CONSTANTS.project.status;
        if (standardStatuses.includes(status)) {
            return status;
        }

        // status_mapping의 역매핑 생성 (Task→Project 상태 변환)
        const mapping = this.constants?.status_mapping || FALLBACK_CONSTANTS.status_mapping;
        const reverseMapping = {};
        Object.entries(mapping).forEach(([projectStatus, taskStatus]) => {
            if (!reverseMapping[taskStatus]) {
                reverseMapping[taskStatus] = projectStatus;
            }
        });
        return reverseMapping[status] || 'active';
    },

    // Status 매핑 (다양한 상태값을 표준 Task 상태로 변환)
    normalizeStatus(status) {
        // 표준 Task 상태는 그대로 반환
        const standardStatuses = this.constants?.task?.status || FALLBACK_CONSTANTS.task.status;
        if (standardStatuses.includes(status)) {
            return status;
        }

        // status_mapping 사용 (SSOT: schema_constants.yaml)
        const mapping = this.constants?.status_mapping || FALLBACK_CONSTANTS.status_mapping;
        return mapping[status] || 'todo';
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

        // Filter by project (다중 선택 지원)
        if (this.currentProjects.length > 0) {
            filtered = filtered.filter(t => this.currentProjects.includes(t.project_id));
        }

        // NOTE: Assignee filter is intentionally SKIPPED here

        // Apply project status/priority filters
        filtered = filtered.filter(t => {
            const project = this.getProjectById(t.project_id);
            if (!project) return true;
            const projectStatus = this.normalizeProjectStatus(project.status || 'doing');
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

        // Apply task type filter
        filtered = filtered.filter(t => {
            const taskType = t.type;
            if (!taskType) return true;
            return this.filters.task.types.includes(taskType);
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

        // Apply task type filter
        filtered = filtered.filter(t => {
            const taskType = t.type;
            if (!taskType) return true;
            return this.filters.task.types.includes(taskType);
        });

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

        // 2. Filter by current assignees (다중 선택 지원)
        if (this.currentAssignees.length > 0) {
            filteredTasks = filteredTasks.filter(t => {
                if (this.currentAssignees.includes('unassigned')) {
                    const otherAssignees = this.currentAssignees.filter(a => a !== 'unassigned');
                    return !t.assignee || otherAssignees.includes(t.assignee);
                }
                return this.currentAssignees.includes(t.assignee);
            });
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
                // Apply project status filter (normalize to handle legacy statuses)
                const projectStatus = this.normalizeProjectStatus(project.status || 'doing');
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
                types: [...this.getTaskTypes()],
                dueDateStart: null,
                dueDateEnd: null,
                showInactive: false,
                // Reset quick date filter
                quickDateMode: 'week',
                selectedWeeks: [],
                selectedMonths: []
            },
            showInactiveMembers: false,
            showNonCoreMembers: false
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
