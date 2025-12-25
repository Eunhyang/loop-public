/**
 * App Module
 * 메인 엔트리, 초기화 및 전역 함수
 */

// ============================================
// Toast Notifications
// ============================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ============================================
// Initialization
// ============================================
async function init() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <div>Loading...</div>
        </div>
    `;

    try {
        // Load all data
        await State.loadAll();

        // Initialize and Render Sidebar
        Sidebar.init();
        Sidebar.render();

        // Render UI
        Tabs.render();
        Kanban.renderProjectFilter();
        Kanban.render();

        // Populate form selects
        TaskModal.populateSelects();
        ProjectModal.populateSelects();

        // Initialize Panels
        TaskPanel.init();
        ProjectPanel.init();
        ProgramPanel.init();
        EntityDetailPanel.init();
        FilterPanel.init();

        // Initialize Graph
        Graph.init();

        // Setup event listeners
        setupEventListeners();

    } catch (err) {
        console.error('Init error:', err);
        boardEl.innerHTML = `
            <div class="loading">
                <div style="color: #ef4444;">Failed to load data. Please refresh.</div>
            </div>
        `;
    }
}

// ============================================
// View Toggle
// ============================================
let currentView = 'kanban';

function switchView(view) {
    currentView = view;

    // Update toggle buttons
    document.getElementById('viewKanban').classList.toggle('active', view === 'kanban');
    document.getElementById('viewCalendar').classList.toggle('active', view === 'calendar');
    document.getElementById('viewGraph').classList.toggle('active', view === 'graph');

    // Hide all views
    document.getElementById('kanbanView').classList.remove('active');
    document.getElementById('calendarView').classList.remove('active');
    document.getElementById('graphView').classList.remove('active');

    // Show/hide shared filters (Kanban + Calendar use tabs, Graph doesn't)
    const sharedFilters = document.getElementById('sharedFilters');
    if (view === 'graph') {
        sharedFilters.style.display = 'none';
    } else {
        sharedFilters.style.display = 'block';
    }

    // Show selected view
    if (view === 'kanban') {
        document.getElementById('kanbanView').classList.add('active');
    } else if (view === 'calendar') {
        document.getElementById('calendarView').classList.add('active');
        // Lazy initialization of Calendar
        Calendar.init();
    } else if (view === 'graph') {
        document.getElementById('graphView').classList.add('active');
        Graph.show();
    }
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
    // View toggle buttons
    document.getElementById('viewKanban').addEventListener('click', () => switchView('kanban'));
    document.getElementById('viewCalendar').addEventListener('click', () => switchView('calendar'));
    document.getElementById('viewGraph').addEventListener('click', () => switchView('graph'));

    // Header buttons
    document.getElementById('btnNewTask').addEventListener('click', () => TaskPanel.openNew());
    document.getElementById('btnNewProject').addEventListener('click', () => ProjectModal.open());
    document.getElementById('btnReloadCache').addEventListener('click', async () => {
        const btn = document.getElementById('btnReloadCache');
        const icon = btn.querySelector('.reload-icon');
        const originalText = icon.textContent;

        try {
            // Show loading state
            icon.textContent = '⏳';
            btn.disabled = true;
            btn.style.opacity = '0.6';

            // Reload cache
            const result = await API.reloadCache();

            // Show success briefly
            icon.textContent = '✅';

            // Reload all data
            await State.loadAll();
            Sidebar.render();
            Tabs.render();
            Kanban.renderProjectFilter();
            Kanban.render();

            // Show stats in console
            console.log('Cache reloaded:', result.stats);

            // Reset icon after delay
            setTimeout(() => {
                icon.textContent = originalText;
            }, 1500);
        } catch (err) {
            console.error('Cache reload failed:', err);
            icon.textContent = '❌';
            setTimeout(() => {
                icon.textContent = originalText;
            }, 2000);
        } finally {
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    });

    // Task Modal
    document.getElementById('taskModalClose').addEventListener('click', () => TaskModal.close());
    document.getElementById('taskModalCancel').addEventListener('click', () => TaskModal.close());
    document.getElementById('taskModalSave').addEventListener('click', () => TaskModal.save());

    // Project Modal
    document.getElementById('projectModalClose').addEventListener('click', () => ProjectModal.close());
    document.getElementById('projectModalCancel').addEventListener('click', () => ProjectModal.close());
    document.getElementById('projectModalSave').addEventListener('click', () => ProjectModal.save());

    // Delete Modal
    document.getElementById('deleteModalClose').addEventListener('click', () => closeDeleteModal());
    document.getElementById('deleteModalCancel').addEventListener('click', () => closeDeleteModal());
    document.getElementById('deleteModalConfirm').addEventListener('click', () => confirmDelete());

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape: Close modals/panels
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
            TaskPanel.close();
            ProjectPanel.close();
            return;
        }

        // Skip shortcuts when typing in input/textarea or modal is open
        const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
        const modalOpen = document.querySelector('.modal-overlay.active');
        const panelOpen = document.querySelector('.side-panel.active');
        if (isTyping || modalOpen || panelOpen) return;

        // View switching: 1=Kanban, 2=Calendar, 3=Graph
        if (e.key === '1') { switchView('kanban'); return; }
        if (e.key === '2') { switchView('calendar'); return; }
        if (e.key === '3') { switchView('graph'); return; }

        // Filter shortcuts: F=Toggle, R=Reset
        if (e.key === 'f' || e.key === 'F') {
            FilterPanel.toggle();
            return;
        }
        if (e.key === 'r' || e.key === 'R') {
            FilterPanel.reset();
            showToast('Filters reset', 'info');
            return;
        }

        // Help modal: ?
        if (e.key === '?') {
            openHelpModal();
            return;
        }

        // Member filter shortcuts: Shift+E/M/A
        if (e.shiftKey) {
            if (e.key === 'E') {
                setMemberFilter('김은향');
                return;
            }
            if (e.key === 'M') {
                setMemberFilter('한명학');
                return;
            }
            if (e.key === 'A') {
                setMemberFilter('all');
                return;
            }
        }
    });

    // Help Modal event listeners
    document.getElementById('helpModalClose')?.addEventListener('click', closeHelpModal);
    document.getElementById('helpModalClose2')?.addEventListener('click', closeHelpModal);
}

// ============================================
// Help Modal
// ============================================
function openHelpModal() {
    document.getElementById('helpModal').classList.add('active');
}

function closeHelpModal() {
    document.getElementById('helpModal').classList.remove('active');
}

// ============================================
// Member Filter
// ============================================
function setMemberFilter(memberId) {
    State.currentAssignee = memberId;

    // Re-render UI
    Tabs.render();
    Kanban.renderProjectFilter();
    Kanban.render();
    Calendar.refresh();

    // Show toast
    const label = memberId === 'all' ? 'All Members' : memberId;
    showToast(`Filter: ${label}`, 'info');
}

// ============================================
// Delete Modal
// ============================================
function openDeleteModal(type, id, name) {
    document.getElementById('deleteType').value = type;
    document.getElementById('deleteId').value = id;
    document.getElementById('deleteMessage').textContent =
        `Are you sure you want to delete "${name}"?`;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
}

async function confirmDelete() {
    const type = document.getElementById('deleteType').value;
    const id = document.getElementById('deleteId').value;

    try {
        let result;
        if (type === 'task') {
            result = await API.deleteTask(id);
        } else if (type === 'project') {
            result = await API.deleteProject(id);
        }

        if (result.success) {
            showToast(`${type === 'task' ? 'Task' : 'Project'} deleted successfully`, 'success');
            if (type === 'task') {
                await State.reloadTasks();
                Kanban.render();
                Calendar.refresh();
            } else {
                await State.reloadProjects();
                Tabs.render();
                Kanban.render();
                Calendar.refresh();
            }
        } else {
            showToast(result.message || result.detail || 'Delete failed', 'error');
        }
    } catch (err) {
        console.error('Delete error:', err);
        showToast('Error deleting item', 'error');
    }

    closeDeleteModal();
}

// ============================================
// Start App
// ============================================
// App 객체로 노출 (auth.js에서 호출)
window.App = {
    init: init,
    initialized: false
};

// DOMContentLoaded에서 직접 init 호출하지 않음
// Auth.checkAuth()가 성공하면 App.init() 호출됨
