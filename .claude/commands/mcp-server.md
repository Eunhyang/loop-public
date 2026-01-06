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
```

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
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
cd /volume1/LOOP_CORE/vault/LOOP
# Load API keys from .env file
source /volume1/LOOP_CORE/vault/LOOP/.env 2>/dev/null || true
/var/packages/ContainerManager/target/usr/bin/docker build -t loop-api:latest .
/var/packages/ContainerManager/target/usr/bin/docker stop loop-api
/var/packages/ContainerManager/target/usr/bin/docker rm loop-api
/var/packages/ContainerManager/target/usr/bin/docker run -d --name loop-api --restart unless-stopped -p 8082:8081 -v /volume1/LOOP_CORE/vault/LOOP:/vault:rw -v /volume1/LOOP_CLevel/vault/loop_exec:/vault/exec:rw -v /volume1/LOOP_CORE/vault/LOOP/api/oauth:/app/api/oauth:rw -e VAULT_DIR=/vault -e EXEC_VAULT_DIR=/vault/exec -e OAUTH_ISSUER=https://mcp.sosilab.synology.me -e TZ=Asia/Seoul -e OPENAI_API_KEY=\$OPENAI_API_KEY -e ANTHROPIC_API_KEY=\$ANTHROPIC_API_KEY loop-api:latest
" 2>&1'
```

### Full rebuild (rebuild-all)
Complete fresh start including OAuth keys/DB (auth session reset):
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
cd /volume1/LOOP_CORE/vault/LOOP
source /volume1/LOOP_CORE/vault/LOOP/.env 2>/dev/null || true

# Reset OAuth keys/DB (new keys generated - existing tokens invalidated)
rm -rf /volume1/LOOP_CORE/vault/LOOP/api/oauth/keys
rm -f /volume1/LOOP_CORE/vault/LOOP/api/oauth/oauth.db

# Build and run loop-api
/var/packages/ContainerManager/target/usr/bin/docker build -t loop-api:latest .
/var/packages/ContainerManager/target/usr/bin/docker stop loop-api 2>/dev/null || true
/var/packages/ContainerManager/target/usr/bin/docker rm loop-api 2>/dev/null || true
/var/packages/ContainerManager/target/usr/bin/docker run -d --name loop-api --restart unless-stopped -p 8082:8081 -v /volume1/LOOP_CORE/vault/LOOP:/vault:rw -v /volume1/LOOP_CLevel/vault/loop_exec:/vault/exec:rw -v /volume1/LOOP_CORE/vault/LOOP/api/oauth:/app/api/oauth:rw -e VAULT_DIR=/vault -e EXEC_VAULT_DIR=/vault/exec -e OAUTH_ISSUER=https://mcp.sosilab.synology.me -e TZ=Asia/Seoul -e OPENAI_API_KEY=\$OPENAI_API_KEY -e ANTHROPIC_API_KEY=\$ANTHROPIC_API_KEY loop-api:latest
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
| `docker-compose.yml` | Container config (reference) |
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
