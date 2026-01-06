/**
 * ProgramModal Component (tsk-022-02)
 * Program 생성 모달
 */
const ProgramModal = {
    isOpen: false,

    /**
     * 초기화
     */
    init() {
        this.setupEventListeners();
    },

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 모달 닫기 버튼
        const closeBtn = document.getElementById('programModalClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // 취소 버튼
        const cancelBtn = document.getElementById('programModalCancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.close());
        }

        // 제출 버튼
        const submitBtn = document.getElementById('programModalSubmit');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submit());
        }

        // 모달 배경 클릭으로 닫기
        const overlay = document.getElementById('programModal');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close();
                }
            });
        }

        // ESC 키로 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    },

    /**
     * 모달 열기
     */
    open() {
        const modal = document.getElementById('programModal');
        if (!modal) {
            console.error('ProgramModal: modal element not found');
            return;
        }

        // 폼 초기화
        this.resetForm();

        // Program type 드롭다운 채우기
        this.populateProgramTypes();

        // Owner 드롭다운 채우기
        this.populateOwners();

        // 모달 표시
        modal.style.display = 'flex';
        this.isOpen = true;

        // 첫 번째 input에 포커스
        const nameInput = document.getElementById('programName');
        if (nameInput) {
            nameInput.focus();
        }
    },

    /**
     * 모달 닫기
     */
    close() {
        const modal = document.getElementById('programModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.isOpen = false;
    },

    /**
     * 폼 초기화
     */
    resetForm() {
        const form = document.getElementById('programForm');
        if (form) {
            form.reset();
        }

        // 에러 메시지 숨기기
        const errorEl = document.getElementById('programModalError');
        if (errorEl) {
            errorEl.style.display = 'none';
            errorEl.textContent = '';
        }
    },

    /**
     * Program type 드롭다운 채우기
     */
    populateProgramTypes() {
        const select = document.getElementById('programType');
        if (!select) return;

        // 기존 옵션 제거 (기본 옵션 제외)
        while (select.options.length > 1) {
            select.remove(1);
        }

        // PROGRAM_TYPES는 State.constants에서 가져옴
        const programTypes = State.constants?.program_types || [
            'hiring', 'fundraising', 'grants', 'launch', 'experiments', 'infrastructure'
        ];

        programTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = this.formatProgramType(type);
            select.appendChild(option);
        });
    },

    /**
     * Program type 표시 형식
     */
    formatProgramType(type) {
        const labels = {
            'hiring': 'Hiring (채용)',
            'fundraising': 'Fundraising (투자 유치)',
            'grants': 'Grants (지원사업)',
            'launch': 'Launch (런칭)',
            'experiments': 'Experiments (실험)',
            'infrastructure': 'Infrastructure (인프라)'
        };
        return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
    },

    /**
     * Owner 드롭다운 채우기
     */
    populateOwners() {
        const select = document.getElementById('programOwner');
        if (!select) return;

        // 기존 옵션 제거 (기본 옵션 제외)
        while (select.options.length > 1) {
            select.remove(1);
        }

        // State.members에서 가져옴
        const members = State.members || [];
        const activeMembers = members.filter(m => m.active !== false);

        activeMembers.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = member.id + (member.role ? ` (${member.role})` : '');
            select.appendChild(option);
        });
    },

    /**
     * 폼 제출
     */
    async submit() {
        const nameInput = document.getElementById('programName');
        const typeSelect = document.getElementById('programType');
        const ownerSelect = document.getElementById('programOwner');
        const descriptionInput = document.getElementById('programDescription');

        // 필수 필드 검증
        if (!nameInput?.value?.trim()) {
            this.showError('Program 이름을 입력하세요.');
            nameInput?.focus();
            return;
        }

        if (!typeSelect?.value) {
            this.showError('Program 유형을 선택하세요.');
            typeSelect?.focus();
            return;
        }

        if (!ownerSelect?.value) {
            this.showError('책임자를 선택하세요.');
            ownerSelect?.focus();
            return;
        }

        // Submit 버튼 비활성화
        const submitBtn = document.getElementById('programModalSubmit');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';
        }

        try {
            const program = {
                entity_name: nameInput.value.trim(),
                program_type: typeSelect.value,
                owner: ownerSelect.value,
                description: descriptionInput?.value?.trim() || null,
                principles: [],
                process_steps: []
            };

            const result = await API.createProgram(program);

            if (result.success) {
                // 성공 시 모달 닫기
                this.close();

                // Programs 리로드
                await State.reloadPrograms();

                // Program-Round 뷰 새로고침
                if (typeof ProgramRoundsView !== 'undefined') {
                    ProgramRoundsView.render();
                }

                // 성공 메시지 표시 (선택)
                console.log(`Program created: ${result.program_id}`);
            } else {
                this.showError(result.detail || result.message || 'Program 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('Program creation error:', error);
            this.showError(error.message || 'Program 생성 중 오류가 발생했습니다.');
        } finally {
            // Submit 버튼 복원
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create Program';
            }
        }
    },

    /**
     * 에러 메시지 표시
     */
    showError(message) {
        const errorEl = document.getElementById('programModalError');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }
};
