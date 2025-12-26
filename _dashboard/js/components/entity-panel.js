/**
 * Entity Detail Panel Component
 * 사이드바에서 Track, Condition, Hypothesis 클릭 시 상세 정보 표시
 * GraphDetailPanel의 렌더링 로직을 재사용
 */
const EntityDetailPanel = {
    currentEntity: null,
    currentType: null,

    // ============================================
    // Initialization
    // ============================================
    init() {
        this.setupEventListeners();
    },

    setupEventListeners() {
        // Close button
        const closeBtn = document.getElementById('entityPanelClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Overlay click to close
        const overlay = document.getElementById('entityPanelOverlay');
        if (overlay) {
            overlay.addEventListener('click', () => this.close());
        }

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
    },

    // ============================================
    // Open/Close
    // ============================================
    open(entityType, entityId) {
        this.currentType = entityType;

        // Get entity data based on type
        let entity = null;
        switch (entityType) {
            case 'Track':
                entity = State.getTrackById(entityId);
                break;
            case 'Condition':
                entity = (State.conditions || []).find(c => c.entity_id === entityId);
                break;
            case 'Hypothesis':
                entity = (State.hypotheses || []).find(h => h.entity_id === entityId);
                break;
        }

        if (!entity) {
            console.warn('Entity not found:', entityType, entityId);
            return;
        }

        this.currentEntity = entity;
        this.render();
        this.show();
    },

    show() {
        const panel = document.getElementById('entityPanel');
        const overlay = document.getElementById('entityPanelOverlay');
        if (panel) panel.classList.add('active');
        if (overlay) overlay.classList.add('active');
    },

    close() {
        const panel = document.getElementById('entityPanel');
        const overlay = document.getElementById('entityPanelOverlay');
        if (panel) panel.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        this.currentEntity = null;
        this.currentType = null;
    },

    isOpen() {
        const panel = document.getElementById('entityPanel');
        return panel && panel.classList.contains('active');
    },

    // ============================================
    // Render
    // ============================================
    render() {
        const titleEl = document.getElementById('entityPanelTitle');
        const bodyEl = document.getElementById('entityPanelBody');

        if (!titleEl || !bodyEl || !this.currentEntity) return;

        // Set title with clickable ID
        const name = this.currentEntity.entity_name || this.currentEntity.entity_id;
        const entityId = this.currentEntity.entity_id;
        titleEl.innerHTML = `
            <span class="entity-type-badge ${this.currentType.toLowerCase()}">${this.currentType}</span>
            ${this.formatName(name)}
            <span class="entity-id-badge" style="cursor: pointer; margin-left: 8px; font-size: 12px; color: #888; background: #f0f0f0; padding: 2px 6px; border-radius: 4px;"
                  title="Click to copy ID"
                  data-entity-id="${entityId}">${entityId}</span>
        `;

        // ID 클릭 시 복사 이벤트
        const idBadge = titleEl.querySelector('.entity-id-badge');
        if (idBadge) {
            idBadge.addEventListener('click', (e) => {
                e.stopPropagation();
                this.copyId(idBadge.dataset.entityId);
            });
        }

        // Render content based on type
        bodyEl.innerHTML = this.renderContent();
    },

    /**
     * ID를 클립보드에 복사
     */
    copyId(id) {
        if (!id) return;
        navigator.clipboard.writeText(id).then(() => {
            showToast(`Copied: ${id}`, 'success');
        }).catch(err => {
            console.error('Copy failed:', err);
            showToast('Copy failed', 'error');
        });
    },

    renderContent() {
        switch (this.currentType) {
            case 'Track':
                return this.renderTrack();
            case 'Condition':
                return this.renderCondition();
            case 'Hypothesis':
                return this.renderHypothesis();
            default:
                return this.renderGeneric();
        }
    },

    // ============================================
    // Track Render
    // ============================================
    renderTrack() {
        const data = this.currentEntity;
        const progress = data.progress || 0;
        const projects = this.getRelatedProjects(data.entity_id);

        return `
            ${this.renderStatus(data.status)}

            ${data.hypothesis ? `
                <div class="entity-section">
                    <div class="entity-section-title">Hypothesis</div>
                    <div class="entity-section-content">${data.hypothesis}</div>
                </div>
            ` : ''}

            <div class="entity-section">
                <div class="entity-section-title">Progress</div>
                <div class="entity-progress">
                    <div class="entity-progress-bar">
                        <div class="entity-progress-fill" style="width: ${progress * 100}%"></div>
                    </div>
                    <div class="entity-progress-text">${Math.round(progress * 100)}% complete</div>
                </div>
            </div>

            ${data.focus ? `
                <div class="entity-section">
                    <div class="entity-section-title">Focus Areas</div>
                    <div class="entity-section-content">
                        ${Array.isArray(data.focus) ? data.focus.map(f => `<div>• ${f}</div>`).join('') : data.focus}
                    </div>
                </div>
            ` : ''}

            ${projects.length > 0 ? `
                <div class="entity-section">
                    <div class="entity-section-title">Projects (${projects.length})</div>
                    <ul class="entity-related-list">
                        ${projects.map(p => `
                            <li class="entity-related-item" data-action="open-project" data-id="${p.entity_id}">
                                <span class="entity-related-icon">📁</span>
                                <span class="entity-related-name">${this.formatName(p.entity_name || p.entity_id)}</span>
                                <span class="entity-related-badge">${p.status || 'active'}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            ${this.renderRelatedTasks(data.entity_id, 'parent_id')}
        `;
    },

    // ============================================
    // Condition Render
    // ============================================
    renderCondition() {
        const data = this.currentEntity;
        const metrics = data.metrics || [];

        return `
            ${this.renderStatus(data.status)}

            ${data.unlock ? `
                <div class="entity-section">
                    <div class="entity-section-title">Unlock</div>
                    <div class="entity-section-content entity-unlock">${data.unlock}</div>
                </div>
            ` : ''}

            ${data.if_broken ? `
                <div class="entity-section">
                    <div class="entity-section-title">If Broken</div>
                    <div class="entity-section-content entity-if-broken">${data.if_broken}</div>
                </div>
            ` : ''}

            ${metrics.length > 0 ? `
                <div class="entity-section">
                    <div class="entity-section-title">Metrics</div>
                    <div class="entity-metrics">
                        ${metrics.map(m => `
                            <div class="entity-metric">
                                <div class="entity-metric-label">${m.name}</div>
                                <div class="entity-metric-value ${m.status === 'at_risk' ? 'at-risk' : m.status === 'on_track' ? 'on-track' : ''}">
                                    ${m.current} / ${m.threshold}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${data.risk_level ? `
                <div class="entity-section">
                    <div class="entity-section-title">Risk Level</div>
                    <div class="entity-status-badge ${data.risk_level === 'high' ? 'at_risk' : data.risk_level === 'low' ? 'active' : 'in_progress'}">
                        ${data.risk_level.toUpperCase()}
                    </div>
                </div>
            ` : ''}

            ${this.renderRelatedTasks(data.entity_id, 'conditions_3y')}
        `;
    },

    // ============================================
    // Hypothesis Render
    // ============================================
    renderHypothesis() {
        const data = this.currentEntity;
        const validatingTasks = this.getValidatingTasks(data.entity_id);
        const validatingProjects = this.getValidatingProjects(data.entity_id);
        const parentTrack = this.getParentTrack(data.parent_id);

        return `
            ${this.renderStatus(data.status)}

            ${data.hypothesis_question ? `
                <div class="entity-section">
                    <div class="entity-section-title">Hypothesis Question</div>
                    <div class="entity-section-content entity-hypothesis-question">
                        "${data.hypothesis_question}"
                    </div>
                </div>
            ` : ''}

            ${data.confidence !== undefined ? `
                <div class="entity-section">
                    <div class="entity-section-title">Confidence</div>
                    <div class="entity-progress">
                        <div class="entity-progress-bar">
                            <div class="entity-progress-fill" style="width: ${data.confidence * 100}%; background: ${data.confidence >= 0.7 ? '#3fb950' : data.confidence >= 0.4 ? '#f0883e' : '#f85149'};"></div>
                        </div>
                        <div class="entity-progress-text">${Math.round(data.confidence * 100)}%</div>
                    </div>
                </div>
            ` : ''}

            ${data.success_criteria ? `
                <div class="entity-section">
                    <div class="entity-section-title">Success Criteria</div>
                    <div class="entity-section-content entity-success">
                        ✓ ${data.success_criteria}
                    </div>
                </div>
            ` : ''}

            ${data.failure_criteria ? `
                <div class="entity-section">
                    <div class="entity-section-title">Failure Criteria</div>
                    <div class="entity-section-content entity-failure">
                        ✗ ${data.failure_criteria}
                    </div>
                </div>
            ` : ''}

            ${parentTrack ? `
                <div class="entity-section">
                    <div class="entity-section-title">Parent Track</div>
                    <div class="entity-related-item" data-action="open-track" data-id="${parentTrack.entity_id}">
                        <span class="entity-related-icon">🎯</span>
                        <span class="entity-related-name">${this.formatName(parentTrack.entity_name || parentTrack.entity_id)}</span>
                        <span class="entity-related-badge">${parentTrack.status || 'active'}</span>
                    </div>
                </div>
            ` : ''}

            ${validatingProjects.length > 0 ? `
                <div class="entity-section">
                    <div class="entity-section-title">Validating Projects (${validatingProjects.length})</div>
                    <ul class="entity-related-list">
                        ${validatingProjects.map(p => `
                            <li class="entity-related-item" data-action="open-project" data-id="${p.entity_id}">
                                <span class="entity-related-icon">📁</span>
                                <span class="entity-related-name">${this.formatName(p.entity_name || p.entity_id)}</span>
                                <span class="entity-related-badge">${p.status || 'active'}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            ${validatingTasks.length > 0 ? `
                <div class="entity-section">
                    <div class="entity-section-title">Validating Tasks (${validatingTasks.length})</div>
                    <ul class="entity-related-list">
                        ${validatingTasks.slice(0, 5).map(t => `
                            <li class="entity-related-item" data-action="open-task" data-id="${t.entity_id}">
                                <span class="entity-related-icon">${this.getStatusIcon(t.status)}</span>
                                <span class="entity-related-name">${this.formatName(t.entity_name || t.entity_id)}</span>
                                <span class="entity-related-badge">${t.status || 'todo'}</span>
                            </li>
                        `).join('')}
                        ${validatingTasks.length > 5 ? `<li class="entity-related-more">... +${validatingTasks.length - 5} more</li>` : ''}
                    </ul>
                </div>
            ` : ''}

            ${data.horizon ? `
                <div class="entity-section">
                    <div class="entity-section-title">Validation Horizon</div>
                    <div class="entity-section-content">${data.horizon}</div>
                </div>
            ` : ''}
        `;
    },

    // ============================================
    // Generic Render
    // ============================================
    renderGeneric() {
        const data = this.currentEntity;
        return `
            ${this.renderStatus(data.status)}
            <div class="entity-section">
                <div class="entity-section-title">ID</div>
                <div class="entity-section-content">${data.entity_id}</div>
            </div>
            <div class="entity-section">
                <div class="entity-section-title">Raw Data</div>
                <div class="entity-section-content">
                    <pre style="font-size: 11px; overflow-x: auto;">${JSON.stringify(data, null, 2)}</pre>
                </div>
            </div>
        `;
    },

    // ============================================
    // Helper Renders
    // ============================================
    renderStatus(status) {
        if (!status) return '';
        return `
            <div class="entity-section">
                <div class="entity-section-title">Status</div>
                <div class="entity-status-badge ${status.replace(/\s+/g, '_')}">${status}</div>
            </div>
        `;
    },

    renderRelatedTasks(entityId, field) {
        const tasks = (State.tasks || []).filter(t => {
            const values = t[field];
            if (!values) return false;
            const arr = Array.isArray(values) ? values : [values];
            return arr.includes(entityId);
        });

        if (tasks.length === 0) return '';

        return `
            <div class="entity-section">
                <div class="entity-section-title">Related Tasks (${tasks.length})</div>
                <ul class="entity-related-list">
                    ${tasks.slice(0, 5).map(t => `
                        <li class="entity-related-item" data-action="open-task" data-id="${t.entity_id}">
                            <span class="entity-related-icon">${this.getStatusIcon(t.status)}</span>
                            <span class="entity-related-name">${this.formatName(t.entity_name || t.entity_id)}</span>
                            <span class="entity-related-badge">${t.status || 'todo'}</span>
                        </li>
                    `).join('')}
                    ${tasks.length > 5 ? `<li class="entity-related-more">... +${tasks.length - 5} more</li>` : ''}
                </ul>
            </div>
        `;
    },

    // ============================================
    // Data Helpers
    // ============================================
    getRelatedProjects(trackId) {
        return (State.projects || []).filter(p =>
            p.parent_id === trackId || p.track_id === trackId
        );
    },

    getValidatingTasks(hypId) {
        return (State.tasks || []).filter(t => {
            if (!t.validates) return false;
            const validates = Array.isArray(t.validates) ? t.validates : [t.validates];
            return validates.includes(hypId);
        });
    },

    getValidatingProjects(hypId) {
        return (State.projects || []).filter(p => {
            if (!p.validates) return false;
            const validates = Array.isArray(p.validates) ? p.validates : [p.validates];
            return validates.includes(hypId);
        });
    },

    getParentTrack(trackId) {
        if (!trackId) return null;
        return (State.tracks || []).find(t => t.entity_id === trackId);
    },

    // ============================================
    // Formatting Helpers
    // ============================================
    formatName(name) {
        if (!name) return '';
        return name
            .replace(/^(Track_|Project_|Task_|Condition_|Hypothesis_)/, '')
            .replace(/_/g, ' ');
    },

    getStatusIcon(status) {
        const icons = {
            'done': '✅',
            'completed': '✅',
            'doing': '🔄',
            'in_progress': '🔄',
            'todo': '⬜',
            'backlog': '📋',
            'blocked': '🚫'
        };
        return icons[status] || '⬜';
    }
};