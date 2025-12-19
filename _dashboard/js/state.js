/**
 * State Module
 * 전역 상태 관리
 */
const State = {
    // Data
    constants: null,
    members: [],
    tracks: [],
    projects: [],
    tasks: [],

    // UI State
    currentProject: 'all',
    loading: false,
    editingTask: null,
    editingProject: null,

    // ============================================
    // Data Loading
    // ============================================
    async loadAll() {
        this.loading = true;
        try {
            const [constants, members, tracks, projects, tasks] = await Promise.all([
                API.getConstants(),
                API.getMembers(),
                API.getTracks(),
                API.getProjects(),
                API.getTasks()
            ]);

            this.constants = constants;
            this.members = members;
            this.tracks = tracks;
            this.projects = projects;
            this.tasks = tasks;
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

    // Get filtered tasks by current project
    getFilteredTasks() {
        if (this.currentProject === 'all') {
            return this.tasks;
        }
        return this.tasks.filter(t => t.project_id === this.currentProject);
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
    }
};
