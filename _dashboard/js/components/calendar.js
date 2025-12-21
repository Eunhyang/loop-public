/**
 * Calendar Component
 * FullCalendar를 사용한 Task 캘린더 뷰
 */
const Calendar = {
    instance: null,
    initialized: false,

    /**
     * Calendar 초기화
     */
    init() {
        if (this.initialized) {
            this.refresh();
            return;
        }

        const calendarEl = document.getElementById('calendarContainer');
        if (!calendarEl) {
            console.error('Calendar container not found');
            return;
        }

        this.instance = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'ko',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
            },
            buttonText: {
                today: '오늘',
                month: '월',
                week: '주'
            },
            events: this.getEvents(),
            eventClick: (info) => this.onEventClick(info),
            editable: true,
            eventDrop: (info) => this.onEventDrop(info),
            eventResize: (info) => this.onEventResize(info),
            height: 'auto',
            dayMaxEvents: 3,
            eventDisplay: 'block',
            eventTimeFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }
        });

        this.instance.render();
        this.initialized = true;
    },

    /**
     * Task 데이터를 FullCalendar 이벤트 형식으로 변환
     * Codex 피드백: 날짜 없는 Task 필터링
     */
    getEvents() {
        const tasks = State.getFilteredTasks();

        return tasks
            .filter(task => {
                // 날짜가 없는 Task는 제외
                const hasDate = task.start_date || task.due;
                return hasDate;
            })
            .map(task => {
                const startDate = task.start_date || task.due;
                const endDate = task.due || task.start_date;

                return {
                    id: task.entity_id,
                    title: task.entity_name,
                    start: startDate,
                    end: this.getEndDateForCalendar(endDate),
                    backgroundColor: this.getColorByPriority(task.priority),
                    borderColor: this.getColorByPriority(task.priority),
                    textColor: '#fff',
                    extendedProps: {
                        status: task.status,
                        assignee: task.assignee,
                        project_id: task.project_id,
                        priority: task.priority
                    }
                };
            });
    },

    /**
     * FullCalendar는 end date를 exclusive로 처리하므로 +1일
     */
    getEndDateForCalendar(dateStr) {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        date.setDate(date.getDate() + 1);
        return date.toISOString().split('T')[0];
    },

    /**
     * Priority에 따른 색상 반환
     */
    getColorByPriority(priority) {
        const colors = {
            high: '#ef4444',    // red
            medium: '#f59e0b',  // amber
            low: '#22c55e'      // green
        };
        return colors[priority] || colors.medium;
    },

    /**
     * 이벤트 클릭 핸들러 - Task 패널 열기
     */
    onEventClick(info) {
        const taskId = info.event.id;
        TaskPanel.open(taskId);
    },

    /**
     * 이벤트 드래그 핸들러 - 날짜 업데이트
     * Codex 피드백: start_date와 due 모두 이동
     */
    async onEventDrop(info) {
        const taskId = info.event.id;
        const newStart = info.event.startStr;
        const newEnd = info.event.endStr;

        // FullCalendar end는 exclusive이므로 -1일
        let adjustedEnd = newEnd;
        if (newEnd) {
            const endDate = new Date(newEnd);
            endDate.setDate(endDate.getDate() - 1);
            adjustedEnd = endDate.toISOString().split('T')[0];
        } else {
            adjustedEnd = newStart;
        }

        try {
            const result = await API.updateTask(taskId, {
                start_date: newStart,
                due: adjustedEnd
            });

            if (result.success) {
                showToast('날짜가 업데이트되었습니다', 'success');
                await State.reloadTasks();
            } else {
                info.revert();
                showToast(result.message || '업데이트 실패', 'error');
            }
        } catch (err) {
            console.error('Event drop error:', err);
            info.revert();
            showToast('날짜 업데이트 중 오류 발생', 'error');
        }
    },

    /**
     * 이벤트 리사이즈 핸들러 - 종료일 업데이트
     */
    async onEventResize(info) {
        const taskId = info.event.id;
        const newEnd = info.event.endStr;

        // FullCalendar end는 exclusive이므로 -1일
        let adjustedEnd = newEnd;
        if (newEnd) {
            const endDate = new Date(newEnd);
            endDate.setDate(endDate.getDate() - 1);
            adjustedEnd = endDate.toISOString().split('T')[0];
        }

        try {
            const result = await API.updateTask(taskId, {
                due: adjustedEnd
            });

            if (result.success) {
                showToast('마감일이 업데이트되었습니다', 'success');
                await State.reloadTasks();
            } else {
                info.revert();
                showToast(result.message || '업데이트 실패', 'error');
            }
        } catch (err) {
            console.error('Event resize error:', err);
            info.revert();
            showToast('마감일 업데이트 중 오류 발생', 'error');
        }
    },

    /**
     * Calendar 새로고침
     * Codex 피드백: removeAllEventSources()로 이전 소스 제거 후 추가
     */
    refresh() {
        if (this.instance) {
            // 모든 이벤트 소스 제거 후 새로 추가 (중복 방지)
            this.instance.removeAllEventSources();
            this.instance.addEventSource(this.getEvents());
        }
    },

    /**
     * Calendar 파괴
     */
    destroy() {
        if (this.instance) {
            this.instance.destroy();
            this.instance = null;
            this.initialized = false;
        }
    }
};
