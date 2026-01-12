---
description: Docker-based MCP server management (build, restart, log check)
model: haiku
---

# MCP Server Management (Docker)

MCP (Model Context Protocol) server runs as Docker container on NAS.
Enables ChatGPT Developer Mode to access LOOP Vault data.

## Server Info

| Item | Value |
|-----|-----|
| URL | `https://mcp.sosilab.synology.me` |
| MCP endpoint | `https://mcp.sosilab.synology.me/mcp` |
| Container | `loop-api` (API + MCP + OAuth) |
| Port | 8082 → 8081 |
| Python | 3.11 (Docker) |

### Architecture
```
loop-api (8082) ─── API + MCP + OAuth
                     - Vault access
                     - OAuth (/authorize, /token, /register)
                     - Keys/DB persist in volume

loop-auth (8084) ─── OAuth 인증 서버 (독립)
                     - JWKS 제공 (/well-known/jwks.json)
```

**Network**: `loop_default` - loop-api와 loop-auth가 같은 네트워크에서 JWKS 통신

**Session persistence**: OAuth keys/DB stored in `/api/oauth/` volume → auth session survives rebuild

## User Input

$ARGUMENTS

(rebuild / rollback / restart / logs / status / stop / rebuild-all)

## Execution Steps

### [Before rebuild] Sync dependency

The `rebuild` command requires `/nas-git local-sync` to run first.
This ensures local changes are synced to NAS before rebuilding the container.

**Execution order:**
1. Claude executes `/nas-git local-sync` skill (Local → GitHub → NAS sync)
2. After sync completes, proceed with Docker rebuild

> **Note**: Sync logic is maintained in `nas-git.md` only (SSOT - no code duplication).

---

### Status check (status)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker ps | grep loop-api'
```

### Log check (logs)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker logs --tail 50 loop-api 2>&1'
```

### Rollback (rollback)
**Instant rollback to previous version** (switches nginx back to old container):
```bash
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  BLUE-GREEN ROLLBACK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
cd /volume1/LOOP_CORE/vault/LOOP
./scripts/rollback.sh
" 2>&1'
```

> **Rollback Process**:
> - Detects current active color (blue/green)
> - Starts previous container if not running
> - Health checks previous container
> - Switches nginx back to previous version
> - **Takes ~30 seconds** (instant switch, no rebuild needed)

### Restart (restart)
**Quick restart of current active container** (for config changes without code changes):
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker restart loop-api 2>&1'
```

> **Note**: With Blue-Green deployment, use `rebuild` for code changes, not `restart`.

### Rebuild (rebuild)
**Zero-downtime Blue-Green deployment** (OAuth keys/DB preserved in volume, auth session maintained):

**Step 1: Sync vaults first (MANDATORY)**

> **IMPORTANT**: Before deployment, run `/nas-git local-sync` first.
> This ensures local changes are synced to NAS before rebuilding the container.
>
> **Claude: Execute `/nas-git local-sync` skill before proceeding to Step 2.**

**Step 2: Blue-Green Deployment**
```bash
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  BLUE-GREEN DEPLOYMENT (Zero-Downtime)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
cd /volume1/LOOP_CORE/vault/LOOP
./scripts/deploy-blue-green.sh
" 2>&1'
```

> **Blue-Green Strategy**:
> - Builds new version (green) while current (blue) serves traffic
> - Health checks new container (30 attempts × 10s = 5min max)
> - Switches nginx upstream to new version
> - Verifies traffic for 30s before stopping old container
> - **Zero downtime** - API stays available throughout deployment
> - **Instant rollback** available via `./scripts/rollback.sh`

### Full rebuild (rebuild-all)
Complete fresh start including OAuth keys/DB (auth session reset):
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
cd /volume1/LOOP_CORE/vault/LOOP

# Reset OAuth keys/DB (new keys generated - existing tokens invalidated)
rm -rf /volume1/LOOP_CORE/vault/LOOP/api/oauth/keys
rm -f /volume1/LOOP_CORE/vault/LOOP/api/oauth/oauth.db

# Rebuild all services with docker compose
/var/packages/ContainerManager/target/usr/bin/docker compose up -d --build --force-recreate
" 2>&1'
```

> **Volume mount explanation**:
> - `/volume1/LOOP_CORE/vault/LOOP:/vault:rw` - LOOP vault (read/write)
> - `/volume1/LOOP_CLevel/vault/loop_exec:/vault/exec:rw` - loop_exec vault (read/write, allows Dashboard edits)
> - `/volume1/LOOP_CORE/vault/LOOP/api/oauth:/app/api/oauth:rw` - OAuth keys/DB (persistent)

### Stop (stop)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker stop loop-api 2>&1'
```

## Health Check
```bash
curl -s https://mcp.sosilab.synology.me/health | python3 -m json.tool
```

## MCP Endpoint Test
```bash
curl -s -m 3 https://mcp.sosilab.synology.me/mcp
# Normal response: event: endpoint, data: /mcp/messages/?session_id=...
```

## Related Files

| File | Description |
|-----|------|
| `Dockerfile` | Docker image definition (Python 3.11 + FastAPI + MCP) |
| `docker-compose.yml` | Container config (networks, volumes, env) |
| `api/main.py` | FastAPI app + MCP mount |
| `api/models/entities.py` | Pydantic models (OpenAPI schema) |

## Troubleshooting

### ChatGPT connection error
1. Check SSE response with `curl https://mcp.sosilab.synology.me/mcp`
2. On OpenAPI schema error, check `api/models/entities.py`
3. Rebuild and retry

### Container start failure
```bash
# Check detailed logs
docker logs loop-api 2>&1 | tail -50
```
