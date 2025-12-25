/**
 * Kanban Component
 * 칸반 보드 렌더링 (2단계 탭: Assignee → Project)
 */
const Kanban = {
    /**
     * Project 탭 렌더링 (하위 탭 - Program 먼저, 그 다음 Project)
     */
    renderProjectFilter() {
        const filterEl = document.getElementById('assigneeFilter');
        if (!filterEl) return;

        // 현재 담당자의 Task가 있는 프로젝트 목록
        const projectsWithTasks = State.getProjectsForAssignee();

        // Program 목록 (Task가 있는 Program만)
        const programsWithTasks = this.getProgramsWithTasks();

        // 전체 Task 수 계산
        let totalTasks = 0;
        projectsWithTasks.forEach(p => totalTasks += p.taskCount);

        // All Projects 버튼
        const isAllActive = State.currentProject === 'all' && !State.filterProgram;
        let html = `
            <button class="filter-btn ${isAllActive ? 'active' : ''}" data-project="all" data-type="all">
                All
                <span class="filter-count">${totalTasks}</span>
            </button>
        `;

        // Program 버튼들 (먼저 표시, 다른 스타일)
        programsWithTasks.forEach(prog => {
            const isActive = State.filterProgram === prog.entity_id;
            html += `
                <button class="filter-btn filter-btn-program ${isActive ? 'active' : ''}"
                        data-program="${prog.entity_id}" data-type="program">
                    ${prog.entity_name || prog.entity_id}
                    <span class="filter-count">${prog.taskCount}</span>
                    <span class="btn-program-info" data-program-info="${prog.entity_id}"
                          title="프로그램 상세" tabindex="0" role="button"
                          aria-label="프로그램 상세 열기">ℹ️</span>
                </button>
            `;
        });

        // Program이 선택된 경우, 하위 프로젝트 버튼 표시
        if (State.filterProgram) {
            const childProjects = projectsWithTasks.filter(p => p.program_id === State.filterProgram);
            if (childProjects.length > 0) {
                html += `<span class="filter-separator">│</span>`;

                // "All in Program" 버튼
                const isAllInProgram = State.currentProject === 'all';
                html += `
                    <button class="filter-btn filter-btn-child ${isAllInProgram ? 'active' : ''}"
                            data-project="all" data-type="child-all">
                        All
                        <span class="filter-count">${childProjects.reduce((sum, p) => sum + p.taskCount, 0)}</span>
                    </button>
                `;

                // 하위 프로젝트 버튼들
                childProjects.forEach(p => {
                    const isActive = State.currentProject === p.entity_id;
                    const projectColor = Calendar.getColorByProject(p.entity_id);
                    html += `
                        <button class="filter-btn filter-btn-child ${isActive ? 'active' : ''}"
                                data-project="${p.entity_id}" data-type="child-project"
                                style="background-color: ${projectColor}; color: #333;">
                            ${p.entity_name || p.entity_id}
                            <span class="filter-count">${p.taskCount}</span>
                            <span class="btn-project-info" data-project-info="${p.entity_id}"
                                  title="프로젝트 상세" tabindex="0" role="button"
                                  aria-label="프로젝트 상세 열기">ℹ️</span>
                        </button>
                    `;
                });
            }
        }

        // Project 버튼들 (Program에 속하지 않은 프로젝트, Program 미선택 시에만)
        projectsWithTasks
            .filter(p => !p.program_id)  // Program에 속하지 않은 프로젝트만
            .forEach(p => {
                const isActive = State.currentProject === p.entity_id && !State.filterProgram;
                const projectColor = Calendar.getColorByProject(p.entity_id);
                html += `
                    <button class="filter-btn ${isActive ? 'active' : ''}"
                            data-project="${p.entity_id}" data-type="project"
                            style="background-color: ${projectColor}; color: #333;">
                        ${p.entity_name || p.entity_id}
                        <span class="filter-count">${p.taskCount}</span>
                        <span class="btn-project-info" data-project-info="${p.entity_id}"
                              title="프로젝트 상세" tabindex="0" role="button"
                              aria-label="프로젝트 상세 열기">ℹ️</span>
                    </button>
                `;
            });

        filterEl.innerHTML = html;

        // 이벤트 리스너
        filterEl.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // info 버튼 클릭 시 필터 변경 방지
                if (e.target.closest('.btn-project-info') || e.target.closest('.btn-program-info')) {
                    return;
                }

                const type = btn.dataset.type;

                if (type === 'all') {
                    State.currentProject = 'all';
                    State.filterProgram = null;
                } else if (type === 'program') {
                    // 같은 Program 클릭 시 토글 (선택 해제)
                    if (State.filterProgram === btn.dataset.program) {
                        State.filterProgram = null;
                        State.currentProject = 'all';
                    } else {
                        State.filterProgram = btn.dataset.program;
                        State.currentProject = 'all';
                    }
                } else if (type === 'child-all') {
                    // Program 내 모든 프로젝트
                    State.currentProject = 'all';
                } else if (type === 'child-project') {
                    // Program 내 특정 프로젝트
                    State.currentProject = btn.dataset.project;
                } else {
                    // 독립 프로젝트
                    State.currentProject = btn.dataset.project;
                    State.filterProgram = null;
                }

                this.renderProjectFilter();
                this.render();
                Calendar.refresh();
            });
        });

        // 프로젝트 상세 버튼 이벤트 리스너
        filterEl.querySelectorAll('.btn-project-info').forEach(btn => {
            const handler = (e) => {
                e.stopPropagation();
                e.preventDefault();
                const projectId = btn.dataset.projectInfo;
                if (projectId && typeof ProjectPanel !== 'undefined') {
                    ProjectPanel.open(projectId);
                }
            };
            btn.addEventListener('click', handler);
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handler(e);
                }
            });
        });

        // 프로그램 상세 버튼 이벤트 리스너
        filterEl.querySelectorAll('.btn-program-info').forEach(btn => {
            const handler = (e) => {
                e.stopPropagation();
                e.preventDefault();
                const programId = btn.dataset.programInfo;
                if (programId) {
                    this.openProgramDetail(programId);
                }
            };
            btn.addEventListener('click', handler);
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handler(e);
                }
            });
        });
    },

    /**
     * Program 상세 패널 열기
     */
    openProgramDetail(programId) {
        if (typeof ProgramPanel !== 'undefined' && ProgramPanel.open) {
            ProgramPanel.open(programId);
        } else {
            showToast('Program panel not available', 'error');
        }
    },

    /**
     * Task가 있는 Program 목록 반환
     */
    getProgramsWithTasks() {
        const programs = State.programs || [];
        const tasks = State.getStrategyFilteredTasks();

        // Assignee 필터 적용
        let filteredTasks = tasks;
        if (State.currentAssignee !== 'all') {
            if (State.currentAssignee === 'unassigned') {
                filteredTasks = filteredTasks.filter(t => !t.assignee);
            } else {
                filteredTasks = filteredTasks.filter(t => t.assignee === State.currentAssignee);
            }
        }

        // Program별 Task 수 계산
        const result = [];
        programs.forEach(prog => {
            // 이 Program에 속한 프로젝트들
            const programProjects = State.projects.filter(p => p.program_id === prog.entity_id);
            const projectIds = programProjects.map(p => p.entity_id);

            // 해당 프로젝트의 Task 수
            const taskCount = filteredTasks.filter(t => projectIds.includes(t.project_id)).length;

            if (taskCount > 0) {
                result.push({
                    ...prog,
                    taskCount
                });
            }
        });

        return result;
    },

    render() {
        const boardEl = document.getElementById('board');
        const statuses = State.getTaskStatuses();
        const statusLabels = State.getTaskStatusLabels();
        const grouped = State.getTasksByStatus();

        boardEl.innerHTML = statuses.map(status => `
            <div class="kanban-column" data-status="${status}">
                <div class="column-header">
                    <span class="column-title">${statusLabels[status] || status}</span>
                    <span class="column-count">${grouped[status]?.length || 0}</span>
                </div>
                <div class="column-body">
                    ${(grouped[status]?.length === 0)
                        ? '<div class="empty-column">No tasks</div>'
                        : grouped[status].map(task => TaskCard.render(task)).join('')
                    }
                </div>
            </div>
        `).join('');

        // Add event listeners for task cards
        this.attachCardListeners();
    },

    attachCardListeners() {
        // Card click -> open panel
        document.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't open panel if clicking on buttons or select
                if (e.target.closest('.task-actions')) return;
                // Don't open task panel if clicking on clickable entity links
                if (e.target.closest('.clickable')) return;
                const taskId = card.dataset.id;
                TaskPanel.open(taskId);
            });
        });

        // Clickable entity links (Project, Track, Condition, Hypothesis)
        document.querySelectorAll('.task-card .clickable').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const entityType = el.dataset.entityType;
                const entityId = el.dataset.entityId;
                if (!entityType || !entityId) return;

                switch (entityType) {
                    case 'Project':
                        ProjectPanel.open(entityId);
                        break;
                    case 'Track':
                    case 'Condition':
                    case 'Hypothesis':
                        if (typeof EntityDetailPanel !== 'undefined') {
                            EntityDetailPanel.open(entityType, entityId);
                        }
                        break;
                }
            });
        });

        // Delete buttons
        document.querySelectorAll('.task-card .btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = e.target.closest('.task-card').dataset.id;
                const task = State.getTaskById(taskId);
                if (task) {
                    openDeleteModal('task', taskId, task.entity_name);
                }
            });
        });

        // Status quick select
        document.querySelectorAll('.task-card .status-select').forEach(select => {
            select.addEventListener('click', (e) => e.stopPropagation());
            select.addEventListener('change', async (e) => {
                e.stopPropagation();
                const taskId = e.target.closest('.task-card').dataset.id;
                const newStatus = e.target.value;
                await this.updateTaskStatus(taskId, newStatus);
            });
        });

        // Drag and Drop
        this.attachDragListeners();
    },

    attachDragListeners() {
        // Drag start on cards
        document.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', card.dataset.id);
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                document.querySelectorAll('.kanban-column').forEach(col => {
                    col.classList.remove('drag-over');
                });
            });
        });

        // Drop zone on columns
        document.querySelectorAll('.column-body').forEach(columnBody => {
            columnBody.addEventListener('dragover', (e) => {
                e.preventDefault();
                const column = columnBody.closest('.kanban-column');
                column.classList.add('drag-over');
            });

            columnBody.addEventListener('dragleave', (e) => {
                const column = columnBody.closest('.kanban-column');
                if (!column.contains(e.relatedTarget)) {
                    column.classList.remove('drag-over');
                }
            });

            columnBody.addEventListener('drop', async (e) => {
                e.preventDefault();
                const column = columnBody.closest('.kanban-column');
                column.classList.remove('drag-over');

                const taskId = e.dataTransfer.getData('text/plain');
                const newStatus = column.dataset.status;

                if (taskId && newStatus) {
                    await this.updateTaskStatus(taskId, newStatus);
                }
            });
        });
    },

    async updateTaskStatus(taskId, newStatus) {
        try {
            const result = await API.updateTask(taskId, { status: newStatus });
            if (result.success) {
                showToast('Status updated', 'success');
                await State.reloadTasks();
                this.render();
            } else {
                showToast(result.message || 'Update failed', 'error');
            }
        } catch (err) {
            console.error('Status update error:', err);
            showToast('Error updating status', 'error');
        }
    }
};
