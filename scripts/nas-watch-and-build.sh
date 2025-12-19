#!/bin/bash
# NAS File Watcher + Auto Build for Multi-User Environment
# Version: 1.0
# Purpose: 여러 팀원의 Task 수정을 감지하여 자동으로 Dashboard 빌드

set -e

# ============================================
# Configuration
# ============================================
VAULT_DIR="/volume1/LOOP_CORE/vault/LOOP"
WEB_DIR="/volume1/web/kanban"
LOG_FILE="/volume1/LOOP_CORE/logs/watch-build.log"
LOCK_FILE="/volume1/LOOP_CORE/logs/.build.lock"
PYTHON="/volume1/@appstore/py3k/usr/local/bin/python3"

DEBOUNCE_SECONDS=2        # 디바운스 시간 (2초)
BUILD_TIMEOUT=60          # 빌드 최대 시간 (60초)
WATCH_PATH="$VAULT_DIR/50_Projects"  # 감시 대상

# ============================================
# Functions
# ============================================
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

error() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ERROR: $1" | tee -a "$LOG_FILE"
}

# Lock file 체크 및 생성
acquire_lock() {
    # Lock file이 있고 최근(60초 이내)이면 대기
    if [ -f "$LOCK_FILE" ]; then
        local lock_age=$(($(date +%s) - $(stat -c %Y "$LOCK_FILE" 2>/dev/null || echo 0)))

        if [ $lock_age -lt $BUILD_TIMEOUT ]; then
            log "빌드 진행 중 (${lock_age}초 경과) - 대기"
            return 1
        else
            # 오래된 lock file은 삭제 (비정상 종료 처리)
            log "오래된 lock file 제거 (${lock_age}초 경과)"
            rm -f "$LOCK_FILE"
        fi
    fi

    # Lock 획득
    touch "$LOCK_FILE"
    return 0
}

# Lock file 해제
release_lock() {
    rm -f "$LOCK_FILE"
}

# Dashboard 빌드
build_dashboard() {
    local start_time=$(date +%s)

    log "========================================="
    log "Dashboard 빌드 시작"

    # Lock 획득 시도
    if ! acquire_lock; then
        log "빌드 스킵 (이미 진행 중)"
        return 0
    fi

    # Trap으로 lock 해제 보장
    trap release_lock EXIT

    cd "$VAULT_DIR" || {
        error "Vault 디렉토리 접근 실패: $VAULT_DIR"
        return 1
    }

    # 1. Schema 검증 (선택 사항)
    # log "Step 1/3: Schema 검증 중..."
    # $PYTHON scripts/validate_schema.py . >> "$LOG_FILE" 2>&1 || {
    #     error "Schema 검증 실패"
    #     return 1
    # }

    # 2. Dashboard 빌드
    log "Step 1/2: Dashboard 빌드 중..."
    if $PYTHON scripts/build_dashboard.py . >> "$LOG_FILE" 2>&1; then
        log "Dashboard 빌드 성공"
    else
        error "Dashboard 빌드 실패"
        return 1
    fi

    # 3. 웹 배포
    log "Step 2/2: 웹 배포 중..."

    if [ ! -f "_dashboard/index.html" ]; then
        error "Dashboard 파일 없음: _dashboard/index.html"
        return 1
    fi

    mkdir -p "$WEB_DIR"
    cp -f _dashboard/index.html "$WEB_DIR/index.html" || {
        error "웹 배포 실패"
        return 1
    }

    chmod 644 "$WEB_DIR/index.html"
    chown http:http "$WEB_DIR/index.html" 2>/dev/null || true

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log "✅ 빌드 및 배포 완료 (${duration}초 소요)"
    log "Dashboard URL: http://$(hostname):8080"
    log "========================================="

    # Lock 해제
    release_lock
    trap - EXIT
}

# ============================================
# Main Loop
# ============================================
log "========================================="
log "NAS File Watcher 시작 (Multi-User)"
log "감시 경로: $WATCH_PATH"
log "디바운스: ${DEBOUNCE_SECONDS}초"
log "========================================="

# 디바운스용 변수
LAST_EVENT_TIME=0

# inotifywait로 파일 변경 감지
# -m: 모니터 모드 (계속 실행)
# -r: 재귀적 감시
# -e: 이벤트 타입 (modify, create, move, delete)
# --exclude: 제외 패턴
# --include: 포함 패턴 (.md 파일만)
inotifywait -m -r \
    -e modify -e create -e move -e delete \
    --exclude '\.git|\.obsidian|_dashboard|node_modules|\.DS_Store' \
    --format '%w%f %e %T' \
    --timefmt '%s' \
    "$WATCH_PATH" 2>/dev/null |
while read filepath event timestamp; do
    # .md 파일만 처리
    if [[ ! "$filepath" =~ \.md$ ]]; then
        continue
    fi

    # 템플릿 파일 제외
    if [[ "$filepath" =~ _TEMPLATES|template_ ]]; then
        continue
    fi

    log "파일 변경 감지: $filepath ($event)"

    # 현재 시간
    CURRENT_TIME=$(date +%s)

    # 디바운스: 마지막 이벤트로부터 N초 경과했는지 확인
    TIME_DIFF=$((CURRENT_TIME - LAST_EVENT_TIME))

    if [ $TIME_DIFF -lt $DEBOUNCE_SECONDS ]; then
        log "디바운스 대기 중... (${TIME_DIFF}초/${DEBOUNCE_SECONDS}초)"
        LAST_EVENT_TIME=$CURRENT_TIME
        continue
    fi

    # 디바운스 시간 경과 → 빌드 시작
    LAST_EVENT_TIME=$CURRENT_TIME

    # 약간의 추가 대기 (빠른 연속 수정 대응)
    sleep $DEBOUNCE_SECONDS

    # Dashboard 빌드 실행
    build_dashboard
done