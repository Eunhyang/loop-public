#!/bin/sh
set -e

# ============================================
# LOOP OAuth Server Entrypoint
# ============================================
# This script runs BEFORE Python to ensure proper directory permissions.
# Solves the named volume permission issue where Docker creates volumes
# as root but container runs as non-root user (1026:100).

echo "=== LOOP OAuth Server Starting ==="

# OAuth data directory (named volume mount point)
OAUTH_DATA_DIR="${OAUTH_DB_PATH%/*}"  # Extract directory from DB path
OAUTH_DATA_DIR="${OAUTH_DATA_DIR:-/app/oauth-data}"

echo "OAuth data directory: $OAUTH_DATA_DIR"

# Create directories if they don't exist
# Note: This works because the script runs before user downgrade
mkdir -p "$OAUTH_DATA_DIR"
mkdir -p "$OAUTH_DATA_DIR/keys"

echo "Directories created/verified"

# Start the OAuth server
echo "Starting uvicorn..."
exec uvicorn api.main_auth:app --host 0.0.0.0 --port 8083
