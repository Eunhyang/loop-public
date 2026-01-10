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

(rebuild / restart / logs / status / stop)

## Execution Steps

### [Before rebuild] Auto sync (required for rebuild command)

Before rebuild, **automatically run `/nas-git local-sync` first**.
This ensures local changes are reflected on NAS before rebuild.

**Execution order:**
1. Run `/nas-git local-sync` (Local → GitHub → NAS sync)
2. Proceed with rebuild after sync complete

> **Note**: When rebuild command entered, Claude automatically runs `/nas-git local-sync` first.
> No need to run sync separately.

---

### Status check (status)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker ps | grep loop-api'
```

### Log check (logs)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker logs --tail 50 loop-api 2>&1'
```

### Restart (restart)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker restart loop-api 2>&1'
```

### Rebuild (rebuild)
Rebuild loop-api (OAuth keys/DB preserved in volume, auth session maintained):

**Step 1: Sync public + exec vaults first**
```bash
echo "╔════════════════════════════════════════════╗"
echo "║  Local Sync: public + exec                ║"
echo "╚════════════════════════════════════════════╝"

# ============================================
# PUBLIC (LOOP) VAULT
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PUBLIC VAULT (LOOP)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: NAS public changes first
echo ""
echo "=== [PUBLIC] Step 1: NAS commit + push ==="
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 "
export HOME=/tmp
cd /volume1/LOOP_CORE/vault/LOOP
git config --global --add safe.directory /volume1/LOOP_CORE/vault/LOOP 2>/dev/null
git add -A
if [ -n \"\$(git status --porcelain)\" ]; then
  git commit --no-verify -m 'nas-auto: \$(date +%Y-%m-%d\ %H:%M)'
fi
git push origin main 2>&1 || true
"

# Step 2: Local public commit
echo ""
echo "=== [PUBLIC] Step 2: 로컬 commit ==="
cd ~/dev/loop/public
git add -A
if [ -n "$(git status --porcelain)" ]; then
  git commit --no-verify -m "local-sync: $(date '+%Y-%m-%d %H:%M')"
fi

# Step 3: Local public pull --rebase
echo ""
echo "=== [PUBLIC] Step 3: 로컬 pull --rebase ==="
git pull --rebase origin main

# Step 4: Local public push
echo ""
echo "=== [PUBLIC] Step 4: 로컬 push ==="
git push origin main

# Step 5: NAS public pull
echo ""
echo "=== [PUBLIC] Step 5: NAS pull ==="
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 "
export HOME=/tmp
cd /volume1/LOOP_CORE/vault/LOOP
git config --global --add safe.directory /volume1/LOOP_CORE/vault/LOOP 2>/dev/null
git pull --rebase origin main 2>&1
"

# ============================================
# EXEC (loop_exec) VAULT
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  EXEC VAULT (loop_exec)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: NAS exec changes first
echo ""
echo "=== [EXEC] Step 1: NAS commit + push ==="
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 "
export HOME=/tmp
cd /volume1/LOOP_CLevel/vault/loop_exec
git config --global --add safe.directory /volume1/LOOP_CLevel/vault/loop_exec 2>/dev/null
git add -A
if [ -n \"\$(git status --porcelain)\" ]; then
  git commit --no-verify -m 'nas-auto: \$(date +%Y-%m-%d\ %H:%M)'
fi
git push origin main 2>&1 || true
"

# Step 2: Local exec commit
echo ""
echo "=== [EXEC] Step 2: 로컬 commit ==="
cd ~/dev/loop/exec
git add -A
if [ -n "$(git status --porcelain)" ]; then
  git commit --no-verify -m "local-sync: $(date '+%Y-%m-%d %H:%M')"
fi

# Step 3: Local exec pull --rebase
echo ""
echo "=== [EXEC] Step 3: 로컬 pull --rebase ==="
git pull --rebase origin main

# Step 4: Local exec push
echo ""
echo "=== [EXEC] Step 4: 로컬 push ==="
git push origin main

# Step 5: NAS exec pull
echo ""
echo "=== [EXEC] Step 5: NAS pull ==="
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 "
export HOME=/tmp
cd /volume1/LOOP_CLevel/vault/loop_exec
git config --global --add safe.directory /volume1/LOOP_CLevel/vault/loop_exec 2>/dev/null
git pull --rebase origin main 2>&1
"

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  동기화 완료: public + exec               ║"
echo "╚════════════════════════════════════════════╝"
```

**Step 2: Docker rebuild (using docker compose)**
```bash
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  DOCKER REBUILD (docker compose)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
cd /volume1/LOOP_CORE/vault/LOOP
/var/packages/ContainerManager/target/usr/bin/docker compose up -d --build --force-recreate loop-api
" 2>&1'
```

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
