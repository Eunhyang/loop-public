#!/bin/bash
# LOOP Kanban Auto Deploy Script for Synology NAS
# Version: 1.0
# Purpose: Automatically pull vault updates and deploy dashboard to web server

set -e  # Exit on error

# ============================================
# Configuration
# ============================================
VAULT_DIR="/volume1/vault/LOOP"
WEB_DIR="/volume1/web/kanban"
LOG_FILE="/volume1/logs/kanban-deploy.log"
PYTHON="/volume1/@appstore/py3k/usr/local/bin/python3"

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

# ============================================
# Main Script
# ============================================
log "========================================="
log "Deploy started"

# Create log directory if not exists
mkdir -p /volume1/logs

# 1. Git Pull
log "Step 1/5: Checking for updates..."
cd "$VAULT_DIR" || error "Vault directory not found: $VAULT_DIR"

# Fetch from remote
git fetch origin main >> "$LOG_FILE" 2>&1 || error "Git fetch failed"

# Check if there are changes
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})

if [ "$LOCAL" = "$REMOTE" ]; then
    log "No changes detected. Skipping deployment."
    exit 0
fi

log "Step 2/5: Pulling changes from GitHub..."
git pull origin main >> "$LOG_FILE" 2>&1 || error "Git pull failed"

# 2. Schema Validation
log "Step 3/5: Validating schema..."
$PYTHON scripts/validate_schema.py . >> "$LOG_FILE" 2>&1 || error "Schema validation failed"

# 3. Build Dashboard
log "Step 4/5: Building dashboard..."
$PYTHON scripts/build_dashboard.py . >> "$LOG_FILE" 2>&1 || error "Dashboard build failed"

# Verify dashboard was created
if [ ! -f "_dashboard/index.html" ]; then
    error "Dashboard file not found after build"
fi

# 4. Deploy to Web
log "Step 5/5: Deploying to web server..."

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
log "Latest commit: $(git log -1 --oneline)"
log "========================================="
