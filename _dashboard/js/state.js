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
    filterHypothesis: null,
    filterCondition: null,
    loading: false,
    editingTask: null,
    editingProject: null,

    // ============================================
    // Data Loading
    // ============================================
    async loadAll() {
        this.loading = true;
        try {
            const [
                constants, members,
                northstars, metahypotheses, conditions, productlines, partnershipstages,
                tracks, projects, tasks, hypotheses
            ] = await Promise.all([
                API.getConstants(),
                API.getMembers(),
                API.getNorthStars().catch(() => []),
                API.getMetaHypotheses().catch(() => []),
                API.getConditions().catch(() => []),
                API.getProductLines().catch(() => []),
                API.getPartnershipStages().catch(() => []),
                API.getTracks(),
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
        return this.constants?.project?.status || ['planning', 'active', 'paused', 'done', 'cancelled'];
    },

    getProjectStatusLabels() {
        return this.constants?.project?.status_labels || {
            planning: 'Planning', active: 'Active', paused: 'Paused', done: 'Done', cancelled: 'Cancelled'
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

    getMemberById(memberId) {
        return this.members.find(m => m.id === memberId);
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
    getFilteredTasks() {
        let filtered = this.tasks;

        // Filter by track (via project's parent_id)
        if (this.filterTrack && this.filterTrack !== 'all') {
            const trackProjects = this.projects
                .filter(p => p.parent_id === this.filterTrack || p.track_id === this.filterTrack)
                .map(p => p.entity_id);
            filtered = filtered.filter(t => trackProjects.includes(t.project_id));
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
            filtered = filtered.filter(t => t.assignee === this.currentAssignee);
        }

        return filtered;
    },

    // Status 매핑 (다양한 상태값을 표준 상태로 변환)
    normalizeStatus(status) {
        const statusMap = {
            // 표준 상태
            'todo': 'todo',
            'doing': 'doing',
            'done': 'done',
            'blocked': 'blocked',
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

    // ============================================
    // Assignee-centric helpers (for Kanban by Assignee)
    // ============================================

    // Get task count per assignee (for tabs)
    getTaskCountByAssignee() {
        const counts = { all: this.tasks.length };
        this.members.forEach(m => counts[m.id] = 0);
        counts['unassigned'] = 0;

        this.tasks.forEach(task => {
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
    getProjectsForAssignee() {
        // 1. Filter tasks by current assignee
        let filtered = this.tasks;
        if (this.currentAssignee !== 'all') {
            if (this.currentAssignee === 'unassigned') {
                filtered = filtered.filter(t => !t.assignee);
            } else {
                filtered = filtered.filter(t => t.assignee === this.currentAssignee);
            }
        }

        // 2. Count tasks per project
        const projectTaskCount = {};
        filtered.forEach(task => {
            const projectId = task.project_id;
            if (projectId) {
                projectTaskCount[projectId] = (projectTaskCount[projectId] || 0) + 1;
            }
        });

        // 3. Get project objects with task count
        const result = [];
        Object.keys(projectTaskCount).forEach(projectId => {
            const project = this.getProjectById(projectId);
            if (project) {
                result.push({
                    ...project,
                    taskCount: projectTaskCount[projectId]
                });
            }
        });

        return result;
    }
};
