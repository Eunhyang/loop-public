/**
 * API Module
 * 모든 API 호출을 담당
 */
const API = {
    baseUrl: '',

    // 토큰 관리
    getToken() {
        return localStorage.getItem('api_token');
    },

    setToken(token) {
        localStorage.setItem('api_token', token);
    },

    clearToken() {
        localStorage.removeItem('api_token');
    },

    // 인증 헤더 포함 fetch
    async authFetch(url, options = {}) {
        const token = this.getToken();
        const headers = {
            ...options.headers,
            'x-api-token': token || ''
        };

        const res = await fetch(url, { ...options, headers });

        // 401이면 로그인 모달 표시
        if (res.status === 401) {
            this.clearToken();
            if (window.showLoginModal) {
                window.showLoginModal();
            }
            throw new Error('Unauthorized');
        }

        return res;
    },

    // ============================================
    // Constants
    // ============================================
    async getConstants() {
        const res = await this.authFetch(`${this.baseUrl}/api/constants`);
        return res.json();
    },

    // ============================================
    // Members
    // ============================================
    async getMembers() {
        const res = await this.authFetch(`${this.baseUrl}/api/members`);
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
        const res = await this.authFetch(`${this.baseUrl}/api/tracks`);
        const data = await res.json();
        return data.tracks || [];
    },

    // ============================================
    // Hypotheses
    // ============================================
    async getHypotheses() {
        const res = await this.authFetch(`${this.baseUrl}/api/hypotheses`);
        const data = await res.json();
        return data.hypotheses || [];
    },

    // ============================================
    // Conditions
    // ============================================
    async getConditions() {
        const res = await this.authFetch(`${this.baseUrl}/api/conditions`);
        const data = await res.json();
        return data.conditions || [];
    },

    // ============================================
    // Strategy (NorthStar, MetaHypotheses, ProductLines, PartnershipStages)
    // ============================================
    async getNorthStars() {
        const res = await this.authFetch(`${this.baseUrl}/api/strategy/northstar`);
        const data = await res.json();
        return data.northstars || [];
    },

    async getMetaHypotheses() {
        const res = await this.authFetch(`${this.baseUrl}/api/strategy/metahypotheses`);
        const data = await res.json();
        return data.metahypotheses || [];
    },

    async getProductLines() {
        const res = await this.authFetch(`${this.baseUrl}/api/strategy/productlines`);
        const data = await res.json();
        return data.productlines || [];
    },

    async getPartnershipStages() {
        const res = await this.authFetch(`${this.baseUrl}/api/strategy/partnershipstages`);
        const data = await res.json();
        return data.partnershipstages || [];
    },

    // ============================================
    // Programs
    // ============================================
    async getPrograms() {
        const res = await this.authFetch(`${this.baseUrl}/api/programs`);
        const data = await res.json();
        return data.programs || [];
    },

    // ============================================
    // Projects
    // ============================================
    async getProjects() {
        const res = await this.authFetch(`${this.baseUrl}/api/projects`);
        const data = await res.json();
        return data.projects || [];
    },

    async createProject(project) {
        const res = await this.authFetch(`${this.baseUrl}/api/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project)
        });
        return res.json();
    },

    async updateProject(projectId, project) {
        const res = await this.authFetch(`${this.baseUrl}/api/projects/${encodeURIComponent(projectId)}`, {
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
        const res = await this.authFetch(url, { method: 'DELETE' });
        return res.json();
    },

    // ============================================
    // Tasks
    // ============================================
    async getTasks(projectId = null) {
        const url = projectId && projectId !== 'all'
            ? `${this.baseUrl}/api/tasks?project_id=${encodeURIComponent(projectId)}`
            : `${this.baseUrl}/api/tasks`;
        const res = await this.authFetch(url);
        const data = await res.json();
        return data.tasks || [];
    },

    async createTask(task) {
        const res = await this.authFetch(`${this.baseUrl}/api/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        return res.json();
    },

    async updateTask(taskId, task) {
        const res = await this.authFetch(`${this.baseUrl}/api/tasks/${encodeURIComponent(taskId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        return res.json();
    },

    async deleteTask(taskId) {
        const res = await this.authFetch(`${this.baseUrl}/api/tasks/${encodeURIComponent(taskId)}`, {
            method: 'DELETE'
        });
        return res.json();
    },

    // ============================================
    // Cache Management
    // ============================================
    async reloadCache() {
        const res = await this.authFetch(`${this.baseUrl}/api/cache/reload`, {
            method: 'POST'
        });
        return res.json();
    },

    async getCacheStats() {
        const res = await this.authFetch(`${this.baseUrl}/api/cache/stats`);
        return res.json();
    }
};
