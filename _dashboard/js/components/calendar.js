/**
 * Calendar Component
 * FullCalendar를 사용한 Task 캘린더 뷰
 */
const Calendar = {
    instance: null,
    initialized: false,

    // 트랙별 고정 색상 (6개 트랙)
    TRACK_COLORS: {
        'trk-1': '#FFEBEE',  // 연한 빨강
        'trk-2': '#E8EAF6',  // 연한 인디고
        'trk-3': '#E0F7FA',  // 연한 시안
        'trk-4': '#E8F5E9',  // 연한 초록
        'trk-5': '#FFF8E1',  // 연한 앰버
        'trk-6': '#FBE9E7',  // 연한 오렌지
    },

    // 기본 색상 (트랙 없는 경우)
    DEFAULT_COLOR: '#E0E0E0',

    // Google Calendar 설정
    GOOGLE_CALENDAR_CONFIG: {
        apiKey: 'AIzaSyDhdIFvqgVcnOCsp2vkG_KC5nD7cBawkAk',
        calendarId: 'sosilab2020@gmail.com', // Primary calendar (변경 필요시 수정)
        color: '#4285F4',     // Google Blue
        className: 'google-event'
    },

    /**
     * 프로젝트/태스크의 트랙 기반 색상 반환
     * projectId → project.parent_id(트랙) → 트랙 색상
     */
    getColorByProject(projectId) {
        if (projectId === null || projectId === undefined) return this.DEFAULT_COLOR;

        // State에서 프로젝트 찾기
        const project = State.projects.find(p => p.entity_id === projectId);
        if (!project) return this.DEFAULT_COLOR;

        // 프로젝트의 트랙 ID 가져오기
        const trackId = project.parent_id || project.track_id;
        if (!trackId) return this.DEFAULT_COLOR;

        // 트랙 색상 반환
        return this.TRACK_COLORS[trackId] || this.DEFAULT_COLOR;
    },

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
            // Google Calendar API Key
            googleCalendarApiKey: this.GOOGLE_CALENDAR_CONFIG.apiKey,
            // 이벤트 소스: LOOP Tasks + Google Calendar
            eventSources: [
                this.getLoopEventSource(),
                this.getGoogleCalendarEventSource()
            ],
            eventClick: (info) => this.onEventClick(info),
            editable: true,  // 기본값 (개별 소스에서 override)
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
        // Skip quick date filter for calendar view - show all tasks
        const tasks = State.getFilteredTasks({ skipQuickDateFilter: true });

        return tasks
            .filter(task => {
                // 날짜가 없는 Task는 제외
                const hasDate = task.start_date || task.due;
                return hasDate;
            })
            .map(task => {
                const startDate = task.start_date || task.due;
                const endDate = task.due || task.start_date;
                const projectColor = this.getColorByProject(task.project_id);

                return {
                    id: task.entity_id,
                    title: task.entity_name,
                    start: startDate,
                    end: this.getEndDateForCalendar(endDate),
                    backgroundColor: projectColor,
                    borderColor: projectColor,
                    textColor: '#333',
                    classNames: task.status === 'done' ? ['event-done'] : [],
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
     * Google Calendar 이벤트 소스 반환
     * 읽기 전용으로 설정 (editable: false)
     */
    getGoogleCalendarEventSource() {
        const config = this.GOOGLE_CALENDAR_CONFIG;
        return {
            id: 'google',
            googleCalendarId: config.calendarId,
            color: config.color,
            textColor: '#fff',
            className: config.className,
            editable: false,  // 읽기 전용 - 드래그/리사이즈 불가
            failure: () => {
                console.warn('Google Calendar 로드 실패');
                showToast('Google Calendar를 불러오지 못했습니다', 'warning');
            }
        };
    },

    /**
     * LOOP Task 이벤트 소스 반환
     */
    getLoopEventSource() {
        return {
            id: 'loop',
            events: this.getEvents(),
            editable: true
        };
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
     * 이벤트 클릭 핸들러
     * - LOOP 이벤트: Task 패널 열기
     * - Google 이벤트: Toast로 정보만 표시 (읽기 전용)
     */
    onEventClick(info) {
        const sourceId = info.event.source?.id;

        // Google Calendar 이벤트인 경우
        if (sourceId === 'google') {
            info.jsEvent.preventDefault();
            const event = info.event;
            const startTime = event.start ? event.start.toLocaleString('ko-KR') : '';
            const endTime = event.end ? event.end.toLocaleString('ko-KR') : '';
            const timeRange = endTime ? `${startTime} ~ ${endTime}` : startTime;
            showToast(`📅 ${event.title}\n${timeRange}`, 'info', 4000);
            return;
        }

        // LOOP Task 이벤트
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
