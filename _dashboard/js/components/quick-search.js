/**
 * Quick Search Component (Cmd+K)
 * Notion-style command palette for searching tasks, projects, and commands
 */

const QuickSearch = {
    overlay: null,
    input: null,
    results: null,
    selectedIndex: -1,
    items: [],
    debounceTimer: null,

    // Available commands (> prefix)
    commands: [
        { id: 'new-task', icon: '➕', title: 'New Task', description: 'Create a new task', action: () => document.getElementById('btnNewTask').click() },
        { id: 'new-project', icon: '📁', title: 'New Project', description: 'Create a new project', action: () => document.getElementById('btnNewProject').click() },
        { id: 'view-kanban', icon: '📋', title: 'View Kanban', description: 'Switch to Kanban view', action: () => document.getElementById('viewKanban').click() },
        { id: 'view-calendar', icon: '📅', title: 'View Calendar', description: 'Switch to Calendar view', action: () => document.getElementById('viewCalendar').click() },
        { id: 'view-graph', icon: '🔗', title: 'View Graph', description: 'Switch to Graph view', action: () => document.getElementById('viewGraph').click() },
        { id: 'reload', icon: '🔄', title: 'Reload Cache', description: 'Refresh data from server', action: () => { API.post('/cache/reload').then(() => location.reload()); } },
    ],

    init() {
        this.overlay = document.getElementById('quickSearchOverlay');
        this.input = document.getElementById('quickSearchInput');
        this.results = document.getElementById('quickSearchResults');

        if (!this.overlay || !this.input || !this.results) {
            console.warn('QuickSearch: Required elements not found');
            return;
        }

        this.bindEvents();
        console.log('QuickSearch initialized (Cmd+K to open)');
    },

    bindEvents() {
        // Global keyboard shortcut (Cmd+K or Cmd+P)
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'p')) {
                e.preventDefault();
                this.open();
            }
            // ESC to close
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });

        // Click overlay to close
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });

        // Input events
        this.input.addEventListener('input', () => this.onInput());
        this.input.addEventListener('keydown', (e) => this.onKeydown(e));

        // Result click
        this.results.addEventListener('click', (e) => {
            const item = e.target.closest('.quick-search-item');
            if (item) {
                const index = parseInt(item.dataset.index, 10);
                this.selectItem(index);
            }
        });
    },

    isOpen() {
        return this.overlay.classList.contains('active');
    },

    open() {
        this.overlay.classList.add('active');
        this.input.value = '';
        this.input.focus();
        this.selectedIndex = -1;
        this.renderResults([]);
    },

    close() {
        this.overlay.classList.remove('active');
        this.input.value = '';
        this.selectedIndex = -1;
    },

    onInput() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.search(this.input.value);
        }, 150);
    },

    onKeydown(e) {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.moveSelection(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.moveSelection(-1);
                break;
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0) {
                    this.selectItem(this.selectedIndex);
                }
                break;
            case 'Escape':
                e.preventDefault();
                this.close();
                break;
        }
    },

    moveSelection(delta) {
        if (this.items.length === 0) return;

        this.selectedIndex += delta;
        if (this.selectedIndex < 0) this.selectedIndex = this.items.length - 1;
        if (this.selectedIndex >= this.items.length) this.selectedIndex = 0;

        this.updateSelection();
    },

    updateSelection() {
        const items = this.results.querySelectorAll('.quick-search-item');
        items.forEach((item, i) => {
            item.classList.toggle('selected', i === this.selectedIndex);
        });

        // Scroll into view
        const selected = items[this.selectedIndex];
        if (selected) {
            selected.scrollIntoView({ block: 'nearest' });
        }
    },

    selectItem(index) {
        const item = this.items[index];
        if (!item) return;

        this.close();

        // Execute action based on type
        switch (item.type) {
            case 'command':
                item.action();
                break;
            case 'task':
                TaskPanel.open(item.data.entity_id);
                break;
            case 'project':
                ProjectPanel.open(item.data.entity_id);
                break;
            case 'track':
            case 'condition':
            case 'hypothesis':
                // Select in sidebar
                if (typeof Sidebar !== 'undefined' && Sidebar.selectItem) {
                    Sidebar.selectItem(item.data.entity_id);
                }
                break;
        }
    },

    search(query) {
        query = query.trim().toLowerCase();
        this.items = [];

        // Command mode (> prefix)
        if (query.startsWith('>')) {
            const cmdQuery = query.slice(1).trim();
            this.items = this.commands
                .filter(cmd =>
                    cmd.title.toLowerCase().includes(cmdQuery) ||
                    cmd.description.toLowerCase().includes(cmdQuery)
                )
                .map(cmd => ({
                    type: 'command',
                    icon: cmd.icon,
                    title: cmd.title,
                    meta: cmd.description,
                    action: cmd.action
                }));
        } else if (query.length >= 1) {
            // Search Tasks (name, id, assignee, status, priority, project_id)
            const tasks = (State.tasks || [])
                .filter(t =>
                    t.entity_name?.toLowerCase().includes(query) ||
                    t.entity_id?.toLowerCase().includes(query) ||
                    t.assignee?.toLowerCase().includes(query) ||
                    t.status?.toLowerCase().includes(query) ||
                    t.priority?.toLowerCase().includes(query) ||
                    t.project_id?.toLowerCase().includes(query)
                )
                .slice(0, 5)
                .map(t => ({
                    type: 'task',
                    icon: '📋',
                    title: t.entity_name,
                    meta: `${t.entity_id} · ${t.assignee || 'unassigned'}`,
                    badge: t.status,
                    data: t
                }));

            // Search Projects (name, id, owner, status, priority, program_id)
            const projects = (State.projects || [])
                .filter(p =>
                    p.entity_name?.toLowerCase().includes(query) ||
                    p.entity_id?.toLowerCase().includes(query) ||
                    p.owner?.toLowerCase().includes(query) ||
                    p.status?.toLowerCase().includes(query) ||
                    p.priority?.toLowerCase().includes(query) ||
                    p.program_id?.toLowerCase().includes(query)
                )
                .slice(0, 5)
                .map(p => ({
                    type: 'project',
                    icon: '📁',
                    title: p.entity_name,
                    meta: `${p.entity_id} · ${p.owner || ''}`,
                    badge: p.status,
                    data: p
                }));

            // Search Programs (name, id, status, owner)
            const programs = (State.programs || [])
                .filter(p =>
                    p.entity_name?.toLowerCase().includes(query) ||
                    p.entity_id?.toLowerCase().includes(query) ||
                    p.status?.toLowerCase().includes(query) ||
                    p.owner?.toLowerCase().includes(query)
                )
                .slice(0, 3)
                .map(p => ({
                    type: 'program',
                    icon: '📦',
                    title: p.entity_name,
                    meta: p.entity_id,
                    badge: p.status,
                    data: p
                }));

            // Search Tracks (name, id)
            const tracks = (State.tracks || [])
                .filter(t =>
                    t.entity_name?.toLowerCase().includes(query) ||
                    t.entity_id?.toLowerCase().includes(query)
                )
                .slice(0, 3)
                .map(t => ({
                    type: 'track',
                    icon: '📊',
                    title: t.entity_name,
                    meta: t.entity_id,
                    data: t
                }));

            // Search Conditions (name, id, status)
            const conditions = (State.conditions || [])
                .filter(c =>
                    c.entity_name?.toLowerCase().includes(query) ||
                    c.entity_id?.toLowerCase().includes(query) ||
                    c.status?.toLowerCase().includes(query)
                )
                .slice(0, 3)
                .map(c => ({
                    type: 'condition',
                    icon: '⚠️',
                    title: c.entity_name,
                    meta: c.entity_id,
                    badge: c.status,
                    data: c
                }));

            // Search Hypotheses (name, id, status)
            const hypotheses = (State.hypotheses || [])
                .filter(h =>
                    h.entity_name?.toLowerCase().includes(query) ||
                    h.entity_id?.toLowerCase().includes(query) ||
                    h.status?.toLowerCase().includes(query)
                )
                .slice(0, 3)
                .map(h => ({
                    type: 'hypothesis',
                    icon: '💡',
                    title: h.entity_name,
                    meta: h.entity_id,
                    badge: h.status,
                    data: h
                }));

            this.items = [...tasks, ...projects, ...programs, ...tracks, ...conditions, ...hypotheses];
        }

        this.selectedIndex = this.items.length > 0 ? 0 : -1;
        this.renderResults(this.items);
    },

    renderResults(items) {
        if (items.length === 0) {
            const query = this.input.value.trim();
            if (query.length > 0) {
                this.results.innerHTML = '<div class="quick-search-no-results">No results found</div>';
            } else {
                this.results.innerHTML = '';
            }
            return;
        }

        // Group by type
        const grouped = {};
        items.forEach((item, index) => {
            item._index = index;
            if (!grouped[item.type]) {
                grouped[item.type] = [];
            }
            grouped[item.type].push(item);
        });

        const typeLabels = {
            command: 'Commands',
            task: 'Tasks',
            project: 'Projects',
            program: 'Programs',
            track: 'Tracks',
            condition: 'Conditions',
            hypothesis: 'Hypotheses'
        };

        let html = '';
        for (const [type, typeItems] of Object.entries(grouped)) {
            html += `<div class="quick-search-category">${typeLabels[type] || type}</div>`;
            for (const item of typeItems) {
                const selectedClass = item._index === this.selectedIndex ? 'selected' : '';
                html += `
                    <div class="quick-search-item ${selectedClass}" data-index="${item._index}">
                        <span class="quick-search-item-icon">${item.icon}</span>
                        <div class="quick-search-item-content">
                            <div class="quick-search-item-title">${this.escapeHtml(item.title)}</div>
                            ${item.meta ? `<div class="quick-search-item-meta">${this.escapeHtml(item.meta)}</div>` : ''}
                        </div>
                        ${item.badge ? `<span class="quick-search-item-badge">${item.badge}</span>` : ''}
                    </div>
                `;
            }
        }

        this.results.innerHTML = html;
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => QuickSearch.init());
} else {
    QuickSearch.init();
}
