#!/bin/bash
# Note: Don't use 'set -e' to allow error handling code to run
set -uo pipefail

# Blue-Green Rollback Script for LOOP API
# Switches nginx back to the previous color

# Configuration
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.blue-green.yml}"
ACTIVE_COLOR_FILE="${ACTIVE_COLOR_FILE:-/volume1/LOOP_CORE/vault/LOOP/_build/.active-color}"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function: Get active color from file
get_active_color() {
    if [ -f "$ACTIVE_COLOR_FILE" ]; then
        cat "$ACTIVE_COLOR_FILE"
    else
        log_error "Active color file not found: $ACTIVE_COLOR_FILE"
        exit 1
    fi
}

# Function: Get opposite color
get_opposite_color() {
    local color=$1
    if [ "$color" == "blue" ]; then
        echo "green"
    else
        echo "blue"
    fi
}

# Function: Get host port for color
get_host_port() {
    local color=$1
    if [ "$color" == "blue" ]; then
        echo "8082"
    else
        echo "8085"
    fi
}

# Function: Check if container is running
check_container_running() {
    local color=$1
    local container_id=$(docker ps -q -f name=loop-api-$color 2>/dev/null)
    
    if [ -n "$container_id" ]; then
        return 0  # Running
    else
        return 1  # Not running
    fi
}

# Function: Start container if not running
ensure_container_running() {
    local color=$1
    
    if check_container_running "$color"; then
        log_info "Container loop-api-$color is already running"
        return 0
    fi
    
    log_warning "Container loop-api-$color is not running, starting it..."
    if docker compose -f "$COMPOSE_FILE" up -d loop-api-$color; then
        log_info "Waiting for container to be healthy..."
        sleep 5
        return 0
    else
        log_error "Failed to start loop-api-$color"
        return 1
    fi
}

# Function: Health check
quick_health_check() {
    local color=$1
    local host_port=$(get_host_port "$color")
    local url="http://localhost:$host_port/health"
    
    log_info "Verifying health of $color container..."
    
    for ((i=1; i<=10; i++)); do
        response=$(curl -s -w "\n%{http_code}" --max-time 3 "$url" 2>/dev/null || echo "000")
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n-1)
        
        # FIX: Use proper JSON parsing to avoid false positive on "unhealthy"
        if [ "$http_code" == "200" ]; then
            if echo "$body" | python3 -c "import sys, json; d=json.load(sys.stdin); sys.exit(0 if d.get('status')=='healthy' else 1)" 2>/dev/null; then
                log_success "Health check passed for $color"
                return 0
            fi
        fi
        
        if [ $i -lt 10 ]; then
            sleep 3
        fi
    done
    
    log_error "Health check failed for $color after 10 attempts"
    return 1
}

# Function: Switch nginx to target color
switch_nginx() {
    local target_color=$1
    local upstream_file="$SCRIPT_DIR/${target_color}-upstream.conf"
    local active_upstream_file="$SCRIPT_DIR/active-upstream.conf"
    local backup_file="${active_upstream_file}.backup"
    
    log_info "Switching nginx upstream to $target_color..."
    
    # Verify upstream config exists
    if [ ! -f "$upstream_file" ]; then
        log_error "Upstream config not found: $upstream_file"
        return 1
    fi
    
    # Backup current active config
    cp "$active_upstream_file" "$backup_file"
    
    # Atomic copy (with bind mount, this auto-reflects in container)
    local temp_file="${active_upstream_file}.tmp.$$"
    cp "$upstream_file" "$temp_file"
    mv "$temp_file" "$active_upstream_file"
    
    # Reload nginx (without set -e, we can handle errors)
    log_info "Reloading nginx..."
    if docker exec loop-nginx nginx -s reload; then
        rm -f "$backup_file"
        log_success "Nginx switched to $target_color"
        return 0
    else
        log_error "Nginx reload failed, restoring backup"
        # FIX: Restore backup
        mv "$backup_file" "$active_upstream_file"
        return 1
    fi
}

# Function: Mark color as active
mark_active() {
    local color=$1
    local temp_file="${ACTIVE_COLOR_FILE}.tmp.$$"
    
    log_info "Marking $color as active..."
    
    # Atomic write
    echo "$color" > "$temp_file"
    mv "$temp_file" "$ACTIVE_COLOR_FILE"
    
    log_success "Active color set to $color"
}

# Main rollback workflow
main() {
    log_info "=== Blue-Green Rollback for LOOP API ==="
    echo ""
    
    # Step 1: Get current active color
    CURRENT_ACTIVE=$(get_active_color)
    TARGET_COLOR=$(get_opposite_color "$CURRENT_ACTIVE")
    
    log_info "Current active: $CURRENT_ACTIVE"
    log_info "Rolling back to: $TARGET_COLOR"
    echo ""
    
    # Confirmation
    echo -n "Are you sure you want to rollback to $TARGET_COLOR? (yes/no): "
    read confirmation
    
    if [ "$confirmation" != "yes" ]; then
        log_info "Rollback cancelled"
        exit 0
    fi
    echo ""
    
    # Step 2: Ensure target container is running
    if ! ensure_container_running "$TARGET_COLOR"; then
        log_error "Cannot rollback: target container failed to start"
        exit 1
    fi
    echo ""
    
    # Step 3: Health check target container
    if ! quick_health_check "$TARGET_COLOR"; then
        log_error "Cannot rollback: target container is not healthy"
        exit 1
    fi
    echo ""
    
    # Step 4: Switch nginx
    if ! switch_nginx "$TARGET_COLOR"; then
        log_error "Failed to switch nginx"
        exit 1
    fi
    echo ""
    
    # Step 5: Verify nginx routing
    log_info "Verifying nginx routing..."
    sleep 3
    response=$(curl -s http://localhost:8080/health 2>/dev/null || echo "FAILED")
    # FIX: Use proper JSON parsing
    if echo "$response" | python3 -c "import sys, json; d=json.load(sys.stdin); sys.exit(0 if d.get('status')=='healthy' else 1)" 2>/dev/null; then
        log_success "Nginx routing verified"
    else
        log_error "Nginx routing verification failed"
        log_warning "Manual intervention may be required"
        exit 1
    fi
    echo ""
    
    # Step 6: Mark target as active
    mark_active "$TARGET_COLOR"
    echo ""
    
    log_success "=== Rollback Complete ==="
    log_success "Active container: loop-api-$TARGET_COLOR"
    log_info "Previous container (loop-api-$CURRENT_ACTIVE) is still running"
    log_info "Stop it manually with: docker compose -f $COMPOSE_FILE stop loop-api-$CURRENT_ACTIVE"
}

# Execute main function
main
