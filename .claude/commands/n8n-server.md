---
description: Docker-based n8n server management (restart, log check, env vars)
---

# n8n Server Management (Docker)

n8n workflow automation server runs as Docker container on NAS.

## Server Info

| Item | Value |
|-----|-----|
| URL | `https://n8n.sosilab.synology.me` |
| Container name | `n8n` |
| Port | 5678 |
| Data path | `/volume1/docker/n8n` |

## User Input

$ARGUMENTS

(status / logs / restart / rebuild / stop / env)

## Execution Steps

### Status check (status)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker ps | grep n8n'
```

### Log check (logs)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker logs --tail 50 n8n 2>&1'
```

### Restart (restart)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker restart n8n 2>&1'
```

### Check env vars (env)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker inspect n8n --format="{{range .Config.Env}}{{println .}}{{end}}" 2>&1'
```

### Rebuild (rebuild) - Includes WebSocket fix env vars
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
/var/packages/ContainerManager/target/usr/bin/docker stop n8n
/var/packages/ContainerManager/target/usr/bin/docker rm n8n
/var/packages/ContainerManager/target/usr/bin/docker run -d \
  --name n8n \
  --restart unless-stopped \
  -p 5678:5678 \
  -v /volume1/docker/n8n:/home/node/.n8n \
  -e N8N_PUSH_BACKEND=sse \
  -e N8N_EDITOR_BASE_URL=https://n8n.sosilab.synology.me \
  -e WEBHOOK_URL=https://n8n.sosilab.synology.me \
  -e N8N_PROTOCOL=https \
  -e N8N_PROXY_HOPS=1 \
  -e GENERIC_TIMEZONE=Asia/Seoul \
  -e TZ=Asia/Seoul \
  n8nio/n8n:latest
" 2>&1'
```

### Stop (stop)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker stop n8n 2>&1'
```

## Health Check
```bash
curl -s -o /dev/null -w "%{http_code}" https://n8n.sosilab.synology.me/healthz
```

## Environment Variables

| Variable | Value | Description |
|-----|-----|------|
| `N8N_PUSH_BACKEND` | `sse` | Use SSE instead of WebSocket (proxy compatible) |
| `N8N_EDITOR_BASE_URL` | `https://n8n.sosilab.synology.me` | Editor base URL |
| `WEBHOOK_URL` | `https://n8n.sosilab.synology.me` | Webhook base URL |
| `N8N_PROTOCOL` | `https` | Use HTTPS protocol |
| `N8N_PROXY_HOPS` | `1` | Reverse proxy hop count |
| `LOOP_API_TOKEN` | `loop_2024_kanban_secret` | LOOP API auth (Docker env var) |

## LOOP API Credential Setup (CRITICAL)

> **Must connect Credential when calling LOOP API in workflows**

| Credential name | Type | Header | Value |
|----------------|------|------|-----|
| `LOOP API Token` | Header Auth | `x-api-token` | `loop_2024_kanban_secret` |

### Workflow Setup Method

1. Open **HTTP Request node**
2. **Authentication**: Select `Predefined Credential Type`
3. **Credential Type**: `Header Auth`
4. **Header Auth**: Select `LOOP API Token`

### Important Notes

- Credential not auto-linked on workflow JSON import
- Must manually connect Credential after import
- Docker env var `LOOP_API_TOKEN` and n8n Credential are separate

## Troubleshooting

### "Connection issue or server is down" error
1. Check env vars with `/n8n-server env`
2. If `N8N_PUSH_BACKEND=sse` missing, run `/n8n-server rebuild`
3. Hard refresh browser (Cmd+Shift+R)

### Container start failure
```bash
# Check detailed logs
/n8n-server logs
```

## Related Files

| File | Description |
|-----|------|
| `_build/n8n_workflows/` | Workflow JSON files |
| `api/routers/pending.py` | Pending Review API (n8n integration) |
