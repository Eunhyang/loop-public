/**
 * Auth Module
 * OAuth 기반 로그인 관리
 */
const Auth = {
    init() {
        this.setupLoginModal();
        this.checkAuth();
    },

    /**
     * 인증 상태 확인
     * JWT 토큰 존재 + 만료 여부 체크
     */
    checkAuth() {
        const token = API.getToken();

        if (token && !API.isTokenExpired()) {
            this.hideLoginModal();
            // 인증 성공 시 앱 초기화
            if (window.App && window.App.init && !window.App.initialized) {
                window.App.initialized = true;
                window.App.init();
            }
            return true;
        }

        // 토큰 없거나 만료됨
        API.clearToken();
        this.showLoginModal();
        return false;
    },

    showLoginModal() {
        const modal = document.getElementById('loginModal');
        const appLayout = document.querySelector('.app-layout');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('loginEmail')?.focus();
        }
        if (appLayout) {
            appLayout.style.filter = 'blur(5px)';
            appLayout.style.pointerEvents = 'none';
        }
    },

    hideLoginModal() {
        const modal = document.getElementById('loginModal');
        const appLayout = document.querySelector('.app-layout');
        if (modal) {
            modal.style.display = 'none';
        }
        if (appLayout) {
            appLayout.style.filter = '';
            appLayout.style.pointerEvents = '';
        }
    },

    setupLoginModal() {
        const loginBtn = document.getElementById('loginSubmit');
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        const errorMsg = document.getElementById('loginError');

        const handleLogin = async () => {
            const email = emailInput?.value?.trim();
            const password = passwordInput?.value;

            // 입력 검증
            if (!email || !password) {
                this.showError('Email and password required');
                return;
            }

            // 로딩 상태
            if (loginBtn) {
                loginBtn.disabled = true;
                loginBtn.textContent = 'Logging in...';
            }

            try {
                // API 로그인 호출
                const result = await API.login(email, password);

                // 성공
                this.hideLoginModal();
                this.hideError();

                // 입력 필드 초기화
                if (emailInput) emailInput.value = '';
                if (passwordInput) passwordInput.value = '';

                // 앱 초기화
                if (window.App && window.App.init && !window.App.initialized) {
                    window.App.initialized = true;
                    window.App.init();
                }

                // 사용자 역할 표시 (선택적)
                console.log(`Logged in as ${result.role}`);

            } catch (err) {
                // 실패
                this.showError(err.message || 'Login failed');
                if (passwordInput) {
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            } finally {
                // 로딩 해제
                if (loginBtn) {
                    loginBtn.disabled = false;
                    loginBtn.textContent = 'Login';
                }
            }
        };

        // 버튼 클릭
        if (loginBtn) {
            loginBtn.addEventListener('click', handleLogin);
        }

        // Enter 키
        if (emailInput) {
            emailInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    passwordInput?.focus();
                }
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleLogin();
                }
            });
        }
    },

    showError(message) {
        const errorMsg = document.getElementById('loginError');
        if (errorMsg) {
            errorMsg.textContent = message;
            errorMsg.style.display = 'block';
        }
    },

    hideError() {
        const errorMsg = document.getElementById('loginError');
        if (errorMsg) {
            errorMsg.style.display = 'none';
        }
    },

    /**
     * 현재 사용자 역할 반환
     */
    getRole() {
        return API.getRole();
    },

    /**
     * exec 권한 확인
     */
    canAccessExec() {
        const role = this.getRole();
        return role === 'exec' || role === 'admin';
    },

    /**
     * 로그아웃
     */
    logout() {
        API.logout();
        window.App.initialized = false;
        this.showLoginModal();
    }
};

// 전역 함수로 노출 (api.js에서 401 시 호출)
window.showLoginModal = () => Auth.showLoginModal();

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
