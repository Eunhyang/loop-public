/**
 * PendingPanel Component
 * Pending Review 관리 패널 (n8n 자동화)
 * - LLM이 제안한 필드값 승인/수정/거부
 */
const PendingPanel = {
    currentReview: null,
    isExpanded: false,

    /**
     * 패널 초기화
     */
    init() {
        this.createPanelHTML();
        this.setupEventListeners();
    },

    /**
     * 패널 HTML 생성 (동적 삽입)
     */
    createPanelHTML() {
        // Check if panel already exists
        if (document.getElementById('pendingPanel')) return;

        const panelHTML = `
            <div id="pendingPanelOverlay" class="panel-overlay"></div>
            <div id="pendingPanel" class="side-panel pending-panel">
                <div class="panel-header">
                    <h3>Pending Reviews</h3>
                    <div class="panel-header-actions">
                        <button id="pendingPanelRefresh" class="panel-btn" title="Refresh">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 4v6h6M23 20v-6h-6"/>
                                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                            </svg>
                        </button>
                        <button id="pendingPanelExpand" class="panel-btn" title="Expand">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                            </svg>
                        </button>
                        <button id="pendingPanelClose" class="panel-btn" title="Close">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="panel-body">
                    <div class="pending-filter-tabs">
                        <button class="pending-tab active" data-status="pending">Pending</button>
                        <button class="pending-tab" data-status="approved">Approved</button>
                        <button class="pending-tab" data-status="rejected">Rejected</button>
                    </div>
                    <div id="pendingReviewsList" class="pending-reviews-list">
                        <!-- Reviews will be rendered here -->
                    </div>
                </div>
            </div>

            <!-- Review Detail Modal -->
            <div id="reviewDetailModal" class="pending-review-modal">
                <div class="modal-content review-detail-modal">
                    <div class="modal-header">
                        <h3 id="reviewDetailTitle">Review Details</h3>
                        <button id="reviewDetailClose" class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body" id="reviewDetailBody">
                        <!-- Detail content -->
                    </div>
                    <div class="modal-footer" id="reviewDetailFooter">
                        <!-- Action buttons -->
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', panelHTML);
    },

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // Close button
        document.getElementById('pendingPanelClose')?.addEventListener('click', () => this.close());

        // Overlay click
        document.getElementById('pendingPanelOverlay')?.addEventListener('click', () => this.close());

        // Expand button
        document.getElementById('pendingPanelExpand')?.addEventListener('click', () => this.toggleExpand());

        // Refresh button
        document.getElementById('pendingPanelRefresh')?.addEventListener('click', () => this.refresh());

        // Tab clicks
        document.querySelectorAll('.pending-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.pending-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.renderReviews(e.target.dataset.status);
            });
        });

        // Modal close
        document.getElementById('reviewDetailClose')?.addEventListener('click', () => this.closeDetailModal());
        document.getElementById('reviewDetailModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'reviewDetailModal') this.closeDetailModal();
        });
    },

    /**
     * HTML 이스케이프 (XSS 방지)
     */
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * 전체화면 토글
     */
    toggleExpand() {
        this.isExpanded = !this.isExpanded;
        const panel = document.getElementById('pendingPanel');
        const btn = document.getElementById('pendingPanelExpand');

        if (this.isExpanded) {
            panel.classList.add('expanded');
            btn.title = 'Collapse';
        } else {
            panel.classList.remove('expanded');
            btn.title = 'Expand';
        }
    },

    /**
     * 패널 열기
     */
    async open() {
        await State.loadPendingReviews();
        this.renderReviews('pending');
        this.show();
    },

    /**
     * 새로고침
     */
    async refresh() {
        const btn = document.getElementById('pendingPanelRefresh');
        btn.classList.add('spinning');
        await State.loadPendingReviews();
        const activeTab = document.querySelector('.pending-tab.active');
        this.renderReviews(activeTab?.dataset.status || 'pending');
        btn.classList.remove('spinning');
        showToast('Reviews refreshed', 'success');
    },

    /**
     * 리뷰 목록 렌더링
     */
    renderReviews(status = 'pending') {
        const container = document.getElementById('pendingReviewsList');
        const reviews = State.getPendingReviewsByStatus(status);

        if (reviews.length === 0) {
            container.innerHTML = `
                <div class="empty-message">
                    No ${status} reviews
                </div>
            `;
            return;
        }

        container.innerHTML = reviews.map(review => this.renderReviewCard(review)).join('');

        // Add click handlers
        container.querySelectorAll('.pending-review-card').forEach(card => {
            card.addEventListener('click', () => {
                const reviewId = card.dataset.reviewId;
                const review = State.pendingReviews.find(r => r.id === reviewId);
                if (review) this.openDetailModal(review);
            });
        });
    },

    /**
     * 리뷰 카드 렌더링
     */
    renderReviewCard(review) {
        const statusClass = `review-status-${review.status}`;
        const date = new Date(review.created_at).toLocaleDateString('ko-KR');

        return `
            <div class="pending-review-card ${statusClass}" data-review-id="${this.escapeHtml(review.id)}">
                <div class="review-card-header">
                    <span class="review-entity-type">${this.escapeHtml(review.entity_type)}</span>
                    <span class="review-date">${date}</span>
                </div>
                <div class="review-card-title">${this.escapeHtml(review.entity_name)}</div>
                <div class="review-card-id">${this.escapeHtml(review.entity_id)}</div>
                <div class="review-card-fields">
                    ${Object.keys(review.suggested_fields || {}).map(field => `
                        <span class="review-field-badge">${this.escapeHtml(field)}</span>
                    `).join('')}
                </div>
            </div>
        `;
    },

    /**
     * 상세 모달 열기
     */
    openDetailModal(review) {
        this.currentReview = review;

        document.getElementById('reviewDetailTitle').textContent =
            `${review.entity_type}: ${review.entity_name}`;

        const body = document.getElementById('reviewDetailBody');
        body.innerHTML = `
            <div class="review-detail-section">
                <h4>Entity Info</h4>
                <div class="review-detail-row">
                    <span class="label">ID:</span>
                    <span class="value">${this.escapeHtml(review.entity_id)}</span>
                </div>
                <div class="review-detail-row">
                    <span class="label">Type:</span>
                    <span class="value">${this.escapeHtml(review.entity_type)}</span>
                </div>
                <div class="review-detail-row">
                    <span class="label">Created:</span>
                    <span class="value">${new Date(review.created_at).toLocaleString('ko-KR')}</span>
                </div>
            </div>

            <div class="review-detail-section">
                <h4>Suggested Changes</h4>
                ${Object.entries(review.suggested_fields || {}).map(([field, value]) => `
                    <div class="review-field-item">
                        <div class="review-field-header">
                            <span class="field-name">${this.escapeHtml(field)}</span>
                        </div>
                        <div class="review-field-value">
                            <input type="text" class="review-field-input"
                                   data-field="${this.escapeHtml(field)}"
                                   value="${this.escapeHtml(Array.isArray(value) ? JSON.stringify(value) : String(value))}" />
                        </div>
                        ${review.reasoning?.[field] ? `
                            <div class="review-field-reasoning">
                                <span class="reasoning-label">Reasoning:</span>
                                ${this.escapeHtml(review.reasoning[field])}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;

        const footer = document.getElementById('reviewDetailFooter');
        if (review.status === 'pending') {
            footer.innerHTML = `
                <button class="btn btn-secondary" id="btnRejectReview">Reject</button>
                <button class="btn btn-primary" id="btnApproveReview">Approve</button>
            `;

            document.getElementById('btnApproveReview').addEventListener('click', () => this.approveReview());
            document.getElementById('btnRejectReview').addEventListener('click', () => this.rejectReview());
        } else {
            footer.innerHTML = `
                <button class="btn btn-secondary" id="btnDeleteReview">Delete</button>
            `;
            document.getElementById('btnDeleteReview').addEventListener('click', () => this.deleteReview());
        }

        document.getElementById('reviewDetailModal').classList.add('active');
    },

    /**
     * 상세 모달 닫기
     */
    closeDetailModal() {
        document.getElementById('reviewDetailModal').classList.remove('active');
        this.currentReview = null;
    },

    /**
     * 값 타입 추론 및 변환
     * @param {string} value - 입력값
     * @param {*} originalValue - 원래 suggested_fields의 값 (타입 힌트용)
     */
    parseFieldValue(value, originalValue) {
        const trimmed = value.trim();

        // null/undefined 처리
        if (trimmed === '' || trimmed === 'null') return null;

        // Boolean 처리
        if (trimmed === 'true') return true;
        if (trimmed === 'false') return false;

        // Array/Object 처리 (JSON)
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            try {
                return JSON.parse(trimmed);
            } catch (e) {
                // Keep as string if invalid JSON
            }
        }

        // Number 처리 (원래 값이 숫자였거나, 숫자 형태인 경우)
        if (typeof originalValue === 'number' || /^-?\d+(\.\d+)?$/.test(trimmed)) {
            const num = parseFloat(trimmed);
            if (!isNaN(num)) return num;
        }

        // 그 외는 문자열
        return trimmed;
    },

    /**
     * 리뷰 승인
     */
    async approveReview() {
        if (!this.currentReview) return;

        // Collect modified values from inputs with type preservation
        const modifiedFields = {};
        const suggestedFields = this.currentReview.suggested_fields || {};

        document.querySelectorAll('.review-field-input').forEach(input => {
            const field = input.dataset.field;
            const originalValue = suggestedFields[field];
            modifiedFields[field] = this.parseFieldValue(input.value, originalValue);
        });

        try {
            await State.approvePendingReview(this.currentReview.id, modifiedFields);
            showToast('Review approved', 'success');
            this.closeDetailModal();
            this.renderReviews('pending');
        } catch (e) {
            showToast('Failed to approve: ' + e.message, 'error');
        }
    },

    /**
     * 리뷰 거부
     */
    async rejectReview() {
        if (!this.currentReview) return;

        try {
            await State.rejectPendingReview(this.currentReview.id);
            showToast('Review rejected', 'success');
            this.closeDetailModal();
            this.renderReviews('pending');
        } catch (e) {
            showToast('Failed to reject: ' + e.message, 'error');
        }
    },

    /**
     * 리뷰 삭제
     */
    async deleteReview() {
        if (!this.currentReview) return;

        if (!confirm('Delete this review permanently?')) return;

        try {
            await State.deletePendingReview(this.currentReview.id);
            showToast('Review deleted', 'success');
            this.closeDetailModal();
            const activeTab = document.querySelector('.pending-tab.active');
            this.renderReviews(activeTab?.dataset.status || 'pending');
        } catch (e) {
            showToast('Failed to delete: ' + e.message, 'error');
        }
    },

    /**
     * 패널 표시
     */
    show() {
        document.getElementById('pendingPanel')?.classList.add('active');
        document.getElementById('pendingPanelOverlay')?.classList.add('active');
    },

    /**
     * 패널 닫기
     */
    close() {
        const panel = document.getElementById('pendingPanel');
        panel?.classList.remove('active');
        panel?.classList.remove('expanded');
        document.getElementById('pendingPanelOverlay')?.classList.remove('active');
        this.isExpanded = false;

        const btn = document.getElementById('pendingPanelExpand');
        if (btn) btn.title = 'Expand';
    },

    /**
     * 배지 카운트 업데이트 (사이드바용)
     */
    updateBadge() {
        const count = State.getPendingReviewCount();
        const badge = document.getElementById('pendingReviewBadge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-flex' : 'none';
        }
    }
};
