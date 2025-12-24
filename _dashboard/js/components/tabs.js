/**
 * Tabs Component
 * Assignee 탭 렌더링 (Kanban by Assignee)
 */
const Tabs = {
    render() {
        const tabsEl = document.getElementById('tabs');
        const counts = State.getTaskCountByAssignee();

        // Build assignee tabs: All + members + unassigned
        let html = `
            <div class="tab ${State.currentAssignee === 'all' ? 'active' : ''}"
                 data-assignee="all" role="tab" aria-selected="${State.currentAssignee === 'all'}">
                All
                <span class="tab-count">${counts.all || 0}</span>
            </div>
        `;

        // Add tab for each active member (respects showInactiveMembers filter)
        State.getActiveMembers().forEach(member => {
            const count = counts[member.id] || 0;
            const isActive = State.currentAssignee === member.id;
            html += `
                <div class="tab ${isActive ? 'active' : ''}"
                     data-assignee="${member.id}" role="tab" aria-selected="${isActive}">
                    ${member.name}
                    <span class="tab-count">${count}</span>
                </div>
            `;
        });

        // Add unassigned tab if there are unassigned tasks
        if (counts['unassigned'] > 0) {
            const isActive = State.currentAssignee === 'unassigned';
            html += `
                <div class="tab ${isActive ? 'active' : ''}"
                     data-assignee="unassigned" role="tab" aria-selected="${isActive}">
                    미정
                    <span class="tab-count">${counts['unassigned']}</span>
                </div>
            `;
        }

        tabsEl.innerHTML = html;
        tabsEl.setAttribute('role', 'tablist');

        // Add click handlers
        tabsEl.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const assigneeId = tab.dataset.assignee;
                this.select(assigneeId);
            });
        });
    },

    select(assigneeId) {
        State.currentAssignee = assigneeId;
        State.currentProject = 'all';  // 담당자 변경 시 프로젝트 필터 초기화
        this.render();
        Kanban.renderProjectFilter();
        Kanban.render();
        Calendar.refresh();  // Codex 피드백: 필터 변경 시 Calendar도 갱신
    }
};
