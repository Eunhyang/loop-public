/**
 * API Module
 * 모든 API 호출을 담당
 */
const API = {
    baseUrl: '',

    // ============================================
    // Constants
    // ============================================
    async getConstants() {
        const res = await fetch(`${this.baseUrl}/api/constants`);
        return res.json();
    },

    // ============================================
    // Members
    // ============================================
    async getMembers() {
        const res = await fetch(`${this.baseUrl}/api/members`);
        const data = await res.json();
        // members가 객체인 경우 배열로 변환
        const members = data.members;
        if (Array.isArray(members)) {
            return members;
        }
        // 객체인 경우 values를 배열로 변환
        return Object.values(members || {});
    },

    // ============================================
    // Tracks
    // ============================================
    async getTracks() {
        const res = await fetch(`${this.baseUrl}/api/tracks`);
        const data = await res.json();
        return data.tracks || [];
    },

    // ============================================
    // Hypotheses
    // ============================================
    async getHypotheses() {
        const res = await fetch(`${this.baseUrl}/api/hypotheses`);
        const data = await res.json();
        return data.hypotheses || [];
    },

    // ============================================
    // Conditions
    // ============================================
    async getConditions() {
        const res = await fetch(`${this.baseUrl}/api/conditions`);
        const data = await res.json();
        return data.conditions || [];
    },

    // ============================================
    // Projects
    // ============================================
    async getProjects() {
        const res = await fetch(`${this.baseUrl}/api/projects`);
        const data = await res.json();
        return data.projects || [];
    },

    async createProject(project) {
        const res = await fetch(`${this.baseUrl}/api/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project)
        });
        return res.json();
    },

    async updateProject(projectId, project) {
        const res = await fetch(`${this.baseUrl}/api/projects/${encodeURIComponent(projectId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project)
        });
        return res.json();
    },

    async deleteProject(projectId, force = false) {
        const url = force
            ? `${this.baseUrl}/api/projects/${encodeURIComponent(projectId)}?force=true`
            : `${this.baseUrl}/api/projects/${encodeURIComponent(projectId)}`;
        const res = await fetch(url, { method: 'DELETE' });
        return res.json();
    },

    // ============================================
    // Tasks
    // ============================================
    async getTasks(projectId = null) {
        const url = projectId && projectId !== 'all'
            ? `${this.baseUrl}/api/tasks?project_id=${encodeURIComponent(projectId)}`
            : `${this.baseUrl}/api/tasks`;
        const res = await fetch(url);
        const data = await res.json();
        return data.tasks || [];
    },

    async createTask(task) {
        const res = await fetch(`${this.baseUrl}/api/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        return res.json();
    },

    async updateTask(taskId, task) {
        const res = await fetch(`${this.baseUrl}/api/tasks/${encodeURIComponent(taskId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        return res.json();
    },

    async deleteTask(taskId) {
        const res = await fetch(`${this.baseUrl}/api/tasks/${encodeURIComponent(taskId)}`, {
            method: 'DELETE'
        });
        return res.json();
    }
};
