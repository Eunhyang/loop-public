/**
 * PDF Viewer Component (tsk-dashboard-ux-v1-20)
 * PDF.js 기반 인라인 PDF 뷰어
 */
const PDFViewer = {
    // State
    pdfDoc: null,
    currentPage: 1,
    totalPages: 0,
    scale: 1.0,
    currentUrl: null,
    currentFilename: null,
    currentTaskId: null,
    isRendering: false,
    isActive: false,

    // Scale limits
    MIN_SCALE: 0.5,
    MAX_SCALE: 2.0,
    SCALE_STEP: 0.25,

    // PDF.js library reference (loaded via CDN)
    pdfjsLib: null,
    pdfjsLibError: false, // CDN 로드 실패 상태

    // Race condition 방지 (Codex 피드백 반영)
    requestToken: 0,

    // Memory leak 방지 (Codex 피드백 반영)
    abortController: null,
    loadingTask: null,

    /**
     * Initialize the PDF viewer
     */
    init() {
        this.setupEventListeners();
        this.loadPdfJsLibrary();
    },

    /**
     * Load PDF.js library from CDN
     * Codex 피드백 반영: 에러 시 사용자에게 표시
     */
    async loadPdfJsLibrary() {
        try {
            // PDF.js는 ES Module로 로드됨
            const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs');
            this.pdfjsLib = pdfjsLib;
            this.pdfjsLibError = false;

            // Worker 경로 설정 (Codex 피드백 반영)
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';

            console.log('PDF.js loaded successfully');
        } catch (err) {
            console.error('Failed to load PDF.js:', err);
            this.pdfjsLibError = true;
            // CDN 에러 시 사용자에게 알림 (Codex 피드백 반영)
            showToast('PDF viewer failed to load. Please refresh the page.', 'error');
        }
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close button
        document.getElementById('pdfViewerClose')?.addEventListener('click', () => this.close());

        // Overlay click (close on background click)
        document.getElementById('pdfViewerOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'pdfViewerOverlay') {
                this.close();
            }
        });

        // Navigation buttons
        document.getElementById('pdfViewerPrev')?.addEventListener('click', () => this.prevPage());
        document.getElementById('pdfViewerNext')?.addEventListener('click', () => this.nextPage());

        // Page input
        document.getElementById('pdfViewerPageInput')?.addEventListener('change', (e) => {
            const page = parseInt(e.target.value, 10);
            if (page >= 1 && page <= this.totalPages) {
                this.goToPage(page);
            } else {
                e.target.value = this.currentPage;
            }
        });

        document.getElementById('pdfViewerPageInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.target.blur();
            }
        });

        // Zoom buttons
        document.getElementById('pdfViewerZoomIn')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('pdfViewerZoomOut')?.addEventListener('click', () => this.zoomOut());

        // Download button
        document.getElementById('pdfViewerDownload')?.addEventListener('click', () => this.download());

        // Keyboard shortcuts (Codex 피드백: 모달 활성화 시에만)
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    },

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e
     */
    handleKeydown(e) {
        // Only handle when viewer is active (Codex 피드백 반영)
        if (!this.isActive) return;

        // Prevent shortcuts when typing in input
        if (e.target.tagName === 'INPUT') {
            if (e.key === 'Escape') {
                e.target.blur();
            }
            return;
        }

        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                this.close();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.prevPage();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextPage();
                break;
            case '+':
            case '=':
                e.preventDefault();
                this.zoomIn();
                break;
            case '-':
                e.preventDefault();
                this.zoomOut();
                break;
        }
    },

    /**
     * Open PDF viewer with a URL
     * @param {string} url - PDF URL
     * @param {string} filename - Display filename
     * @param {string} taskId - Task ID (for authorization)
     */
    async open(url, filename, taskId) {
        // CDN 로드 실패 시 재시도 (Codex 피드백 반영)
        if (this.pdfjsLibError) {
            showToast('PDF viewer unavailable. Retrying...', 'warning');
            await this.loadPdfJsLibrary();
        }

        if (!this.pdfjsLib) {
            showToast('PDF viewer not ready. Please try again.', 'error');
            return;
        }

        // URL 검증 (Codex 피드백: 보안)
        if (!this.isValidUrl(url)) {
            showToast('Invalid PDF URL', 'error');
            return;
        }

        // Race condition 방지: 이전 요청 취소 (Codex 피드백 반영)
        this.cancelPendingRequests();

        // 새 요청 토큰 생성
        const thisToken = ++this.requestToken;

        this.currentUrl = url;
        this.currentFilename = filename;
        this.currentTaskId = taskId;
        this.currentPage = 1;
        this.scale = 1.0;

        // Update UI
        document.getElementById('pdfViewerFilename').textContent = filename;
        document.getElementById('pdfViewerZoomLevel').textContent = '100%';
        this.showLoading(true);
        this.hideError();
        this.show();

        try {
            // AbortController로 fetch 취소 가능하게 (Codex 피드백 반영)
            this.abortController = new AbortController();

            // Fetch PDF with authorization (같은 도메인 API)
            const response = await API.authFetch(url, {
                signal: this.abortController.signal
            });

            // Race condition 체크: 현재 요청이 최신인지 확인
            if (thisToken !== this.requestToken) {
                console.log('Stale PDF request, ignoring');
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();

            // Race condition 재확인
            if (thisToken !== this.requestToken || !this.isActive) {
                console.log('Viewer closed or new request started, ignoring');
                return;
            }

            // Load PDF document
            this.loadingTask = this.pdfjsLib.getDocument({ data: arrayBuffer });
            const pdfDoc = await this.loadingTask.promise;

            // Race condition 최종 확인
            if (thisToken !== this.requestToken || !this.isActive) {
                pdfDoc.destroy();
                console.log('Viewer closed during load, cleaning up');
                return;
            }

            this.pdfDoc = pdfDoc;
            this.loadingTask = null;
            this.totalPages = this.pdfDoc.numPages;

            // Update total pages
            document.getElementById('pdfViewerTotalPages').textContent = this.totalPages;
            document.getElementById('pdfViewerPageInput').max = this.totalPages;

            // Render first page
            await this.renderPage(1);
            this.showLoading(false);

        } catch (err) {
            // AbortError는 정상적인 취소
            if (err.name === 'AbortError') {
                console.log('PDF fetch aborted');
                return;
            }

            // 인증 관련 에러 구분 (Codex 피드백 반영: authFetch가 이미 throw)
            const isAuthError = err.message === 'Unauthorized' || err.message === 'Token expired';
            if (isAuthError) {
                console.log('PDF load failed due to authentication:', err.message);
                this.showError('Authentication required', 'Please log in again to view this file.');
                return;
            }

            console.error('Error loading PDF:', err);
            this.showError('Failed to load PDF', err.message);
        }
    },

    /**
     * Cancel pending requests (Codex 피드백 반영: Memory leak 방지)
     */
    cancelPendingRequests() {
        // Fetch 취소
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }

        // PDF.js loadingTask 취소
        if (this.loadingTask) {
            this.loadingTask.destroy();
            this.loadingTask = null;
        }
    },

    /**
     * Validate URL (Codex 피드백: 보안)
     * @param {string} url - URL to validate
     * @returns {boolean}
     */
    isValidUrl(url) {
        if (!url) return false;
        try {
            const parsed = new URL(url, window.location.origin);
            // 같은 도메인만 허용 (Codex 피드백 반영)
            return parsed.origin === window.location.origin;
        } catch {
            return false;
        }
    },

    /**
     * Close the viewer
     */
    close() {
        this.isActive = false;
        document.getElementById('pdfViewerOverlay').classList.remove('active');

        // 진행 중인 요청 취소 (Codex 피드백 반영: Memory leak 방지)
        this.cancelPendingRequests();

        // Cleanup (Codex 피드백: 메모리 정리)
        if (this.pdfDoc) {
            this.pdfDoc.destroy();
            this.pdfDoc = null;
        }

        // Clear canvas
        const canvas = document.getElementById('pdfViewerCanvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Reset state
        this.currentUrl = null;
        this.currentFilename = null;
        this.currentTaskId = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.scale = 1.0;

        // Hide any error/loading states
        this.showLoading(false);
        this.hideError();
    },

    /**
     * Show the viewer
     */
    show() {
        this.isActive = true;
        document.getElementById('pdfViewerOverlay').classList.add('active');

        // Focus trap (Codex 피드백: 접근성)
        document.getElementById('pdfViewerClose')?.focus();
    },

    /**
     * Render a specific page
     * @param {number} num - Page number
     */
    async renderPage(num) {
        if (!this.pdfDoc || this.isRendering) return;

        this.isRendering = true;

        try {
            const page = await this.pdfDoc.getPage(num);
            const canvas = document.getElementById('pdfViewerCanvas');
            const ctx = canvas.getContext('2d');

            // Calculate viewport with scale
            const viewport = page.getViewport({ scale: this.scale * window.devicePixelRatio });

            // Set canvas dimensions
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.style.width = `${viewport.width / window.devicePixelRatio}px`;
            canvas.style.height = `${viewport.height / window.devicePixelRatio}px`;

            // Render page
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };

            await page.render(renderContext).promise;

            // Update state
            this.currentPage = num;
            document.getElementById('pdfViewerPageInput').value = num;

            // Update button states (Codex 피드백: 페이지 네비게이션 상태)
            this.updateNavigationButtons();

        } catch (err) {
            console.error('Error rendering page:', err);
            showToast('Error rendering page', 'error');
        } finally {
            this.isRendering = false;
        }
    },

    /**
     * Update navigation button states
     */
    updateNavigationButtons() {
        const prevBtn = document.getElementById('pdfViewerPrev');
        const nextBtn = document.getElementById('pdfViewerNext');
        const zoomInBtn = document.getElementById('pdfViewerZoomIn');
        const zoomOutBtn = document.getElementById('pdfViewerZoomOut');

        // Page navigation (Codex 피드백: 첫/마지막 페이지에서 비활성화)
        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= this.totalPages;
        }

        // Zoom (Codex 피드백: 확대/축소 제한)
        if (zoomInBtn) {
            zoomInBtn.disabled = this.scale >= this.MAX_SCALE;
        }
        if (zoomOutBtn) {
            zoomOutBtn.disabled = this.scale <= this.MIN_SCALE;
        }
    },

    /**
     * Go to previous page
     */
    prevPage() {
        if (this.currentPage > 1) {
            this.renderPage(this.currentPage - 1);
        }
    },

    /**
     * Go to next page
     */
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.renderPage(this.currentPage + 1);
        }
    },

    /**
     * Go to a specific page
     * @param {number} num - Page number
     */
    goToPage(num) {
        if (num >= 1 && num <= this.totalPages) {
            this.renderPage(num);
        }
    },

    /**
     * Zoom in
     */
    zoomIn() {
        if (this.scale < this.MAX_SCALE) {
            this.scale = Math.min(this.scale + this.SCALE_STEP, this.MAX_SCALE);
            this.updateZoomLevel();
            this.renderPage(this.currentPage);
        }
    },

    /**
     * Zoom out
     */
    zoomOut() {
        if (this.scale > this.MIN_SCALE) {
            this.scale = Math.max(this.scale - this.SCALE_STEP, this.MIN_SCALE);
            this.updateZoomLevel();
            this.renderPage(this.currentPage);
        }
    },

    /**
     * Update zoom level display
     */
    updateZoomLevel() {
        const percent = Math.round(this.scale * 100);
        document.getElementById('pdfViewerZoomLevel').textContent = `${percent}%`;
        this.updateNavigationButtons();
    },

    /**
     * Download the PDF
     */
    async download() {
        if (!this.currentUrl || !this.currentFilename) return;

        try {
            const response = await API.authFetch(this.currentUrl);
            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = this.currentFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

            showToast('Download started', 'success');
        } catch (err) {
            // 인증 관련 에러 구분 (Codex 피드백 반영: authFetch가 이미 throw)
            const isAuthError = err.message === 'Unauthorized' || err.message === 'Token expired';
            if (isAuthError) {
                console.log('PDF download failed due to authentication:', err.message);
                showToast('Please log in again to download this file.', 'error');
                return;
            }

            console.error('Download error:', err);
            showToast('Download failed', 'error');
        }
    },

    /**
     * Show/hide loading spinner
     * @param {boolean} show
     */
    showLoading(show) {
        const loadingEl = document.getElementById('pdfViewerLoading');
        if (loadingEl) {
            loadingEl.classList.toggle('hidden', !show);
        }
    },

    /**
     * Show error message
     * @param {string} message
     * @param {string} detail
     */
    showError(message, detail = '') {
        this.showLoading(false);
        const container = document.getElementById('pdfViewerContainer');

        // Remove existing error
        this.hideError();

        // Create error element
        const errorEl = document.createElement('div');
        errorEl.className = 'pdf-viewer-error';
        errorEl.innerHTML = `
            <div class="pdf-viewer-error-icon">❌</div>
            <div class="pdf-viewer-error-message">${this.escapeHtml(message)}</div>
            ${detail ? `<div class="pdf-viewer-error-detail">${this.escapeHtml(detail)}</div>` : ''}
        `;
        container.appendChild(errorEl);
    },

    /**
     * Hide error message
     */
    hideError() {
        const container = document.getElementById('pdfViewerContainer');
        const errorEl = container?.querySelector('.pdf-viewer-error');
        if (errorEl) {
            errorEl.remove();
        }
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} str
     * @returns {string}
     */
    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
};
