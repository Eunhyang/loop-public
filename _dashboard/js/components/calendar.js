/**
 * Calendar Component
 * FullCalendar를 사용한 Task 캘린더 뷰
 *
 * Google Calendar 연동 (tsk-dashboard-ux-v1-25):
 * - /api/google/calendars: 연결된 Google 계정의 캘린더 목록
 * - /api/google/events: 선택된 캘린더의 이벤트 조회
 * - 캘린더별 표시/숨김 토글 (localStorage 저장)
 */
const Calendar = {
    instance: null,
    initialized: false,
    contextMenu: null,
    contextMenuDate: null,

    // Google Calendar 상태 (tsk-dashboard-ux-v1-25)
    googleCalendars: [],           // 연결된 Google 캘린더 목록
    enabledCalendars: new Set(),   // 활성화된 캘린더 ID들
    googleEventsCache: [],         // 캐시된 Google 이벤트
    googleCalendarsLoading: false, // 로딩 상태
    googleCalendarsError: null,    // 오류 메시지

    // 계정 관리 상태 (tsk-dashboard-ux-v1-28)
    collapsedAccounts: new Set(),  // 접힌 계정 이메일 목록
    accountMenu: null,             // 현재 열린 계정 메뉴

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

    // localStorage 키
    STORAGE_KEY: 'loop_calendar_enabled_gcal',
    COLLAPSED_ACCOUNTS_KEY: 'loop_calendar_collapsed_accounts',
    EXPAND_MODE_KEY: 'loop_calendar_expand_mode',

    // 월뷰 확장 모드 상태 (tsk-dashboard-ux-v1-33)
    // false = +more 모드 (축소), true = 모든 태스크 표시 (확장)
    expandedMode: false,

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
    async init() {
        if (this.initialized) {
            this.refresh();
            return;
        }

        const calendarEl = document.getElementById('calendarContainer');
        if (!calendarEl) {
            console.error('Calendar container not found');
            return;
        }

        // localStorage에서 활성화된 캘린더 목록 로드
        this.loadEnabledCalendars();

        // localStorage에서 접힌 계정 목록 로드 (tsk-dashboard-ux-v1-28)
        this.loadCollapsedAccounts();

        // localStorage에서 확장 모드 설정 로드 (tsk-dashboard-ux-v1-33)
        this.loadExpandMode();

        // Google 캘린더 목록 로드 (비동기)
        this.loadGoogleCalendars();

        // expandedMode에 따른 초기 dayMaxEvents 값 결정
        // false = 모든 태스크 표시, 3 = 3개 초과시 +more
        const initialDayMaxEvents = this.expandedMode ? false : 3;

        this.instance = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'ko',
            // 커스텀 버튼 정의 (tsk-dashboard-ux-v1-33)
            customButtons: {
                expandToggle: {
                    text: this.expandedMode ? '+more' : '모두 표시',
                    click: () => this.toggleExpandMode()
                }
            },
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'expandToggle dayGridMonth,timeGridWeek'
            },
            buttonText: {
                today: '오늘',
                month: '월',
                week: '주'
            },
            // 이벤트 소스: LOOP Tasks만 초기화 (Google은 비동기 로드)
            eventSources: [
                this.getLoopEventSource()
            ],
            eventClick: (info) => this.onEventClick(info),
            dateClick: (info) => this.onDateClick(info),
            datesSet: (info) => this.onDatesSet(info),  // 날짜 범위 변경 시 호출
            editable: true,  // 기본값 (개별 소스에서 override)
            eventDrop: (info) => this.onEventDrop(info),
            eventResize: (info) => this.onEventResize(info),
            height: 'auto',
            dayMaxEvents: initialDayMaxEvents,  // 월간뷰: expandedMode에 따라 설정 (tsk-dashboard-ux-v1-33)
            eventDisplay: 'block',
            // 뷰별 설정 (tsk-dashboard-ux-v1-32: 주간뷰 모든 태스크 표시)
            views: {
                timeGridWeek: {
                    dayMaxEvents: false  // 주간뷰: 제한 없음, 모든 태스크 표시
                }
            },
            eventTimeFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }
        });

        this.instance.render();
        this.initialized = true;

        // 초기 렌더링 후 버튼 텍스트 동기화 (tsk-dashboard-ux-v1-33)
        this.updateExpandButtonText();

        // 초기 expanded 클래스 적용 (localStorage에서 로드된 상태 반영)
        if (this.expandedMode) {
            const calendarView = document.querySelector('.calendar-view');
            if (calendarView) {
                calendarView.classList.add('expanded');
            }
        }

        // 컨텍스트 메뉴 생성
        this.createContextMenu();

        // 우클릭 이벤트 핸들러 등록
        calendarEl.addEventListener('contextmenu', (e) => this.onContextMenu(e));

        // 문서 클릭 시 컨텍스트 메뉴 닫기
        document.addEventListener('click', () => this.hideContextMenu());
    },

    /**
     * 날짜 범위 변경 시 호출 (월/주 변경)
     */
    onDatesSet(info) {
        // 현재 보고 있는 날짜 범위로 Google 이벤트 로드
        if (this.enabledCalendars.size > 0) {
            this.loadGoogleEvents(info.startStr, info.endStr);
        }

        // 뷰 변경 시 dayMaxEvents 상태 동기화 (tsk-dashboard-ux-v1-33)
        // Codex 피드백: 주간뷰에서 토글 후 월간뷰로 돌아올 때 상태 적용 필요
        if (this.instance) {
            const currentView = this.instance.view.type;
            if (currentView === 'dayGridMonth') {
                // 월간뷰로 전환 시 expandedMode에 따라 dayMaxEvents 재적용
                // false = 모든 태스크 표시, 3 = 3개 초과시 +more
                this.instance.setOption('dayMaxEvents', this.expandedMode ? false : 3);
            }
            // 버튼 텍스트도 동기화
            this.updateExpandButtonText();
        }
    },

    /**
     * localStorage에서 확장 모드 설정 로드 (tsk-dashboard-ux-v1-33)
     */
    loadExpandMode() {
        try {
            const saved = localStorage.getItem(this.EXPAND_MODE_KEY);
            this.expandedMode = saved === 'true';
        } catch (e) {
            console.warn('Failed to load expand mode from localStorage:', e);
            this.expandedMode = false;
        }
    },

    /**
     * localStorage에 확장 모드 설정 저장 (tsk-dashboard-ux-v1-33)
     */
    saveExpandMode() {
        try {
            localStorage.setItem(this.EXPAND_MODE_KEY, String(this.expandedMode));
        } catch (e) {
            console.warn('Failed to save expand mode to localStorage:', e);
        }
    },

    /**
     * 확장 모드 토글 (tsk-dashboard-ux-v1-33)
     * +more 모드 ↔ 모든 태스크 표시 모드 전환
     */
    toggleExpandMode() {
        this.expandedMode = !this.expandedMode;
        this.saveExpandMode();

        if (this.instance) {
            // expandedMode=true이면 dayMaxEvents=false (모든 태스크 표시)
            // expandedMode=false이면 dayMaxEvents=3 (+more 모드, 3개 초과시 +more)
            const newValue = this.expandedMode ? false : 3;
            this.instance.setOption('dayMaxEvents', newValue);

            // 캘린더 컨테이너에 expanded 클래스 토글 (높이 제한 해제)
            const calendarView = document.querySelector('.calendar-view');
            if (calendarView) {
                calendarView.classList.toggle('expanded', this.expandedMode);
            }

            // 캘린더 다시 렌더링
            this.instance.render();

            // 버튼 텍스트 업데이트
            this.updateExpandButtonText();

            console.log('Toggle expand mode:', this.expandedMode, 'dayMaxEvents:', newValue);
        }
    },

    /**
     * 확장 토글 버튼 텍스트 업데이트 (tsk-dashboard-ux-v1-33)
     * Codex 피드백: DOM 직접 업데이트로 버튼 텍스트 동기화
     */
    updateExpandButtonText() {
        const button = document.querySelector('.fc-expandToggle-button');
        if (button) {
            // expandedMode=true이면 현재 모든 태스크 표시 중 → "+more"로 전환 가능
            // expandedMode=false이면 현재 +more 모드 → "모두 표시"로 전환 가능
            button.textContent = this.expandedMode ? '+more' : '모두 표시';
        }
    },

    /**
     * localStorage에서 활성화된 캘린더 목록 로드
     * Migrates old colon format (1:email@example.com) to double underscore format (1__email@example.com)
     */
    loadEnabledCalendars() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const ids = JSON.parse(saved);
                // Migrate old colon format to double underscore format
                // Pattern: digits followed by : that isn't already in new format (digits__)
                let needsSave = false;
                const migratedIds = ids.map(id => {
                    // Check if old format: starts with digits and colon, but not already in new format
                    const oldFormatMatch = id.match(/^(\d+):(.+)$/);
                    const newFormatMatch = id.match(/^(\d+)__(.+)$/);
                    if (oldFormatMatch && !newFormatMatch) {
                        // Convert digit:rest to digit__rest
                        needsSave = true;
                        return `${oldFormatMatch[1]}__${oldFormatMatch[2]}`;
                    }
                    return id;
                });
                this.enabledCalendars = new Set(migratedIds);
                // Save migrated format
                if (needsSave) {
                    console.log('Migrated calendar IDs from colon to double underscore format');
                    this.saveEnabledCalendars();
                }
            }
        } catch (e) {
            console.warn('Failed to load enabled calendars from localStorage:', e);
        }
    },

    /**
     * localStorage에 활성화된 캘린더 목록 저장
     */
    saveEnabledCalendars() {
        try {
            const ids = Array.from(this.enabledCalendars);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ids));
        } catch (e) {
            console.warn('Failed to save enabled calendars to localStorage:', e);
        }
    },

    /**
     * Google 캘린더 목록 API 호출
     */
    async loadGoogleCalendars() {
        this.googleCalendarsLoading = true;
        this.googleCalendarsError = null;

        try {
            const response = await fetch('/api/google/calendars', {
                headers: API.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            this.googleCalendars = data.calendars || [];

            // 처음 로드 시 primary 캘린더 자동 활성화
            // Note: Using double underscore (__) as separator instead of colon (:) to avoid
            // URL parsing issues with reverse proxies (Synology NAS)
            if (this.enabledCalendars.size === 0 && this.googleCalendars.length > 0) {
                this.googleCalendars.forEach(cal => {
                    if (cal.primary) {
                        const calKey = `${cal.account_id}__${cal.id}`;
                        this.enabledCalendars.add(calKey);
                    }
                });
                this.saveEnabledCalendars();
            }

            // 활성화된 캘린더가 있으면 이벤트 로드
            // (renderGoogleCalendarSidebar는 finally에서 항상 호출됨)
            if (this.enabledCalendars.size > 0 && this.instance) {
                const view = this.instance.view;
                this.loadGoogleEvents(
                    view.activeStart.toISOString().split('T')[0],
                    view.activeEnd.toISOString().split('T')[0]
                );
            }

        } catch (error) {
            console.error('Failed to load Google calendars:', error);
            this.googleCalendarsError = 'Google 캘린더 목록을 불러오지 못했습니다';
        } finally {
            this.googleCalendarsLoading = false;
            // 항상 UI 갱신 보장 (로딩/에러/성공 모든 상태에서)
            this.renderGoogleCalendarSidebar();
        }
    },

    /**
     * Google 이벤트 API 호출
     */
    async loadGoogleEvents(start, end) {
        if (this.enabledCalendars.size === 0) {
            this.googleEventsCache = [];
            this.refreshGoogleEventSource();
            return;
        }

        try {
            const calendarIds = Array.from(this.enabledCalendars).join(',');
            const response = await fetch(
                `/api/google/events?start=${start}&end=${end}&calendar_ids=${encodeURIComponent(calendarIds)}`,
                { headers: API.getHeaders() }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            this.googleEventsCache = data.events || [];

            // Google 이벤트 소스 갱신
            this.refreshGoogleEventSource();

        } catch (error) {
            console.error('Failed to load Google events:', error);
            showToast('Google Calendar 이벤트를 불러오지 못했습니다', 'warning');
        }
    },

    /**
     * Google 이벤트 소스 갱신
     */
    refreshGoogleEventSource() {
        if (!this.instance) return;

        // 기존 Google 이벤트 소스 제거
        const existingSource = this.instance.getEventSourceById('google');
        if (existingSource) {
            existingSource.remove();
        }

        // 새 이벤트 소스 추가
        if (this.googleEventsCache.length > 0) {
            this.instance.addEventSource({
                id: 'google',
                events: this.googleEventsCache,
                editable: false
            });
        }
    },

    /**
     * Google 캘린더 사이드바 렌더링 (tsk-dashboard-ux-v1-28 개선)
     */
    renderGoogleCalendarSidebar() {
        const container = document.getElementById('googleCalendarList');
        if (!container) return;

        // 항상 "+계정 추가" 버튼을 포함한 헤더 렌더링
        let html = `
            <div class="gcal-sidebar-header">
                <a href="/api/google/authorize?redirect_after=/" class="gcal-add-account-btn">
                    <span class="gcal-add-icon">+</span>
                    <span>계정 추가</span>
                </a>
            </div>
        `;

        // 로딩 중
        if (this.googleCalendarsLoading) {
            html += `
                <div class="google-calendar-loading">
                    <span class="spinner-small"></span>
                    Google Calendar 로드 중...
                </div>
            `;
            container.innerHTML = html;
            return;
        }

        // 오류 발생
        if (this.googleCalendarsError) {
            html += `
                <div class="google-calendar-error">
                    <span>${this.googleCalendarsError}</span>
                    <button onclick="Calendar.loadGoogleCalendars()" class="btn btn-sm">재시도</button>
                </div>
            `;
            container.innerHTML = html;
            return;
        }

        // 연결된 계정 없음
        if (this.googleCalendars.length === 0) {
            html += `
                <div class="google-calendar-empty">
                    <p>연결된 Google 계정이 없습니다</p>
                </div>
            `;
            container.innerHTML = html;
            return;
        }

        // 캘린더 목록을 계정별로 그룹핑
        const accountGroups = {};
        this.googleCalendars.forEach(cal => {
            if (!accountGroups[cal.account_email]) {
                accountGroups[cal.account_email] = {
                    accountId: cal.account_id,
                    calendars: []
                };
            }
            accountGroups[cal.account_email].calendars.push(cal);
        });

        // 계정별 렌더링
        for (const [email, group] of Object.entries(accountGroups)) {
            const isCollapsed = this.collapsedAccounts.has(email);
            const chevronIcon = isCollapsed ? '>' : 'v';
            const accountId = group.accountId;

            html += `
                <div class="google-calendar-account ${isCollapsed ? 'collapsed' : ''}">
                    <div class="account-header" data-email="${email}">
                        <button class="account-collapse-btn" onclick="Calendar.toggleAccountCollapse('${email}')" title="${isCollapsed ? '펼치기' : '접기'}">
                            <span class="collapse-icon">${chevronIcon}</span>
                        </button>
                        <span class="account-avatar">${email.charAt(0).toUpperCase()}</span>
                        <span class="account-email">${email}</span>
                        <button class="account-menu-btn" onclick="Calendar.showAccountMenu('${accountId}', '${email}', event)" title="계정 옵션">
                            <span class="menu-dots">...</span>
                        </button>
                    </div>
                    <ul class="calendar-list ${isCollapsed ? 'hidden' : ''}">
            `;

            group.calendars.forEach(cal => {
                // Use double underscore (__) as separator to avoid URL parsing issues
                const calKey = `${cal.account_id}__${cal.id}`;
                const isEnabled = this.enabledCalendars.has(calKey);
                html += `
                    <li class="calendar-item">
                        <label>
                            <input type="checkbox"
                                   ${isEnabled ? 'checked' : ''}
                                   data-calendar-key="${calKey}"
                                   onchange="Calendar.toggleCalendar('${calKey}')"
                                   style="accent-color: ${cal.color}">
                            <span class="calendar-color" style="background-color: ${cal.color}"></span>
                            <span class="calendar-name">${cal.summary}</span>
                            ${cal.primary ? '<span class="calendar-primary">기본</span>' : ''}
                        </label>
                    </li>
                `;
            });

            html += `
                    </ul>
                </div>
            `;
        }

        container.innerHTML = html;
    },

    /**
     * 계정 접기/펼치기 토글 (tsk-dashboard-ux-v1-28)
     */
    toggleAccountCollapse(email) {
        if (this.collapsedAccounts.has(email)) {
            this.collapsedAccounts.delete(email);
        } else {
            this.collapsedAccounts.add(email);
        }
        this.saveCollapsedAccounts();
        this.renderGoogleCalendarSidebar();
    },

    /**
     * 접힌 계정 목록 localStorage에서 로드 (tsk-dashboard-ux-v1-28)
     */
    loadCollapsedAccounts() {
        try {
            const saved = localStorage.getItem(this.COLLAPSED_ACCOUNTS_KEY);
            if (saved) {
                this.collapsedAccounts = new Set(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load collapsed accounts:', e);
            this.collapsedAccounts = new Set();
        }
    },

    /**
     * 접힌 계정 목록 localStorage에 저장 (tsk-dashboard-ux-v1-28)
     */
    saveCollapsedAccounts() {
        try {
            localStorage.setItem(
                this.COLLAPSED_ACCOUNTS_KEY,
                JSON.stringify(Array.from(this.collapsedAccounts))
            );
        } catch (e) {
            console.error('Failed to save collapsed accounts:', e);
        }
    },

    /**
     * 계정 메뉴 표시 (tsk-dashboard-ux-v1-28)
     */
    showAccountMenu(accountId, email, event) {
        event.stopPropagation();

        // 기존 메뉴 닫기
        this.hideAccountMenu();

        const menu = document.createElement('div');
        menu.className = 'account-popup-menu';
        menu.innerHTML = `
            <button class="account-menu-item" onclick="Calendar.disconnectAccount('${accountId}', '${email}')">
                <span class="menu-item-icon">x</span>
                <span>연결 해제</span>
            </button>
        `;

        // 버튼 위치에 메뉴 표시
        const rect = event.target.closest('.account-menu-btn').getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = `${rect.bottom + 4}px`;
        menu.style.left = `${rect.left - 100}px`;  // 메뉴를 왼쪽으로 정렬

        document.body.appendChild(menu);
        this.accountMenu = menu;

        // 클릭 외부 감지로 메뉴 닫기
        setTimeout(() => {
            document.addEventListener('click', this.hideAccountMenuHandler);
        }, 0);
    },

    /**
     * 계정 메뉴 숨기기 핸들러 (tsk-dashboard-ux-v1-28)
     */
    hideAccountMenuHandler: function(e) {
        if (Calendar.accountMenu && !Calendar.accountMenu.contains(e.target)) {
            Calendar.hideAccountMenu();
        }
    },

    /**
     * 계정 메뉴 숨기기 (tsk-dashboard-ux-v1-28)
     */
    hideAccountMenu() {
        if (this.accountMenu) {
            this.accountMenu.remove();
            this.accountMenu = null;
        }
        document.removeEventListener('click', this.hideAccountMenuHandler);
    },

    /**
     * Google 계정 연결 해제 (tsk-dashboard-ux-v1-28)
     */
    async disconnectAccount(accountId, email) {
        this.hideAccountMenu();

        if (!confirm(`'${email}' 계정 연결을 해제하시겠습니까?\n\n이 계정의 캘린더는 더 이상 표시되지 않습니다.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/google/accounts/${accountId}`, {
                method: 'DELETE',
                headers: API.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            showToast(`${email} 계정 연결이 해제되었습니다`, 'success');

            // 해당 계정의 캘린더를 enabledCalendars에서 제거
            // Note: Using double underscore (__) as separator to match the new format
            const keysToRemove = [];
            this.enabledCalendars.forEach(key => {
                if (key.startsWith(accountId + '__')) {
                    keysToRemove.push(key);
                }
            });
            keysToRemove.forEach(key => this.enabledCalendars.delete(key));
            this.saveEnabledCalendars();

            // 캘린더 목록 새로고침
            await this.loadGoogleCalendars();

        } catch (error) {
            console.error('Failed to disconnect account:', error);
            showToast('계정 연결 해제에 실패했습니다', 'error');
        }
    },

    /**
     * 캘린더 토글
     */
    toggleCalendar(calKey) {
        if (this.enabledCalendars.has(calKey)) {
            this.enabledCalendars.delete(calKey);
        } else {
            this.enabledCalendars.add(calKey);
        }

        this.saveEnabledCalendars();

        // 이벤트 새로고침
        if (this.instance) {
            const view = this.instance.view;
            this.loadGoogleEvents(
                view.activeStart.toISOString().split('T')[0],
                view.activeEnd.toISOString().split('T')[0]
            );
        }
    },

    /**
     * 컨텍스트 메뉴 생성
     */
    createContextMenu() {
        // 이미 존재하면 제거
        if (this.contextMenu) {
            this.contextMenu.remove();
        }

        const menu = document.createElement('div');
        menu.id = 'calendarContextMenu';
        menu.className = 'calendar-context-menu';
        menu.innerHTML = `
            <button class="context-menu-item" data-action="add-meeting">
                <span class="context-menu-icon">+</span>
                미팅 추가
            </button>
        `;
        menu.style.display = 'none';
        document.body.appendChild(menu);
        this.contextMenu = menu;

        // 메뉴 항목 클릭 이벤트
        menu.addEventListener('click', (e) => {
            const item = e.target.closest('.context-menu-item');
            if (item && item.dataset.action === 'add-meeting') {
                this.onAddMeeting();
            }
        });
    },

    /**
     * 우클릭 이벤트 핸들러
     */
    onContextMenu(e) {
        // 날짜 셀인지 확인
        const dayCell = e.target.closest('.fc-daygrid-day');
        if (!dayCell) return;

        e.preventDefault();

        // 날짜 추출
        const dateStr = dayCell.getAttribute('data-date');
        if (!dateStr) return;

        this.contextMenuDate = dateStr;
        this.showContextMenu(e.pageX, e.pageY);
    },

    /**
     * 컨텍스트 메뉴 표시
     */
    showContextMenu(x, y) {
        if (!this.contextMenu) return;

        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;
        this.contextMenu.style.display = 'block';
    },

    /**
     * 컨텍스트 메뉴 숨기기
     */
    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.style.display = 'none';
        }
    },

    /**
     * 미팅 추가 핸들러 (tsk-019-02: Auto-set type to meeting)
     */
    onAddMeeting() {
        this.hideContextMenu();
        TaskModal.open({ date: this.contextMenuDate, type: 'meeting' });
    },

    /**
     * 날짜 클릭 핸들러 (좌클릭)
     */
    onDateClick(info) {
        // 좌클릭은 현재 동작 없음 (필요시 확장 가능)
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
                const dateStr = task.start_date || task.due;
                if (!dateStr) return false;
                // 유효한 날짜인지 확인
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) {
                    console.warn('Invalid date in task:', task.entity_id, dateStr);
                    return false;
                }
                return true;
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
        // Invalid Date 체크
        if (isNaN(date.getTime())) {
            console.warn('Invalid date string:', dateStr);
            return null;
        }
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
     * - Google 이벤트: 상세 정보 표시 (읽기 전용)
     */
    onEventClick(info) {
        const sourceId = info.event.source?.id;

        // Google Calendar 이벤트인 경우
        if (sourceId === 'google') {
            info.jsEvent.preventDefault();
            const event = info.event;
            const props = event.extendedProps || {};

            // 시간 정보
            const startTime = event.start ? event.start.toLocaleString('ko-KR') : '';
            const endTime = event.end ? event.end.toLocaleString('ko-KR') : '';
            const timeRange = endTime && endTime !== startTime
                ? `${startTime} ~ ${endTime}`
                : startTime;

            // 상세 정보 구성
            let details = `${event.title}\n${timeRange}`;
            if (props.calendar_name) {
                details += `\n캘린더: ${props.calendar_name}`;
            }
            if (props.location) {
                details += `\n장소: ${props.location}`;
            }

            // Google Calendar 링크가 있으면 새 창에서 열기 옵션 제공
            if (props.html_link) {
                showToast(details, 'info', 5000);
                // 5초 후 자동으로 닫히지만, 클릭하면 Google Calendar로 이동
                const openLink = confirm(`Google Calendar에서 이벤트를 열까요?\n\n${event.title}`);
                if (openLink) {
                    window.open(props.html_link, '_blank');
                }
            } else {
                showToast(details, 'info', 4000);
            }
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
     * LOOP Task 소스 갱신 + Google 이벤트 캐시 갱신
     */
    refresh() {
        if (this.instance) {
            // LOOP 이벤트 소스만 제거 후 새로 추가
            const loopSource = this.instance.getEventSourceById('loop');
            if (loopSource) {
                loopSource.remove();
            }
            this.instance.addEventSource(this.getLoopEventSource());

            // Google 이벤트 소스도 갱신 (캐시된 이벤트 사용)
            this.refreshGoogleEventSource();
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
