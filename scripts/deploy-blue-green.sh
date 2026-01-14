#!/bin/bash
# Note: Don't use 'set -e' to allow error handling code to run
set -uo pipefail

# Blue-Green Deployment Script for LOOP API
# Implements zero-downtime deployment with health check and automatic rollback

# Configuration
DOCKER_CMD="${DOCKER_CMD:-/var/packages/ContainerManager/target/usr/bin/docker}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.blue-green.yml}"
ACTIVE_COLOR_FILE="${ACTIVE_COLOR_FILE:-/volume1/LOOP_CORE/vault/LOOP/_build/.active-color}"
HEALTH_CHECK_MAX_ATTEMPTS=30
HEALTH_CHECK_INTERVAL=10
POST_SWITCH_VERIFICATION_SECONDS=30
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root directory
cd "$PROJECT_ROOT" || {
    echo "ERROR: Failed to change to project root: $PROJECT_ROOT"
    exit 1
}

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
        echo "blue"  # Default to blue on first deployment
    fi
}

# Function: Get inactive color
get_inactive_color() {
    local active=$1
    if [ "$active" == "blue" ]; then
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

# Function: Check if port is in use (host-level)
check_port_available() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1  # Port in use
    else
        return 0  # Port available
    fi
}

# Function: Build container
build_container() {
    local color=$1
    log_info "Building loop-api-$color container..."
    
    if $DOCKER_CMD compose -f "$COMPOSE_FILE" build loop-api-$color; then
        log_success "Build completed for $color container"
        return 0
    else
        log_error "Build failed for $color container"
        return 1
    fi
}

# Function: Start container
start_container() {
    local color=$1
    local port=$(get_host_port "$color")
    
    log_info "Starting loop-api-$color container on port $port..."
    
    # Check if port is available
    if ! check_port_available "$port"; then
        log_error "Port $port is already in use"
        return 1
    fi
    
    if $DOCKER_CMD compose -f "$COMPOSE_FILE" up -d loop-api-$color; then
        log_success "Container loop-api-$color started"
        return 0
    else
        log_error "Failed to start $color container"
        return 1
    fi
}

# Function: Health check with retry
health_check() {
    local color=$1
    local host_port=$(get_host_port "$color")
    local url="http://localhost:$host_port/health"
    
    log_info "Health checking $color container at $url (max ${HEALTH_CHECK_MAX_ATTEMPTS} attempts, ${HEALTH_CHECK_INTERVAL}s interval)..."
    
    for ((i=1; i<=HEALTH_CHECK_MAX_ATTEMPTS; i++)); do
        log_info "Attempt $i/$HEALTH_CHECK_MAX_ATTEMPTS..."
        
        # Use curl with timeout and capture response
        response=$(curl -s -w "\n%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n-1)
        
        if [ "$http_code" == "200" ]; then
            # FIX: Use jq or more specific pattern to avoid false positive on "unhealthy"
            if echo "$body" | python3 -c "import sys, json; d=json.load(sys.stdin); sys.exit(0 if d.get('status')=='healthy' else 1)" 2>/dev/null; then
                # Additional check: verify vault_exists is true
                if echo "$body" | python3 -c "import sys, json; d=json.load(sys.stdin); sys.exit(0 if d.get('vault_exists')==True else 1)" 2>/dev/null; then
                    log_success "Health check passed for $color container (vault mounted correctly)"
                    return 0
                else
                    log_warning "Vault not accessible in $color container"
                fi
            else
                log_warning "Health endpoint responded but status is not 'healthy'"
            fi
        elif [ "$http_code" == "000" ]; then
            log_warning "Connection failed (container may be starting)"
        else
            log_warning "Health check returned HTTP $http_code"
        fi
        
        if [ $i -lt $HEALTH_CHECK_MAX_ATTEMPTS ]; then
            sleep "$HEALTH_CHECK_INTERVAL"
        fi
    done
    
    log_error "Health check failed after ${HEALTH_CHECK_MAX_ATTEMPTS} attempts"
    return 1
}

# Function: Switch nginx to new color
switch_nginx() {
    local new_color=$1
    local upstream_file="$SCRIPT_DIR/${new_color}-upstream.conf"
    local active_upstream_file="$SCRIPT_DIR/active-upstream.conf"
    local backup_file="${active_upstream_file}.backup"
    
    log_info "Switching nginx upstream to $new_color..."
    
    # Verify upstream config exists
    if [ ! -f "$upstream_file" ]; then
        log_error "Upstream config not found: $upstream_file"
        return 1
    fi
    
    # Backup current active config
    cp "$active_upstream_file" "$backup_file"
    
    # Atomic copy (via temp file) - with bind mount, this auto-reflects in container
    local temp_file="${active_upstream_file}.tmp.$$"
    cp "$upstream_file" "$temp_file"
    mv "$temp_file" "$active_upstream_file"
    
    # Reload nginx (without set -e, we can handle errors)
    log_info "Reloading nginx..."
    if $DOCKER_CMD exec loop-nginx nginx -s reload; then
        rm -f "$backup_file"
        log_success "Nginx switched to $new_color"
        return 0
    else
        log_error "Nginx reload failed, restoring backup"
        # Restore backup
        mv "$backup_file" "$active_upstream_file"
        return 1
    fi
}

# Function: Verify traffic through nginx
verify_nginx_traffic() {
    local color=$1
    log_info "Verifying traffic through nginx (30s monitoring)..."
    
    for ((i=1; i<=3; i++)); do
        response=$(curl -s http://localhost:8080/health 2>/dev/null || echo "FAILED")
        # FIX: Use proper JSON parsing
        if echo "$response" | python3 -c "import sys, json; d=json.load(sys.stdin); sys.exit(0 if d.get('status')=='healthy' else 1)" 2>/dev/null; then
            log_success "Nginx routing to $color working (check $i/3)"
        else
            log_error "Nginx routing verification failed"
            return 1
        fi
        sleep 10
    done
    
    log_success "Traffic verification passed"
    return 0
}

# Function: Stop container
stop_container() {
    local color=$1
    log_info "Stopping loop-api-$color container..."
    
    if $DOCKER_CMD compose -f "$COMPOSE_FILE" stop loop-api-$color; then
        log_success "Container loop-api-$color stopped"
    else
        log_warning "Failed to stop $color container (may not be running)"
    fi
}

# Function: Mark new color as active
mark_active() {
    local color=$1
    local temp_file="${ACTIVE_COLOR_FILE}.tmp.$$"
    
    log_info "Marking $color as active..."
    
    # Ensure directory exists
    mkdir -p "$(dirname "$ACTIVE_COLOR_FILE")"
    
    # Atomic write
    echo "$color" > "$temp_file"
    mv "$temp_file" "$ACTIVE_COLOR_FILE"
    
    log_success "Active color set to $color"
}

# Function: Detect and handle conflicts
detect_conflicts() {
    local blue_running=$($DOCKER_CMD ps -q -f name=loop-api-blue 2>/dev/null)
    local green_running=$($DOCKER_CMD ps -q -f name=loop-api-green 2>/dev/null)
    
    if [ -n "$blue_running" ] && [ -n "$green_running" ]; then
        log_warning "Both blue and green containers are running"
        echo -n "Which container should be kept? (blue/green/abort): "
        read choice
        
        case "$choice" in
            blue)
                stop_container "green"
                # FIX: Update nginx to point to blue
                log_info "Updating nginx to point to blue..."
                switch_nginx "blue"
                mark_active "blue"
                ;;
            green)
                stop_container "blue"
                # FIX: Update nginx to point to green
                log_info "Updating nginx to point to green..."
                switch_nginx "green"
                mark_active "green"
                ;;
            abort)
                log_info "Deployment aborted by user"
                exit 1
                ;;
            *)
                log_error "Invalid choice"
                exit 1
                ;;
        esac
    fi
}

