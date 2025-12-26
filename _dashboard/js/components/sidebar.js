/**
 * Sidebar Component
 * 사이드바 네비게이션 (Tracks, Hypotheses, Conditions)
 */
const Sidebar = {
    collapsed: true,
    sectionsCollapsed: {
        tracks: false,
        hypotheses: false,
        conditions: false
    },

    // ============================================
    // Initialization
    // ============================================
    init() {
        this.setupEventListeners();
        // Apply initial collapsed state to DOM
        const sidebar = document.getElementById('sidebar');
        if (sidebar && this.collapsed) {
            sidebar.classList.add('collapsed');
        }
    },

    setupEventListeners() {
        // Toggle sidebar collapse
        const toggleBtn = document.getElementById('sidebarToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleSidebar());
        }

        // Section headers toggle
        document.querySelectorAll('.sidebar-section-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const section = header.dataset.section;
                this.toggleSection(section);
            });
        });
    },

    toggleSidebar() {
        this.collapsed = !this.collapsed;
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed', this.collapsed);
        }
    },

    toggleSection(section) {
        this.sectionsCollapsed[section] = !this.sectionsCollapsed[section];
        const sectionEl = document.querySelector(`.sidebar-section-header[data-section="${section}"]`);
        if (sectionEl) {
            sectionEl.parentElement.classList.toggle('collapsed', this.sectionsCollapsed[section]);
        }
    },

    // ============================================
    // Render
    // ============================================
    render() {
        this.renderTracks();
        this.renderHypotheses();
        this.renderConditions();
    },

    renderTracks() {
        const container = document.getElementById('sidebarTracks');
        if (!container) return;

        const tracks = State.tracks || [];

        // "All" option
        let html = `
            <li class="sidebar-item all-items ${State.currentTrack === 'all' ? 'active' : ''}"
                data-track-id="all">
                <span class="sidebar-item-text">All Projects</span>
            </li>
        `;

        tracks.forEach(track => {
            const isActive = State.currentTrack === track.entity_id;
            const progress = track.progress || 0;
            const statusClass = this.getStatusClass(track.status);
            const displayName = this.formatTrackName(track.entity_name || track.entity_id);

            html += `
                <li class="sidebar-item ${isActive ? 'active' : ''}"
                    data-track-id="${track.entity_id}"
                    title="${track.hypothesis || track.entity_name || ''}">
                    <span class="sidebar-item-icon">${this.getTrackIcon(track.entity_id)}</span>
                    <span class="sidebar-item-text">${displayName}</span>
                    <div class="sidebar-item-progress">
                        <div class="sidebar-item-progress-bar" style="width: ${progress * 100}%"></div>
                    </div>
                </li>
            `;
        });

        if (tracks.length === 0) {
            html += '<li class="sidebar-empty">No tracks found</li>';
        }

        container.innerHTML = html;

        // Add click handlers
        container.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', () => {
                const trackId = item.dataset.trackId;
                this.selectTrack(trackId);
            });
        });
    },

    renderHypotheses() {
        const container = document.getElementById('sidebarHypotheses');
        if (!container) return;

        const hypotheses = State.hypotheses || [];

        if (hypotheses.length === 0) {
            container.innerHTML = '<li class="sidebar-empty">No hypotheses yet</li>';
            return;
        }

        let html = '';
        hypotheses.forEach(hyp => {
            const isActive = State.currentHypothesis === hyp.entity_id;
            const statusClass = this.getStatusClass(hyp.status);

            html += `
                <li class="sidebar-item ${isActive ? 'active' : ''}"
                    data-hypothesis-id="${hyp.entity_id}"
                    title="${hyp.entity_name || ''}">
                    <span class="sidebar-item-icon">💡</span>
                    <span class="sidebar-item-text">${hyp.entity_name || hyp.entity_id}</span>
                    <span class="sidebar-item-badge ${statusClass}">${hyp.status || 'draft'}</span>
                </li>
            `;
        });

        container.innerHTML = html;

        // Add click handlers
        container.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', () => {
                const hypId = item.dataset.hypothesisId;
                this.selectHypothesis(hypId);
            });
        });
    },

    renderConditions() {
        const container = document.getElementById('sidebarConditions');
        if (!container) return;

        const conditions = State.conditions || [];

        if (conditions.length === 0) {
            container.innerHTML = '<li class="sidebar-empty">No conditions yet</li>';
            return;
        }

        let html = '';
        conditions.forEach(cond => {
            const isActive = State.currentCondition === cond.entity_id;
            const statusClass = this.getConditionStatusClass(cond);
            const displayName = cond.entity_name?.replace('Condition_', 'Cond ') || cond.entity_id;

            html += `
                <li class="sidebar-item ${isActive ? 'active' : ''}"
                    data-condition-id="${cond.entity_id}"
                    title="${cond.unlock || cond.entity_name || ''}">
                    <span class="sidebar-item-icon">${this.getConditionIcon(cond)}</span>
                    <span class="sidebar-item-text">${displayName}</span>
                    <span class="sidebar-item-badge ${statusClass}">${cond.status || 'unknown'}</span>
                </li>
            `;
        });

        container.innerHTML = html;

        // Add click handlers
        container.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', () => {
                const condId = item.dataset.conditionId;
                this.selectCondition(condId);
            });
        });
    },

    // ============================================
    // Selection Handlers
    // ============================================
    selectTrack(trackId) {
        State.currentTrack = trackId;
        State.currentHypothesis = null;
        State.currentCondition = null;

        // Update header meta
        this.updateHeaderMeta();

        // Filter projects by track
        this.filterByTrack(trackId);

        // Open entity detail panel (except for 'all')
        if (trackId !== 'all' && typeof EntityDetailPanel !== 'undefined') {
            EntityDetailPanel.open('Track', trackId);
        }

        // Re-render sidebar to show active state
        this.render();
    },

    selectHypothesis(hypId) {
        State.currentHypothesis = hypId;
        State.currentTrack = 'all';
        State.currentCondition = null;

        // Update header and show hypothesis details
        this.updateHeaderMeta();

        // Filter by hypothesis
        this.filterByHypothesis(hypId);

        // Open entity detail panel
        if (typeof EntityDetailPanel !== 'undefined') {
            EntityDetailPanel.open('Hypothesis', hypId);
        }

        this.render();
    },

    selectCondition(condId) {
        State.currentCondition = condId;
        State.currentTrack = 'all';
        State.currentHypothesis = null;

        // Update header and show condition details
        this.updateHeaderMeta();

        // Filter by condition
        this.filterByCondition(condId);

        // Open entity detail panel
        if (typeof EntityDetailPanel !== 'undefined') {
            EntityDetailPanel.open('Condition', condId);
        }

        this.render();
    },

    // ============================================
    // Filtering
    // ============================================
    filterByTrack(trackId) {
        // Reset other filters
        State.filterProgram = null;
        State.filterHypothesis = null;
        State.filterCondition = null;

        if (trackId === 'all') {
            // Show all projects
            State.currentProject = 'all';
            State.filterTrack = null;
        } else {
            // Filter projects by parent_id = trackId
            const track = State.getTrackById(trackId);
            if (track) {
                // Find first project under this track
                const trackProjects = State.projects.filter(p =>
                    p.parent_id === trackId || p.track_id === trackId
                );
                if (trackProjects.length > 0) {
                    // Select first project or show all under track
                    State.currentProject = 'all';
                    // Store track filter for Kanban
                    State.filterTrack = trackId;
                } else {
                    State.currentProject = 'all';
                    State.filterTrack = trackId;
                }
            }
        }

        // Re-render tabs and kanban
        Tabs.render();
        Kanban.render();
        Calendar.refresh();  // Codex 피드백: 필터 변경 시 Calendar도 갱신
    },

    filterByHypothesis(hypId) {
        // Find tasks that validate this hypothesis
        State.filterHypothesis = hypId;
        State.currentProject = 'all';
        State.filterTrack = null;
        State.filterProgram = null;

        Tabs.render();
        Kanban.render();
        Calendar.refresh();  // Codex 피드백: 필터 변경 시 Calendar도 갱신
    },

    filterByCondition(condId) {
        // Find tasks with conditions_3y containing this condition
        State.filterCondition = condId;
        State.currentProject = 'all';
        State.filterTrack = null;
        State.filterProgram = null;

        Tabs.render();
        Kanban.render();
        Calendar.refresh();  // Codex 피드백: 필터 변경 시 Calendar도 갱신
    },

    filterByProgram(progId) {
        // Find tasks under projects belonging to this program
        State.filterProgram = progId;
        State.currentProject = 'all';
        State.filterTrack = null;
        State.filterHypothesis = null;
        State.filterCondition = null;

        Tabs.render();
        Kanban.render();
        Calendar.refresh();
    },

    // ============================================
    // Helpers
    // ============================================
    updateHeaderMeta() {
        const metaEl = document.getElementById('headerMeta');
        if (!metaEl) return;

        if (State.currentTrack && State.currentTrack !== 'all') {
            const track = State.getTrackById(State.currentTrack);
            if (track) {
                metaEl.textContent = `Track ${track.entity_id.replace('trk-', '')}: ${track.hypothesis || track.entity_name}`;
                return;
            }
        }

        if (State.currentHypothesis) {
            const hyp = State.hypotheses?.find(h => h.entity_id === State.currentHypothesis);
            if (hyp) {
                metaEl.textContent = `Hypothesis: ${hyp.entity_name}`;
                return;
            }
        }

        if (State.currentCondition) {
            const cond = State.conditions?.find(c => c.entity_id === State.currentCondition);
            if (cond) {
                metaEl.textContent = `Condition: ${cond.entity_name}`;
                return;
            }
        }

        metaEl.textContent = 'Task & Project Management';
    },

    formatTrackName(name) {
        if (!name) return '';
        return name
            .replace('Track_', 'T')
            .replace(/_/g, ' ');
    },

    getTrackIcon(trackId) {
        const icons = {
            'trk-1': '📱', // Product
            'trk-2': '📊', // Data
            'trk-3': '📝', // Content
            'trk-4': '🧑‍🏫', // Coaching
            'trk-5': '🤝', // Partnership
            'trk-6': '💰'  // Revenue
        };
        return icons[trackId] || '🎯';
    },

    getStatusClass(status) {
        const statusMap = {
            // New schema values
            'todo': 'planning',
            'doing': 'active',
            'done': 'active',
            'blocked': 'blocked',
            // Legacy values (backward compat)
            'active': 'active',
            'in_progress': 'active',
            'planning': 'planning',
            'at_risk': 'at_risk',
            'completed': 'active'
        };
        return statusMap[status] || 'planning';
    },

    getConditionStatusClass(cond) {
        // Check risk_level or metrics
        if (cond.risk_level === 'high') return 'at_risk';
        if (cond.status === 'met' || cond.status === 'done') return 'active';
        if (cond.status === 'blocked') return 'blocked';
        return 'planning';
    },

    getConditionIcon(cond) {
        if (cond.status === 'met') return '✅';
        if (cond.risk_level === 'high') return '⚠️';
        if (cond.status === 'blocked') return '🚫';
        return '🎯';
    }
};
