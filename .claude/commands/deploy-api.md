---
description: LOOP API fast deploy (docker cp, no rebuild, ~30 seconds)
model: haiku
---

# LOOP API Fast Deploy

Deploy API code without Docker rebuild.

## User Input

$ARGUMENTS

(deploy / deploy-only)

- **deploy**: commit + cp + restart (default)
- **deploy-only**: cp + restart only (no commit)

## Execution Steps

### Step 1: Sync to NAS (deploy option only)

> Skip this step for `deploy-only`

Execute `/nas-git local-sync` to sync local changes to NAS via GitHub.

### Step 2: Docker CP

Copy api/ and shared/ folders to container.

```bash
# 1. Compress api and shared folders
cd /Users/gim-eunhyang/dev/loop/public
tar -czf /tmp/loop-api-deploy.tar.gz api shared

# 2. Transfer to NAS (-O: use legacy SCP protocol, required for Synology NAS)
sshpass -p 'Dkssud272902*' scp -O -P 22 -o StrictHostKeyChecking=no /tmp/loop-api-deploy.tar.gz Sosilab@100.93.242.60:/tmp/

# 3. Copy to container and restart
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
mkdir -p /tmp/loop-api-deploy
tar -xzf /tmp/loop-api-deploy.tar.gz -C /tmp/loop-api-deploy
/var/packages/ContainerManager/target/usr/bin/docker cp /tmp/loop-api-deploy/api/. loop-api:/app/api/
/var/packages/ContainerManager/target/usr/bin/docker cp /tmp/loop-api-deploy/shared/. loop-api:/app/shared/
rm -rf /tmp/loop-api-deploy /tmp/loop-api-deploy.tar.gz
echo Done: api and shared copied to container
" 2>&1'

# 4. Cleanup local temp file
rm -f /tmp/loop-api-deploy.tar.gz
```

### Step 3: Restart uvicorn

```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
/var/packages/ContainerManager/target/usr/bin/docker exec loop-api pkill -f uvicorn || true
sleep 2
echo Restarted: uvicorn process killed, container will auto-restart it
" 2>&1'
```

### Step 4: Verify

```bash
sleep 3
curl -s https://mcp.sosilab.synology.me/health | head -5
```

On success, returns JSON: `{"status":"healthy",...}`

## Notes

- **vs /mcp-server rebuild**: Same result, but 30 seconds vs 5-10 min
- **When to use rebuild**: Required when Dockerfile, requirements, or docker-compose.yml changes
- **What this deploys**: api/ and shared/ folders only (not dashboard, scripts, etc.)
