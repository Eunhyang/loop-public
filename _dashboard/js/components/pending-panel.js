/**
 * PendingPanel Component
 * Pending Review 관리 패널 (n8n 자동화)
 * - LLM이 제안한 필드값 승인/수정/거부
 * - 3-pane 레이아웃: List | Detail | Entity Preview
 */
const PendingPanel = {
    currentReview: null,
    selectedReviewId: null,
    currentEntityId: null,
    abortController: null, // For cancelling stale entity fetches
    isExpanded: false,

    // Entity ID 패턴 매핑
    ENTITY_PATTERNS: {
        condition: /^cond-[a-z]$/,
        track: /^trk-\d+$/,
        hypothesis: /^hyp-\d+-\d+$/,
        project: /^prj-\d+$/,
        task: /^tsk-\d+-\d+$/
    },

    // Entity ID 추출 정규식 (전역 매칭용)
    ENTITY_ID_REGEX: /\b(cond-[a-z]|trk-\d+|hyp-\d+-\d+|prj-\d+|tsk-\d+-\d+)\b/g,

    // field_type별 색상 매핑 (대시보드 기존 색감)
    FIELD_TYPE_COLORS: {
        expected_impact: '#3b82f6',   // blue (doing)
        realized_impact: '#10b981',   // green (done)
        conditions_3y: '#8b5cf6',     // purple (track)
        due: '#f59e0b',               // amber (hold)
        priority: '#dc2626',          // red (critical)
        track_contributes: '#6366f1', // indigo
        condition_contributes: '#6366f1'
    },

    // 필드 타입 우선순위 (카드 색상 결정용)
    FIELD_TYPE_PRIORITY: ['expected_impact', 'realized_impact', 'priority', 'conditions_3y', 'due'],

    /**
     * 필드 타입 색상 반환
     */
    getFieldTypeColor(fieldType) {
        return this.FIELD_TYPE_COLORS[fieldType] || '#6b7280';
    },

    /**
     * 주요 필드 타입 결정 (카드 색상용)
     */
    getPrimaryFieldType(fieldTypes) {
        for (const p of this.FIELD_TYPE_PRIORITY) {
            if (fieldTypes.includes(p)) return p;
        }
        return fieldTypes[0] || 'other';
    },

    /**
     * 배열 값을 뱃지 형태로 포맷팅
     */
    formatArrayValue(arr) {
        if (!Array.isArray(arr) || arr.length === 0) {
            return '<span class="field-value-empty">-</span>';
        }
        return '<div class="field-value-badges">' +
            arr.map(item => {
                if (item === null || item === undefined) {
                    return '<span class="field-value-badge">null</span>';
                }
                if (typeof item === 'object') {
                    return '<span class="field-value-badge">' + this.escapeHtml(JSON.stringify(item)) + '</span>';
                }
                const isCondition = String(item).startsWith('cond-');
                const badgeClass = isCondition ? 'field-value-badge condition' : 'field-value-badge';
                return '<span class="' + badgeClass + '">' + this.escapeHtml(String(item)) + '</span>';
            }).join('') +
        '</div>';
    },

    /**
     * Impact 객체를 구조화된 형태로 포맷팅
     */
    formatImpactObject(impact) {
        if (!impact || typeof impact !== 'object') {
            return '<span class="field-value-empty">-</span>';
        }

        let html = '<div class="impact-object">';
        html += '<div class="impact-meta">';

        if (impact.tier) {
            html += '<div class="impact-meta-item"><span class="impact-label">Tier</span><span class="impact-value tier-' + impact.tier + '">' + this.escapeHtml(impact.tier) + '</span></div>';
        }
        if (impact.impact_magnitude) {
            html += '<div class="impact-meta-item"><span class="impact-label">Magnitude</span><span class="impact-value">' + this.escapeHtml(impact.impact_magnitude) + '</span></div>';
        }
        if (impact.confidence !== undefined && impact.confidence !== null) {
            const conf = Number(impact.confidence);
            const display = !isNaN(conf) && conf >= 0 && conf <= 1 ? (conf * 100).toFixed(0) + '%' : String(impact.confidence);
            html += '<div class="impact-meta-item"><span class="impact-label">Confidence</span><span class="impact-value">' + display + '</span></div>';
        }
        html += '</div>';

        if (Array.isArray(impact.contributes) && impact.contributes.length > 0) {
            html += '<div class="contributes-section"><div class="contributes-label">Contributes to:</div><div class="contributes-list">';
            impact.contributes.forEach(c => {
                const w = Number(c.weight);
                const wDisplay = !isNaN(w) && w >= 0 && w <= 1 ? (w * 100).toFixed(0) + '%' : String(c.weight || '-');
                html += '<div class="contributes-item"><span class="contributes-target">' + this.escapeHtml(c.to || '') + '</span><span class="contributes-weight">' + wDisplay + '</span></div>';
            });
            html += '</div></div>';
        }
        html += '</div>';
        return html;
    },

    /**
     * 일반 객체를 key-value 테이블로 포맷팅
     */
    formatGenericObject(obj, depth = 0) {
        if (!obj || typeof obj !== 'object') return '<span class="field-value-empty">-</span>';
        if (depth > 2) return '<span class="field-value-truncated">' + this.escapeHtml(JSON.stringify(obj)) + '</span>';

        const entries = Object.entries(obj);
        if (entries.length === 0) return '<span class="field-value-empty">{}</span>';

        let html = '<table class="field-value-table"><tbody>';
        entries.forEach(([key, val]) => {
            html += '<tr><td class="field-key">' + this.escapeHtml(key) + '</td><td class="field-val">';
            if (val === null || val === undefined) {
                html += '<span class="field-value-null">null</span>';
            } else if (Array.isArray(val)) {
                html += this.formatArrayValue(val);
            } else if (typeof val === 'object') {
                html += this.formatGenericObject(val, depth + 1);
            } else {
                html += this.escapeHtml(String(val));
            }
            html += '</td></tr>';
        });
        html += '</tbody></table>';
        return html;
    },

    /**
     * 필드값 포맷팅 (타입별 분기)
     */
    formatFieldValue(field, value) {
        if (value === null || value === undefined) {
            return '<span class="field-value-empty">-</span>';
        }
        if (Array.isArray(value)) {
            return this.formatArrayValue(value);
        }
        if (typeof value === 'object') {
            if (field === 'expected_impact' || field === 'realized_impact') {
                return this.formatImpactObject(value);
            }
            return this.formatGenericObject(value);
        }
        return '<span class="field-value-simple">' + this.escapeHtml(String(value)) + '</span>';
    },

    /**
     * AI Reasoning 렌더링 (접기/펼치기)
     */
    renderReasoning(reviewId, field, reasoningText) {
        if (!reasoningText) return '';
        const uniqueId = 'reasoning-' + this.escapeHtml(String(reviewId)) + '-' + this.escapeHtml(field);
        return '<div class="reasoning-section">' +
            '<button class="reasoning-toggle-btn" onclick="PendingPanel.toggleReasoning(\'' + uniqueId + '\')">' +
            '<span class="toggle-icon">▼</span> AI 판단 근거</button>' +
            '<div class="reasoning-content" id="' + uniqueId + '">' +
            this.escapeHtml(reasoningText) + '</div></div>';
    },

    /**
     * Reasoning 토글
     */
    toggleReasoning(targetId) {
        const content = document.getElementById(targetId);
        if (!content) return;
        const btn = document.querySelector('[onclick*="' + targetId + '"]');
        const icon = btn?.querySelector('.toggle-icon');
        content.classList.toggle('collapsed');
        if (icon) icon.textContent = content.classList.contains('collapsed') ? '▶' : '▼';
    },

    /**
     * 패널 초기화
     */
    init() {
        this.createPanelHTML();
        this.setupEventListeners();
    },

    /**
     * 패널 HTML 생성 (동적 삽입) - 3-pane 레이아웃
     */
    createPanelHTML() {
        // Check if panel already exists
        if (document.getElementById('pendingPanel')) return;

        const panelHTML = `
            <div id="pendingPanelOverlay" class="panel-overlay"></div>
            <div id="pendingPanel" class="pending-3pane-container" role="dialog" aria-label="Pending Reviews">
                <!-- Left Pane: Pending List -->
                <div class="pending-list-pane" role="region" aria-label="Review List">
                    <div class="pane-header">
                        <h3>Pending Reviews</h3>
                        <div class="pane-header-actions">
                            <button id="pendingPanelRefresh" class="panel-btn" title="Refresh" aria-label="Refresh reviews">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 4v6h6M23 20v-6h-6"/>
                                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                                </svg>
                            </button>
                            <button id="pendingPanelClose" class="panel-btn" title="Close" aria-label="Close panel">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="pending-filter-tabs" role="tablist">
                        <button class="pending-tab active" data-status="pending" role="tab" aria-selected="true">Pending</button>
                        <button class="pending-tab" data-status="approved" role="tab" aria-selected="false">Approved</button>
                        <button class="pending-tab" data-status="rejected" role="tab" aria-selected="false">Rejected</button>
                    </div>
                    <div id="pendingReviewsList" class="pending-reviews-list" role="listbox" aria-label="Reviews">
                        <!-- Reviews will be rendered here -->
                    </div>
                </div>

                <!-- Center Pane: Pending Detail -->
                <div class="pending-detail-pane" role="region" aria-label="Review Detail">
                    <div id="pendingDetailContent" class="pane-content">
                        <div class="pane-empty-state">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                            </svg>
                            <p>Select a review to see details</p>
                        </div>
                    </div>
                </div>

                <!-- Right Pane: Entity Preview -->
                <div class="pending-entity-pane" role="region" aria-label="Entity Preview">
                    <div id="pendingEntityContent" class="pane-content">
                        <div class="pane-empty-state">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
                                <polyline points="13 2 13 9 20 9"/>
                            </svg>
                            <p>Click an entity ID to preview</p>
                        </div>
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

        // Refresh button
        document.getElementById('pendingPanelRefresh')?.addEventListener('click', () => this.refresh());

        // Tab clicks
        document.querySelectorAll('.pending-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.pending-tab').forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                e.target.classList.add('active');
                e.target.setAttribute('aria-selected', 'true');
                this.renderReviews(e.target.dataset.status);
            });
        });

        // Keyboard navigation for ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('pendingPanel')?.classList.contains('active')) {
                this.close();
            }
        });
    },

    /**
     * HTML 이스케이프 (XSS 방지)
     * - 0, false 등 falsy 값도 문자열로 변환
     */
    escapeHtml(str) {
        if (str === null || str === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(str);
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
            // Clear detail pane when no reviews
            this.clearDetailPane();
            return;
        }

        container.innerHTML = reviews.map(review => this.renderReviewCard(review)).join('');

        // Add click handlers
        container.querySelectorAll('.pending-review-card').forEach(card => {
            card.addEventListener('click', () => {
                const reviewId = card.dataset.reviewId;
                const review = State.pendingReviews.find(r => r.id === reviewId);
                if (review) {
                    // Update selection state
                    container.querySelectorAll('.pending-review-card').forEach(c => {
                        c.classList.remove('selected');
                        c.setAttribute('aria-selected', 'false');
                    });
                    card.classList.add('selected');
                    card.setAttribute('aria-selected', 'true');
                    this.selectedReviewId = reviewId;

                    // Render detail in center pane
                    this.renderDetail(review);
                }
            });
        });

        // Auto-select first review if none selected
        if (!this.selectedReviewId || !reviews.find(r => r.id === this.selectedReviewId)) {
            const firstCard = container.querySelector('.pending-review-card');
            if (firstCard) {
                firstCard.click();
            }
        } else {
            // Re-select previously selected review
            const selectedCard = container.querySelector(`[data-review-id="${this.selectedReviewId}"]`);
            if (selectedCard) {
                selectedCard.classList.add('selected');
                selectedCard.setAttribute('aria-selected', 'true');
            }
        }
    },

    /**
     * 상세 패널 클리어
     */
    clearDetailPane() {
        const container = document.getElementById('pendingDetailContent');
        if (container) {
            container.innerHTML = `
                <div class="pane-empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    <p>Select a review to see details</p>
                </div>
            `;
        }
        this.currentReview = null;
        this.selectedReviewId = null;
    },

    /**
     * Entity 패널 클리어
     */
    clearEntityPane() {
        const container = document.getElementById('pendingEntityContent');
        if (container) {
            container.innerHTML = `
                <div class="pane-empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
                        <polyline points="13 2 13 9 20 9"/>
                    </svg>
                    <p>Click an entity ID to preview</p>
                </div>
            `;
        }
        this.currentEntityId = null;
    },

    /**
     * 리뷰 카드 렌더링
     */
    renderReviewCard(review) {
        const statusClass = `review-status-${review.status}`;
        const date = new Date(review.created_at).toLocaleDateString('ko-KR');
        const fieldTypes = Object.keys(review.suggested_fields || {});
        const primaryFieldType = this.getPrimaryFieldType(fieldTypes);

        return `
            <div class="pending-review-card ${statusClass}"
                 data-review-id="${this.escapeHtml(review.id)}"
                 data-field-type="${this.escapeHtml(primaryFieldType)}"
                 role="option"
                 aria-selected="false"
                 tabindex="0">
                <div class="review-card-header">
                    <span class="review-entity-type">${this.escapeHtml(review.entity_type)}</span>
                    <span class="review-date">${date}</span>
                </div>
                <div class="review-card-title">${this.escapeHtml(review.entity_name)}</div>
                <div class="review-card-id">${this.escapeHtml(review.entity_id)}</div>
                <div class="review-card-fields">
                    ${fieldTypes.map(field => {
                        const color = this.getFieldTypeColor(field);
                        return `<span class="review-field-badge" style="border-left: 3px solid ${color}">${this.escapeHtml(field)}</span>`;
                    }).join('')}
                </div>
            </div>
        `;
    },

    /**
     * 상세 패널 렌더링 (가운데 패널)
     */
    renderDetail(review) {
        this.currentReview = review;
        const container = document.getElementById('pendingDetailContent');
        if (!container) return;

        // Clear entity pane when selecting new review
        this.clearEntityPane();

        container.innerHTML = `
            <div class="detail-pane-header">
                <h3>${this.escapeHtml(review.entity_type)}: ${this.escapeHtml(review.entity_name)}</h3>
            </div>
            <div class="detail-pane-body">
                <div class="review-detail-section">
                    <h4>Entity Info</h4>
                    <div class="review-detail-row">
                        <span class="label">ID:</span>
                        <span class="value entity-id-link" data-entity-id="${this.escapeHtml(review.entity_id)}">${this.escapeHtml(review.entity_id)}</span>
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
                    ${Object.entries(review.suggested_fields || {}).map(([field, value]) => {
                        const isComplex = typeof value === 'object' && value !== null;
                        const fieldColor = this.getFieldTypeColor(field);
                        const formattedValue = this.formatFieldValueWithLinks(field, value);

                        return `
                        <div class="review-field-item" style="border-left: 3px solid ${fieldColor}">
                            <div class="review-field-header">
                                <span class="field-name">${this.escapeHtml(field)}</span>
                                ${isComplex ? '<span class="field-type-badge">Object</span>' : ''}
                            </div>
                            <div class="review-field-value">
                                ${isComplex ? `
                                    <div class="field-value-display">
                                        ${formattedValue}
                                    </div>
                                    <textarea class="review-field-textarea"
                                           data-field="${this.escapeHtml(field)}"
                                           rows="4">${this.escapeHtml(JSON.stringify(value, null, 2))}</textarea>
                                ` : `
                                    <input type="text" class="review-field-input"
                                           data-field="${this.escapeHtml(field)}"
                                           value="${this.escapeHtml(String(value))}" />
                                `}
                            </div>
                            ${this.renderReasoning(review.id, field, review.reasoning?.[field])}
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
            <div class="detail-pane-footer">
                ${review.status === 'pending' ? `
                    <button class="btn btn-secondary" id="btnRejectReview" aria-label="Reject this review">Reject</button>
                    <button class="btn btn-primary" id="btnApproveReview" aria-label="Approve this review">Approve</button>
                ` : `
                    <button class="btn btn-secondary" id="btnDeleteReview" aria-label="Delete this review">Delete</button>
                `}
            </div>
        `;

        // Setup button event listeners
        if (review.status === 'pending') {
            document.getElementById('btnApproveReview')?.addEventListener('click', () => this.approveReview());
            document.getElementById('btnRejectReview')?.addEventListener('click', () => this.rejectReview());
        } else {
            document.getElementById('btnDeleteReview')?.addEventListener('click', () => this.deleteReview());
        }

        // Setup entity ID click handlers
        this.setupEntityIdClickHandlers(container);
    },

    /**
     * Entity ID 클릭 핸들러 설정
     */
    setupEntityIdClickHandlers(container) {
        container.querySelectorAll('.entity-id-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const entityId = link.dataset.entityId;
                if (entityId) {
                    this.loadEntityPreview(entityId);
                }
            });
        });
    },

    /**
     * 필드값 포맷팅 + Entity ID 링크 추가
     */
    formatFieldValueWithLinks(field, value) {
        let formatted = this.formatFieldValue(field, value);
        // Entity ID 패턴을 클릭 가능한 링크로 변환
        formatted = formatted.replace(this.ENTITY_ID_REGEX, (match) => {
            return `<span class="entity-id-link" data-entity-id="${this.escapeHtml(match)}">${this.escapeHtml(match)}</span>`;
        });
        return formatted;
    },

    /**
     * Entity 미리보기 로드 (오른쪽 패널)
     */
    async loadEntityPreview(entityId) {
        const container = document.getElementById('pendingEntityContent');
        if (!container) return;

        // Cancel any pending request
        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();

        this.currentEntityId = entityId;

        // Show loading state
        container.innerHTML = `
            <div class="pane-loading-state">
                <div class="loading-spinner"></div>
                <p>Loading ${this.escapeHtml(entityId)}...</p>
            </div>
        `;

        try {
            const entityType = this.getEntityType(entityId);
            let entity = null;

            switch (entityType) {
                case 'condition':
                    entity = await API.getCondition(entityId);
                    break;
                case 'track':
                    entity = await API.getTrack(entityId);
                    break;
                case 'hypothesis':
                    entity = await API.getHypothesis(entityId);
                    break;
                case 'project':
                    entity = await API.getProject(entityId);
                    break;
                case 'task':
                    entity = await API.getTask(entityId);
                    break;
                default:
                    throw new Error(`Unknown entity type for ID: ${entityId}`);
            }

            // Check if this is still the current entity
            if (this.currentEntityId !== entityId) return;

            this.renderEntityPreview(entity, entityType);

        } catch (error) {
            // Ignore abort errors
            if (error.name === 'AbortError') return;

            // Check if this is still the current entity
            if (this.currentEntityId !== entityId) return;

            container.innerHTML = `
                <div class="pane-error-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p>Failed to load entity</p>
                    <span class="error-detail">${this.escapeHtml(error.message)}</span>
                </div>
            `;
        }
    },

    /**
     * Entity ID에서 타입 추출
     */
    getEntityType(entityId) {
        for (const [type, pattern] of Object.entries(this.ENTITY_PATTERNS)) {
            if (pattern.test(entityId)) {
                return type;
            }
        }
        return null;
    },

    /**
     * Entity 미리보기 렌더링
     */
    renderEntityPreview(entity, entityType) {
        const container = document.getElementById('pendingEntityContent');
        if (!container || !entity) return;

        const typeColors = {
            condition: '#f59e0b',
            track: '#8b5cf6',
            hypothesis: '#3b82f6',
            project: '#10b981',
            task: '#6366f1'
        };

        const color = typeColors[entityType] || '#6b7280';

        container.innerHTML = `
            <div class="entity-preview-header" style="border-left: 4px solid ${color}">
                <span class="entity-type-badge ${entityType}">${this.escapeHtml(entityType.toUpperCase())}</span>
                <h4 class="entity-preview-title">${this.escapeHtml(entity.name || entity.title || entity.entity_id || 'Untitled')}</h4>
                <span class="entity-preview-id">${this.escapeHtml(entity.entity_id || entity.id || '')}</span>
            </div>
            <div class="entity-preview-body">
                ${this.renderEntityFields(entity, entityType)}
            </div>
        `;

        // Setup entity ID click handlers for nested entities
        this.setupEntityIdClickHandlers(container);
    },

    /**
     * Entity 필드 렌더링
     */
    renderEntityFields(entity, entityType) {
        const skipFields = ['name', 'title', 'entity_id', 'id', 'file_path', 'body'];
        let html = '<div class="entity-fields">';

        for (const [key, value] of Object.entries(entity)) {
            if (skipFields.includes(key) || value === null || value === undefined) continue;

            const displayValue = this.formatEntityFieldValue(key, value);
            html += `
                <div class="entity-field-row">
                    <span class="entity-field-label">${this.escapeHtml(key)}</span>
                    <span class="entity-field-value">${displayValue}</span>
                </div>
            `;
        }

        html += '</div>';
        return html;
    },

    /**
     * Entity 필드값 포맷팅 (Entity ID 링크 포함)
     */
    formatEntityFieldValue(key, value) {
        if (Array.isArray(value)) {
            if (value.length === 0) return '<span class="field-value-empty">-</span>';
            return '<div class="field-value-badges">' +
                value.map(item => {
                    const strVal = String(item);
                    const isEntityId = this.ENTITY_ID_REGEX.test(strVal);
                    this.ENTITY_ID_REGEX.lastIndex = 0; // Reset regex state
                    if (isEntityId) {
                        return `<span class="field-value-badge entity-id-link" data-entity-id="${this.escapeHtml(strVal)}">${this.escapeHtml(strVal)}</span>`;
                    }
                    return `<span class="field-value-badge">${this.escapeHtml(strVal)}</span>`;
                }).join('') +
            '</div>';
        }
        if (typeof value === 'object') {
            return `<pre class="entity-field-json">${this.escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
        }
        const strVal = String(value);
        // Check if it's an entity ID
        if (this.ENTITY_ID_REGEX.test(strVal)) {
            this.ENTITY_ID_REGEX.lastIndex = 0;
            return `<span class="entity-id-link" data-entity-id="${this.escapeHtml(strVal)}">${this.escapeHtml(strVal)}</span>`;
        }
        return this.escapeHtml(strVal);
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

        // Collect modified values from inputs and textareas with type preservation
        const modifiedFields = {};
        const suggestedFields = this.currentReview.suggested_fields || {};
        const detailPane = document.getElementById('pendingDetailContent');

        // 일반 input 필드 처리
        detailPane?.querySelectorAll('.review-field-input').forEach(input => {
            const field = input.dataset.field;
            const originalValue = suggestedFields[field];
            modifiedFields[field] = this.parseFieldValue(input.value, originalValue);
        });

        // textarea (JSON) 필드 처리
        detailPane?.querySelectorAll('.review-field-textarea').forEach(textarea => {
            const field = textarea.dataset.field;
            try {
                modifiedFields[field] = JSON.parse(textarea.value);
            } catch (e) {
                // JSON 파싱 실패 시 원본 값 유지
                modifiedFields[field] = suggestedFields[field];
                console.warn(`Failed to parse JSON for field ${field}:`, e);
            }
        });

        try {
            await State.approvePendingReview(this.currentReview.id, modifiedFields);
            showToast('Review approved', 'success');
            this.selectedReviewId = null;
            this.currentReview = null;
            this.clearDetailPane();
            this.clearEntityPane();
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
            this.selectedReviewId = null;
            this.currentReview = null;
            this.clearDetailPane();
            this.clearEntityPane();
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
            this.selectedReviewId = null;
            this.currentReview = null;
            this.clearDetailPane();
            this.clearEntityPane();
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
