#!/bin/bash
# NAS Git Auto-Sync Script
# 15분마다 cron으로 실행되어 GitHub와 동기화

set -e

VAULT_DIR="/volume1/LOOP_CORE/vault/LOOP"
LOG_FILE="/volume1/LOOP_CORE/vault/LOOP/_build/git-sync.log"
MAX_LOG_LINES=1000

# git safe.directory 설정 (ownership 문제 해결)
git config --global --add safe.directory "$VAULT_DIR" 2>/dev/null || true

cd "$VAULT_DIR"

# Synology @eaDir 메타데이터 정리 (git refs 오염 방지)
find .git/refs -name "*@eaDir*" -o -name "*@SynoEA*" 2>/dev/null | xargs rm -rf 2>/dev/null || true
find .git -name "@eaDir" -type d 2>/dev/null | xargs rm -rf 2>/dev/null || true

# 로그 함수
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# 로그 파일 크기 관리
if [ -f "$LOG_FILE" ] && [ $(wc -l < "$LOG_FILE") -gt $MAX_LOG_LINES ]; then
    tail -n 500 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi

log "=== Git Sync 시작 ==="

# 1. 변경사항 확인 및 커밋 (pre-commit hook 스킵)
if [ -n "$(git status --porcelain)" ]; then
    git add -A
    CHANGED_FILES=$(git diff --cached --name-only | wc -l)
    git commit --no-verify -m "auto: $(date '+%Y-%m-%d %H:%M') - ${CHANGED_FILES} files"
    log "커밋 완료: ${CHANGED_FILES} files"
else
    log "로컬 변경사항 없음"
fi

# 2. GitHub에서 pull (rebase)
if git pull --rebase origin main 2>&1; then
    log "Pull 완료"
else
    log "ERROR: Pull 실패 - conflict 가능성"
    exit 1
fi

# 3. GitHub로 push
if git push origin main 2>&1; then
    log "Push 완료"
else
    log "ERROR: Push 실패"
    exit 1
fi

log "=== Git Sync 완료 ==="
