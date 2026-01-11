---
description: Dashboard v2 fast deploy (docker cp, no rebuild, 30 seconds)
model: haiku
---

# Dashboard v2 Fast Deploy

Deploy frontend without Docker rebuild.

## User Input

$ARGUMENTS

(deploy / deploy-only / build-only)

- **deploy**: build + commit + cp (default)
- **deploy-only**: build + cp (no commit)
- **build-only**: local build only

## Execution Steps

### Step 1: Build (local)

```bash
cd /Users/gim-eunhyang/dev/loop/public/dashboard-v2 && npm run build
```

On success, output generated in `dist/` folder.

### Step 2: Commit (deploy option only)

> Skip this step for `deploy-only` or `build-only`

Execute `/safe-commit` skill to commit changes.

### Step 3: Docker CP (deploy, deploy-only options)

> Skip this step for `build-only`

```bash
# 1. Compress dist folder
cd /Users/gim-eunhyang/dev/loop/public/dashboard-v2
tar -czf /tmp/dashboard-v2-dist.tar.gz -C dist .

# 2. Transfer to NAS (-O: use legacy SCP protocol, required for Synology NAS)
sshpass -p 'Dkssud272902*' scp -O -P 22 -o StrictHostKeyChecking=no /tmp/dashboard-v2-dist.tar.gz Sosilab@100.93.242.60:/tmp/

# 3. Copy to container
sshpass -p 'Dkssud272902*' ssh -p 22 -o StrictHostKeyChecking=no Sosilab@100.93.242.60 'echo "Dkssud272902*" | sudo -S bash -c "
mkdir -p /tmp/dashboard-v2-dist
tar -xzf /tmp/dashboard-v2-dist.tar.gz -C /tmp/dashboard-v2-dist
/var/packages/ContainerManager/target/usr/bin/docker cp /tmp/dashboard-v2-dist/. loop-api:/app/dashboard-v2-dist/
rm -rf /tmp/dashboard-v2-dist /tmp/dashboard-v2-dist.tar.gz
echo Done: dashboard-v2 deployed to container
" 2>&1'

# 4. Cleanup local temp file
rm -f /tmp/dashboard-v2-dist.tar.gz
```

### Step 4: Verify

```bash
curl -s https://mcp.sosilab.synology.me/v2/ | head -5
```

On success, returns HTML containing `<!DOCTYPE html>`.

## Notes

- **vs rebuild**: Both use latest source, same result
- **Advantage**: 30 seconds vs 5-10 min full rebuild
- **When to use rebuild**: Required when API code changes
