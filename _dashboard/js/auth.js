/**
 * Auth Module
 * 로그인 모달 및 인증 관리
 */
const Auth = {
    TOKEN: 'loop_2024_kanban_secret',

    init() {
        this.setupLoginModal();
        this.checkAuth();
    },

    checkAuth() {
        const token = API.getToken();
        if (token === this.TOKEN) {
            this.hideLoginModal();
            // 인증 성공 시 앱 초기화
            if (window.App && window.App.init && !window.App.initialized) {
                window.App.initialized = true;
                window.App.init();
            }
            return true;
        }
        this.showLoginModal();
        return false;
    },

    showLoginModal() {
        const modal = document.getElementById('loginModal');
        const appLayout = document.querySelector('.app-layout');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('loginPassword').focus();
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
        const passwordInput = document.getElementById('loginPassword');
        const errorMsg = document.getElementById('loginError');

        const handleLogin = () => {
            const password = passwordInput.value;
            if (password === this.TOKEN) {
                API.setToken(password);
                this.hideLoginModal();
                errorMsg.style.display = 'none';
                // 앱 초기화 트리거
                if (window.App && window.App.init && !window.App.initialized) {
                    window.App.initialized = true;
                    window.App.init();
                }
            } else {
                errorMsg.style.display = 'block';
                passwordInput.value = '';
                passwordInput.focus();
            }
        };

        if (loginBtn) {
            loginBtn.addEventListener('click', handleLogin);
        }

        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleLogin();
                }
            });
        }
    }
};

// 전역 함수로 노출 (api.js에서 401 시 호출)
window.showLoginModal = () => Auth.showLoginModal();

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
