#!/bin/bash
# Local Git Auto-Sync Script
# 15분마다 launchd로 실행되어 GitHub와 동기화
# NAS cron보다 7분 오프셋 (충돌 방지)

set -e

VAULT_DIR="/Users/gim-eunhyang/dev/loop/public"
LOG_FILE="$VAULT_DIR/_build/local-sync.log"
MAX_LOG_LINES=1000

cd "$VAULT_DIR"

# 로그 함수
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# 로그 파일 크기 관리
if [ -f "$LOG_FILE" ] && [ $(wc -l < "$LOG_FILE") -gt $MAX_LOG_LINES ]; then
    tail -n 500 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi

log "=== Local Git Sync 시작 ==="

# 1. 변경사항 확인 및 커밋 (pull 전에 먼저!)
if [ -n "$(git status --porcelain)" ]; then
    git add -A
    CHANGED_FILES=$(git diff --cached --name-only | wc -l | tr -d ' ')
    git commit --no-verify -m "auto: $(date '+%Y-%m-%d %H:%M') - ${CHANGED_FILES} files"
    log "커밋 완료: ${CHANGED_FILES} files"
else
    log "로컬 변경사항 없음"
fi

# 2. pull --rebase (원격 변경사항 받기)
if git pull --rebase origin main 2>&1; then
    log "Pull 완료"
else
    log "ERROR: Pull 실패 - conflict 가능성"
    # conflict 발생 시 rebase abort하고 종료
    git rebase --abort 2>/dev/null || true
    exit 1
fi

# 3. GitHub로 push
if git push origin main 2>&1; then
    log "Push 완료"
else
    log "ERROR: Push 실패"
    exit 1
fi

log "=== Local Git Sync 완료 ==="
