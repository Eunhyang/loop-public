/**
 * Graph Detail Panel Component
 * 그래프 노드 선택 시 상세 정보 표시
 */
const GraphDetailPanel = {
    currentNode: null,

    // ============================================
    // Show/Hide
    // ============================================
    show(node) {
        console.log('GraphDetailPanel.show called:', node);
        this.currentNode = node;
        const panel = document.getElementById('graphDetailPanel');
        console.log('graphDetailPanel element:', panel);
        if (!panel) return;

        panel.classList.remove('collapsed');
        this.render();
    },

    hide() {
        this.currentNode = null;
        const panel = document.getElementById('graphDetailPanel');
        if (panel) {
            panel.classList.add('collapsed');
        }
    },

    // ============================================
    // Render
    // ============================================
    render() {
        const panel = document.getElementById('graphDetailPanel');
        if (!panel || !this.currentNode) return;

        const node = this.currentNode;
        const data = node.data || {};

        panel.innerHTML = `
            <div class="graph-detail-header">
                <div class="graph-detail-title">
                    <span class="graph-detail-type ${node.type.toLowerCase()}">${node.type}</span>
                    <h3>${this.formatName(data.entity_name || data.entity_id || node.id)}</h3>
                </div>
                <button class="graph-detail-close" onclick="GraphDetailPanel.hide()">×</button>
            </div>
            <div class="graph-detail-content">
                ${this.renderContent(node)}
            </div>
        `;
    },

    renderContent(node) {
        switch (node.type) {
            case 'NorthStar':
                return this.renderNorthStar(node);
            case 'MetaHypothesis':
                return this.renderMetaHypothesis(node);
            case 'ProductLine':
                return this.renderProductLine(node);
            case 'PartnershipStage':
                return this.renderPartnershipStage(node);
            case 'Track':
                return this.renderTrack(node);
            case 'Condition':
                return this.renderCondition(node);
            case 'Project':
                return this.renderProject(node);
            case 'Hypothesis':
                return this.renderHypothesis(node);
            case 'Task':
                return this.renderTask(node);
            default:
                return this.renderGeneric(node);
        }
    },

    // ============================================
    // Entity-specific renders
    // ============================================

    renderNorthStar(node) {
        const data = node.data;
        const linkedMH = this.getLinkedMetaHypotheses(node.id);

        return `
            ${this.renderStatus(data.status)}

            ${data.vision ? `
                <div class="detail-section">
                    <div class="detail-section-title">Vision</div>
                    <div class="detail-section-content" style="font-size: 15px; font-weight: 500; line-height: 1.6;">
                        ${data.vision}
                    </div>
                </div>
            ` : ''}

            ${data.characteristics && data.characteristics.length > 0 ? `
                <div class="detail-section">
                    <div class="detail-section-title">Characteristics</div>
                    <div class="detail-section-content">
                        ${data.characteristics.map(c => `<div>• ${c}</div>`).join('')}
                    </div>
                </div>
            ` : ''}

            ${data.immutable ? `
                <div class="detail-section">
                    <div class="detail-section-title">Immutability</div>
                    <div class="detail-status active">🔒 IMMUTABLE</div>
                </div>
            ` : ''}

            ${linkedMH.length > 0 ? `
                <div class="detail-section">
                    <div class="detail-section-title">Meta Hypotheses (${linkedMH.length})</div>
                    <ul class="detail-related-list">
                        ${linkedMH.map(mh => `
                            <li class="detail-related-item" onclick="GraphDetailPanel.navigateTo('${mh.entity_id}')">
                                <span class="detail-related-icon">🧬</span>
                                <span class="detail-related-name">${this.formatName(mh.entity_name || mh.entity_id)}</span>
                                <span class="detail-related-badge">${mh.status || 'validating'}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
    },

    renderMetaHypothesis(node) {
        const data = node.data;
        const linkedConditions = this.getLinkedConditions(node.id);
        const evidence = data.evidence || {};

        return `
            ${this.renderStatus(data.status)}

            ${data.hypothesis_text ? `
                <div class="detail-section">
                    <div class="detail-section-title">Hypothesis</div>
                    <div class="detail-section-content" style="font-weight: 500;">
                        "${data.hypothesis_text}"
                    </div>
                </div>
            ` : ''}

            ${data.confidence !== undefined ? `
                <div class="detail-section">
                    <div class="detail-section-title">Confidence</div>
                    <div class="detail-progress">
                        <div class="detail-progress-bar">
                            <div class="detail-progress-fill" style="width: ${data.confidence * 100}%; background: ${data.confidence >= 0.7 ? '#3fb950' : data.confidence >= 0.4 ? '#f0883e' : '#f85149'};"></div>
                        </div>
                        <div class="detail-progress-text">${Math.round(data.confidence * 100)}% confidence</div>
                    </div>
                </div>
            ` : ''}

            ${data.if_broken ? `
                <div class="detail-section">
                    <div class="detail-section-title">If Broken</div>
                    <div class="detail-section-content" style="color: #f85149; font-weight: 500;">
                        ⚠️ ${data.if_broken}
                    </div>
                </div>
            ` : ''}

            ${evidence.positive && evidence.positive.length > 0 ? `
                <div class="detail-section">
                    <div class="detail-section-title">Positive Evidence (${evidence.positive.length})</div>
                    <div class="detail-section-content" style="color: #3fb950;">
                        ${evidence.positive.slice(0, 3).map(e => `<div>✓ ${e}</div>`).join('')}
                        ${evidence.positive.length > 3 ? `<div style="opacity: 0.6;">... +${evidence.positive.length - 3} more</div>` : ''}
                    </div>
                </div>
            ` : ''}

            ${evidence.negative && evidence.negative.length > 0 ? `
                <div class="detail-section">
                    <div class="detail-section-title">Negative Evidence (${evidence.negative.length})</div>
                    <div class="detail-section-content" style="color: #f85149;">
                        ${evidence.negative.slice(0, 3).map(e => `<div>✗ ${e}</div>`).join('')}
                        ${evidence.negative.length > 3 ? `<div style="opacity: 0.6;">... +${evidence.negative.length - 3} more</div>` : ''}
                    </div>
                </div>
            ` : ''}

            ${linkedConditions.length > 0 ? `
                <div class="detail-section">
                    <div class="detail-section-title">Enables Conditions (${linkedConditions.length})</div>
                    <ul class="detail-related-list">
                        ${linkedConditions.map(c => `
                            <li class="detail-related-item" onclick="GraphDetailPanel.navigateTo('${c.entity_id}')">
                                <span class="detail-related-icon">🔑</span>
                                <span class="detail-related-name">${this.formatName(c.entity_name || c.entity_id)}</span>
                                <span class="detail-related-badge">${c.status || 'in_progress'}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            ${data.validated_by && data.validated_by.length > 0 ? `
                <div class="detail-section">
                    <div class="detail-section-title">Validated By</div>
                    <ul class="detail-related-list">
                        ${data.validated_by.slice(0, 5).map(id => `
                            <li class="detail-related-item" onclick="GraphDetailPanel.navigateTo('${id}')">
                                <span class="detail-related-icon">${this.getEntityIcon(id)}</span>
                                <span class="detail-related-name">${id}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
    },

    renderProductLine(node) {
        const data = node.data;
        const linkedTracks = this.getLinkedTracks(node.id);

        return `
            ${this.renderStatus(data.status)}

            ${data.description ? `
                <div class="detail-section">
                    <div class="detail-section-title">Description</div>
                    <div class="detail-section-content">${data.description}</div>
                </div>
            ` : ''}

            ${data.target_market ? `
                <div class="detail-section">
                    <div class="detail-section-title">Target Market</div>
                    <div class="detail-section-content">${data.target_market}</div>
                </div>
            ` : ''}

            ${data.revenue_model ? `
                <div class="detail-section">
                    <div class="detail-section-title">Revenue Model</div>
                    <div class="detail-section-content">${data.revenue_model}</div>
                </div>
            ` : ''}

            ${linkedTracks.length > 0 ? `
                <div class="detail-section">
                    <div class="detail-section-title">Related Tracks (${linkedTracks.length})</div>
                    <ul class="detail-related-list">
                        ${linkedTracks.map(t => `
                            <li class="detail-related-item" onclick="GraphDetailPanel.navigateTo('${t.entity_id}')">
                                <span class="detail-related-icon">🎯</span>
                                <span class="detail-related-name">${this.formatName(t.entity_name || t.entity_id)}</span>
                                <span class="detail-related-badge">${t.status || 'active'}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            ${data.parent_id ? `
                <div class="detail-section">
                    <div class="detail-section-title">Parent</div>
                    <div class="detail-related-item" onclick="GraphDetailPanel.navigateTo('${data.parent_id}')">
                        <span class="detail-related-icon">${this.getEntityIcon(data.parent_id)}</span>
                        <span class="detail-related-name">${data.parent_id}</span>
                    </div>
                </div>
            ` : ''}
        `;
    },

    renderPartnershipStage(node) {
        const data = node.data;
        const linkedTracks = this.getLinkedTracks(node.id);

        return `
            ${this.renderStatus(data.status)}

            ${data.description ? `
                <div class="detail-section">
                    <div class="detail-section-title">Description</div>
                    <div class="detail-section-content">${data.description}</div>
                </div>
            ` : ''}

            ${data.partner_type ? `
                <div class="detail-section">
                    <div class="detail-section-title">Partner Type</div>
                    <div class="detail-section-content">${data.partner_type}</div>
                </div>
            ` : ''}

            ${data.stage_goal ? `
                <div class="detail-section">
                    <div class="detail-section-title">Stage Goal</div>
                    <div class="detail-section-content">${data.stage_goal}</div>
                </div>
            ` : ''}

            ${data.timeline ? `
                <div class="detail-section">
                    <div class="detail-section-title">Timeline</div>
                    <div class="detail-section-content">${data.timeline}</div>
                </div>
            ` : ''}

            ${linkedTracks.length > 0 ? `
                <div class="detail-section">
                    <div class="detail-section-title">Related Tracks (${linkedTracks.length})</div>
                    <ul class="detail-related-list">
                        ${linkedTracks.map(t => `
                            <li class="detail-related-item" onclick="GraphDetailPanel.navigateTo('${t.entity_id}')">
                                <span class="detail-related-icon">🎯</span>
                                <span class="detail-related-name">${this.formatName(t.entity_name || t.entity_id)}</span>
                                <span class="detail-related-badge">${t.status || 'active'}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            ${data.parent_id ? `
                <div class="detail-section">
                    <div class="detail-section-title">Parent</div>
                    <div class="detail-related-item" onclick="GraphDetailPanel.navigateTo('${data.parent_id}')">
                        <span class="detail-related-icon">${this.getEntityIcon(data.parent_id)}</span>
                        <span class="detail-related-name">${data.parent_id}</span>
                    </div>
                </div>
            ` : ''}
        `;
    },

    renderTrack(node) {
        const data = node.data;
        const progress = data.progress || 0;
        const projects = this.getRelatedProjects(node.id);

        return `
            ${this.renderStatus(data.status)}

            ${data.hypothesis ? `
                <div class="detail-section">
                    <div class="detail-section-title">Hypothesis</div>
                    <div class="detail-section-content">${data.hypothesis}</div>
                </div>
            ` : ''}

            <div class="detail-section">
                <div class="detail-section-title">Progress</div>
                <div class="detail-progress">
                    <div class="detail-progress-bar">
                        <div class="detail-progress-fill" style="width: ${progress * 100}%"></div>
                    </div>
                    <div class="detail-progress-text">${Math.round(progress * 100)}% complete</div>
                </div>
            </div>

            ${data.focus ? `
                <div class="detail-section">
                    <div class="detail-section-title">Focus Areas</div>
                    <div class="detail-section-content">
                        ${Array.isArray(data.focus) ? data.focus.map(f => `<div>• ${f}</div>`).join('') : data.focus}
                    </div>
                </div>
            ` : ''}

            ${projects.length > 0 ? `
                <div class="detail-section">
                    <div class="detail-section-title">Projects (${projects.length})</div>
                    <ul class="detail-related-list">
                        ${projects.map(p => `
                            <li class="detail-related-item" onclick="GraphDetailPanel.navigateTo('${p.entity_id}')">
                                <span class="detail-related-icon">📁</span>
                                <span class="detail-related-name">${this.formatName(p.entity_name || p.entity_id)}</span>
                                <span class="detail-related-badge">${p.status || 'active'}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
    },

    renderCondition(node) {
        const data = node.data;
        const metrics = data.metrics || [];

        return `
            ${this.renderStatus(data.status)}

            ${data.unlock ? `
                <div class="detail-section">
                    <div class="detail-section-title">Unlock</div>
                    <div class="detail-section-content">${data.unlock}</div>
                </div>
            ` : ''}

            ${data.if_broken ? `
                <div class="detail-section">
                    <div class="detail-section-title">If Broken</div>
                    <div class="detail-section-content" style="color: #f85149;">${data.if_broken}</div>
                </div>
            ` : ''}

            ${metrics.length > 0 ? `
                <div class="detail-section">
                    <div class="detail-section-title">Metrics</div>
                    <div class="detail-metrics">
                        ${metrics.map(m => `
                            <div class="detail-metric">
                                <div class="detail-metric-label">${m.name}</div>
                                <div class="detail-metric-value ${m.status === 'at_risk' ? 'at-risk' : m.status === 'on_track' ? 'on-track' : ''}">
                                    ${m.current} / ${m.threshold}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${data.risk_level ? `
                <div class="detail-section">
                    <div class="detail-section-title">Risk Level</div>
                    <div class="detail-status ${data.risk_level === 'high' ? 'at_risk' : data.risk_level === 'low' ? 'active' : 'in_progress'}">
                        ${data.risk_level.toUpperCase()}
                    </div>
                </div>
            ` : ''}

            ${this.renderRelatedTasks(node.id, 'conditions_3y')}
        `;
    },

    renderProject(node) {
        const data = node.data;
        const tasks = this.getRelatedTasks(node.id);
        const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'completed').length;
        const progress = tasks.length > 0 ? completedTasks / tasks.length : 0;

        return `
            ${this.renderStatus(data.status)}

            <div class="detail-section">
                <div class="detail-section-title">Progress</div>
                <div class="detail-progress">
                    <div class="detail-progress-bar">
                        <div class="detail-progress-fill" style="width: ${progress * 100}%"></div>
                    </div>
                    <div class="detail-progress-text">${completedTasks} / ${tasks.length} tasks completed</div>
                </div>
            </div>

            ${data.owner ? `
                <div class="detail-section">
                    <div class="detail-section-title">Owner</div>
                    <div class="detail-section-content">${data.owner}</div>
                </div>
            ` : ''}

            ${data.parent_id ? `
                <div class="detail-section">
                    <div class="detail-section-title">Parent Track</div>
                    <div class="detail-related-item" onclick="GraphDetailPanel.navigateTo('${data.parent_id}')">
                        <span class="detail-related-icon">🎯</span>
                        <span class="detail-related-name">${data.parent_id}</span>
                    </div>
                </div>
            ` : ''}

            ${data.validates ? `
                <div class="detail-section">
                    <div class="detail-section-title">Validates</div>
                    <ul class="detail-related-list">
                        ${(Array.isArray(data.validates) ? data.validates : [data.validates]).map(h => `
                            <li class="detail-related-item" onclick="GraphDetailPanel.navigateTo('${h}')">
                                <span class="detail-related-icon">💡</span>
                                <span class="detail-related-name">${h}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            ${tasks.length > 0 ? `
                <div class="detail-section">
                    <div class="detail-section-title">Tasks (${tasks.length})</div>
                    <ul class="detail-related-list">
                        ${tasks.slice(0, 10).map(t => `
                            <li class="detail-related-item" onclick="GraphDetailPanel.navigateTo('${t.entity_id}')">
                                <span class="detail-related-icon">${this.getStatusIcon(t.status)}</span>
                                <span class="detail-related-name">${this.formatName(t.entity_name || t.entity_id)}</span>
                                <span class="detail-related-badge">${t.status || 'todo'}</span>
                            </li>
                        `).join('')}
                        ${tasks.length > 10 ? `<li class="detail-related-item" style="opacity: 0.6;">... and ${tasks.length - 10} more</li>` : ''}
                    </ul>
                </div>
            ` : ''}
        `;
    },

    renderHypothesis(node) {
        const data = node.data;
        const validatingTasks = this.getValidatingTasks(node.id);
        const validatingProjects = this.getValidatingProjects(node.id);

        return `
            ${this.renderStatus(data.status)}

            ${data.statement ? `
                <div class="detail-section">
                    <div class="detail-section-title">Statement</div>
                    <div class="detail-section-content">${data.statement}</div>
                </div>
            ` : ''}

            ${data.evidence ? `
                <div class="detail-section">
                    <div class="detail-section-title">Evidence</div>
                    <div class="detail-section-content">${data.evidence}</div>
                </div>
            ` : ''}

            ${data.if_false ? `
                <div class="detail-section">
                    <div class="detail-section-title">If False</div>
                    <div class="detail-section-content" style="color: #f85149;">${data.if_false}</div>
                </div>
            ` : ''}

            ${validatingProjects.length > 0 ? `
                <div class="detail-section">
                    <div class="detail-section-title">Validating Projects (${validatingProjects.length})</div>
                    <ul class="detail-related-list">
                        ${validatingProjects.map(p => `
                            <li class="detail-related-item" onclick="GraphDetailPanel.navigateTo('${p.entity_id}')">
                                <span class="detail-related-icon">📁</span>
                                <span class="detail-related-name">${this.formatName(p.entity_name || p.entity_id)}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            ${validatingTasks.length > 0 ? `
                <div class="detail-section">
                    <div class="detail-section-title">Validating Tasks (${validatingTasks.length})</div>
                    <ul class="detail-related-list">
                        ${validatingTasks.slice(0, 5).map(t => `
                            <li class="detail-related-item" onclick="GraphDetailPanel.navigateTo('${t.entity_id}')">
                                <span class="detail-related-icon">${this.getStatusIcon(t.status)}</span>
                                <span class="detail-related-name">${this.formatName(t.entity_name || t.entity_id)}</span>
                            </li>
                        `).join('')}
                        ${validatingTasks.length > 5 ? `<li class="detail-related-item" style="opacity: 0.6;">... and ${validatingTasks.length - 5} more</li>` : ''}
                    </ul>
                </div>
            ` : ''}
        `;
    },

    renderTask(node) {
        const data = node.data;

        return `
            ${this.renderStatus(data.status)}

            ${data.priority ? `
                <div class="detail-section">
                    <div class="detail-section-title">Priority</div>
                    <div class="detail-status ${data.priority === 'high' ? 'at_risk' : data.priority === 'low' ? 'active' : 'in_progress'}">
                        ${data.priority.toUpperCase()}
                    </div>
                </div>
            ` : ''}

            ${data.assignee ? `
                <div class="detail-section">
                    <div class="detail-section-title">Assignee</div>
                    <div class="detail-section-content">${data.assignee}</div>
                </div>
            ` : ''}

            ${data.project_id ? `
                <div class="detail-section">
                    <div class="detail-section-title">Project</div>
                    <div class="detail-related-item" onclick="GraphDetailPanel.navigateTo('${data.project_id}')">
                        <span class="detail-related-icon">📁</span>
                        <span class="detail-related-name">${data.project_id}</span>
                    </div>
                </div>
            ` : ''}

            ${data.validates ? `
                <div class="detail-section">
                    <div class="detail-section-title">Validates</div>
                    <ul class="detail-related-list">
                        ${(Array.isArray(data.validates) ? data.validates : [data.validates]).map(h => `
                            <li class="detail-related-item" onclick="GraphDetailPanel.navigateTo('${h}')">
                                <span class="detail-related-icon">💡</span>
                                <span class="detail-related-name">${h}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            ${data.conditions_3y ? `
                <div class="detail-section">
                    <div class="detail-section-title">Contributes to Conditions</div>
                    <ul class="detail-related-list">
                        ${(Array.isArray(data.conditions_3y) ? data.conditions_3y : [data.conditions_3y]).map(c => `
                            <li class="detail-related-item" onclick="GraphDetailPanel.navigateTo('${c}')">
                                <span class="detail-related-icon">⚠️</span>
                                <span class="detail-related-name">${c}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            ${data.notes ? `
                <div class="detail-section">
                    <div class="detail-section-title">Notes</div>
                    <div class="detail-section-content">${data.notes}</div>
                </div>
            ` : ''}

            ${data.due_date ? `
                <div class="detail-section">
                    <div class="detail-section-title">Due Date</div>
                    <div class="detail-section-content">${data.due_date}</div>
                </div>
            ` : ''}
        `;
    },

    renderGeneric(node) {
        const data = node.data;
        return `
            ${this.renderStatus(data.status)}
            <div class="detail-section">
                <div class="detail-section-title">ID</div>
                <div class="detail-section-content">${node.id}</div>
            </div>
            <div class="detail-section">
                <div class="detail-section-title">Raw Data</div>
                <div class="detail-section-content">
                    <pre style="font-size: 11px; overflow-x: auto;">${JSON.stringify(data, null, 2)}</pre>
                </div>
            </div>
        `;
    },

    // ============================================
    // Helper renders
    // ============================================
    renderStatus(status) {
        if (!status) return '';
        return `
            <div class="detail-section">
                <div class="detail-section-title">Status</div>
                <div class="detail-status ${status.replace(/\s+/g, '_')}">${status}</div>
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
            <div class="detail-section">
                <div class="detail-section-title">Related Tasks (${tasks.length})</div>
                <ul class="detail-related-list">
                    ${tasks.slice(0, 5).map(t => `
                        <li class="detail-related-item" onclick="GraphDetailPanel.navigateTo('${t.entity_id}')">
                            <span class="detail-related-icon">${this.getStatusIcon(t.status)}</span>
                            <span class="detail-related-name">${this.formatName(t.entity_name || t.entity_id)}</span>
                            <span class="detail-related-badge">${t.status || 'todo'}</span>
                        </li>
                    `).join('')}
                    ${tasks.length > 5 ? `<li class="detail-related-item" style="opacity: 0.6;">... and ${tasks.length - 5} more</li>` : ''}
                </ul>
            </div>
        `;
    },

    // ============================================
    // Data helpers
    // ============================================
    getRelatedProjects(trackId) {
        return (State.projects || []).filter(p =>
            p.parent_id === trackId || p.track_id === trackId
        );
    },

    getRelatedTasks(projectId) {
        return (State.tasks || []).filter(t => t.project_id === projectId);
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

    getLinkedMetaHypotheses(northStarId) {
        return (State.metahypotheses || []).filter(mh =>
            mh.parent_id === northStarId
        );
    },

    getLinkedConditions(mhId) {
        // Check if condition's parent_id is this MH
        // Or if MH.enables includes the condition
        const mh = (State.metahypotheses || []).find(m => m.entity_id === mhId);
        const enabledConditions = mh?.enables || [];

        return (State.conditions || []).filter(c => {
            // Direct parent link
            if (c.parent_id === mhId) return true;
            // Enabled by MH
            const condNames = [c.entity_id, c.entity_name].filter(Boolean);
            return enabledConditions.some(e => condNames.includes(e) || condNames.some(n => n.includes(e)));
        });
    },

    getLinkedTracks(entityId) {
        return (State.tracks || []).filter(t => {
            // Track's parent_id matches or has outgoing relation
            if (t.parent_id === entityId) return true;
            if (t.outgoing_relations) {
                return t.outgoing_relations.some(r => r.target_id === entityId);
            }
            return false;
        });
    },

    getEntityIcon(entityId) {
        if (!entityId) return '📄';
        const id = entityId.toLowerCase();
        if (id.startsWith('ns:')) return '⭐';
        if (id.startsWith('mh:')) return '🧬';
        if (id.startsWith('cond:')) return '🔑';
        if (id.startsWith('pl:')) return '📦';
        if (id.startsWith('ps:')) return '🤝';
        if (id.startsWith('trk:')) return '🎯';
        if (id.startsWith('prj:')) return '📁';
        if (id.startsWith('hyp:')) return '💡';
        if (id.startsWith('tsk:')) return '✅';
        return '📄';
    },

    // ============================================
    // Formatting helpers
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
    },

    // ============================================
    // Navigation
    // ============================================
    navigateTo(entityId) {
        // Find the node in Graph
        const node = Graph.nodes.find(n => n.id === entityId);
        if (node) {
            Graph.selectNode(node);
        }
    }
};
