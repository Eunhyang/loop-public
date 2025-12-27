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

        // Initialize quick date filter (default: current week)
        State.initQuickDateFilter();

        // Initialize and Render Sidebar
        Sidebar.init();
        Sidebar.render();

        // Initialize Quick Date Toggle (sync with existing filter state)
        QuickDateToggle.init();

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
        PendingPanel.init();

        // Update pending review badge
        PendingPanel.updateBadge();

        // Initialize Graph
        Graph.init();

        // Setup event listeners
        setupEventListeners();

        // Display user info
        displayUserInfo();

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

    // Show/hide Quick Date Toggle (hide in calendar view - calendar has its own date navigation)
    const quickDateToggle = document.getElementById('quickDateToggle');
    if (quickDateToggle) {
        if (view === 'calendar') {
            quickDateToggle.classList.add('hidden');
        } else {
            quickDateToggle.classList.remove('hidden');
        }
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
// User Info Display
// ============================================
function displayUserInfo() {
    const userRoleEl = document.getElementById('userRole');
    const role = Auth.getRole();

    if (userRoleEl) {
        const roleLabels = {
            'admin': '👑 Admin',
            'exec': '🔐 Exec',
            'member': '👤 Member'
        };
        userRoleEl.textContent = roleLabels[role] || role;

        // exec/admin인 경우 특별 스타일
        if (role === 'exec' || role === 'admin') {
            userRoleEl.classList.add('role-privileged');
        }
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

    // Logout button
    document.getElementById('btnLogout')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            Auth.logout();
        }
    });

    // Header buttons
    document.getElementById('btnNewTask').addEventListener('click', () => TaskPanel.openNew());
    document.getElementById('btnNewProject').addEventListener('click', () => ProjectModal.open());
    document.getElementById('btnPendingReviews')?.addEventListener('click', () => PendingPanel.open());
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

        // View switching: 1=Kanban, 2=Calendar, 3=Graph (use e.code for IME compatibility)
        if (e.code === 'Digit1') { switchView('kanban'); return; }
        if (e.code === 'Digit2') { switchView('calendar'); return; }
        if (e.code === 'Digit3') { switchView('graph'); return; }

        // Filter shortcuts: F=Toggle, Shift+R=Reset (use e.code for IME compatibility)
        if (e.code === 'KeyF') {
            FilterPanel.toggle();
            return;
        }
        if (e.code === 'KeyR' && e.shiftKey) {
            FilterPanel.reset();
            showToast('Filters reset', 'info');
            return;
        }

        // Help modal: ? (Shift + /) - use e.code for IME compatibility
        if (e.code === 'Slash' && e.shiftKey) {
            openHelpModal();
            return;
        }

        // Member filter shortcuts: Shift+E/M/A
        // Use e.code instead of e.key to work regardless of IME (Korean input) state
        if (e.shiftKey) {
            if (e.code === 'KeyE') {
                setMemberFilter('김은향');
                return;
            }
            if (e.code === 'KeyM') {
                setMemberFilter('한명학');
                return;
            }
            if (e.code === 'KeyA') {
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
// Member Filter (키보드 단축키용 - 단일 선택)
// ============================================
function setMemberFilter(memberId) {
    if (memberId === 'all') {
        State.currentAssignees = [];
    } else {
        State.currentAssignees = [memberId];
    }

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