# Main deployment workflow
main() {
    log_info "=== Blue-Green Deployment for LOOP API ==="
    log_info "Compose file: $COMPOSE_FILE"
    log_info "Active color file: $ACTIVE_COLOR_FILE"
    echo ""
    
    # Step 1: Detect conflicts
    detect_conflicts
    
    # Step 2: Detect current active color
    ACTIVE_COLOR=$(get_active_color)
    INACTIVE_COLOR=$(get_inactive_color "$ACTIVE_COLOR")
    
    log_info "Current active: $ACTIVE_COLOR"
    log_info "Deploying to: $INACTIVE_COLOR"
    echo ""
    
    # Step 3: Build inactive container
    if ! build_container "$INACTIVE_COLOR"; then
        log_error "Build failed, aborting deployment"
        exit 1
    fi
    echo ""
    
    # Step 4: Start inactive container
    if ! start_container "$INACTIVE_COLOR"; then
        log_error "Failed to start container, aborting deployment"
        exit 1
    fi
    echo ""
    
    # Step 5: Health check
    if ! health_check "$INACTIVE_COLOR"; then
        log_error "Health check failed, keeping old container running"
        stop_container "$INACTIVE_COLOR"
        exit 1
    fi
    echo ""
    
    # Step 6: Switch nginx
    if ! switch_nginx "$INACTIVE_COLOR"; then
        log_error "Nginx switch failed, rolling back"
        stop_container "$INACTIVE_COLOR"
        exit 1
    fi
    echo ""
    
    # Step 7: Verify traffic through nginx
    if ! verify_nginx_traffic "$INACTIVE_COLOR"; then
        log_error "Traffic verification failed, rolling back"
        switch_nginx "$ACTIVE_COLOR"
        stop_container "$INACTIVE_COLOR"
        exit 1
    fi
    echo ""
    
    # Step 8: Stop old container
    stop_container "$ACTIVE_COLOR"
    echo ""
    
    # Step 9: Mark new color as active
    mark_active "$INACTIVE_COLOR"
    echo ""
    
    log_success "=== Deployment Complete ==="
    log_success "Active container: loop-api-$INACTIVE_COLOR"
    log_success "Old container (loop-api-$ACTIVE_COLOR) has been stopped"
    log_info "To rollback: ./scripts/rollback.sh"
}

# Execute main function
main
