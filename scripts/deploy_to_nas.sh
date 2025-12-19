#!/bin/bash
# LOOP Kanban Auto Deploy Script for Synology NAS
# Version: 2.0 (Simplified - No Git Pull)
# Purpose: Monitor vault changes and auto-deploy dashboard
#
# NOTE: Vault is already on NAS and mounted by MacBook
#       No need for git pull - files are synced in real-time!

set -e  # Exit on error

# ============================================
# Configuration
# ============================================
VAULT_DIR="/volume1/vault/LOOP"
WEB_DIR="/volume1/web/kanban"
LOG_FILE="/volume1/logs/kanban-deploy.log"
PYTHON="/volume1/@appstore/py3k/usr/local/bin/python3"
LAST_BUILD_FILE="/volume1/logs/.last_kanban_build"

# ============================================
# Functions
# ============================================
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

error() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ERROR: $1" | tee -a "$LOG_FILE"
    exit 1
}

check_changes() {
    # Check if any .md files in 50_Projects have changed
    # since last build

    if [ ! -f "$LAST_BUILD_FILE" ]; then
        # First run - always build
        return 0
    fi

    # Find any .md files modified after last build
    CHANGED=$(find "$VAULT_DIR/50_Projects" -name "*.md" -newer "$LAST_BUILD_FILE" 2>/dev/null | wc -l)

    if [ $CHANGED -gt 0 ]; then
        log "Detected $CHANGED changed file(s)"
        return 0
    else
        return 1
    fi
}

# ============================================
# Main Script
# ============================================
log "========================================="
log "Deploy check started"

# Create log directory if not exists
mkdir -p /volume1/logs

# 1. Change Detection
log "Step 1/4: Checking for file changes..."
cd "$VAULT_DIR" || error "Vault directory not found: $VAULT_DIR"

if ! check_changes; then
    log "No changes detected. Skipping deployment."
    exit 0
fi

log "Changes detected - proceeding with deployment"

# 2. Schema Validation
log "Step 2/4: Validating schema..."
$PYTHON scripts/validate_schema.py . >> "$LOG_FILE" 2>&1 || error "Schema validation failed"

# 3. Build Dashboard
log "Step 3/4: Building dashboard..."
$PYTHON scripts/build_dashboard.py . >> "$LOG_FILE" 2>&1 || error "Dashboard build failed"

# Verify dashboard was created
if [ ! -f "_dashboard/index.html" ]; then
    error "Dashboard file not found after build"
fi

# Update last build timestamp
touch "$LAST_BUILD_FILE"

# 4. Deploy to Web
log "Step 4/4: Deploying to web server..."

# Create web directory if not exists
mkdir -p "$WEB_DIR"

# Copy dashboard
cp -f _dashboard/index.html "$WEB_DIR/index.html" || error "Failed to copy dashboard"

# Set permissions
chmod 644 "$WEB_DIR/index.html"
chown http:http "$WEB_DIR/index.html" 2>/dev/null || true

# 5. Complete
log "Deploy completed successfully!"
log "Dashboard URL: http://$(hostname):8080"
log "Files changed since last build"
log "========================================="
