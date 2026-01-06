---
description: Docker-based Content OS server management (build, restart, log check)
---

# Content OS Server Management (Docker)

Content OS runs as Docker container on NAS.
Provides content pipeline and automation services.

## Server Info

| Item | Value |
|-----|-----|
| URL | `https://contentos.sosilab.synology.me` |
| Container name | `content-os` |
| Image name | `loop-content-os` |
| Port | 8083 (internal 3000) |
| Source path | `/volume1/LOOP_CORE/vault/LOOP/apps/content-os` |

## User Input

$ARGUMENTS

(status / logs / restart / rebuild / stop)

## Execution Steps

### [Before rebuild] Check local changes (rebuild command only)

Before rebuild, check if there are uncommitted local changes.
If changes exist, they're not reflected on NAS, so ask whether to sync first.

```bash
cd ~/dev/loop/public && git status --short
```

If changes exist, ask user:
> "로컬에 변경사항이 있습니다. NAS에 먼저 동기화할까요? (git push → NAS sync)"

**If Yes:**
1. Commit & push locally:
```bash
cd ~/dev/loop/public && git add -A && git commit -m "chore: sync before rebuild" && git push origin main
```

2. Pull on NAS:
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 '
echo "Dkssud272902*" | sudo -S /volume1/LOOP_CORE/vault/LOOP/scripts/nas-git-sync.sh 2>&1
'
```

3. Then proceed with rebuild

---

### Status check (status)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker ps | grep content-os'
```

### Log check (logs)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker logs --tail 50 content-os 2>&1'
```

### Restart (restart)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker restart content-os 2>&1'
```

### Rebuild (rebuild)
Rebuild Docker image and deploy after code changes:
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
cd /volume1/LOOP_CORE/vault/LOOP/apps/content-os
source /volume1/LOOP_CORE/vault/LOOP/.env 2>/dev/null || true
/var/packages/ContainerManager/target/usr/bin/docker build -t loop-content-os:latest .
/var/packages/ContainerManager/target/usr/bin/docker stop content-os 2>/dev/null || true
/var/packages/ContainerManager/target/usr/bin/docker rm content-os 2>/dev/null || true
/var/packages/ContainerManager/target/usr/bin/docker run -d \
  --name content-os \
  --restart unless-stopped \
  -p 8083:3000 \
  -v /volume1/LOOP_CORE/vault/LOOP:/vault:ro \
  -e NODE_ENV=production \
  -e VAULT_DIR=/vault \
  -e TZ=Asia/Seoul \
  -e AUTH_USERNAME=\$AUTH_USERNAME \
  -e AUTH_PASSWORD=\$AUTH_PASSWORD \
  -e YOUTUBE_API_KEY=\$YOUTUBE_API_KEY \
  -e GOOGLE_CLIENT_ID=\$GOOGLE_CLIENT_ID \
  -e GOOGLE_CLIENT_SECRET=\$GOOGLE_CLIENT_SECRET \
  -e GOOGLE_REDIRECT_URI=https://contentos.sosilab.synology.me/api/auth/youtube/callback \
  loop-content-os:latest
" 2>&1'
```

### Stop (stop)
```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S /var/packages/ContainerManager/target/usr/bin/docker stop content-os 2>&1'
```

## Health Check
```bash
curl -s -o /dev/null -w "%{http_code}" https://contentos.sosilab.synology.me/health
```

## Related Files

| File | Description |
|-----|------|
| `50_Projects/Content_OS/Dockerfile` | Docker image definition |
| `50_Projects/Content_OS/app/` | FastAPI app source |

## Troubleshooting

### Container start failure
```bash
# Check detailed logs
/content-os-server logs
```

### Connection error
1. Check container status with `/content-os-server status`
2. If container missing, run `/content-os-server rebuild`
3. Check Synology Reverse Proxy settings (contentos.sosilab.synology.me:443 → localhost:8083)
