/**
 * API Module
 * 모든 API 호출을 담당
 */
const API = {
    baseUrl: 'https://mcp.sosilab.synology.me',

    // JWT 토큰 관리
    getToken() {
        return localStorage.getItem('jwt_token');
    },

    setToken(token) {
        localStorage.setItem('jwt_token', token);
    },

    clearToken() {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_role');
    },

    // User role 관리
    getRole() {
        return localStorage.getItem('user_role') || 'member';
    },

    setRole(role) {
        localStorage.setItem('user_role', role);
    },

    // JWT에서 payload 추출
    parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    },

    // 토큰 만료 체크
    isTokenExpired() {
        const token = this.getToken();
        if (!token) return true;

        const payload = this.parseJwt(token);
        if (!payload || !payload.exp) return true;

        // 만료 5분 전부터 만료로 처리
        return Date.now() >= (payload.exp * 1000) - (5 * 60 * 1000);
    },

    // 인증 헤더 포함 fetch (Authorization: Bearer)
    async authFetch(url, options = {}) {
        const token = this.getToken();

        // 토큰 만료 체크
        if (this.isTokenExpired()) {
            this.clearToken();
            if (window.showLoginModal) {
                window.showLoginModal();
            }
            throw new Error('Token expired');
        }

        const headers = {
            ...options.headers,
            'Authorization': token ? `Bearer ${token}` : ''
        };

        const res = await fetch(url, { ...options, headers });

        // 401/403이면 로그인 모달 표시
        if (res.status === 401 || res.status === 403) {
            this.clearToken();
            if (window.showLoginModal) {
                window.showLoginModal();
            }
            throw new Error('Unauthorized');
        }

        return res;
    },

    // 대시보드 로그인 API
    async login(email, password) {
        const res = await fetch(`${this.baseUrl}/oauth/dashboard-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error_description || 'Login failed');
        }

        const data = await res.json();

        // JWT 토큰과 role 저장
        this.setToken(data.access_token);
        this.setRole(data.role);

        return data;
    },

    // 로그아웃
    logout() {
        this.clearToken();
        if (window.showLoginModal) {
            window.showLoginModal();
        }
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
    },

    // ============================================
    // Pending Reviews (n8n 자동화)
    // ============================================
    async getPendingReviews(status = null) {
        const url = status
            ? `${this.baseUrl}/api/pending?status=${encodeURIComponent(status)}`
            : `${this.baseUrl}/api/pending`;
        const res = await this.authFetch(url);
        const data = await res.json();
        return data.reviews || [];
    },

    async approvePendingReview(reviewId, modifiedFields = null) {
        const body = modifiedFields ? { modified_fields: modifiedFields } : {};
        const res = await this.authFetch(`${this.baseUrl}/api/pending/${encodeURIComponent(reviewId)}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return res.json();
    },

    async rejectPendingReview(reviewId) {
        const res = await this.authFetch(`${this.baseUrl}/api/pending/${encodeURIComponent(reviewId)}/reject`, {
            method: 'POST'
        });
        return res.json();
    },

    async deletePendingReview(reviewId) {
        const res = await this.authFetch(`${this.baseUrl}/api/pending/${encodeURIComponent(reviewId)}`, {
            method: 'DELETE'
        });
        return res.json();
    }
};
