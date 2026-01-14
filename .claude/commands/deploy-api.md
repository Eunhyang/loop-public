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

# 3. Detect active container and copy
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
mkdir -p /tmp/loop-api-deploy
tar -xzf /tmp/loop-api-deploy.tar.gz -C /tmp/loop-api-deploy

# Detect active container (Blue-Green deployment support)
if [ -f /volume1/LOOP_CORE/vault/LOOP/_build/.active-color ]; then
  ACTIVE_COLOR=\$(cat /volume1/LOOP_CORE/vault/LOOP/_build/.active-color)
  CONTAINER_NAME=\"loop-api-\${ACTIVE_COLOR}\"
  echo \"Detected active container: \${CONTAINER_NAME}\"
else
  CONTAINER_NAME=\"loop-api\"
  echo \"No Blue-Green setup detected, using: \${CONTAINER_NAME}\"
fi

/var/packages/ContainerManager/target/usr/bin/docker cp /tmp/loop-api-deploy/api/. \${CONTAINER_NAME}:/app/api/
/var/packages/ContainerManager/target/usr/bin/docker cp /tmp/loop-api-deploy/shared/. \${CONTAINER_NAME}:/app/shared/
rm -rf /tmp/loop-api-deploy /tmp/loop-api-deploy.tar.gz
echo Done: api and shared copied to \${CONTAINER_NAME}
" 2>&1'

# 4. Cleanup local temp file
rm -f /tmp/loop-api-deploy.tar.gz
```

### Step 3: Restart uvicorn

```bash
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
# Detect active container (Blue-Green deployment support)
if [ -f /volume1/LOOP_CORE/vault/LOOP/_build/.active-color ]; then
  ACTIVE_COLOR=\$(cat /volume1/LOOP_CORE/vault/LOOP/_build/.active-color)
  CONTAINER_NAME=\"loop-api-\${ACTIVE_COLOR}\"
else
  CONTAINER_NAME=\"loop-api\"
fi

/var/packages/ContainerManager/target/usr/bin/docker exec \${CONTAINER_NAME} pkill -f uvicorn || true
sleep 2
echo Restarted: uvicorn process killed in \${CONTAINER_NAME}, container will auto-restart it
" 2>&1'
```

### Step 4: Verify

```bash
sleep 3
curl -s https://mcp.sosilab.synology.me/health | head -5
```

On success, returns JSON: `{"status":"healthy",...}`

## Notes

- **Blue-Green support**: Automatically detects active container (blue/green) via `.active-color` file
- **vs /mcp-server rebuild**: Same result, but 30 seconds vs 5-10 min
- **When to use rebuild**: Required when Dockerfile, requirements, or docker-compose.yml changes
- **What this deploys**: api/ and shared/ folders only (not dashboard, scripts, etc.)
- **Fallback**: If Blue-Green not detected, uses legacy `loop-api` container name
